// Executive › Access & Users › Roles / Access Management
// View users, view roles, change a user's role, and approve the users the Technical Admin creates.
// Reads and writes the real accounts (techData), using the shared Technical Admin components.
import { useState } from 'react'
import RoleShell from '../../components/RoleShell'
import { PageHeader, Card, Tabs, Pill, RoleBadge, Notice, EmptyRow } from '../technical/techUi'
import { NAVY, MUTED, BORDER, selectStyle, thStyle, tdStyle, smallPrimaryBtn, dangerBtn, formatDate } from '../technical/techTheme'
import { useDb, save, employeeName } from '../technical/techData'

const TABS = ['View Users', 'View Roles', 'Assign / Change Roles', 'Approve Access'] as const
type Tab = typeof TABS[number]

const roleInfo: Record<string, { description: string; can: string[] }> = {
  executive: {
    description: 'Full system visibility and control. Manages and approves access across roles.',
    can: ['View dashboards, competency results, gap analysis results and reports', 'Assign / change roles and approve access', 'View all organisation and competency data'],
  },
  technical_admin: {
    description: 'Looks after user accounts, system settings and technical issues.',
    can: ['Manage users, roles and role assignment', 'View access logs', 'Review employee profile updates and office requests', 'System configuration and technical issues'],
  },
  administrative_admin: {
    description: 'HR / competency data and analysis assistant to the Executive.',
    can: ['Manage employees and positions', 'Manage competencies and position requirements', 'Run gap analysis and view results', 'Process Concerned Office report requests'],
  },
  concerned_office: {
    description: 'Office representative with a view of their own office only.',
    can: ['View own office and employees', 'View competency information', 'Submit employee and report requests', 'View own office gap analysis reports'],
  },
}

