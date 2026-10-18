// TECHNICAL ADMIN DASHBOARD  (/technical/dashboard)
// First page after login. Shows account health, sign-in activity, system health,
// open issues, pending profile updates and security alerts, with links to each page.
import { Link, useNavigate } from 'react-router-dom'
import { useDb, employeeName } from './techData'
import { TechLayout, PageHeader, StatRow, StatCard, Card, SignInChart, Pill, Icon } from './techUi'
import type { IconName } from './techUi'
import { NAVY, ACCENT, BORDER, MUTED, CHART_BLUE, primaryBtn, ghostBtn, linkBtn, relativeTime, nowMs } from './techTheme'

const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }

export default function TechDashboard() {
  const db = useDb()
  const navigate = useNavigate()
  const now = nowMs()

  // ---- account numbers (top cards) ----
  const total = db.users.length
  const active = db.users.filter((u) => u.status === 'Active').length
  const pendingSetup = db.users.filter((u) => u.status === 'Pending Setup').length
  const blocked = db.users.filter((u) => u.status === 'Suspended' || u.status === 'Deactivated').length
  const officeCount = new Set(db.users.map((u) => db.employees.find((e) => e.id === u.employeeId)?.officeCode)).size

  // ---- security numbers ----
  const today = new Date(now).toDateString()
  const todayLogs = db.logs.filter((l) => new Date(l.timestamp).toDateString() === today)
  const failedToday = todayLogs.filter((l) => l.event === 'Failed Login').length
  const deniedToday = todayLogs.filter((l) => l.event === 'Permission Denied').length
  const locked = db.users.filter((u) => u.status === 'Active' && u.failedAttempts >= db.config.security.maxFailedAttempts)
  const no2fa = db.users.filter((u) => u.status === 'Active' && !u.twoFactor).length

  // ---- issues + updates ----
  const openIssues = db.issues
    .filter((i) => i.status === 'Open' || i.status === 'In Progress')
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || b.createdAt.localeCompare(a.createdAt))
  const pendingUpdates = db.updates.filter((u) => u.status === 'Pending').sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  const lastBackup = db.config.maintenance.backups[0]
  const emailIssue = db.issues.some((i) => i.category === 'Access & Login' && i.priority === 'Critical' && i.status !== 'Resolved' && i.status !== 'Closed')

  // ---- system health list ----
  const services: { name: string; detail: string; status: 'Operational' | 'Degraded' | 'Maintenance' }[] = [
    { name: 'Web Application', detail: 'CB-HRMS portal · 99.9% uptime (30 days)', status: db.config.maintenance.maintenanceMode ? 'Maintenance' : 'Operational' },
    { name: 'Database (MySQL)', detail: 'Response time 42 ms · 12% storage used', status: 'Operational' },
    { name: 'GovMail / 2FA Email', detail: emailIssue ? 'Delayed code delivery reported' : 'Codes delivered in < 30 s', status: emailIssue ? 'Degraded' : 'Operational' },
    { name: 'Nightly Backup', detail: lastBackup ? `Last backup ${relativeTime(lastBackup.at)} · ${lastBackup.size}` : 'No backup yet', status: 'Operational' },
  ]
  const serviceColor = { Operational: '#0ca30c', Degraded: '#ec835a', Maintenance: '#fab219' }

  const quickActions: { label: string; to: string; icon: IconName }[] = [
    { label: 'Add New User', to: '/technical/users?new=1', icon: 'users' },
    { label: 'Assign a Role', to: '/technical/role-assignment', icon: 'key' },
    { label: 'Review Profile Updates', to: '/technical/profile-updates', icon: 'id' },
    { label: 'System Configuration', to: '/technical/system-configuration', icon: 'settings' },
    { label: 'View Access Logs', to: '/technical/access-logs', icon: 'log' },
    { label: 'Report an Issue', to: '/technical/system-issues?new=1', icon: 'alert' },
  ]

  const roleCounts = db.roles.map((r) => ({ role: r, count: db.users.filter((u) => u.roleId === r.id && u.status !== 'Deactivated').length }))
  const maxRole = Math.max(1, ...roleCounts.map((r) => r.count))

  return (
    <TechLayout>
      <PageHeader
        crumbs={[{ label: 'Dashboard' }]}
        title="Technical Admin Dashboard"
        description="System health, user access and employee-profile maintenance across all DOST concerned offices and attached agencies."
        actions={
          <>
            <button style={ghostBtn} onClick={() => navigate('/technical/system-issues?new=1')}><Icon name="alert" size={16} /> Report Issue</button>
            <button style={primaryBtn} onClick={() => navigate('/technical/users?new=1')}><Icon name="plus" size={16} /> Add New User</button>
          </>
        }
      />

      {/* Account KPI cards (same as the User Account Management mockup) */}
      <StatRow>
        <StatCard label="TOTAL SYSTEM ACCOUNTS" value={total} unit="Registered" sub={`Across ${officeCount} concerned offices & units`} icon="users" to="/technical/users" />
        <StatCard label="ACTIVE USERS" value={active} unit={`${Math.round((active / Math.max(1, total)) * 100)}%`} tone="success" sub="Accounts able to sign in" icon="check" to="/technical/users?status=Active" />
        <StatCard label="PENDING SETUP" value={pendingSetup} unit="Pending" tone="warning" sub="Awaiting 2FA / GovMail verification" icon="hourglass" to="/technical/users?status=Pending Setup" />
        <StatCard label="DEACTIVATED / SUSPENDED" value={blocked} unit="Blocked" tone="danger" sub="Security lock or separation" icon="userx" to="/technical/users?status=Suspended" />
      </StatRow>

      {/* Sign-in activity + system health */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '18px', marginBottom: '18px' }}>
        <Card title="Sign-in Activity" subtitle="Successful vs failed sign-ins over the last 7 days" right={<Link to="/technical/access-logs" style={linkBtn}>Open Access Logs &rarr;</Link>}>
          <SignInChart logs={db.logs} />
        </Card>
        <Card title="System Health" subtitle="Status of core services" right={<Link to="/technical/system-configuration?tab=maintenance" style={linkBtn}>Maintenance &rarr;</Link>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {services.map((s) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '11px 14px' }}>
                <span style={{ width: 34, height: 34, borderRadius: '8px', background: '#f1f2f4', color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="server" size={17} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#111827' }}>{s.name}</div>
                  <div style={{ fontSize: '12px', color: MUTED }}>{s.detail}</div>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: '#374151' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: serviceColor[s.status] }} />{s.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Issues, profile updates, security alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px', marginBottom: '18px' }}>
        <Card title="Open Technical Issues" subtitle={`${openIssues.length} open or in progress`} right={<Link to="/technical/system-issues" style={linkBtn}>View all &rarr;</Link>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {openIssues.slice(0, 5).map((i) => (
              <Link key={i.id} to={`/technical/system-issues?open=${i.id}`} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', textDecoration: 'none', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${BORDER}` }}>
                <Pill text={i.priority} dot={false} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.title}</div>
                  <div style={{ fontSize: '12px', color: MUTED }}>{i.id} · {i.status} · {i.assignedTo}</div>
                </div>
              </Link>
            ))}
            {openIssues.length === 0 && <div style={{ color: MUTED, fontSize: '13px' }}>No open issues. 🎉</div>}
          </div>
        </Card>

        <Card title="Pending Profile Updates" subtitle={`${pendingUpdates.length} request${pendingUpdates.length === 1 ? '' : 's'} waiting for review`} right={<Link to="/technical/profile-updates" style={linkBtn}>Review &rarr;</Link>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingUpdates.slice(0, 5).map((u) => {
              const e = db.employees.find((x) => x.id === u.employeeId)
              return (
                <Link key={u.id} to={`/technical/profile-updates?open=${u.id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', textDecoration: 'none', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${BORDER}` }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{employeeName(e)}</div>
                    <div style={{ fontSize: '12px', color: MUTED }}>{u.id} · changes {u.field === 'officeCode' ? 'office' : u.field === 'positionTitle' ? 'position' : u.field.replace(/([A-Z])/g, ' $1').toLowerCase()}</div>
                  </div>
                  <span style={{ fontSize: '12px', color: MUTED, whiteSpace: 'nowrap' }}>{relativeTime(u.submittedAt)}</span>
                </Link>
              )
            })}
            {pendingUpdates.length === 0 && <div style={{ color: MUTED, fontSize: '13px' }}>Nothing to review.</div>}
          </div>
        </Card>

        <Card title="Security Alerts" subtitle="Today’s sign-in and access risks" right={<Link to="/technical/access-logs?status=Failed" style={linkBtn}>Investigate &rarr;</Link>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            {[
              { label: 'Failed sign-ins today', value: failedToday, danger: failedToday > 0, to: '/technical/access-logs?event=Failed Login' },
              { label: 'Locked accounts', value: locked.length, danger: locked.length > 0, to: '/technical/users?filter=locked' },
              { label: 'Permission denied today', value: deniedToday, danger: false, to: '/technical/access-logs?event=Permission Denied' },
              { label: 'Active users without 2FA', value: no2fa, danger: false, to: '/technical/users?filter=no2fa' },
            ].map((a) => (
              <Link key={a.label} to={a.to} style={{ border: `1px solid ${a.danger ? '#f8caca' : BORDER}`, background: a.danger ? '#fdecec' : 'white', borderRadius: '10px', padding: '10px 12px', textDecoration: 'none' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: a.danger ? '#b91c1c' : '#111827' }}>{a.value}</div>
                <div style={{ fontSize: '12px', color: '#374151' }}>{a.label}</div>
              </Link>
            ))}
          </div>
          {locked.map((u) => (
            <div key={u.id} style={{ fontSize: '12.5px', color: '#9f2222', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Icon name="lock" size={14} /> {u.username} locked after {u.failedAttempts} failed attempts ·{' '}
              <Link to={`/technical/users?q=${u.username}`} style={{ color: ACCENT, fontWeight: 600 }}>Unlock</Link>
            </div>
          ))}
        </Card>
      </div>

      {/* Roles, recent activity, quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr) minmax(0, 1fr)', gap: '18px' }}>
        <Card title="Accounts by Role" right={<Link to="/technical/roles" style={linkBtn}>Roles &rarr;</Link>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {roleCounts.map(({ role, count }) => (
              <div key={role.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                  <span style={{ color: '#1f2937', fontWeight: 600 }}>{role.name}</span>
                  <strong>{count}</strong>
                </div>
                <div style={{ height: '8px', background: '#eceef2', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(count / maxRole) * 100}%`, height: '100%', background: CHART_BLUE, borderRadius: '0 4px 4px 0' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent Access Activity" right={<Link to="/technical/access-logs" style={linkBtn}>View all &rarr;</Link>}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {db.logs.slice(0, 7).map((l) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f0f1f3', fontSize: '13px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.status === 'Failed' ? '#d03b3b' : l.status === 'Warning' ? '#fab219' : '#0ca30c', flexShrink: 0 }} />
                <strong style={{ minWidth: '92px', color: '#111827' }}>{l.username}</strong>
                <span style={{ flex: 1, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.event} · {l.details}</span>
                <span style={{ color: MUTED, whiteSpace: 'nowrap', fontSize: '12px' }}>{relativeTime(l.timestamp)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Actions">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {quickActions.map((a) => (
              <Link key={a.label} to={a.to} style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px', textDecoration: 'none', color: NAVY, fontSize: '13px', fontWeight: 600 }}>
                <span style={{ width: 32, height: 32, borderRadius: '8px', background: '#e6f5fc', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={a.icon} size={16} /></span>
                {a.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </TechLayout>
  )
}
