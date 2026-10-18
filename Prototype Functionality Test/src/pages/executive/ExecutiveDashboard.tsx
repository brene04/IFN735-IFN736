// Executive › Dashboard
// Same building blocks as the Technical Admin dashboard (PageHeader, StatCard, Card, Pill).
import { Link } from 'react-router-dom'
import { useState } from 'react'
import RoleShell from '../../components/RoleShell'
import { PageHeader, Card, StatCard, StatRow, Notice, Icon } from '../technical/techUi'
import { NAVY, ACCENT, BORDER, MUTED, CHART_BLUE, CHART_RED, ghostBtn, dangerBtn, smallPrimaryBtn, linkBtn } from '../technical/techTheme'
import { useDb, save, employeeName } from '../technical/techData'

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
        <span style={{ color: '#1f2937', fontWeight: 600 }}>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div style={{ height: '8px', background: '#eceef2', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, value)}%`, height: '100%', background: color, borderRadius: '0 4px 4px 0' }} />
      </div>
    </div>
  )
}

// Quick links to each section of the Executive menu
const overviewFor = (c: { employees: number; offices: number; positions: number; mapped: number; competencies: number }) => [
  { section: 'Access & Users', items: [
    { label: 'Users', value: 'View', to: '/executive/users' },
    { label: 'Roles / Access', value: '4 roles', to: '/roles-access' },
  ] },
  { section: 'Organisation Data', items: [
    { label: 'Employees', value: `${c.employees}`, to: '/employee-position-management?tab=employees' },
    { label: 'Offices', value: `${c.offices}`, to: '/office-competency-management?tab=offices' },
    { label: 'Positions', value: `${c.positions}`, to: '/employee-position-management?tab=positions' },
  ] },
  { section: 'Competency Framework', items: [
    { label: 'Competencies', value: `${c.competencies}`, to: '/office-competency-management?tab=competencies' },
    { label: 'Position Requirements', value: `${c.mapped} of ${c.positions}`, to: '/position-mapping' },
    { label: 'Competency Profiles', value: 'View', to: '/employees' },
  ] },
  { section: 'Analysis & Reporting', items: [
    { label: 'Gap Analysis', value: 'Run', to: '/gap-analysis' },
    { label: 'Gap Results', value: 'Latest', to: '/gap-analysis/results/GA-2026-032' },
    { label: 'Historical Results', value: 'History', to: '/gap-analysis/history' },
  ] },
]

export default function ExecutiveDashboard() {
  const db = useDb()
  const [notice, setNotice] = useState('')

  // Figures from the latest completed gap analysis of each employee (tbl_gap_analyses / tbl_gap_analysis_results)
  const latest = db.employees
    .map((e) => db.gapAnalyses.filter((a) => a.employeeId === e.id && a.status === 'Completed').sort((x, y) => y.id - x.id)[0])
    .filter((a): a is NonNullable<typeof a> => !!a)
  const results = latest.flatMap((a) => db.gapResults.filter((r) => r.gapAnalysisId === a.id).map((r) => ({ ...r, office: db.employees.find((e) => e.id === a.employeeId)?.officeCode ?? '' })))
  const matchOf = (rows: typeof results) => {
    const need = rows.reduce((t, r) => t + r.requiredLevel, 0)
    return need ? Math.round((rows.reduce((t, r) => t + Math.min(r.currentLevel, r.requiredLevel), 0) / need) * 100) : 0
  }
  const avgMatch = matchOf(results)
  const openGaps = results.filter((r) => r.currentLevel < r.requiredLevel).length
  const share = (rows: typeof results) => (rows.length ? Math.round((rows.filter((r) => r.currentLevel < r.requiredLevel).length / rows.length) * 100) : 0)
  const topGaps = [...new Set(results.map((r) => r.competencyId))]
    .map((id) => ({ label: db.competencies.find((c) => c.id === id)?.competencyName ?? '', value: share(results.filter((r) => r.competencyId === id)), n: results.filter((r) => r.competencyId === id).length }))
    .filter((g) => g.n >= 2).sort((a, b) => b.value - a.value).slice(0, 4)
  const officeGaps = [...new Set(results.map((r) => r.office))]
    .map((o) => ({ label: o, value: share(results.filter((r) => r.office === o)) }))
    .sort((a, b) => a.value - b.value).slice(0, 4)
  const overview = overviewFor({
    employees: db.employees.filter((e) => e.status !== 'Separated').length,
    offices: db.offices.length,
    positions: db.positions.length,
    mapped: db.positions.filter((p) => db.positionCompetencies.some((r) => r.positionId === p.id)).length,
    competencies: db.competencies.length,
  })

  // Users the Technical Admin created that are waiting for the Executive
  const pending = db.users.filter((u) => u.status === 'Pending Approval')
  const active = db.users.filter((u) => u.status === 'Active').length
  const roleName = (id: number) => db.roles.find((r) => r.id === id)?.name ?? 'User'

  function decide(id: number, approved: boolean) {
    const u = db.users.find((x) => x.id === id)
    if (!u) return
    save((d) => { const x = d.users.find((v) => v.id === id); if (x) x.status = approved ? 'Active' : 'Deactivated' },
      { event: approved ? 'Account Activated' : 'User Updated', details: `${u.username} ${approved ? 'approved' : 'rejected'} by Executive`, status: approved ? 'Success' : 'Warning' })
    setNotice(`${approved ? 'Approved' : 'Rejected'}: ${u.username}`)
  }

  return (
    <RoleShell>
      <PageHeader
        crumbs={[{ label: 'Dashboard' }]}
        title="Executive Dashboard"
        description="System overview: competency, gap and access status across the organisation."
        actions={
          <>
            <Link to="/gap-analysis/history" style={{ ...ghostBtn, textDecoration: 'none' }}><Icon name="log" size={16} /> Historical Results</Link>
            <Link to="/roles-access" style={{ ...smallPrimaryBtn, textDecoration: 'none', padding: '11px 18px', fontSize: '14px' }}><Icon name="shield" size={16} /> Roles / Access</Link>
          </>
        }
      />

      <StatRow>
        <StatCard label="ACTIVE USERS" value={active} unit="Accounts" tone="success" sub="Able to sign in" icon="check" to="/executive/users" />
        <StatCard label="OVERALL MATCH" value={`${avgMatch}%`} unit="Avg." tone="accent" sub="Average competency match" icon="dashboard" to="/gap-analysis/history" />
        <StatCard label="OPEN GAPS" value={openGaps} unit="Gaps" tone="danger" sub="Across all offices" icon="alert" to="/gap-analysis/results/GA-2026-032" />
        <StatCard label="ACCESS REQUESTS" value={pending.length} unit="Pending" tone="warning" sub="Awaiting your decision" icon="hourglass" to="/roles-access" />
      </StatRow>

      {/* System overview, grouped like the sidebar */}
      <Card title="System Overview" subtitle="Jump to any area, grouped the same way as the menu" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          {overview.map((group) => (
            <div key={group.section}>
              <div style={{ fontSize: '11px', letterSpacing: '1px', color: MUTED, fontWeight: 700, marginBottom: '8px' }}>{group.section.toUpperCase()}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.items.map((i) => (
                  <Link key={i.label} to={i.to} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '10px 14px', textDecoration: 'none' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: NAVY }}>{i.label}</span>
                    <span style={{ fontSize: '12.5px', color: ACCENT, fontWeight: 700 }}>{i.value} &rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '18px', marginBottom: '18px' }}>
        <Card title="Average Gap by Office" subtitle="Lower is better">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {officeGaps.map((o) => <Bar key={o.label} {...o} color={CHART_BLUE} />)}
          </div>
        </Card>
        <Card title="Top Competency Gaps" subtitle="Share of employees below required level" right={<Link to="/gap-analysis/history" style={linkBtn}>Historical results &rarr;</Link>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {topGaps.map((o) => <Bar key={o.label} {...o} color={CHART_RED} />)}
          </div>
        </Card>
      </div>

      <Card title="Access Requests" subtitle="New users created by the Technical Admin that need your approval" right={<Link to="/roles-access" style={linkBtn}>Roles / Access Management &rarr;</Link>}>
        {notice && <Notice text={notice} onClose={() => setNotice('')} />}
        {pending.length === 0 ? (
          <p style={{ color: MUTED, fontSize: '14px', margin: 0 }}>No users are waiting for approval.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pending.map((u) => {
              const emp = db.employees.find((e) => e.id === u.employeeId)
              return (
                <div key={u.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px 16px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{emp ? employeeName(emp) : u.username} <span style={{ fontWeight: 400, color: MUTED }}>· @{u.username} · {emp?.officeCode}</span></div>
                    <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '2px' }}>Requested role: {roleName(u.roleId)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={smallPrimaryBtn} onClick={() => decide(u.id, true)}>Approve</button>
                    <button style={dangerBtn} onClick={() => decide(u.id, false)}>Reject</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </RoleShell>
  )
}
