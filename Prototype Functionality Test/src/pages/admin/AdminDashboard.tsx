// Administrative Admin › Dashboard
// Same building blocks as the Technical Admin dashboard (PageHeader, StatCard, Card, Pill).
import { Link, useNavigate } from 'react-router-dom'
import RoleShell from '../../components/RoleShell'
import { PageHeader, Card, StatCard, StatRow, Icon } from '../technical/techUi'
import type { IconName } from '../technical/techUi'
import { NAVY, ACCENT, BORDER, MUTED, CHART_BLUE, CHART_RED, primaryBtn, ghostBtn, linkBtn } from '../technical/techTheme'
import { useOfficeStore } from '../office/officeData'
import { useDb } from '../technical/techData'

// The workflow from the Administrative Admin specification, in order.
const workflowSteps = (employees: number, positions: number, mapped: number, comps: number, levels: number, noLevels: number, offices: number) => [
  { step: 1, label: 'Employee Management', detail: `${employees} employees across ${offices} offices`, to: '/employee-position-management?tab=employees', status: 'Ready', tone: 'ok' },
  { step: 2, label: 'Position Management', detail: `${positions} positions`, to: '/employee-position-management?tab=positions', status: 'Ready', tone: 'ok' },
  { step: 3, label: 'Position–Competency Requirements', detail: `${mapped} of ${positions} positions have required levels`, to: '/position-mapping', status: positions - mapped ? `${positions - mapped} missing` : 'Ready', tone: positions - mapped ? 'warn' : 'ok' },
  { step: 4, label: 'Competency Management', detail: `${comps} competencies · 4 categories · ${levels} proficiency levels`, to: '/office-competency-management?tab=competencies', status: 'Ready', tone: 'ok' },
  { step: 5, label: 'Employee Competency Profiles', detail: `${employees - noLevels} of ${employees} employees have current levels recorded`, to: '/employees', status: noLevels ? `${noLevels} incomplete` : 'Ready', tone: noLevels ? 'warn' : 'ok' },
  { step: 6, label: 'Gap Analysis', detail: 'Required level vs current level', to: '/gap-analysis', status: 'Run', tone: 'info' },
  { step: 7, label: 'Gap Analysis Results', detail: 'Saved analyses and history', to: '/gap-analysis/history', status: 'Ready', tone: 'ok' },
  { step: 8, label: 'Office Report Requests', detail: 'Reports requested by Concerned Offices', to: '/admin/report-requests', status: 'Review', tone: 'info' },
]
const toneColor: Record<string, string> = { ok: '#15803d', warn: '#b45309', info: ACCENT }

const attentionItems = (unmappedPositions: number, noLevels: number) => [
  { text: `${unmappedPositions} positions have no competency requirements set`, to: '/position-mapping', action: 'Set requirements', n: unmappedPositions },
  { text: `${noLevels} employees have no current competency levels`, to: '/employees', action: 'Update profiles', n: noLevels },
]

