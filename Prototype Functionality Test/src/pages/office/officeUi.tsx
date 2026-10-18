// Building blocks for the Concerned Office pages.
// Cards, pills, modals, tables etc. come from ../technical/techUi so every role looks the same.
// This file adds:
//   - ShellLayout: the sidebar + top bar (also used by the Administrative Admin "Office Report Requests" page)
//   - OfficeLayout: ShellLayout with the Concerned Office menu
//   - small charts: MatchRing, RadarChart, CompareBars, StackedBar, StepTracker
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import dostLogo from '../../assets/logo_dost.png'
import { useAuth } from '../../auth/authContext'
import { Icon, Pill } from '../technical/techUi'
import { useDb, employeeName, initialsOf } from '../technical/techData'
import { SIDEBAR, SIDEBAR_ACTIVE, NAVY, BORDER, MUTED, CHART_BLUE, nowMs } from '../technical/techTheme'
import { useOfficeStore, officeEmployees, requestPerson, COMPETENCIES, CURRENT_OFFICE } from './officeData'
import type { GapRow, GapStatus, Priority, RequestStatus, ReportStatus, RequestType, StepState } from './officeData'

/* ------------------------------------------------------------------ */
/* Generic shell (sidebar + top bar)                                   */
/* ------------------------------------------------------------------ */

function HexIcon({ size = 20, color = 'white' }: { size?: number; color?: string }) {
  return <span style={{ width: size, height: size, flexShrink: 0, display: 'inline-block', background: color, clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }} />
}

export type ShellMenuItem = { section: string } | { label: string; to: string; badge?: number }

export interface ShellNotification {
  text: string
  to: string
  tone: string
}

// The menu item whose address is the longest match for the current page is highlighted,
// so /office/requests/new-employee highlights "Request Employee Addition", not "Request Status".
function activeItem(menu: ShellMenuItem[], pathname: string, search: string) {
  let best = ''
  const hasTab = /[?&]tab=/.test(search)
  menu.forEach((m) => {
    if ('section' in m) return
    const [path, query] = m.to.split('?')
    const pathOk = pathname === path || pathname.startsWith(path + '/')
    // a page opened without ?tab= shows its first tab, so the first menu link for that page is the active one
    const isDefaultTab = !hasTab && menu.find((x) => !('section' in x) && x.to.split('?')[0] === path) === m
    const queryOk = !query || search.includes(query) || isDefaultTab
    if (pathOk && queryOk && m.to.length > best.length) best = m.to
  })
  return best
}

