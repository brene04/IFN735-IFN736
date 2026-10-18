// Executive › Access & Users › Users (view only)
// Reads the real accounts the Technical Admin manages. Built with the shared Technical Admin components.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import RoleShell from '../../components/RoleShell'
import { PageHeader, StatRow, StatCard, Card, SearchBox, Pill, RoleBadge, TableFooter, EmptyRow, Notice } from '../technical/techUi'
import { MUTED, selectStyle, thStyle, tdStyle, relativeTime, paginate, linkBtn } from '../technical/techTheme'
import { useDb, employeeName, officeName } from '../technical/techData'

const PER_PAGE = 8

export default function ExecutiveUsers() {
  const db = useDb()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [hideNote, setHideNote] = useState(false)

  const roleName = (id: number) => db.roles.find((r) => r.id === id)?.name ?? '—'
  const empOf = (employeeId: number | null) => db.employees.find((e) => e.id === employeeId)

  const q = search.trim().toLowerCase()
  const filtered = db.users.filter((u) => {
    const e = empOf(u.employeeId)
    return (
      (roleFilter === 'All' || String(u.roleId) === roleFilter) &&
      (statusFilter === 'All' || u.status === statusFilter) &&
      (!q || `${employeeName(e)} ${u.username} ${u.email} ${e?.officeCode ?? ''}`.toLowerCase().includes(q))
    )
  })
  const p = paginate(filtered, page, PER_PAGE)
  const count = (s: string) => db.users.filter((u) => u.status === s).length
  const waiting = count('Pending Approval')

  return (
    <RoleShell>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/executive/dashboard' }, { label: 'Access & Users' }, { label: 'Users' }]}
        title="Users"
        description="Everyone with access to the CBHR system, across all roles and offices (view only)."
      />

      <StatRow>
        <StatCard label="TOTAL USERS" value={db.users.length} unit="Accounts" sub="Across 4 roles" icon="users" />
        <StatCard label="ACTIVE" value={count('Active')} tone="success" sub="Accounts able to sign in" icon="check" />
        <StatCard label="PENDING APPROVAL" value={waiting} unit="Waiting" tone="warning" sub="Created by the Technical Admin" icon="hourglass" to="/roles-access" />
        <StatCard label="SUSPENDED / DEACTIVATED" value={count('Suspended') + count('Deactivated')} tone="danger" sub="Access blocked" icon="userx" />
      </StatRow>

      {waiting > 0 && !hideNote && <Notice tone="info" text={`${waiting} new user${waiting === 1 ? ' is' : 's are'} waiting for your approval. Open Roles / Access Management → Approve Access.`} onClose={() => setHideNote(true)} />}

      <Card style={{ marginBottom: '18px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search user by name, username, email or office..." />
          <select style={selectStyle} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}>
            <option value="All">All Roles ({db.roles.length})</option>
            {db.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select style={selectStyle} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="All">Status: All</option>
            {['Active', 'Pending Approval', 'Pending Setup', 'Suspended', 'Deactivated'].map((s) => <option key={s} value={s}>Status: {s}</option>)}
          </select>
        </div>
      </Card>

      <Card flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>USER / EMPLOYEE</th>
                <th style={thStyle}>OFFICE / ATTACHED AGENCY</th>
                <th style={thStyle}>ASSIGNED ROLE</th>
                <th style={thStyle}>ACCOUNT STATUS</th>
                <th style={thStyle}>LAST LOGIN</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map((u) => {
                const e = empOf(u.employeeId)
                return (
                  <tr key={u.id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{employeeName(e)}</div>
                      <div style={{ color: MUTED, fontSize: '13px' }}>{u.email} • {u.username}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{e?.officeCode}</div>
                      <div style={{ color: MUTED, fontSize: '13px', maxWidth: '190px' }}>{e ? officeName(e.officeCode) : ''}</div>
                    </td>
                    <td style={tdStyle}><RoleBadge name={roleName(u.roleId)} /></td>
                    <td style={tdStyle}><Pill text={u.status} /></td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{relativeTime(u.lastLogin)}</td>
                  </tr>
                )
              })}
              {p.rows.length === 0 && <EmptyRow colSpan={5} text="No users match your search or filters." />}
            </tbody>
          </table>
        </div>
        <TableFooter from={p.from} to={p.to} total={filtered.length} label="users" page={p.current} totalPages={p.totalPages} onPage={setPage} />
      </Card>
      <div style={{ marginTop: '14px', textAlign: 'right' }}><Link to="/roles-access" style={linkBtn}>Manage roles &amp; access &rarr;</Link></div>
    </RoleShell>
  )
}