export default function RolesAccessManagement() {
  const db = useDb()
  const [tab, setTab] = useState<Tab>('View Users')
  const [pendingRole, setPendingRole] = useState<Record<number, number>>({})
  const [notice, setNotice] = useState('')

  const roleName = (id: number) => db.roles.find((r) => r.id === id)?.name ?? '—'
  const empOf = (employeeId: number | null) => db.employees.find((e) => e.id === employeeId)
  const nameOf = (u: { employeeId: number | null; username: string }) => { const e = empOf(u.employeeId); return e ? employeeName(e) : u.username }

  const requests = db.users.filter((u) => u.status === 'Pending Approval')
  const users = db.users.filter((u) => u.status !== 'Pending Approval')

  function saveRole(userId: number) {
    const roleId = pendingRole[userId]
    const u = db.users.find((x) => x.id === userId)
    if (!u || !roleId || roleId === u.roleId) return
    const from = roleName(u.roleId)
    save((d) => { const x = d.users.find((v) => v.id === userId); if (x) x.roleId = roleId },
      { event: 'Role Change', details: `${u.username}: ${from} → ${roleName(roleId)} (changed by Executive)` })
    setPendingRole((p) => { const n = { ...p }; delete n[userId]; return n })
    setNotice(`${nameOf(u)} is now ${roleName(roleId)}.`)
  }

  function decide(userId: number, approved: boolean) {
    const u = db.users.find((x) => x.id === userId)
    if (!u) return
    save((d) => { const x = d.users.find((v) => v.id === userId); if (x) x.status = approved ? 'Active' : 'Deactivated' },
      { event: approved ? 'Account Activated' : 'User Updated', details: `${u.username} ${approved ? `approved by Executive as ${roleName(u.roleId)}` : 'access request rejected by Executive'}`, status: approved ? 'Success' : 'Warning' })
    setNotice(approved ? `Access approved: ${nameOf(u)} added as ${roleName(u.roleId)}.` : `Access request from ${nameOf(u)} was rejected.`)
  }

  return (
    <RoleShell>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/executive/dashboard' }, { label: 'Access & Users' }, { label: 'Roles / Access Management' }]}
        title="Roles / Access Management"
        description="See who has access, what each role can do, and approve or change access."
      />

      <Card style={{ marginBottom: '18px', padding: '10px 12px' }}>
        <Tabs
          tabs={TABS.map((t) => ({ value: t, label: t, count: t === 'Approve Access' ? requests.length : undefined }))}
          active={tab}
          onChange={(t) => { setTab(t); setNotice('') }}
        />
      </Card>

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      {tab === 'View Users' && (
        <Card flush>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead><tr>{['USER', 'EMAIL', 'ROLE', 'OFFICE', 'STATUS'].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#111827' }}>{nameOf(u)}</td>
                    <td style={{ ...tdStyle, color: MUTED }}>{u.email}</td>
                    <td style={tdStyle}><RoleBadge name={roleName(u.roleId)} /></td>
                    <td style={tdStyle}>{empOf(u.employeeId)?.officeCode}</td>
                    <td style={tdStyle}><Pill text={u.status} /></td>
                  </tr>
                ))}
                {users.length === 0 && <EmptyRow colSpan={5} text="No users yet." />}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'View Roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
          {db.roles.filter((r) => roleInfo[r.key]).map((r) => (
            <Card key={r.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <RoleBadge name={r.name} />
                <span style={{ fontSize: '13px', color: MUTED }}>{db.users.filter((u) => u.roleId === r.id && u.status === 'Active').length} active users</span>
              </div>
              <p style={{ fontSize: '13.5px', color: '#374151', margin: '0 0 14px' }}>{roleInfo[r.key].description}</p>
              <div style={{ fontSize: '11px', letterSpacing: '1px', color: MUTED, fontWeight: 700, marginBottom: '8px' }}>CAN</div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: NAVY, lineHeight: 1.8 }}>
                {roleInfo[r.key].can.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {tab === 'Assign / Change Roles' && (
        <Card flush>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead><tr>{['USER', 'CURRENT ROLE', 'NEW ROLE', ''].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.username === 'executive'
                  const chosen = pendingRole[u.id] ?? u.roleId
                  const changed = chosen !== u.roleId
                  return (
                    <tr key={u.id}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700, color: '#111827' }}>{nameOf(u)}</div>
                        <div style={{ fontSize: '13px', color: MUTED }}>{u.email}</div>
                      </td>
                      <td style={tdStyle}><RoleBadge name={roleName(u.roleId)} /></td>
                      <td style={tdStyle}>
                        <select disabled={isSelf} value={chosen} onChange={(e) => setPendingRole((p) => ({ ...p, [u.id]: Number(e.target.value) }))} style={{ ...selectStyle, background: isSelf ? '#f3f4f6' : 'white' }}>
                          {db.roles.filter((r) => r.status === 'Active' && roleInfo[r.key]).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        {isSelf && <span style={{ marginLeft: '10px', fontSize: '12.5px', color: MUTED }}>You can't change your own role</span>}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button disabled={!changed} onClick={() => saveRole(u.id)} style={{ ...smallPrimaryBtn, opacity: changed ? 1 : 0.4, cursor: changed ? 'pointer' : 'default' }}>Save</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'Approve Access' && (
        <Card title="Waiting for your approval" subtitle="Accounts created by the Technical Admin stay blocked until you approve them.">
          {requests.length === 0 ? (
            <p style={{ textAlign: 'center', color: MUTED, fontSize: '14px', margin: '20px 0' }}>No access requests are waiting for approval.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {requests.map((u) => (
                <div key={u.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#111827', fontSize: '15px' }}>{nameOf(u)}</span>
                      <RoleBadge name={roleName(u.roleId)} />
                      <Pill text="Pending Approval" />
                    </div>
                    <div style={{ fontSize: '13px', color: MUTED, marginTop: '5px' }}>@{u.username} · {u.email} · {empOf(u.employeeId)?.officeCode} · created {formatDate(u.createdAt)} by the Technical Admin</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={smallPrimaryBtn} onClick={() => decide(u.id, true)}>Approve</button>
                    <button style={dangerBtn} onClick={() => decide(u.id, false)}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </RoleShell>
  )
}