export function ShellLayout({
  roleTitle,
  menu,
  notifications,
  searchPlaceholder,
  renderResults,
  onSearchEnter,
  children,
}: {
  roleTitle: string
  menu: ShellMenuItem[]
  notifications: ShellNotification[]
  searchPlaceholder: string
  renderResults?: (q: string, close: () => void) => ReactNode
  onSearchEnter?: (q: string) => void
  children: ReactNode
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [query, setQuery] = useState('')
  const [showBell, setShowBell] = useState(false)
  const active = activeItem(menu, location.pathname, location.search)
  const name = user?.name ?? roleTitle
  const q = query.trim().toLowerCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", background: '#f4f5f7' }}>
      {/* Sidebar */}
      <style>{`.shell-sidebar::-webkit-scrollbar { display: none; }`}</style>
      <aside className="shell-sidebar" style={{ width: '280px', background: SIDEBAR, color: 'white', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '26px 24px 18px' }}>
          <img src={dostLogo} alt="DOST logo" style={{ width: 34, height: 34 }} />
          <span style={{ fontSize: '19px', letterSpacing: '0.5px' }}>
            <strong>DOST</strong> | CBHR
          </span>
        </div>
        <div style={{ margin: '0 24px 14px', fontSize: '11px', letterSpacing: '1px', color: '#9fb3cf', fontWeight: 700 }}>{roleTitle.toUpperCase()}</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {menu.map((item) => {
            if ('section' in item) {
              return (
                <div key={item.section} style={{ padding: '16px 24px 6px', fontSize: '10.5px', letterSpacing: '1.2px', color: '#9fb3cf', fontWeight: 700 }}>
                  {item.section.toUpperCase()}
                </div>
              )
            }
            const isActive = item.to === active
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 20px', fontSize: '14px', fontWeight: 600, color: 'white',
                  background: isActive ? SIDEBAR_ACTIVE : 'transparent', borderLeft: `5px solid ${isActive ? '#dbe7f5' : 'transparent'}`, textDecoration: 'none',
                }}
              >
                <HexIcon size={18} color={isActive ? 'white' : 'rgba(255,255,255,0.85)'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {!!item.badge && <span style={{ background: '#fab219', color: '#3b2600', fontSize: '11px', fontWeight: 700, borderRadius: '999px', padding: '1px 8px' }}>{item.badge}</span>}
              </Link>
            )
          })}
        </nav>
        <div style={{ margin: 'auto 20px 22px', paddingTop: '18px' }}>
          <div style={{ background: '#f3f4f6', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HexIcon size={20} />
            </span>
            <div style={{ fontSize: '12px', color: '#374151', textAlign: 'center' }}>
              <strong>{name}</strong>
              <div style={{ color: MUTED }}>{roleTitle}</div>
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/')
              }}
              style={{ width: '100%', background: '#d1d5db', color: '#374151', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', padding: '16px 32px', background: 'white', position: 'relative', zIndex: 20 }}>
          {/* Global search */}
          <div style={{ flex: 1, maxWidth: '1000px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f7f8fa', borderRadius: '10px', padding: '0 18px', color: '#9ca3af' }}>
              <Icon name="search" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setQuery('')
                  if (e.key === 'Enter' && q && onSearchEnter) {
                    onSearchEnter(query.trim())
                    setQuery('')
                  }
                }}
                placeholder={searchPlaceholder}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '13px 0', fontSize: '14px', fontStyle: 'italic', color: '#1f2937' }}
              />
            </div>
            {q && renderResults && (
              <div style={{ position: 'absolute', top: '52px', left: 0, right: 0, background: 'white', border: `1px solid ${BORDER}`, borderRadius: '10px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', padding: '8px', zIndex: 30 }}>
                {renderResults(q, () => setQuery(''))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowBell(!showBell)} aria-label="Notifications" style={{ position: 'relative', color: '#6b7280', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
                <Icon name="bell" size={20} />
                {notifications.length > 0 && <span style={{ position: 'absolute', top: 3, right: 3, width: 9, height: 9, borderRadius: '50%', background: '#dc2626', border: '2px solid white' }} />}
              </button>
              {showBell && (
                <div style={{ position: 'absolute', right: 0, top: '42px', width: '360px', background: 'white', border: `1px solid ${BORDER}`, borderRadius: '10px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', padding: '8px', zIndex: 30 }}>
                  <div style={{ padding: '6px 10px 8px', fontWeight: 700, color: NAVY, fontSize: '14px' }}>Notifications ({notifications.length})</div>
                  {notifications.length === 0 && <div style={{ padding: '10px', color: MUTED, fontSize: '13px' }}>You are all caught up.</div>}
                  {notifications.map((n, i) => (
                    <Link key={i} to={n.to} onClick={() => setShowBell(false)} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '9px 10px', borderRadius: '6px', textDecoration: 'none', color: '#1f2937', fontSize: '13px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: n.tone, marginTop: '5px', flexShrink: 0 }} />
                      {n.text}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <span style={{ width: 1, height: 32, background: '#d1d5db' }} />
            <span style={{ width: 44, height: 44, borderRadius: '50%', background: '#e5e7eb', color: '#6b7280', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {initialsOf(name) || 'CO'}
            </span>
            <div style={{ fontSize: '14px', lineHeight: 1.3 }}>
              <div style={{ fontWeight: 700, color: NAVY }}>{name}</div>
              <div style={{ color: NAVY }}>{roleTitle}</div>
            </div>
          </div>
        </div>

        {/* Page content on the light grid background */}
        <div
          onClick={() => showBell && setShowBell(false)}
          style={{
            flex: 1, padding: '26px 32px 40px', backgroundColor: '#f6f7f9',
            backgroundImage: 'linear-gradient(#eceef2 1px, transparent 1px), linear-gradient(90deg, #eceef2 1px, transparent 1px)', backgroundSize: '56px 56px',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Concerned Office layout                                             */
/* ------------------------------------------------------------------ */

const DAY = 86400000

export function OfficeLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const db = useDb()
  const office = useOfficeStore()
  const staff = officeEmployees(db.employees)

  const openRequests = office.requests.filter((r) => r.status === 'Pending' || r.status === 'Under Review').length
  const newReports = office.reports.filter((r) => r.status === 'Report Available' && !r.viewedByOffice).length

  // Left menu - same order as the Concerned Office flow
  const menu: ShellMenuItem[] = [
    { label: 'Dashboard', to: '/office/dashboard' },
    { label: 'My Office', to: '/office/my-office' },
    { section: 'My Employees' },
    { label: 'Employees', to: '/office/employees' },
    { label: 'Employee Competencies', to: '/office/employee-competencies' },
    { section: 'Competency Information' },
    { label: 'Competencies', to: '/office/competencies' },
    { label: 'Position Requirements', to: '/office/position-requirements' },
    { label: 'Employee Competency Profiles', to: '/office/competency-profiles' },
    { section: 'Requests' },
    { label: 'Request Employee Addition', to: '/office/requests/new-employee' },
    { label: 'Request Employee Update', to: '/office/requests/update-employee' },
    { label: 'Request Employee Removal', to: '/office/requests/remove-employee' },
    { label: 'Request Status', to: '/office/requests', badge: openRequests },
    { section: 'Gap Analysis' },
    { label: 'Request Gap Analysis Report', to: '/office/gap-analysis' },
    { label: 'Gap Analysis Reports', to: '/office/gap-analysis/reports', badge: newReports },
  ]

  // Bell: decisions from the Technical Admin and finished reports from the Administrative Admin
  const recent = nowMs() - 14 * DAY
  const notifications: ShellNotification[] = [
    ...office.reports
      .filter((r) => r.status === 'Report Available' && !r.viewedByOffice)
      .map((r) => ({ text: `Gap analysis report ${r.id} is now available`, to: `/office/gap-analysis/reports/${r.id}`, tone: '#0ca30c' })),
    ...office.requests
      .filter((r) => (r.status === 'Approved' || r.status === 'Rejected') && r.reviewedAt && new Date(r.reviewedAt).getTime() > recent)
      .map((r) => ({ text: `${r.id} (${r.type}) was ${r.status.toLowerCase()} by the Technical Admin`, to: `/office/requests?open=${r.id}`, tone: r.status === 'Approved' ? '#0ca30c' : '#d03b3b' })),
    ...office.reports
      .filter((r) => r.status === 'Declined' && r.completedAt && new Date(r.completedAt).getTime() > recent)
      .map((r) => ({ text: `Report request ${r.id} was declined`, to: '/office/gap-analysis', tone: '#d03b3b' })),
    ...(openRequests ? [{ text: `${openRequests} request${openRequests === 1 ? '' : 's'} waiting for the Technical Admin`, to: '/office/requests', tone: '#fab219' }] : []),
  ]

  return (
    <ShellLayout
      roleTitle="Concerned Office"
      menu={menu}
      notifications={notifications}
      searchPlaceholder={`Search ${CURRENT_OFFICE.acronym} employees or competencies...`}
      onSearchEnter={(q) => navigate(`/office/employees?q=${encodeURIComponent(q)}`)}
      renderResults={(q, close) => {
        const people = staff.filter((e) => `${employeeName(e)} ${e.employeeNo} ${e.email} ${e.positionTitle}`.toLowerCase().includes(q)).slice(0, 5)
        const comps = COMPETENCIES.filter((c) => `${c.code} ${c.title}`.toLowerCase().includes(q)).slice(0, 3)
        const head = (t: string) => <div style={{ padding: '6px 10px', fontSize: '11px', letterSpacing: '1px', color: MUTED, fontWeight: 700 }}>{t}</div>
        const row = { display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', textDecoration: 'none', color: '#111827', fontSize: '13.5px' } as const
        return (
          <>
            {people.length === 0 && comps.length === 0 && <div style={{ padding: '10px', color: MUTED, fontSize: '13px' }}>No matches in your office.</div>}
            {people.length > 0 && head('EMPLOYEES')}
            {people.map((e) => (
              <Link key={e.id} to={`/office/employees/${e.id}`} onClick={close} style={row}>
                <span><strong>{employeeName(e)}</strong> <span style={{ color: MUTED }}>· {e.employeeNo}</span></span>
                <span style={{ color: MUTED }}>{e.positionTitle}</span>
              </Link>
            ))}
            {comps.length > 0 && head('COMPETENCIES')}
            {comps.map((c) => (
              <Link key={c.code} to={`/office/competencies?open=${c.code}`} onClick={close} style={row}>
                <span><strong>{c.code}</strong> {c.title}</span>
                <span style={{ color: MUTED }}>{c.category}</span>
              </Link>
            ))}
          </>
        )
      }}
    >
      {children}
    </ShellLayout>
  )
}

/* ------------------------------------------------------------------ */
/* Gap status pill + level display                                     */
/* ------------------------------------------------------------------ */

// Status colours (checked for colour-blind safety): good / warning / serious / not assessed
const GAP_COLORS: Record<GapStatus, { dot: string; bg: string; fg: string; border: string }> = {
  Meets: { dot: '#0ca30c', bg: '#e9f7e9', fg: '#0a6b0a', border: '#bfe6bf' },
  'Minor Gap': { dot: '#fab219', bg: '#fff6e0', fg: '#8a5a00', border: '#fde3a3' },
  'Major Gap': { dot: '#d03b3b', bg: '#fdecec', fg: '#a12424', border: '#f5c2c2' },
  'Not Assessed': { dot: '#9ca3af', bg: '#f3f4f6', fg: '#4b5563', border: '#e5e7eb' },
}

export function GapPill({ status }: { status: GapStatus }) {
  const c = GAP_COLORS[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: c.bg, color: c.fg, border: `1px solid ${c.border}`, fontSize: '12.5px', fontWeight: 600, padding: '3px 11px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} />
      {status}
    </span>
  )
}

export function GapLegend() {
  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12.5px', color: '#374151' }}>
      {(Object.keys(GAP_COLORS) as GapStatus[]).map((s) => (
        <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '3px', background: GAP_COLORS[s].dot }} />
          {s === 'Minor Gap' ? 'Minor gap (1 level)' : s === 'Major Gap' ? 'Major gap (2+ levels)' : s === 'Meets' ? 'Meets requirement' : 'Not yet assessed'}
        </span>
      ))}
    </div>
  )
}

// A coloured cell for the employee × competency matrix
export function LevelCell({ required, current }: { required: number | null; current: number }) {
  if (required === null) {
    // competency not required for this person's position
    return <span style={{ color: current ? '#374151' : '#c4c8cf', fontSize: '13px' }}>{current ? `L${current}` : '·'}</span>
  }
  const status: GapStatus = current === 0 ? 'Not Assessed' : current >= required ? 'Meets' : required - current === 1 ? 'Minor Gap' : 'Major Gap'
  const c = GAP_COLORS[status]
  return (
    <span title={`${status} - current ${current || 'not assessed'}, required ${required}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, padding: '4px 5px', borderRadius: '6px', background: c.bg, color: c.fg, border: `1px solid ${c.border}`, fontSize: '12.5px', fontWeight: 700 }}>
      {current ? current : '–'}/{required}
    </span>
  )
}

// Four small blocks showing a level out of 4 (required level is outlined)
export function LevelBlocks({ current, required }: { current: number; required?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '3px' }} aria-label={`Level ${current} of 4`}>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          style={{
            width: 16, height: 10, borderRadius: '2px',
            background: n <= current ? (required && current < required ? '#fab219' : '#1baf7a') : '#eef0f3',
            outline: required && n <= required ? `1.5px solid ${CHART_BLUE}` : 'none', outlineOffset: '-1.5px',
          }}
        />
      ))}
    </span>
  )
}

const priorityColors: Record<Priority, { bg: string; fg: string }> = {
  Critical: { bg: '#fdecec', fg: '#a12424' },
  Important: { bg: '#e6f5fc', fg: '#0b5f8a' },
  Desirable: { bg: '#f3f4f6', fg: '#4b5563' },
}

export function PriorityTag({ priority }: { priority: Priority }) {
  const c = priorityColors[priority]
  return <span style={{ background: c.bg, color: c.fg, fontSize: '11.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{priority}</span>
}

export function CategoryTag({ category }: { category: string }) {
  const colors: Record<string, { bg: string; fg: string; border: string }> = {
    Core: { bg: '#eef1fb', fg: '#13305a', border: '#c7d2f0' },
    Functional: { bg: '#e6f5fc', fg: '#0b5f8a', border: '#a9dcf3' },
    Leadership: { bg: '#f3eefb', fg: '#5b3a8e', border: '#dccdf3' },
  }
  const c = colors[category] ?? colors.Core
  return <span style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}`, fontSize: '12.5px', fontWeight: 600, padding: '2px 10px', borderRadius: '999px', whiteSpace: 'nowrap' }}>{category}</span>
}

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

// Ring showing a match score (0–100%)
export function MatchRing({ value, size = 84 }: { value: number; size?: number }) {
  const stroke = size < 60 ? 4 : 7 // thinner ring for small sizes (staff list, tables)
  const r = size / 2 - stroke
  const circ = 2 * Math.PI * r
  const color = value >= 85 ? '#0ca30c' : value >= 65 ? '#fab219' : '#d03b3b'
  return (
    <svg width={size} height={size} role="img" aria-label={`Match score ${value}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f3" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(value / 100) * circ} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" style={{ fontSize: size * 0.24, fontWeight: 800, fill: NAVY }}>{value}%</text>
    </svg>
  )
}

// Radar chart: required level (dashed blue outline) vs current level (filled green)
export function RadarChart({ rows }: { rows: GapRow[] }) {
  const [hover, setHover] = useState<number | null>(null)
  if (rows.length < 3) return <div style={{ color: MUTED, fontSize: '13px', padding: '20px 0' }}>A radar chart needs at least 3 competencies.</div>
  // wide viewBox so the competency labels on the left and right are never cut off
  const width = 580
  const size = 340
  const cx = width / 2
  const cy = size / 2
  const radius = 120
  const angle = (i: number) => (Math.PI * 2 * i) / rows.length - Math.PI / 2
  const point = (i: number, level: number) => [cx + Math.cos(angle(i)) * (radius * level) / 4, cy + Math.sin(angle(i)) * (radius * level) / 4]
  const poly = (key: 'required' | 'current') => rows.map((r, i) => point(i, r[key]).join(',')).join(' ')
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${size}`} width="100%" style={{ maxWidth: 620, display: 'block', margin: '0 auto' }} role="img" aria-label="Required versus current proficiency">
        {[1, 2, 3, 4].map((l) => (
          <polygon key={l} points={rows.map((_, i) => point(i, l).join(',')).join(' ')} fill="none" stroke="#e5e7eb" />
        ))}
        {rows.map((_, i) => {
          const [x, y] = point(i, 4)
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e5e7eb" />
        })}
        <polygon points={poly('current')} fill="rgba(27,175,122,0.25)" stroke="#1baf7a" strokeWidth="2" />
        <polygon points={poly('required')} fill="none" stroke={CHART_BLUE} strokeWidth="2" strokeDasharray="6 4" />
        {rows.map((r, i) => {
          const [x, y] = point(i, r.current)
          const [lx, ly] = point(i, 4.75)
          return (
            <g key={r.code} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
              <circle cx={x} cy={y} r={hover === i ? 6 : 4} fill="#1baf7a" stroke="white" strokeWidth="1.5" />
              <text x={lx} y={ly} textAnchor={Math.abs(lx - cx) < 10 ? 'middle' : lx > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: 14, fill: hover === i ? NAVY : '#374151', fontWeight: hover === i ? 700 : 500 }}>
                {r.code} {r.title.length > 18 ? r.title.slice(0, 17) + '…' : r.title}
              </text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', fontSize: '12.5px', color: '#374151', marginTop: '6px', minHeight: '20px' }}>
        {hover !== null ? (
          <span><strong>{rows[hover].title}</strong>: current {rows[hover].current || 'not assessed'} · required {rows[hover].required}</span>
        ) : (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 18, borderTop: `2px dashed ${CHART_BLUE}` }} />Required level</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 12, height: 12, background: 'rgba(27,175,122,0.35)', border: '2px solid #1baf7a', borderRadius: '2px' }} />Current level</span>
          </>
        )}
      </div>
    </div>
  )
}

// Horizontal bars: current level (bar) against the required level (blue tick), scale 0–4
export function CompareBars({ items }: { items: { label: string; sub?: string; required: number; current: number }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {items.map((it) => {
        const short = it.current > 0 && it.current < it.required
        return (
          <div key={it.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '13.5px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: '#111827' }}>{it.label} {it.sub && <span style={{ fontWeight: 400, color: MUTED }}>· {it.sub}</span>}</span>
              <span style={{ color: '#374151', whiteSpace: 'nowrap' }}>
                <strong style={{ color: short ? '#a12424' : '#0a6b0a' }}>{it.current ? it.current.toFixed(1) : '-'}</strong> / {it.required.toFixed(1)}
              </span>
            </div>
            <div style={{ position: 'relative', height: 12, background: '#eef0f3', borderRadius: '999px' }} title={`Current ${it.current.toFixed(1)} · Required ${it.required.toFixed(1)}`}>
              <div style={{ width: `${(it.current / 4) * 100}%`, height: '100%', background: short ? '#fab219' : '#1baf7a', borderRadius: '999px' }} />
              <div style={{ position: 'absolute', top: -3, bottom: -3, left: `calc(${(it.required / 4) * 100}% - 1.5px)`, width: 3, background: CHART_BLUE, borderRadius: '2px' }} />
            </div>
          </div>
        )
      })}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: MUTED, borderTop: `1px solid ${BORDER}`, paddingTop: '8px' }}>
        <span>0</span><span>1 Basic</span><span>2 Intermediate</span><span>3 Advanced</span><span>4 Superior</span>
      </div>
    </div>
  )
}

// One bar split into coloured parts, with a legend underneath
export function StackedBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  return (
    <div>
      <div style={{ display: 'flex', height: 14, borderRadius: '999px', overflow: 'hidden', background: '#eef0f3', gap: '2px' }}>
        {segments.filter((s) => s.value > 0).map((s) => (
          <div key={s.label} title={`${s.label}: ${s.value}`} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px', fontSize: '12.5px', color: '#374151' }}>
        {segments.map((s) => (
          <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
            {s.label} ({s.value})
          </span>
        ))}
      </div>
    </div>
  )
}

// Request progress: Submitted → Review → Decision

export function StepTracker({ steps }: { steps: { label: string; detail?: string; state: StepState }[] }) {
  const colors: Record<StepState, string> = { done: '#0ca30c', current: '#fab219', todo: '#d1d5db', failed: '#d03b3b' }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {steps.map((s, i) => (
        <div key={s.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', textAlign: 'center' }}>
          {i > 0 && <span style={{ position: 'absolute', top: 13, right: '50%', width: '100%', height: 3, background: s.state === 'todo' ? '#e5e7eb' : colors.done, zIndex: 0 }} />}
          <span style={{ position: 'relative', zIndex: 1, width: 28, height: 28, borderRadius: '50%', background: s.state === 'todo' ? 'white' : colors[s.state], border: `2px solid ${colors[s.state]}`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>
            {s.state === 'done' ? '✓' : s.state === 'failed' ? '✕' : s.state === 'current' ? '…' : <span style={{ color: MUTED }}>{i + 1}</span>}
          </span>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: s.state === 'todo' ? MUTED : '#111827', marginTop: '6px' }}>{s.label}</span>
          {s.detail && <span style={{ fontSize: '11.5px', color: MUTED, marginTop: '2px', padding: '0 4px' }}>{s.detail}</span>}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Status pills for requests and reports                               */
/* ------------------------------------------------------------------ */

const requestTones: Record<RequestStatus, 'warning' | 'accent' | 'success' | 'danger' | 'neutral'> = {
  Pending: 'warning', 'Under Review': 'accent', Approved: 'success', Rejected: 'danger', Cancelled: 'neutral',
}

export function RequestStatusPill({ status }: { status: RequestStatus }) {
  return <Pill text={status} tone={requestTones[status]} />
}

const reportTones: Record<ReportStatus, 'navy' | 'accent' | 'success' | 'danger' | 'neutral'> = {
  Submitted: 'navy', 'In Review': 'accent', 'Report Available': 'success', Declined: 'danger', Cancelled: 'neutral',
}

export function ReportStatusPill({ status }: { status: ReportStatus }) {
  return <Pill text={status} tone={reportTones[status]} />
}

export function RequestTypeTag({ type }: { type: RequestType }) {
  const c = type === 'Addition' ? { bg: '#e7f6ec', fg: '#15803d' } : type === 'Update' ? { bg: '#e6f5fc', fg: '#0b5f8a' } : { bg: '#fdecec', fg: '#b91c1c' }
  return <span style={{ background: c.bg, color: c.fg, fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{type}</span>
}

/* ------------------------------------------------------------------ */
/* Side panel shown on the three request forms                         */
/* ------------------------------------------------------------------ */

export function RequestGuide({ type, tips }: { type: RequestType; tips: string[] }) {
  const office = useOfficeStore()
  const db = useDb()
  const recent = office.requests.filter((r) => r.type === type).slice(0, 4)
  const box = { background: 'white', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 22px' } as const
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={box}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: NAVY, margin: '0 0 16px' }}>How it works</h2>
        <StepTracker
          steps={[
            { label: 'You submit', detail: 'Request is logged', state: 'done' },
            { label: 'Technical Admin', detail: 'Checks & reviews', state: 'current' },
            { label: 'Applied', detail: 'Record updated', state: 'todo' },
          ]}
        />
        <ul style={{ margin: '18px 0 0', paddingLeft: '18px', fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
          {tips.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
      <div style={box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: NAVY, margin: 0 }}>Recent {type.toLowerCase()} requests</h2>
          <Link to="/office/requests" style={{ fontSize: '13px', fontWeight: 600, color: '#0b5f8a', textDecoration: 'none' }}>All ›</Link>
        </div>
        {recent.length === 0 && <p style={{ color: MUTED, fontSize: '13px', margin: 0 }}>None yet.</p>}
        {recent.map((r) => (
          <Link key={r.id} to={`/office/requests?open=${r.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '9px 0', borderBottom: '1px solid #eceef2', textDecoration: 'none', color: '#111827', fontSize: '13px' }}>
            <span>
              <strong>{r.id}</strong>
              <div style={{ color: MUTED, fontSize: '12px' }}>{requestPerson(r, db.employees)}</div>
            </span>
            <RequestStatusPill status={r.status} />
          </Link>
        ))}
      </div>
    </div>
  )
}
