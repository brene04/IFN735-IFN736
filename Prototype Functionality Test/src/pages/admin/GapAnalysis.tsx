// GAP ANALYSIS MODULE — three connected screens in one page file
//   /gap-analysis                     -> Competency Gap Analysis (select employee, preview, run)
//   /gap-analysis/results/:analysisId -> Gap Analysis Results (charts + detailed gaps)   (GA-2026-032 or 32)
//   /gap-analysis/history             -> Gap Analysis History (trend + compare)
// Flow: select employee -> preview position requirements vs current levels -> Generate -> Results -> History.
// Every analysis is stored in the shared database as tbl_gap_analyses + tbl_gap_analysis_results
// (pages/technical/techData), so it survives a refresh and is visible to the other roles.
// Proficiency scale: 4 levels (tbl_proficiency_levels).
import { Fragment, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/authContext'
import { roleHome } from '../../auth/users'
import RoleShell from '../../components/RoleShell'
import { PageHeader as TechPageHeader, Card, StatCard as TechStatCard, Modal as TechModal, Field, DetailRow, SearchBox } from '../technical/techUi'
import type { IconName } from '../technical/techUi'
import { inputStyle, selectStyle, primaryBtn, ghostBtn, thStyle, tdStyle, NAVY, ACCENT, BORDER, MUTED } from '../technical/techTheme'
import { useDb, getDb, runGapAnalyses, buildGapResults, gapAnalysisCode } from '../technical/techData'
import type { Db, Employee as DbEmployee, GapAnalysisRow } from '../technical/techData'

/* ------------------------------------------------------------------ */
/* Types + data adapters (database -> the shapes the screens use)      */
/* ------------------------------------------------------------------ */

type Category = string
type Severity = 'None' | 'Minor' | 'Moderate' | 'Critical'
type AnalysisStatus = 'Completed' | 'Superseded'

const MAX_LEVEL = 4
const levelName = (n: number) => (n > 0 ? getDb().config.proficiencyLevels[n - 1]?.name ?? '' : '')
const levelDesc = (n: number) => (n > 0 ? getDb().config.proficiencyLevels[n - 1]?.description ?? '' : '')

interface Position {
  id: number
  code: string
  title: string
  salaryGrade: number
}

function toPosition(p: Db['positions'][number]): Position {
  return { id: p.id, code: p.positionCode, title: p.positionTitle, salaryGrade: p.salaryGrade }
}
function positionByCode(code: string) {
  const p = getDb().positions.find((x) => x.positionCode === code)
  return p ? toPosition(p) : undefined
}
function allPositions() {
  return getDb().positions.map(toPosition)
}

interface Employee {
  id: string // employee number, e.g. DOST-2023-0266
  dbId: number
  firstName: string
  lastName: string
  office: string
  officeName: string
  positionCode: string
}

function toEmployee(e: DbEmployee): Employee {
  const d = getDb()
  return {
    id: e.employeeNo,
    dbId: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    office: e.officeCode,
    officeName: d.offices.find((o) => o.officeCode === e.officeCode)?.officeName ?? e.officeCode,
    positionCode: d.positions.find((p) => p.positionTitle === e.positionTitle)?.positionCode ?? '',
  }
}
function allEmployees() {
  return getDb().employees.filter((e) => e.status !== 'Separated').map(toEmployee)
}
function dbEmployee(e: Employee) {
  return getDb().employees.find((x) => x.id === e.dbId)!
}
function allOffices() {
  return [...new Set(allEmployees().map((e) => e.office))].sort()
}

interface GapAnalysisRecord {
  id: string // GA-2026-032
  dbId: number
  employeeId: string // employee number
  positionId: number
  analysisDate: string
  reviewer: string // who ran it (created_by)
  status: AnalysisStatus
  remarks: string
}

function userName(userId: number) {
  const d = getDb()
  const u = d.users.find((x) => x.id === userId)
  const e = u?.employeeId ? d.employees.find((x) => x.id === u.employeeId) : undefined
  return e ? `${e.firstName} ${e.lastName}` : u?.username ?? 'Administrator'
}

function toRecord(a: GapAnalysisRow): GapAnalysisRecord {
  const e = getDb().employees.find((x) => x.id === a.employeeId)
  return { id: gapAnalysisCode(a.id), dbId: a.id, employeeId: e?.employeeNo ?? '', positionId: a.positionId, analysisDate: a.analysisDate, reviewer: userName(a.createdBy), status: a.status, remarks: a.remarks }
}
function analysisStore() {
  return getDb().gapAnalyses.map(toRecord)
}
// accepts GA-2026-032 or just 32
function findRecord(param: string) {
  return analysisStore().find((a) => a.id.toLowerCase() === param.toLowerCase() || String(a.dbId) === param)
}

/* ------------------------------------------------------------------ */
/* Gap calculations                                                    */
/* ------------------------------------------------------------------ */

interface GapRow {
  code: string
  title: string
  category: Category
  description: string
  required: number
  current: number
  gap: number
  severity: Severity
  critical: boolean
  remark: string
  evidence: string
}

// Severity rule: 0 = meets, 1 level = Minor, 2 levels = Moderate (Critical if the
// competency is critical to the role), 3+ levels = Critical.
function severityOf(gap: number, critical: boolean): Severity {
  if (gap <= 0) return 'None'
  if (gap >= 3 || (gap === 2 && critical)) return 'Critical'
  if (gap === 2) return 'Moderate'
  return 'Minor'
}

const statusText: Record<Severity, string> = {
  None: 'Meets Requirement',
  Minor: 'Gap Identified',
  Moderate: 'Needs Development',
  Critical: 'Needs Improvement',
}

function defaultRemark(gap: number, current: number) {
  if (current === 0) return 'No current level recorded for this competency yet.'
  if (gap <= 0) return 'Consistently demonstrates the behavioural indicators expected at the required level.'
  if (gap === 1) return 'Demonstrates most indicators at the required level; needs more consistent application.'
  if (gap === 2) return 'Demonstrates working knowledge but requires a more advanced level of competency for the position.'
  return 'Shows foundational awareness only; a structured development intervention is needed.'
}

// One row of a result (tbl_gap_analysis_results) joined to its competency
function toRow(positionId: number, r: { competencyId: number; requiredLevel: number; currentLevel: number; remarks: string }, employee?: DbEmployee): GapRow {
  const d = getDb()
  const c = d.competencies.find((x) => x.id === r.competencyId)
  const critical = d.positionCompetencies.some((x) => x.positionId === positionId && x.competencyId === r.competencyId && x.priority === 1)
  const gap = r.currentLevel === 0 ? r.requiredLevel : Math.max(0, r.requiredLevel - r.currentLevel)
  const have = employee?.competencies.find((x) => x.code === c?.competencyCode)
  return {
    code: c?.competencyCode ?? '',
    title: c?.competencyName ?? '',
    category: d.config.categories.find((x) => x.id === c?.categoryId)?.name ?? '',
    description: c?.description ?? '',
    required: r.requiredLevel,
    current: r.currentLevel,
    gap,
    severity: severityOf(gap, critical),
    critical,
    remark: r.remarks || defaultRemark(gap, r.currentLevel),
    evidence: have?.evidence || (gap > 0 ? 'Employee competency record' : 'Employee competency record'),
  }
}

// Live preview for an employee's current position (nothing is saved)
function previewRows(e: Employee): GapRow[] {
  const d = getDb()
  const emp = dbEmployee(e)
  const pos = d.positions.find((p) => p.positionCode === e.positionCode)
  if (!pos) return []
  return buildGapResults(d, emp, pos.id).map((r) => toRow(pos.id, r, emp))
}

// Overall match = levels achieved (capped at required) ÷ levels required
function matchScore(rows: GapRow[]) {
  const required = rows.reduce((s, r) => s + r.required, 0)
  const achieved = rows.reduce((s, r) => s + Math.min(r.current, r.required), 0)
  return required ? Math.round((achieved / required) * 100) : 0
}

function summarise(rows: GapRow[]) {
  return {
    total: rows.length,
    assessed: rows.filter((r) => r.current > 0).length,
    meets: rows.filter((r) => r.severity === 'None').length,
    gaps: rows.filter((r) => r.severity !== 'None').length,
    critical: rows.filter((r) => r.severity === 'Critical').length,
    moderate: rows.filter((r) => r.severity === 'Moderate').length,
    minor: rows.filter((r) => r.severity === 'Minor').length,
    match: matchScore(rows),
  }
}

function formatDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function analysisDetails(a: GapAnalysisRecord) {
  const d = getDb()
  const emp = d.employees.find((e) => e.employeeNo === a.employeeId)!
  const pos = d.positions.find((p) => p.id === a.positionId)!
  const rows = d.gapResults.filter((r) => r.gapAnalysisId === a.dbId).map((r) => toRow(a.positionId, r, emp))
  // `assessment` keeps the shape the screens use for "when / who": the analysis date and the person who ran it
  const assessment = { id: a.id, period: formatDate(a.analysisDate), date: a.analysisDate, assessor: a.reviewer }
  return { analysis: a, assessment, employee: toEmployee(emp), position: toPosition(pos), rows, summary: summarise(rows) }
}

// An employee's completed analyses, oldest first
function employeeAnalyses(employeeId: string) {
  return analysisStore()
    .filter((a) => a.employeeId === employeeId && a.status === 'Completed')
    .sort((x, y) => x.analysisDate.localeCompare(y.analysisDate) || x.dbId - y.dbId)
}

function isProfiled(e: Employee) {
  return dbEmployee(e).competencies.length > 0
}

function analysisStatusOf(e: Employee) {
  if (!isProfiled(e)) return 'Not Profiled'
  return analysisStore().some((a) => a.employeeId === e.id && a.status === 'Completed') ? 'Analysed' : 'Not Analysed'
}

// tbl_gap_analyses.created_by: the signed-in person's user row (matched by role)
function useCreatorId() {
  const { user } = useAuth()
  const db = useDb()
  const role = db.roles.find((r) => r.key === user?.role)
  return db.users.find((u) => u.roleId === role?.id)?.id ?? db.users[0]?.id ?? 1
}

function fullName(e: Employee) {
  return `${e.firstName} ${e.lastName}`
}

function initials(e: Employee) {
  return `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase()
}

// Downloads a CSV file that opens in Excel
function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function analysisCsv(d: ReturnType<typeof analysisDetails>) {
  return [
    ['Gap Analysis', d.analysis.id],
    ['Employee', `${fullName(d.employee)} (${d.employee.id})`],
    ['Office', d.employee.office],
    ['Position', d.position.title],
    ['Analysis Date', d.analysis.analysisDate],
    ['Created By', d.analysis.reviewer],
    ['Status', d.analysis.status],
    ['Overall Competency Match', `${d.summary.match}%`],
    [],
    ['Code', 'Competency', 'Category', 'Required Level', 'Current Level', 'Gap', 'Severity', 'Status', 'Remarks'],
    ...d.rows.map((r) => [r.code, r.title, r.category, r.required, r.current, r.gap, r.severity === 'None' ? 'None' : r.severity, statusText[r.severity], r.remark]),
  ]
}


/* ------------------------------------------------------------------ */
/* Shared bits (styles + small components)                             */
/* ------------------------------------------------------------------ */

function Icon({ name }: { name: 'search' | 'bell' | 'building' | 'people' | 'gauge' | 'check' | 'list' | 'filter' | 'plus' }) {
  const paths: Record<string, ReactNode> = {
    search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
    bell: (<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>),
    building: (<><path d="M3 21h18" /><path d="M5 21V10l7-5 7 5v11" /><path d="M9 21v-6h6v6" /></>),
    people: (<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M15 20c0-2.2 1-4 3-4.6" /></>),
    gauge: (<><path d="M12 3a9 9 0 1 0 9 9" /><path d="M12 12l4-4" /></>),
    check: (<><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>),
    list: (<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>),
    filter: (<><path d="M3 5h18l-7 8v6l-4 2v-8z" /></>),
    plus: (<><path d="M12 5v14M5 12h14" /></>),
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

// Builds the page buttons, e.g. [1, 2, 3, '...', 5]
function pageList(page: number, total: number): (number | '...')[] {
  const wanted = new Set([1, total, page - 1, page, page + 1])
  if (page <= 3) [1, 2, 3].forEach((n) => wanted.add(n))
  const nums = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const result: (number | '...')[] = []
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) result.push('...')
    result.push(n)
  })
  return result
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const box = (active: boolean, disabled = false): CSSProperties => ({
    minWidth: 34,
    height: 34,
    borderRadius: '6px',
    border: active ? 'none' : `1px solid ${BORDER}`,
    background: active ? '#0f2442' : 'white',
    color: active ? 'white' : disabled ? '#c4c8cf' : '#1f2937',
    fontSize: '14px',
    fontWeight: active ? 700 : 500,
    cursor: disabled ? 'default' : 'pointer',
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <button style={box(false, page === 1)} disabled={page === 1} onClick={() => onChange(1)}>|&lsaquo;</button>
      <button style={box(false, page === 1)} disabled={page === 1} onClick={() => onChange(page - 1)}>&lsaquo;</button>
      {pageList(page, total).map((p, i) =>
        p === '...' ? (
          <span key={`gap-${i}`} style={{ padding: '0 4px', color: MUTED }}>...</span>
        ) : (
          <button key={p} style={box(p === page)} onClick={() => onChange(p)}>{p}</button>
        ),
      )}
      <button style={box(false, page === total)} disabled={page === total} onClick={() => onChange(page + 1)}>&rsaquo;</button>
      <button style={box(false, page === total)} disabled={page === total} onClick={() => onChange(total)}>&rsaquo;|</button>
    </div>
  )
}


/* ------------------------------------------------------------------ */
/* Gap colours, chips and charts                                       */
/* ------------------------------------------------------------------ */

// Chart colours (checked for colour-blind safety)
const REQUIRED_COLOR = '#2a78d6' // dashed outline = what the position needs
const CURRENT_COLOR = '#1baf7a' // filled shape = what the employee has
const TREND_COLOR = '#2a78d6'

// Status colours are only used for gap severity, always with a text label
const SEVERITY: Record<Severity, { label: string; dot: string; bg: string; fg: string; border: string; icon: string }> = {
  None: { label: 'Meets Requirement', dot: '#0ca30c', bg: '#e9f7e9', fg: '#0a6b0a', border: '#bfe5bf', icon: '✓' },
  Minor: { label: 'Minor Gap', dot: '#fab219', bg: '#fff6dd', fg: '#7a5000', border: '#f6d98a', icon: '!' },
  Moderate: { label: 'Moderate Gap', dot: '#ec835a', bg: '#fdeee6', fg: '#9a3f17', border: '#f3c2ab', icon: '!!' },
  Critical: { label: 'Critical Gap', dot: '#d03b3b', bg: '#fbe9e9', fg: '#9f2222', border: '#efbaba', icon: '✕' },
}

const severityOrder: Severity[] = ['Critical', 'Moderate', 'Minor', 'None']

function SeverityChip({ severity, short }: { severity: Severity; short?: boolean }) {
  const s = SEVERITY[severity]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: s.bg, color: s.fg, border: `1px solid ${s.border}`, fontSize: '12.5px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
      <span aria-hidden style={{ width: 16, height: 16, borderRadius: '50%', background: s.dot, color: 'white', fontSize: '9.5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</span>
      {short ? (severity === 'None' ? 'None' : severity) : s.label}
    </span>
  )
}

const statIcons: Record<string, IconName> = { building: 'server', people: 'users', gauge: 'dashboard', check: 'check' }
function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: 'building' | 'people' | 'gauge' | 'check'; accent?: boolean }) {
  const text = label.toLowerCase().replace(/(^|[ .])([a-z])/g, (_m, a, b) => a + b.toUpperCase())
  return <TechStatCard label={text} value={value} icon={statIcons[icon]} tone={accent ? 'accent' : 'navy'} />
}

function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  return <TechModal title={title} onClose={onClose} footer={footer} width={wide ? 1000 : 640}>{children}</TechModal>
}

function PageHeader({ crumb, title, description, actions }: { crumb: string; title: string; description: string; actions?: ReactNode }) {
  const { user } = useAuth()
  return (
    <TechPageHeader
      crumbs={[{ label: 'Dashboard', to: roleHome[user?.role ?? 'administrative_admin'] }, { label: 'Analysis & Reporting', to: '/gap-analysis' }, { label: crumb }]}
      title={title}
      description={description}
      actions={actions && <div className="no-print" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{actions}</div>}
    />
  )
}

function KpiCard({ label, value, sub, color, children }: { label: string; value: ReactNode; sub?: ReactNode; color?: string; children?: ReactNode }) {
  return (
    <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '18px 20px', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '11.5px', letterSpacing: '1px', color: '#4b5563', fontWeight: 600, marginBottom: '10px' }}>{label}</div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: color ?? '#111827', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: '12px', color: MUTED, marginTop: '6px' }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

// Circular percentage indicator
function MatchRing({ value, size = 76 }: { value: number; size?: number }) {
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = value >= 85 ? '#0ca30c' : value >= 70 ? TREND_COLOR : '#d03b3b'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Overall competency match ${value}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eceef2" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${(c * value) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="15" fontWeight="700" fill="#111827">{value}%</text>
    </svg>
  )
}

function Tooltip({ x, y, children }: { x: number | string; y: number | string; children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -110%)', background: '#0f2442', color: 'white', fontSize: '12px', lineHeight: 1.5, padding: '8px 10px', borderRadius: '6px', pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: '0 6px 16px rgba(0,0,0,0.2)', zIndex: 5 }}>
      {children}
    </div>
  )
}

// Splits a long label into two lines for the radar chart
function wrapLabel(text: string) {
  if (text.length <= 14) return [text]
  const words = text.split(' ')
  let best = 1
  let bestDiff = Infinity
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length)
    if (diff < bestDiff) { bestDiff = diff; best = i }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

function RadarChart({ rows }: { rows: GapRow[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const size = 500
  const cx = size / 2
  const cy = size / 2
  const radius = 165
  const n = rows.length
  const angle = (i: number) => (-90 + (360 / n) * i) * (Math.PI / 180)
  const point = (i: number, level: number) => {
    const r = (radius * level) / MAX_LEVEL
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))]
  }
  const polygon = (values: number[]) => values.map((v, i) => point(i, v).join(',')).join(' ')
  const hovered = hover !== null ? rows[hover] : null
  const hp = hover !== null ? point(hover, Math.max(hovered!.required, hovered!.current)) : [0, 0]

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '18px', fontSize: '12.5px', color: '#374151', marginBottom: '4px', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke={REQUIRED_COLOR} strokeWidth="2" strokeDasharray="5 3" /></svg>
          Required level (position)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 14, height: 10, background: `${CURRENT_COLOR}55`, border: `2px solid ${CURRENT_COLOR}`, borderRadius: '2px' }} />
          Current level (employee)
        </span>
      </div>
      <div style={{ position: 'relative', maxWidth: size + 140, margin: '0 auto' }}>
        <svg viewBox={`-70 -10 ${size + 140} ${size + 20}`} width="100%" role="img" aria-label="Radar chart comparing required and current competency levels">
          {/* one ring per proficiency level */}
          {Array.from({ length: MAX_LEVEL }, (_, k) => k + 1).map((lvl) => (
            <polygon key={lvl} points={polygon(rows.map(() => lvl))} fill="none" stroke="#e5e7eb" strokeWidth="1" />
          ))}
          {rows.map((_, i) => {
            const [x, y] = point(i, MAX_LEVEL)
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={hover === i ? '#9ca3af' : '#e5e7eb'} strokeWidth="1" />
          })}
          {/* scale numbers */}
          {Array.from({ length: MAX_LEVEL }, (_, k) => k + 1).map((lvl) => (
            <text key={lvl} x={cx + 4} y={cy - (radius * lvl) / MAX_LEVEL + 4} fontSize="10" fill="#9ca3af">{lvl}</text>
          ))}
          <polygon points={polygon(rows.map((r) => r.current))} fill={`${CURRENT_COLOR}40`} stroke={CURRENT_COLOR} strokeWidth="2" strokeLinejoin="round" />
          <polygon points={polygon(rows.map((r) => r.required))} fill="none" stroke={REQUIRED_COLOR} strokeWidth="2" strokeDasharray="6 4" strokeLinejoin="round" />
          {rows.map((r, i) => {
            const [x, y] = point(i, r.current)
            return <circle key={r.code} cx={x} cy={y} r={hover === i ? 6 : 4.5} fill={CURRENT_COLOR} stroke="white" strokeWidth="2" />
          })}
          {/* labels + hover targets */}
          {rows.map((r, i) => {
            const [lx, ly] = point(i, MAX_LEVEL * 1.15)
            const cos = Math.cos(angle(i))
            const anchor = Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end'
            const lines = wrapLabel(r.title)
            const [hx, hy] = point(i, 3.2)
            return (
              <g key={r.code} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
                <line x1={cx} y1={cy} x2={lx} y2={ly} stroke="transparent" strokeWidth="26" />
                <circle cx={hx} cy={hy} r="22" fill="transparent" />
                <text x={lx} y={ly - (lines.length - 1) * 7} textAnchor={anchor} fontSize="11.5" fontWeight={hover === i ? 700 : 500} fill={r.gap > 0 ? '#111827' : '#4b5563'}>
                  {lines.map((line, k) => (
                    <tspan key={k} x={lx} dy={k === 0 ? 0 : 14}>{line}</tspan>
                  ))}
                </text>
              </g>
            )
          })}
        </svg>
        {hovered && (
          <Tooltip x={((hp[0] + 70) / (size + 140)) * 100 + '%'} y={((hp[1] + 10) / (size + 20)) * 100 + '%'}>
            <strong>{hovered.title}</strong><br />
            Required: {hovered.required} – {levelName(hovered.required)}<br />
            Current: {hovered.current} – {(levelName(hovered.current) || 'Not recorded')}<br />
            Gap: {hovered.gap} level{hovered.gap === 1 ? '' : 's'} · {SEVERITY[hovered.severity].label}
          </Tooltip>
        )}
      </div>
      <div style={{ fontSize: '11.5px', color: MUTED, textAlign: 'center', marginTop: '4px' }}>
        Scale: {getDb().config.proficiencyLevels.map((l, i) => `${i + 1} ${l.name}`).join(' · ')}
      </div>
    </div>
  )
}

function GapBarChart({ rows }: { rows: GapRow[] }) {
  const [hover, setHover] = useState<string | null>(null)
  const sorted = [...rows].sort((a, b) => b.gap - a.gap || a.title.localeCompare(b.title))
  const max = Math.max(3, ...rows.map((r) => r.gap))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {sorted.map((r) => {
        const s = SEVERITY[r.severity]
        return (
          <div
            key={r.code}
            onMouseEnter={() => setHover(r.code)}
            onMouseLeave={() => setHover(null)}
            title={`${r.title}: required ${r.required}, current ${r.current}, gap ${r.gap} (${s.label})`}
            style={{ display: 'grid', gridTemplateColumns: '200px 1fr 74px', alignItems: 'center', gap: '10px', padding: '3px 6px', borderRadius: '6px', background: hover === r.code ? '#f4f6f9' : 'transparent' }}
          >
            <span style={{ fontSize: '12.5px', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
            <div style={{ height: '12px', background: '#f1f2f4', borderRadius: '4px', overflow: 'hidden' }}>
              {r.gap > 0 && <div style={{ width: `${(r.gap / max) * 100}%`, height: '100%', background: s.dot, borderRadius: '0 4px 4px 0' }} />}
            </div>
            <span style={{ fontSize: '12px', color: r.gap > 0 ? '#111827' : MUTED, fontWeight: r.gap > 0 ? 700 : 500, whiteSpace: 'nowrap' }}>
              {r.gap > 0 ? `${r.gap} level${r.gap === 1 ? '' : 's'}` : '✓ Meets'}
            </span>
          </div>
        )
      })}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 74px', gap: '10px', padding: '0 6px', fontSize: '10.5px', color: '#9ca3af' }}>
        <span />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {Array.from({ length: max + 1 }, (_, i) => <span key={i}>{i}</span>)}
        </div>
        <span>levels</span>
      </div>
    </div>
  )
}

function SeverityDonut({ summary }: { summary: ReturnType<typeof summarise> }) {
  const [hover, setHover] = useState<Severity | null>(null)
  const counts: Record<Severity, number> = { Critical: summary.critical, Moderate: summary.moderate, Minor: summary.minor, None: summary.meets }
  const size = 150
  const stroke = 22
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const total = summary.total || 1
  const gapPx = summary.total > 1 ? 2 : 0
  // where each slice starts around the ring
  const starts = severityOrder.map((_, i) => severityOrder.slice(0, i).reduce((sum, sev) => sum + (counts[sev] / total) * c, 0))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Gap severity distribution">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f2f4" strokeWidth={stroke} />
        {severityOrder.map((sev, i) => {
          const len = (counts[sev] / total) * c
          if (counts[sev] === 0) return null
          return (
            <circle
              key={sev} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={SEVERITY[sev].dot}
              strokeWidth={hover === sev ? stroke + 4 : stroke}
              strokeDasharray={`${Math.max(0, len - gapPx)} ${c}`} strokeDashoffset={-starts[i]}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              onMouseEnter={() => setHover(sev)} onMouseLeave={() => setHover(null)}
            >
              <title>{`${SEVERITY[sev].label}: ${counts[sev]}`}</title>
            </circle>
          )
        })}
        <text x="50%" y="46%" textAnchor="middle" fontSize="24" fontWeight="700" fill="#111827">{hover ? counts[hover] : summary.total}</text>
        <text x="50%" y="60%" textAnchor="middle" fontSize="10.5" fill={MUTED}>{hover ? SEVERITY[hover].label : 'competencies'}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '150px' }}>
        {severityOrder.map((sev) => (
          <div
            key={sev}
            onMouseEnter={() => setHover(sev)} onMouseLeave={() => setHover(null)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '4px 6px', borderRadius: '6px', background: hover === sev ? '#f4f6f9' : 'transparent' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>
              <span style={{ width: 10, height: 10, borderRadius: '3px', background: SEVERITY[sev].dot }} />
              {sev === 'None' ? 'Meets Requirement' : sev}
            </span>
            <strong style={{ color: '#111827' }}>{counts[sev]}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrendLineChart({ points }: { points: { label: string; value: number; id: string }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const w = 640
  const h = 240
  const pad = { top: 24, right: 52, bottom: 34, left: 52 }
  const innerW = w - pad.left - pad.right
  const innerH = h - pad.top - pad.bottom
  const x = (i: number) => pad.left + (points.length === 1 ? innerW / 2 : (innerW * i) / (points.length - 1))
  const y = (v: number) => pad.top + innerH - (innerH * v) / 100
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ')
  const last = points.length - 1

  if (points.length === 0) return <div style={{ color: MUTED, fontSize: '13px', padding: '30px 0', textAlign: 'center' }}>No completed analyses yet.</div>

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Line chart of overall competency match over time" onMouseLeave={() => setHover(null)}>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={pad.left} x2={w - pad.right} y1={y(v)} y2={y(v)} stroke="#eceef2" strokeWidth="1" />
            <text x={pad.left - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#9ca3af">{v}%</text>
          </g>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 3" />}
        <path d={path} fill="none" stroke={TREND_COLOR} strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={p.id}>
            <rect x={x(i) - innerW / Math.max(2, points.length * 2)} y={pad.top} width={innerW / Math.max(1, points.length)} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} />
            <circle cx={x(i)} cy={y(p.value)} r={hover === i ? 6 : 5} fill={TREND_COLOR} stroke="white" strokeWidth="2" pointerEvents="none" />
            <text x={x(i)} y={h - 10} textAnchor="middle" fontSize="11.5" fill="#4b5563">{p.label}</text>
          </g>
        ))}
        {/* direct label on the latest point only */}
        <text x={x(last)} y={y(points[last].value) - 12} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#111827">{points[last].value}%</text>
      </svg>
      {hover !== null && (
        <Tooltip x={(x(hover) / w) * 100 + '%'} y={(y(points[hover].value) / h) * 100 + '%'}>
          <strong>{points[hover].label}</strong><br />
          Match: {points[hover].value}%<br />
          {points[hover].id}
        </Tooltip>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Shared page pieces                                                  */
/* ------------------------------------------------------------------ */

function Avatar({ employee, size = 52 }: { employee: Employee; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', background: '#e6f0f8', color: NAVY, fontWeight: 700, fontSize: size * 0.33, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid white', boxShadow: `0 0 0 1px ${BORDER}` }}>
      {initials(employee)}
    </span>
  )
}

function EmployeeCard({ employee, extra }: { employee: Employee; extra?: ReactNode }) {
  const position = positionByCode(employee.positionCode)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <Avatar employee={employee} />
      <div style={{ minWidth: '180px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{fullName(employee)}</div>
        <div style={{ color: ACCENT, fontWeight: 600, fontSize: '13.5px' }}>{employee.id}</div>
      </div>
      <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', flex: 1 }}>
        <DetailRow label="Office" value={<>{employee.office}<div style={{ color: MUTED, fontSize: '12.5px' }}>{employee.officeName}</div></>} />
        <DetailRow label="Current position" value={<>{position?.title}<div style={{ color: MUTED, fontSize: '12.5px' }}>SG {position?.salaryGrade}</div></>} />
        {extra}
      </div>
    </div>
  )
}

const statusColors: Record<string, { bg: string; fg: string }> = {
  Completed: { bg: '#e7f6ec', fg: '#15803d' },
  'Pending Review': { bg: '#fef6e4', fg: '#b45309' },
  'In Progress': { bg: '#eef1fb', fg: '#1e3a8a' },
  Analysed: { bg: '#e6f5fc', fg: '#0b4f73' },
  'Not Analysed': { bg: '#f3f4f6', fg: '#4b5563' },
  'Not Profiled': { bg: '#fef6e4', fg: '#b45309' },
  Superseded: { bg: '#f3f4f6', fg: '#6b7280' },
}

function Pill({ text }: { text: string }) {
  const c = statusColors[text] ?? statusColors['Not Analysed']
  return <span style={{ background: c.bg, color: c.fg, fontSize: '12.5px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', whiteSpace: 'nowrap' }}>{text}</span>
}

const secondaryBtn: CSSProperties = { ...ghostBtn, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '13.5px' }


/* ------------------------------------------------------------------ */
/* Screen 1: Gap Analysis (select employee + preview + run)            */
/* ------------------------------------------------------------------ */

function GapAnalysisSetup() {
  const navigate = useNavigate()
  const creatorId = useCreatorId()
  const today = new Date().toISOString().slice(0, 10)

  // search + filters
  const [search, setSearch] = useState('')
  const [idFilter, setIdFilter] = useState('')
  const [officeFilter, setOfficeFilter] = useState('All')
  const [positionFilter, setPositionFilter] = useState('All')
  const [analysisFilter, setAnalysisFilter] = useState('All')

  // selection + configuration
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')
  const [existingId, setExistingId] = useState<string | null>(null)

  const employees = allEmployees()
  const offices = allOffices()
  const q = search.trim().toLowerCase()
  const list = employees.filter(
    (e) =>
      (!q || fullName(e).toLowerCase().includes(q) || e.officeName.toLowerCase().includes(q)) &&
      (!idFilter.trim() || e.id.toLowerCase().includes(idFilter.trim().toLowerCase())) &&
      (officeFilter === 'All' || e.office === officeFilter) &&
      (positionFilter === 'All' || e.positionCode === positionFilter) &&
      (analysisFilter === 'All' || analysisStatusOf(e) === analysisFilter),
  )

  const employee = employees.find((e) => e.id === selectedId) ?? null
  const position = employee ? positionByCode(employee.positionCode) : undefined
  const rows = employee ? previewRows(employee) : []
  const summary = summarise(rows)
  const profiled = employee ? isProfiled(employee) : false
  const lastCompleted = employee ? employeeAnalyses(employee.id).slice(-1)[0] : undefined

  function selectEmployee(e: Employee) {
    setSelectedId(e.id)
    setError('')
    setExistingId(null)
  }

  function resetAll() {
    setSearch(''); setIdFilter(''); setOfficeFilter('All'); setPositionFilter('All'); setAnalysisFilter('All')
    setSelectedId(null); setRemarks(''); setError(''); setExistingId(null)
  }

  function generate(force = false) {
    if (!employee || !position) {
      setError('Select an employee first.')
      return
    }
    if (!profiled) {
      setError('This employee has no current competency levels recorded yet, so there is nothing to compare. Record their levels first.')
      return
    }
    if (rows.length === 0) {
      setError(`No competency requirements are set for ${position.title}. Set them in Position–Competency Requirements first.`)
      return
    }
    if (lastCompleted && !force) {
      setExistingId(lastCompleted.id)
      return
    }
    // the older Completed analysis of this employee becomes Superseded inside runGapAnalyses
    const [id] = runGapAnalyses([employee.dbId], creatorId, remarks.trim())
    if (id) navigate(`/gap-analysis/results/${gapAnalysisCode(id)}`)
  }

  const canGenerate = !!employee && profiled && rows.length > 0

  // Batch: analyse everyone in the filtered list who has current levels and no completed analysis yet (e.g. one office)
  const batchTargets = list.filter((e) => isProfiled(e) && !!positionByCode(e.positionCode) && previewRows(e).length > 0 && !analysisStore().some((r) => r.employeeId === e.id && r.status === 'Completed'))
  function runBatch() {
    if (batchTargets.length === 0) { setError('Everyone in this selection has already been analysed, or has no current levels recorded.'); return }
    runGapAnalyses(batchTargets.map((e) => e.dbId), creatorId, remarks.trim())
    navigate(`/gap-analysis/history?office=${encodeURIComponent(officeFilter)}&saved=${batchTargets.length}`)
  }

  return (
    <>
      <PageHeader
        crumb="Gap Analysis"
        title="Competency Gap Analysis"
        description="Compare an employee’s current competency levels against the required levels for their position."
        actions={
          <button style={secondaryBtn} onClick={() => navigate('/gap-analysis/history')}>
            <ActionIcon name="history" /> View Analysis History
          </button>
        }
      />

      {/* Step 1 – find the employee */}
      <Card title="1. Select Employee" subtitle="Search and filter employees, then choose who to analyse." style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search employee by name or office..." />
          <input style={{ ...inputStyle, width: '190px' }} value={idFilter} onChange={(e) => setIdFilter(e.target.value)} placeholder="Employee ID" />
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
          <select style={selectStyle} value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)}>
            <option value="All">Office: All</option>
            {offices.map((o) => <option key={o} value={o}>Office: {o}</option>)}
          </select>
          <select style={selectStyle} value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
            <option value="All">Position: All</option>
            {allPositions().map((p) => <option key={p.code} value={p.code}>{p.title}</option>)}
          </select>
          <select style={selectStyle} value={analysisFilter} onChange={(e) => setAnalysisFilter(e.target.value)}>
            <option value="All">Analysis Status: All</option>
            <option value="Analysed">Analysed</option>
            <option value="Not Analysed">Not Analysed</option>
            <option value="Not Profiled">Not Profiled</option>
          </select>
        </div>
        {officeFilter !== 'All' && (
          <div data-testid="batch-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', marginTop: '14px' }}>
            <span style={{ fontSize: '13.5px', color: NAVY }}>
              <strong>Batch: {officeFilter}</strong> · {list.length} employee{list.length === 1 ? '' : 's'} selected · {batchTargets.length} ready to analyse (current levels recorded, not yet analysed)
            </span>
            <button style={primaryBtn} onClick={runBatch} disabled={batchTargets.length === 0}>Run Gap Analysis for this Office</button>
          </div>
        )}
        {error && officeFilter !== 'All' && !employee && <div style={{ color: '#b91c1c', fontSize: '13px', marginTop: '10px' }}>{error}</div>}
        <div style={{ overflowX: 'auto', marginTop: '6px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, background: 'white', padding: '12px 14px' }}>EMPLOYEE</th>
                <th style={{ ...thStyle, background: 'white', padding: '12px 14px' }}>OFFICE</th>
                <th style={{ ...thStyle, background: 'white', padding: '12px 14px' }}>POSITION</th>
                <th style={{ ...thStyle, background: 'white', padding: '12px 14px' }}>LATEST ANALYSIS</th>
                <th style={{ ...thStyle, background: 'white', padding: '12px 14px' }}>ANALYSIS STATUS</th>
                <th style={{ ...thStyle, background: 'white', padding: '12px 14px', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const la = employeeAnalyses(e.id).slice(-1)[0]
                const selected = e.id === selectedId
                return (
                  <tr key={e.id} onClick={() => selectEmployee(e)} style={{ cursor: 'pointer', background: selected ? '#eef8fd' : 'white' }}>
                    <td style={{ ...tdStyle, padding: '12px 14px', borderLeft: `4px solid ${selected ? ACCENT : 'transparent'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar employee={e} size={34} />
                        <div>
                          <div style={{ fontWeight: 700, color: '#111827' }}>{fullName(e)}</div>
                          <div style={{ color: ACCENT, fontSize: '12.5px', fontWeight: 600, whiteSpace: 'nowrap' }}>{e.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, padding: '12px 14px', fontWeight: 600 }}>{e.office}</td>
                    <td style={{ ...tdStyle, padding: '12px 14px' }}>{positionByCode(e.positionCode)?.title}</td>
                    <td style={{ ...tdStyle, padding: '12px 14px' }}>{la ? <>{la.id}<div style={{ color: MUTED, fontSize: '12.5px' }}>{formatDate(la.analysisDate)}</div></> : '—'}</td>
                    <td style={{ ...tdStyle, padding: '12px 14px' }}><Pill text={analysisStatusOf(e)} /></td>
                    <td style={{ ...tdStyle, padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); selectEmployee(e) }}
                        style={{ background: selected ? ACCENT : '#f1f0ee', color: selected ? 'white' : '#374151', border: 'none', borderRadius: '4px', padding: '7px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {selected ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {list.length === 0 && (
                <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: MUTED, padding: '30px' }}>No employees match your search or filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {!employee && (
        <div style={{ background: 'white', border: `1px dashed ${BORDER}`, borderRadius: '12px', padding: '36px', textAlign: 'center', color: MUTED, fontSize: '14px' }}>
          Select an employee above to preview their competency gap analysis.
        </div>
      )}

      {employee && (
        <>
          {/* Employee summary + configuration */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.35fr)', gap: '20px', marginBottom: '20px' }}>
            <Card title="Employee Summary">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <Avatar employee={employee} size={64} />
                <div>
                  <div style={{ fontSize: '19px', fontWeight: 700, color: '#111827' }}>{fullName(employee)}</div>
                  <div style={{ color: ACCENT, fontWeight: 600 }}>{employee.id}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <DetailRow label="Office" value={employee.office} />
                <DetailRow label="Position" value={position?.title} />
                <DetailRow label="Latest analysis" value={lastCompleted ? `${lastCompleted.id} · ${formatDate(lastCompleted.analysisDate)}` : '—'} />
                <DetailRow label="Analysis status" value={<Pill text={analysisStatusOf(employee)} />} />
              </div>
            </Card>

            <Card title="2. Analysis Details" subtitle="The employee’s current levels are compared with the requirements of their current position.">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="Position">
                  <input style={inputStyle} value={position ? `${position.title} (SG ${position.salaryGrade})` : '—'} readOnly />
                </Field>
                <Field label="Analysis date">
                  <input style={inputStyle} type="date" value={today} readOnly />
                </Field>
                <Field label="Remarks (optional)" full>
                  <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Saved with the analysis (tbl_gap_analyses.remarks)" />
                </Field>
              </div>
              {!profiled && (
                <div style={{ marginTop: '14px', background: '#fef6e4', border: '1px solid #fde3b0', color: '#7a4b00', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' }}>
                  This employee has <strong>no current competency levels</strong> recorded. A gap analysis can only be generated once their current levels are recorded.
                </div>
              )}
            </Card>
          </div>

          {/* KPI cards */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <StatCard label="TOTAL REQUIRED COMPETENCIES" value={String(summary.total)} icon="building" />
            <StatCard label="CURRENT LEVELS RECORDED" value={`${summary.assessed} of ${summary.total}`} icon="check" />
            <StatCard label="MEETS REQUIREMENT" value={String(summary.meets)} icon="people" />
            <StatCard label="COMPETENCIES WITH GAPS" value={String(summary.gaps)} icon="gauge" accent />
          </div>

          {/* Preview table */}
          <Card
            title="3. Position Competency Preview"
            subtitle={position ? `${position.title} · required level vs current level` : ''}
            right={<div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{severityOrder.map((s) => <SeverityChip key={s} severity={s} />)}</div>}
            flush
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>COMPETENCY</th>
                    <th style={thStyle}>CATEGORY</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>REQUIRED LEVEL</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>CURRENT LEVEL</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>GAP</th>
                    <th style={thStyle}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.code}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700, color: '#111827' }}>{r.title}{r.critical && <span title="Critical to the role" style={{ marginLeft: '6px', fontSize: '11px', color: ACCENT, fontWeight: 700 }}>★ Critical</span>}</div>
                        <div style={{ color: MUTED, fontSize: '12.5px' }}>{r.code}</div>
                      </td>
                      <td style={tdStyle}>{r.category}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}><strong>{r.required}</strong> <span style={{ color: MUTED, fontSize: '12.5px' }}>{levelName(r.required)}</span></td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{r.current ? <><strong>{r.current}</strong> <span style={{ color: MUTED, fontSize: '12.5px' }}>{levelName(r.current)}</span></> : <span style={{ color: MUTED }}>Not recorded</span>}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, fontSize: '15px', color: r.gap > 0 ? '#111827' : MUTED }}>{r.gap}</td>
                      <td style={tdStyle}><SeverityChip severity={r.severity} /></td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: MUTED, padding: '30px' }}>No competency requirements are set for this position yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Messages */}
          {error && <div style={{ marginTop: '16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', padding: '12px 14px', fontSize: '13.5px' }}>{error}</div>}
          {existingId && (
            <div style={{ marginTop: '16px', background: '#eef6fb', border: '1px solid #bfdcef', color: '#0b3d5c', borderRadius: '8px', padding: '12px 14px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ flex: 1 }}>This employee already has a completed analysis, <strong>{existingId}</strong>. Open it, or regenerate to replace it (the old analysis is kept as Superseded).</span>
              <button style={ghostBtn} onClick={() => navigate(`/gap-analysis/results/${existingId}`)}>Open {existingId}</button>
              <button style={{ ...primaryBtn, padding: '9px 14px', fontSize: '13px' }} onClick={() => generate(true)}>Regenerate</button>
            </div>
          )}
        </>
      )}

      {/* Bottom actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '22px' }}>
        <button style={secondaryBtn} onClick={resetAll}>Cancel / Reset</button>
        <button
          style={{ ...primaryBtn, opacity: canGenerate ? 1 : 0.5, cursor: canGenerate ? 'pointer' : 'not-allowed' }}
          disabled={!canGenerate}
          onClick={() => generate()}
        >
          <ActionIcon name="chart" /> Generate Gap Analysis
        </button>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Screen 2: Gap Analysis Results                                      */
/* ------------------------------------------------------------------ */

function GapAnalysisResults({ analysisId }: { analysisId: string }) {
  const navigate = useNavigate()
  const [severityFilter, setSeverityFilter] = useState<'All' | Severity>('All')
  const [expanded, setExpanded] = useState<string[]>([])
  const [notice, setNotice] = useState('')

  const record = findRecord(analysisId)
  if (!record) {
    return (
      <>
        <PageHeader crumb="Gap Analysis Results" title="Gap Analysis Results" description="The analysis you are looking for could not be found." />
        <Card>
          <p style={{ margin: '0 0 14px', color: '#374151' }}>No gap analysis with ID <strong>{analysisId}</strong> exists.</p>
          <button style={primaryBtn} onClick={() => navigate('/gap-analysis/history')}>Go to Analysis History</button>
        </Card>
      </>
    )
  }

  const d = analysisDetails(record)
  const { employee, assessment, position, rows, summary } = d
  const history = employeeAnalyses(employee.id)
  const latest = history[history.length - 1]
  const isHistorical = record.status === 'Superseded' || (latest && latest.id !== record.id)
  const tableRows = rows
    .filter((r) => severityFilter === 'All' || r.severity === severityFilter)
    .sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity) || b.gap - a.gap)
  const allExpanded = tableRows.length > 0 && tableRows.every((r) => expanded.includes(r.code))

  function toggle(code: string) {
    setExpanded(expanded.includes(code) ? expanded.filter((c) => c !== code) : [...expanded, code])
  }

  function exportPdf() {
    setNotice('In the print window, choose “Save as PDF” as the destination.')
    setTimeout(() => window.print(), 50)
  }

  return (
    <>
      <PageHeader
        crumb="Gap Analysis Results"
        title="Gap Analysis Results"
        description={`Competency gaps for ${fullName(employee)} against the requirements of ${position.title}.`}
        actions={
          <>
            <button style={secondaryBtn} onClick={exportPdf}><ActionIcon name="pdf" /> Export PDF</button>
            <button style={secondaryBtn} onClick={() => downloadCsv(`${record.id}_gap_analysis.csv`, analysisCsv(d))}><ActionIcon name="download" /> Export Excel</button>
            <button style={secondaryBtn} onClick={() => window.print()}><ActionIcon name="print" /> Print</button>
            <button style={{ ...primaryBtn, padding: '10px 16px', fontSize: '13.5px' }} onClick={() => navigate(`/gap-analysis/history?employee=${employee.id}`)}><ActionIcon name="history" /> View History</button>
          </>
        }
      />

      {notice && (
        <div className="no-print" style={{ marginBottom: '16px', background: '#eef6fb', border: '1px solid #bfdcef', color: '#0b3d5c', borderRadius: '8px', padding: '10px 14px', fontSize: '13.5px', display: 'flex', justifyContent: 'space-between' }}>
          {notice}
          <button onClick={() => setNotice('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0b3d5c' }}>&times;</button>
        </div>
      )}
      {isHistorical && (
        <div className="no-print" style={{ marginBottom: '16px', background: '#fef6e4', border: '1px solid #fde3b0', color: '#7a4b00', borderRadius: '8px', padding: '10px 14px', fontSize: '13.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span>You are viewing a <strong>historical analysis</strong> ({assessment.period}{record.status === 'Superseded' ? ', superseded' : ''}).</span>
          {latest && <button style={ghostBtn} onClick={() => navigate(`/gap-analysis/results/${latest.id}`)}>Open latest ({latest.id}) &rarr;</button>}
        </div>
      )}

      {/* Employee + analysis information */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '1px', color: MUTED, fontWeight: 700, marginBottom: '12px' }}>EMPLOYEE</div>
            <EmployeeCard employee={employee} />
          </div>
          <div style={{ borderLeft: `1px solid ${BORDER}`, paddingLeft: '24px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '1px', color: MUTED, fontWeight: 700, marginBottom: '12px' }}>ANALYSIS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
              <DetailRow label="Analysis ID" value={<strong style={{ color: ACCENT }}>{record.id}</strong>} />
                            <DetailRow label="Position" value={position.title} />
                            <DetailRow label="Analysis date" value={formatDate(record.analysisDate)} />
                            <DetailRow label="Created by" value={record.reviewer} />
              <DetailRow label="Status" value={<Pill text={record.status} />} />
            </div>
          </div>
        </div>
      </Card>

      {/* KPI cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <KpiCard label="TOTAL COMPETENCIES" value={summary.total} sub="Required by the position" />
        <KpiCard label="MEETS REQUIREMENT" value={summary.meets} sub={`${Math.round((summary.meets / Math.max(1, summary.total)) * 100)}% of competencies`} color="#0a6b0a" />
        <KpiCard label="COMPETENCY GAPS" value={summary.gaps} sub={`${summary.moderate} moderate · ${summary.minor} minor`} />
        <KpiCard label="CRITICAL GAPS" value={summary.critical} sub="Priority for development" color={summary.critical ? '#9f2222' : undefined} />
        <KpiCard label="OVERALL MATCH" value={`${summary.match}%`} sub="Levels achieved vs required">
          <MatchRing value={summary.match} />
        </KpiCard>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <Card title="Required vs Current Competency Levels" subtitle="Hover a competency to see its levels. Where the filled shape is inside the dashed line, there is a gap.">
          <RadarChart rows={rows} />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Competency Gap by Competency" subtitle="Number of proficiency levels below the requirement">
            <GapBarChart rows={rows} />
          </Card>
          <Card title="Gap Severity" subtitle="Minor = 1 level · Moderate = 2 · Critical = 3+, or 2 on a role-critical competency">
            <SeverityDonut summary={summary} />
          </Card>
        </div>
      </div>

      {/* Detailed table */}
      <Card
        title="Detailed Gap Analysis"
        subtitle="Click a row to see the competency description, evidence and assessor remarks."
        right={
          <div className="no-print" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {(['All', ...severityOrder] as ('All' | Severity)[]).map((s) => {
              const active = severityFilter === s
              const count = s === 'All' ? rows.length : rows.filter((r) => r.severity === s).length
              return (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  style={{ background: active ? '#0f2442' : 'white', color: active ? 'white' : '#1f2937', border: `1px solid ${active ? '#0f2442' : BORDER}`, borderRadius: '999px', padding: '6px 12px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {s === 'All' ? 'All' : s === 'None' ? 'Meets' : s} ({count})
                </button>
              )
            })}
            <button style={{ ...ghostBtn, padding: '6px 12px', fontSize: '12.5px' }} onClick={() => setExpanded(allExpanded ? [] : tableRows.map((r) => r.code))}>
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
        }
        flush
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>COMPETENCY</th>
                <th style={thStyle}>CATEGORY</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>REQUIRED</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>CURRENT</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>GAP</th>
                <th style={thStyle}>SEVERITY</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r) => {
                const open = expanded.includes(r.code)
                return (
                  <Fragment key={r.code}>
                    <tr onClick={() => toggle(r.code)} style={{ cursor: 'pointer', background: open ? '#f7fbfe' : 'white' }}>
                      <td style={{ ...tdStyle, borderLeft: `4px solid ${open ? ACCENT : 'transparent'}` }}>
                        <div style={{ fontWeight: 700, color: '#111827' }}>{r.title}{r.critical && <span title="Critical to the role" style={{ marginLeft: '6px', fontSize: '11px', color: ACCENT, fontWeight: 700 }}>★ Critical</span>}</div>
                        <div style={{ color: MUTED, fontSize: '12.5px' }}>{r.code}</div>
                      </td>
                      <td style={tdStyle}>{r.category}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}><strong>{r.required}</strong></td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}><strong>{r.current}</strong></td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, fontSize: '15px', color: r.gap > 0 ? '#111827' : MUTED }}>{r.gap}</td>
                      <td style={tdStyle}><SeverityChip severity={r.severity} short /></td>
                      <td style={{ ...tdStyle, color: '#374151' }}>{statusText[r.severity]}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button
                          className="no-print"
                          onClick={(e) => { e.stopPropagation(); toggle(r.code) }}
                          aria-expanded={open}
                          style={{ background: open ? ACCENT : '#f1f0ee', color: open ? 'white' : '#374151', border: 'none', borderRadius: '4px', padding: '7px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {open ? 'Hide details ▴' : 'View details ▾'}
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={8} style={{ padding: '0 18px 18px 22px', background: '#f7fbfe', borderBottom: `1px solid ${BORDER}` }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', background: 'white', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px' }}>
                            <DetailRow label="Competency description" value={r.description} />
                            <DetailRow label="Required proficiency" value={<><strong>{r.required} – {levelName(r.required)}</strong><div style={{ color: MUTED, fontSize: '13px' }}>{levelDesc(r.required)}</div></>} />
                            <DetailRow label="Current level" value={<><strong>{r.current} – {levelName(r.current)}</strong><div style={{ color: MUTED, fontSize: '13px' }}>{levelDesc(r.current)}</div></>} />
                            <DetailRow
                              label="Gap explanation"
                              value={r.gap === 0
                                ? 'Meets the required level. No development action needed for this competency.'
                                : `${r.gap} level${r.gap === 1 ? '' : 's'} below the requirement → ${SEVERITY[r.severity].label}${r.critical ? ' (role-critical competency)' : ''}.`}
                            />
                            <DetailRow label="Evidence" value={r.evidence} />
                            <DetailRow label="Assessor remarks" value={<em style={{ color: '#374151' }}>“{r.remark}”</em>} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {tableRows.length === 0 && (
                <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: MUTED, padding: '30px' }}>No competencies with this severity.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Screen 3: Gap Analysis History                                      */
/* ------------------------------------------------------------------ */

interface HistoryFilters {
  search: string
  office: string
  position: string
  period: string
  from: string
  to: string
  severity: 'All' | 'Has Critical' | 'Moderate or worse' | 'Minor only' | 'No gaps'
  status: 'All' | AnalysisStatus
}

const emptyFilters: HistoryFilters = { search: '', office: 'All', position: 'All', period: 'All', from: '', to: '', severity: 'All', status: 'All' }

const HISTORY_PER_PAGE = 8

interface ChangeRow {
  code: string
  title: string
  prevRequired: number | null
  prevAssessed: number | null
  currRequired: number | null
  currAssessed: number | null
  prevGap: number | null
  currGap: number | null
}

function compareAnalyses(prev: ReturnType<typeof analysisDetails>, curr: ReturnType<typeof analysisDetails>): ChangeRow[] {
  const codes = [...new Set([...curr.rows.map((r) => r.code), ...prev.rows.map((r) => r.code)])]
  return codes.map((code) => {
    const p = prev.rows.find((r) => r.code === code)
    const c = curr.rows.find((r) => r.code === code)
    return {
      code,
      title: (curr.rows.find((r) => r.code === code) ?? prev.rows.find((r) => r.code === code))?.title ?? code,
      prevRequired: p?.required ?? null,
      prevAssessed: p?.current ?? null,
      currRequired: c?.required ?? null,
      currAssessed: c?.current ?? null,
      prevGap: p?.gap ?? null,
      currGap: c?.gap ?? null,
    }
  })
}

function changeSummary(rows: ChangeRow[]) {
  const both = rows.filter((r) => r.prevAssessed !== null && r.currAssessed !== null)
  return {
    newGaps: rows.filter((r) => (r.currGap ?? 0) > 0 && (r.prevGap === null || r.prevGap === 0)).length,
    improved: both.filter((r) => r.currAssessed! > r.prevAssessed!).length,
    unchanged: both.filter((r) => r.currAssessed === r.prevAssessed).length,
    declined: both.filter((r) => r.currAssessed! < r.prevAssessed!).length,
    resolved: rows.filter((r) => (r.prevGap ?? 0) > 0 && r.currGap === 0).length,
  }
}

function ChangeCell({ row }: { row: ChangeRow }) {
  if (row.prevAssessed === null) return <span style={{ color: ACCENT, fontWeight: 600 }}>New requirement</span>
  if (row.currAssessed === null) return <span style={{ color: MUTED }}>No longer required</span>
  const diff = row.currAssessed - row.prevAssessed
  if (diff > 0) return <span style={{ color: '#0a6b0a', fontWeight: 700 }}>▲ +{diff} Improved</span>
  if (diff < 0) return <span style={{ color: '#9f2222', fontWeight: 700 }}>▼ {diff} Declined</span>
  return <span style={{ color: MUTED, fontWeight: 600 }}>— No change</span>
}

function GapAnalysisHistory() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initial = { ...emptyFilters, search: searchParams.get('employee') ?? '', office: searchParams.get('office') ?? 'All' }
  const savedCount = Number(searchParams.get('saved')) || 0
  const [draft, setDraft] = useState<HistoryFilters>(initial)
  const [applied, setApplied] = useState<HistoryFilters>(initial)
  const [page, setPage] = useState(1)
  const [compare, setCompare] = useState<{ prevId: string; currId: string } | null>(null)

  const all = analysisStore().sort((a, b) => b.analysisDate.localeCompare(a.analysisDate) || b.id.localeCompare(a.id)).map(analysisDetails)

  const q = applied.search.trim().toLowerCase()
  const filtered = all.filter((d) => {
    const s = d.summary
    const severityOk =
      applied.severity === 'All' ||
      (applied.severity === 'Has Critical' && s.critical > 0) ||
      (applied.severity === 'Moderate or worse' && s.critical + s.moderate > 0) ||
      (applied.severity === 'Minor only' && s.gaps > 0 && s.gaps === s.minor) ||
      (applied.severity === 'No gaps' && s.gaps === 0)
    return (
      (!q || fullName(d.employee).toLowerCase().includes(q) || d.employee.id.toLowerCase().includes(q) || d.analysis.id.toLowerCase().includes(q)) &&
      (applied.office === 'All' || d.employee.office === applied.office) &&
      (applied.position === 'All' || d.position.code === applied.position) &&
      (!applied.from || d.analysis.analysisDate >= applied.from) &&
      (!applied.to || d.analysis.analysisDate <= applied.to) &&
      severityOk &&
      (applied.status === 'All' || d.analysis.status === applied.status)
    )
  })

  // If the results are all for one employee, show that employee's trend
  const employeeIds = [...new Set(filtered.map((d) => d.employee.id))]
  const single = employeeIds.length === 1 && q ? allEmployees().find((e) => e.id === employeeIds[0]) ?? null : null
  const singleHistory = single ? employeeAnalyses(single.id).map(analysisDetails) : []
  const latest = singleHistory[singleHistory.length - 1]
  const previous = singleHistory[singleHistory.length - 2]
  const latestChange = latest && previous ? changeSummary(compareAnalyses(previous, latest)) : null

  const totalPages = Math.max(1, Math.ceil(filtered.length / HISTORY_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * HISTORY_PER_PAGE, currentPage * HISTORY_PER_PAGE)

  function apply() {
    if (draft.from && draft.to && draft.from > draft.to) return
    setApplied(draft)
    setPage(1)
  }

  function reset() {
    setDraft(emptyFilters)
    setApplied(emptyFilters)
    setPage(1)
  }

  function openCompare(d: ReturnType<typeof analysisDetails>) {
    const list = employeeAnalyses(d.employee.id)
    const i = list.findIndex((a) => a.id === d.analysis.id)
    if (list.length < 2) return
    if (i <= 0) setCompare({ prevId: list[0].id, currId: list[1].id })
    else setCompare({ prevId: list[i - 1].id, currId: list[i].id })
  }

  const avgMatch = filtered.length ? Math.round(filtered.reduce((s, d) => s + d.summary.match, 0) / filtered.length) : 0
  const dateError = draft.from && draft.to && draft.from > draft.to

  return (
    <>
      <PageHeader
        crumb="Gap Analysis History"
        title="Gap Analysis History"
        description="Review previous competency gap analyses and track changes in employee competency levels over time."
        actions={
          <button style={{ ...primaryBtn, padding: '10px 16px', fontSize: '13.5px' }} onClick={() => navigate('/gap-analysis')}>
            <ActionIcon name="chart" /> New Gap Analysis
          </button>
        }
      />

      {savedCount > 0 && (
        <div data-testid="saved-banner" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '8px', padding: '10px 16px', fontSize: '13.5px', marginBottom: '16px' }}>
          Gap analysis saved for {savedCount} employee{savedCount === 1 ? '' : 's'}. Results are listed below.
        </div>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <SearchBox value={draft.search} onChange={(v) => setDraft({ ...draft, search: v })} placeholder="Search employee name, employee ID or analysis ID..." />
          <select style={selectStyle} value={draft.office} onChange={(e) => setDraft({ ...draft, office: e.target.value })}>
            <option value="All">Office: All</option>
            {allOffices().map((o) => <option key={o} value={o}>Office: {o}</option>)}
          </select>
          <select style={selectStyle} value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })}>
            <option value="All">Position: All</option>
            {allPositions().map((p) => <option key={p.code} value={p.code}>{p.title}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
            From <input type="date" style={{ ...inputStyle, width: '150px' }} value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
            To <input type="date" style={{ ...inputStyle, width: '150px' }} value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
          </label>
          <select style={selectStyle} value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value as HistoryFilters['severity'] })}>
            <option value="All">Gap Severity: All</option>
            <option value="Has Critical">Has critical gaps</option>
            <option value="Moderate or worse">Moderate or worse</option>
            <option value="Minor only">Minor gaps only</option>
            <option value="No gaps">No gaps</option>
          </select>
          <select style={selectStyle} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as HistoryFilters['status'] })}>
            <option value="All">Analysis Status: All</option>
            <option value="Completed">Completed</option>
            <option value="Superseded">Superseded</option>
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <button style={secondaryBtn} onClick={reset}><Icon name="filter" /> Reset</button>
            <button style={{ ...primaryBtn, padding: '10px 18px', fontSize: '13.5px', opacity: dateError ? 0.5 : 1 }} onClick={apply} disabled={!!dateError}>Apply Filters</button>
          </div>
        </div>
        {dateError && <div style={{ color: '#991b1b', fontSize: '12.5px', marginTop: '8px' }}>The “From” date must be before the “To” date.</div>}
      </Card>

      {/* One employee: card, KPIs, trend and comparison */}
      {single && (
        <>
          <Card style={{ marginBottom: '20px' }}>
            <EmployeeCard employee={single} />
          </Card>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <KpiCard label="TOTAL ANALYSES" value={singleHistory.length} sub="Completed analyses" />
            <KpiCard label="LATEST MATCH" value={latest ? `${latest.summary.match}%` : '—'} sub={latest ? latest.assessment.period : ''}>
              {latest && <MatchRing value={latest.summary.match} size={64} />}
            </KpiCard>
            <KpiCard
              label="PREVIOUS MATCH"
              value={previous ? `${previous.summary.match}%` : '—'}
              sub={previous && latest ? (
                <span style={{ color: latest.summary.match >= previous.summary.match ? '#0a6b0a' : '#9f2222', fontWeight: 700 }}>
                  {latest.summary.match >= previous.summary.match ? '▲' : '▼'} {Math.abs(latest.summary.match - previous.summary.match)} pts since {previous.assessment.period}
                </span>
              ) : 'No earlier analysis'}
            />
            <KpiCard label="CURRENT OPEN GAPS" value={latest ? latest.summary.gaps : '—'} sub={latest ? `${latest.summary.critical} critical` : ''} />
            <KpiCard label="RESOLVED GAPS" value={latestChange ? latestChange.resolved : '—'} sub="Since the previous analysis" color="#0a6b0a" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <Card title="Overall Competency Match Over Time" subtitle="Hover a point for details">
              <TrendLineChart points={singleHistory.map((d) => ({ label: d.assessment.period, value: d.summary.match, id: `${d.analysis.id} · ${d.position.title}` }))} />
            </Card>
            <Card title="Current vs Previous Analysis" subtitle={latest && previous ? `${previous.assessment.period} → ${latest.assessment.period}` : 'Needs at least two analyses'}>
              {latestChange ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    {[
                      { label: 'New Gaps', value: latestChange.newGaps, color: '#9f2222', icon: '+' },
                      { label: 'Improved', value: latestChange.improved, color: '#0a6b0a', icon: '▲' },
                      { label: 'Unchanged', value: latestChange.unchanged, color: '#4b5563', icon: '—' },
                      { label: 'Resolved Gaps', value: latestChange.resolved, color: '#0a6b0a', icon: '✓' },
                    ].map((c) => (
                      <div key={c.label} style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', color: MUTED, fontWeight: 600 }}><span style={{ color: c.color }}>{c.icon}</span> {c.label}</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>{c.value}</div>
                      </div>
                    ))}
                  </div>
                  <button style={{ ...ghostBtn, width: '100%' }} onClick={() => setCompare({ prevId: previous!.analysis.id, currId: latest!.analysis.id })}>
                    Open full comparison &rarr;
                  </button>
                </>
              ) : (
                <div style={{ color: MUTED, fontSize: '13.5px' }}>This employee has only one completed analysis, so there is nothing to compare yet.</div>
              )}
            </Card>
          </div>
        </>
      )}

      {!single && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <KpiCard label="ANALYSES SHOWN" value={filtered.length} sub="Matching the filters" />
          <KpiCard label="EMPLOYEES" value={employeeIds.length} sub="With at least one analysis" />
          <KpiCard label="AVERAGE MATCH" value={`${avgMatch}%`} sub="Across shown analyses" />
          <KpiCard label="CRITICAL GAPS" value={filtered.reduce((s, d) => s + d.summary.critical, 0)} sub="Across shown analyses" />
          <div style={{ flex: 1.4, minWidth: '240px', background: '#eef6fb', border: '1px solid #bfdcef', borderRadius: '12px', padding: '16px 18px', fontSize: '13.5px', color: '#0b3d5c', display: 'flex', alignItems: 'center' }}>
            Search for one employee and click Apply Filters to see their match trend and a comparison with their previous analysis.
          </div>
        </div>
      )}

      {/* History table */}
      <Card title="Analysis History" right={<span style={{ fontSize: '13px', color: MUTED }}>{filtered.length} analyses</span>} flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>ANALYSIS ID</th>
                {!single && <th style={thStyle}>EMPLOYEE</th>}
                <th style={thStyle}>ANALYSIS DATE</th>
                <th style={thStyle}>POSITION</th>
                <th style={thStyle}>MATCH SCORE</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>GAPS</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>CRITICAL</th>
                <th style={thStyle}>ANALYSIS DATE</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((d) => {
                const canCompare = d.analysis.status === 'Completed' && employeeAnalyses(d.employee.id).length >= 2
                return (
                  <tr key={d.analysis.id}>
                    <td style={{ ...tdStyle, color: ACCENT, fontWeight: 700, whiteSpace: 'nowrap' }}>{d.analysis.id}</td>
                    {!single && (
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700, color: '#111827' }}>{fullName(d.employee)}</div>
                        <div style={{ color: MUTED, fontSize: '12.5px' }}>{d.employee.id} · {d.employee.office}</div>
                      </td>
                    )}
                    <td style={tdStyle}>{d.assessment.period}</td>
                    <td style={tdStyle}>{d.position.title}</td>
                    <td style={{ ...tdStyle, minWidth: '130px' }}>
                      <div style={{ fontWeight: 700, marginBottom: '5px' }}>{d.summary.match}%</div>
                      <div style={{ height: '6px', background: '#eceef2', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${d.summary.match}%`, height: '100%', background: TREND_COLOR, borderRadius: '3px' }} />
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{d.summary.gaps}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {d.summary.critical > 0 ? <span style={{ color: '#9f2222', fontWeight: 700 }}>✕ {d.summary.critical}</span> : <span style={{ color: MUTED }}>0</span>}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDate(d.analysis.analysisDate)}</td>
                    <td style={tdStyle}><Pill text={d.analysis.status} /></td>
                    <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button onClick={() => navigate(`/gap-analysis/results/${d.analysis.id}`)} style={{ background: ACCENT, color: 'white', border: 'none', borderRadius: '4px', padding: '7px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>View</button>
                        <button
                          onClick={() => openCompare(d)}
                          disabled={!canCompare}
                          title={canCompare ? 'Compare with the previous analysis' : 'Needs two completed analyses for this employee'}
                          style={{ ...ghostBtn, padding: '7px 12px', fontSize: '13px', opacity: canCompare ? 1 : 0.45, cursor: canCompare ? 'pointer' : 'not-allowed' }}
                        >
                          Compare
                        </button>
                        <button onClick={() => downloadCsv(`${d.analysis.id}_gap_analysis.csv`, analysisCsv(d))} style={{ ...ghostBtn, padding: '7px 12px', fontSize: '13px' }}>Export</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {pageRows.length === 0 && (
                <tr><td colSpan={10} style={{ ...tdStyle, textAlign: 'center', color: MUTED, padding: '36px' }}>No analyses match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#f7f6f4', borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: '#374151' }}>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * HISTORY_PER_PAGE + 1} to {Math.min(currentPage * HISTORY_PER_PAGE, filtered.length)} of {filtered.length} Analyses
          </span>
          <Pagination page={currentPage} total={totalPages} onChange={setPage} />
        </div>
      </Card>

      {/* Compare modal */}
      {compare && (() => {
        const prevRecord = analysisStore().find((a) => a.id === compare.prevId)!
        const options = employeeAnalyses(prevRecord.employeeId)
        const prev = analysisDetails(prevRecord)
        const curr = analysisDetails(analysisStore().find((a) => a.id === compare.currId)!)
        const rows = compareAnalyses(prev, curr)
        const s = changeSummary(rows)
        return (
          <Modal
            title={`Compare Analyses · ${fullName(prev.employee)}`}
            onClose={() => setCompare(null)}
            wide
            footer={
              <>
                <button style={ghostBtn} onClick={() => setCompare(null)}>Close</button>
                <button style={{ ...primaryBtn, padding: '9px 16px', fontSize: '13px' }} onClick={() => navigate(`/gap-analysis/results/${curr.analysis.id}`)}>Open {curr.analysis.id}</button>
              </>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'end', marginBottom: '16px' }}>
              <Field label="Previous analysis">
                <select style={inputStyle} value={compare.prevId} onChange={(e) => setCompare({ ...compare, prevId: e.target.value })}>
                  {options.map((a) => {
                    const ad = analysisDetails(a)
                    return <option key={a.id} value={a.id} disabled={a.id === compare.currId}>{ad.assessment.period} · {a.id} ({ad.summary.match}%)</option>
                  })}
                </select>
              </Field>
              <span style={{ paddingBottom: '10px', color: MUTED, fontWeight: 700 }}>vs</span>
              <Field label="Current analysis">
                <select style={inputStyle} value={compare.currId} onChange={(e) => setCompare({ ...compare, currId: e.target.value })}>
                  {options.map((a) => {
                    const ad = analysisDetails(a)
                    return <option key={a.id} value={a.id} disabled={a.id === compare.prevId}>{ad.assessment.period} · {a.id} ({ad.summary.match}%)</option>
                  })}
                </select>
              </Field>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', fontSize: '13px' }}>
              <span style={{ background: '#f1f0ee', padding: '5px 10px', borderRadius: '999px' }}>Match: <strong>{prev.summary.match}% → {curr.summary.match}%</strong></span>
              <span style={{ background: '#fbe9e9', color: '#9f2222', padding: '5px 10px', borderRadius: '999px' }}>+ New gaps: <strong>{s.newGaps}</strong></span>
              <span style={{ background: '#e9f7e9', color: '#0a6b0a', padding: '5px 10px', borderRadius: '999px' }}>▲ Improved: <strong>{s.improved}</strong></span>
              <span style={{ background: '#f1f0ee', padding: '5px 10px', borderRadius: '999px' }}>— Unchanged: <strong>{s.unchanged}</strong></span>
              {s.declined > 0 && <span style={{ background: '#fbe9e9', color: '#9f2222', padding: '5px 10px', borderRadius: '999px' }}>▼ Declined: <strong>{s.declined}</strong></span>}
              <span style={{ background: '#e9f7e9', color: '#0a6b0a', padding: '5px 10px', borderRadius: '999px' }}>✓ Resolved: <strong>{s.resolved}</strong></span>
            </div>
            {prev.position.code !== curr.position.code && (
              <div style={{ background: '#eef6fb', border: '1px solid #bfdcef', color: '#0b3d5c', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '12px' }}>
                Position changed: <strong>{prev.position.title}</strong> → <strong>{curr.position.title}</strong>. Required levels differ between the two analyses.
              </div>
            )}
            <div style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, padding: '12px' }}>COMPETENCY</th>
                    <th style={{ ...thStyle, padding: '12px', textAlign: 'center' }}>PREV. REQUIRED</th>
                    <th style={{ ...thStyle, padding: '12px', textAlign: 'center' }}>PREV. LEVEL</th>
                    <th style={{ ...thStyle, padding: '12px', textAlign: 'center' }}>CURR. REQUIRED</th>
                    <th style={{ ...thStyle, padding: '12px', textAlign: 'center' }}>CURR. LEVEL</th>
                    <th style={{ ...thStyle, padding: '12px', textAlign: 'center' }}>PREV. GAP</th>
                    <th style={{ ...thStyle, padding: '12px', textAlign: 'center' }}>CURR. GAP</th>
                    <th style={{ ...thStyle, padding: '12px' }}>CHANGE</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.code}>
                      <td style={{ ...tdStyle, padding: '10px 12px' }}><strong>{r.title}</strong> <span style={{ color: MUTED, fontSize: '12px' }}>{r.code}</span></td>
                      <td style={{ ...tdStyle, padding: '10px 12px', textAlign: 'center' }}>{r.prevRequired ?? '—'}</td>
                      <td style={{ ...tdStyle, padding: '10px 12px', textAlign: 'center' }}>{r.prevAssessed ?? '—'}</td>
                      <td style={{ ...tdStyle, padding: '10px 12px', textAlign: 'center', color: r.prevRequired !== null && r.currRequired !== null && r.currRequired !== r.prevRequired ? ACCENT : undefined, fontWeight: r.prevRequired !== null && r.currRequired !== null && r.currRequired !== r.prevRequired ? 700 : 400 }}>{r.currRequired ?? '—'}</td>
                      <td style={{ ...tdStyle, padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{r.currAssessed ?? '—'}</td>
                      <td style={{ ...tdStyle, padding: '10px 12px', textAlign: 'center' }}>{r.prevGap ?? '—'}</td>
                      <td style={{ ...tdStyle, padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: (r.currGap ?? 0) > 0 ? '#111827' : MUTED }}>{r.currGap ?? '—'}</td>
                      <td style={{ ...tdStyle, padding: '10px 12px', whiteSpace: 'nowrap' }}><ChangeCell row={r} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Modal>
        )
      })()}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Page wrapper: sidebar + top bar, then the chosen screen             */
/* ------------------------------------------------------------------ */

function ActionIcon({ name }: { name: 'history' | 'chart' | 'pdf' | 'download' | 'print' }) {
  const paths: Record<string, ReactNode> = {
    history: (<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></>),
    chart: (<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
    pdf: (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 14h6M9 17h4" /></>),
    download: (<><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>),
    print: (<><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M7 14h10v7H7z" /></>),
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

export default function GapAnalysis() {
  const location = useLocation()
  const { analysisId } = useParams()
  const isResults = location.pathname.startsWith('/gap-analysis/results')
  const isHistory = location.pathname.startsWith('/gap-analysis/history')

  return (
    <RoleShell>
      {/* Hide the sidebar, top bar and buttons when printing / saving as PDF */}
      <style>{`@media print { .no-print, aside, aside + div > div:first-child { display: none !important; } }`}</style>
      {isResults ? (
        <GapAnalysisResults key={analysisId} analysisId={analysisId ?? ''} />
      ) : isHistory ? (
        <GapAnalysisHistory key={location.search} />
      ) : (
        <GapAnalysisSetup />
      )}
    </RoleShell>
  )
}