const quickActions: { label: string; to: string; icon: IconName }[] = [
  { label: 'Add Employee', to: '/employee-position-management?tab=employees', icon: 'users' },
  { label: 'Add Position', to: '/employee-position-management?tab=positions', icon: 'id' },
  { label: 'Run Gap Analysis', to: '/gap-analysis', icon: 'dashboard' },
  { label: 'Report Requests', to: '/admin/report-requests', icon: 'mail' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const office = useOfficeStore()
  const db = useDb()
  const employees = db.employees.filter((e) => e.status !== 'Separated').length
  const positions = db.positions.length
  const mappedPositions = db.positions.filter((p) => db.positionCompetencies.some((r) => r.positionId === p.id)).length
  const unmappedPositions = positions - mappedPositions
  const noLevels = db.employees.filter((e) => e.status !== 'Separated' && e.competencies.length === 0).length
  const offices = db.offices.length
  const openRequests = office.reports.filter((r) => r.status === 'Submitted' || r.status === 'In Review').length
  const attention = attentionItems(unmappedPositions, noLevels).filter((a) => a.n > 0)
  // Average gap per competency from each employee's latest completed analysis
  const latest = db.employees
    .map((e) => db.gapAnalyses.filter((a) => a.employeeId === e.id && a.status === 'Completed').sort((x, y) => y.id - x.id)[0])
    .filter((a): a is NonNullable<typeof a> => !!a)
  const results = latest.flatMap((a) => db.gapResults.filter((r) => r.gapAnalysisId === a.id))
  const topGaps = [...new Set(results.map((r) => r.competencyId))]
    .map((id) => {
      const rows = results.filter((r) => r.competencyId === id)
      return { name: db.competencies.find((c) => c.id === id)?.competencyName ?? '', gap: Math.round((rows.reduce((t, r) => t + Math.max(0, r.requiredLevel - r.currentLevel), 0) / rows.length) * 10) / 10, people: rows.filter((r) => r.currentLevel < r.requiredLevel).length }
    })
    .filter((g) => g.gap > 0).sort((a, b) => b.gap - a.gap || b.people - a.people).slice(0, 5)
  const workflow = workflowSteps(employees, positions, mappedPositions, db.competencies.length, db.config.proficiencyLevels.length, noLevels, offices)

  return (
    <RoleShell>
      <PageHeader
        crumbs={[{ label: 'Dashboard' }]}
        title="Administrative Admin Dashboard"
        description="Competency data, gap analysis and report requests across all DOST concerned offices."
        actions={
          <>
            <button style={ghostBtn} onClick={() => navigate('/admin/report-requests')}><Icon name="mail" size={16} /> Report Requests</button>
            <button style={primaryBtn} onClick={() => navigate('/gap-analysis')}><Icon name="plus" size={16} /> Run Gap Analysis</button>
          </>
        }
      />

      <StatRow>
        <StatCard label="EMPLOYEES" value={employees} unit="Personnel" sub={`Across ${offices} offices`} icon="users" to="/employee-position-management?tab=employees" />
        <StatCard label="POSITIONS" value={positions} unit="Defined" tone="accent" sub={`${mappedPositions} with requirements`} icon="id" to="/employee-position-management?tab=positions" />
        <StatCard label="OPEN REPORT REQUESTS" value={openRequests} unit="To do" tone="warning" sub="From Concerned Offices" icon="mail" to="/admin/report-requests" />
        <StatCard label="AVERAGE GAP" value="0.9" unit="levels" tone="danger" sub="Below required level" icon="alert" to="/gap-analysis/history" />
      </StatRow>

      {/* Workflow */}
      <Card title="Competency & Gap Analysis Workflow" subtitle="Employee → Position → Required Level + Current Level → Gap Analysis → Results → Reports" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '12px' }}>
          {workflow.map((w) => (
            <Link key={w.step} to={w.to} style={{ display: 'flex', gap: '12px', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px 14px', textDecoration: 'none' }}>
              <span style={{ width: 30, height: 30, borderRadius: '8px', background: '#e6f5fc', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>{w.step}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>{w.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: toneColor[w.tone], whiteSpace: 'nowrap' }}>{w.status}</span>
                </div>
                <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>{w.detail}</div>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '18px', marginBottom: '18px' }}>
        <Card title="Largest Competency Gaps" subtitle="Average levels below required, across all analysed employees" right={<Link to="/gap-analysis/history" style={linkBtn}>View all results &rarr;</Link>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {topGaps.map((g) => (
              <div key={g.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                  <span style={{ color: '#1f2937', fontWeight: 600 }}>{g.name}</span>
                  <span style={{ color: MUTED }}><strong style={{ color: '#111827' }}>{g.gap}</strong> levels · {g.people} employees</span>
                </div>
                <div style={{ height: '8px', background: '#eceef2', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (g.gap / 3) * 100)}%`, height: '100%', background: g.gap >= 1 ? CHART_RED : CHART_BLUE, borderRadius: '0 4px 4px 0' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Data Needing Attention" subtitle="Complete these before running a new gap analysis">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {attention.length === 0 && <div style={{ fontSize: '13px', color: MUTED }}>All required data is in place.</div>}
            {attention.map((a) => (
              <div key={a.text} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: '#fef6e4', border: '1px solid #fde3b0', borderRadius: '10px', padding: '11px 14px' }}>
                <span style={{ fontSize: '13px', color: '#78350f' }}>{a.text}</span>
                <Link to={a.to} style={{ background: NAVY, color: 'white', borderRadius: '8px', padding: '7px 12px', fontSize: '12.5px', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>{a.action}</Link>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Quick Actions">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {quickActions.map((a) => (
            <Link key={a.label} to={a.to} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px', textDecoration: 'none', color: NAVY, fontSize: '13.5px', fontWeight: 600 }}>
              <span style={{ width: 32, height: 32, borderRadius: '8px', background: '#e6f5fc', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={a.icon} size={16} /></span>
              {a.label}
            </Link>
          ))}
        </div>
      </Card>
    </RoleShell>
  )
}
