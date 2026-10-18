// ROLE ASSIGNMENT  (/technical/role-assignment)
// Change the role of one or many users, with an effective date and a reason,
// and review the full role-assignment history.
// Address option: ?users=3,7,9 pre-selects users (sent from the Users page).
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDb, save, employeeName, nextNumber, CURRENT_ACTOR } from './techData'
import { TechLayout, PageHeader, Card, SearchBox, Pill, RoleBadge, Field, TableFooter, EmptyRow, Notice, Icon, Toggle } from './techUi'
import { NAVY, ACCENT, MUTED, BORDER, inputStyle, selectStyle, primaryBtn, ghostBtn, linkBtn, thStyle, tdStyle, errorBox, infoBox, formatDate, formatDateTime, paginate, todayIso, downloadCsv, nowMs } from './techTheme'

const PER_PAGE = 8

export default function RoleAssignmentPage() {
  const db = useDb()
  const [params] = useSearchParams()

  // ---- assignment form ----
  const preselected = (params.get('users') ?? '').split(',').map(Number).filter(Boolean)
  const [selected, setSelected] = useState<number[]>(preselected)
  const [pickSearch, setPickSearch] = useState('')
  const [targetRole, setTargetRole] = useState(db.roles.find((r) => r.status === 'Active')?.id ?? 1)
  const [effectiveDate, setEffectiveDate] = useState(todayIso())
  const [reason, setReason] = useState('')
  const [notify, setNotify] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // ---- history table ----
  const [histSearch, setHistSearch] = useState('')
  const [histRole, setHistRole] = useState('All')
  const [page, setPage] = useState(1)

  const roleName = (id: number | null) => (id === null ? 'No role (new account)' : db.roles.find((r) => r.id === id)?.name ?? 'Deleted role')
  const empOf = (userId: number) => db.employees.find((e) => e.id === db.users.find((u) => u.id === userId)?.employeeId)
  const assignable = db.users.filter((u) => u.status !== 'Deactivated')

  const pq = pickSearch.trim().toLowerCase()
  const pickList = assignable.filter((u) => !pq || `${u.username} ${employeeName(empOf(u.id))} ${roleName(u.roleId)}`.toLowerCase().includes(pq))

  // users that would actually change (skip anyone already in the target role, and yourself)
  const changes = db.users.filter((u) => selected.includes(u.id) && u.roleId !== targetRole && u.id !== CURRENT_ACTOR.userId)
  const skippedSame = db.users.filter((u) => selected.includes(u.id) && u.roleId === targetRole).length
  const skippedSelf = selected.includes(CURRENT_ACTOR.userId)

  function toggle(id: number) {
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
    setError('')
  }

  function assign() {
    if (selected.length === 0) return setError('Select at least one user.')
    if (changes.length === 0) return setError('None of the selected users would change role.')
    if (!reason.trim()) return setError('Enter the reason for the role change. It is kept in the history for audit.')
    if (!effectiveDate) return setError('Choose an effective date.')
    const to = roleName(targetRole)
    save((d) => {
      changes.forEach((c) => {
        const u = d.users.find((x) => x.id === c.id)!
        d.assignments.unshift({ id: nextNumber(d.assignments.map((a) => a.id)), userId: u.id, fromRoleId: u.roleId, toRoleId: targetRole, effectiveDate, reason: reason.trim(), assignedBy: CURRENT_ACTOR.name, at: new Date(nowMs()).toISOString() })
        if (u.employeeId) d.history.unshift({ id: nextNumber(d.history.map((h) => h.id)), employeeId: u.employeeId, recordType: 'Role Change', description: `System role: ${roleName(u.roleId)} → ${to}`, effectiveDate, createdAt: todayIso(), by: CURRENT_ACTOR.name })
        u.roleId = targetRole
      })
    }, { event: 'Role Change', details: `${changes.map((c) => c.username).join(', ')} → ${to} (effective ${effectiveDate}) · ${reason.trim()}${notify ? ' · users notified' : ''}` })
    setNotice(`${changes.length} user(s) assigned to ${to}${notify ? ' and notified by email' : ''}.`)
    setSelected([])
    setReason('')
    setError('')
  }

  // ---- history filtering ----
  const hq = histSearch.trim().toLowerCase()
  const history = db.assignments.filter((a) => {
    const u = db.users.find((x) => x.id === a.userId)
    return (
      (!hq || `${u?.username ?? ''} ${employeeName(empOf(a.userId))} ${a.reason} ${a.assignedBy}`.toLowerCase().includes(hq)) &&
      (histRole === 'All' || String(a.toRoleId) === histRole || String(a.fromRoleId) === histRole)
    )
  })
  const p = paginate(history, page, PER_PAGE)

  function exportHistory() {
    downloadCsv('role_assignment_history.csv', [
      ['Changed On', 'User', 'Employee', 'From Role', 'To Role', 'Effective Date', 'Reason', 'Assigned By'],
      ...history.map((a) => [a.at, db.users.find((u) => u.id === a.userId)?.username ?? '', employeeName(empOf(a.userId)), roleName(a.fromRoleId), roleName(a.toRoleId), a.effectiveDate, a.reason, a.assignedBy]),
    ])
  }

  return (
    <TechLayout>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/technical/dashboard' }, { label: 'User & Access Management', to: '/technical/users' }, { label: 'Role Assignment' }]}
        title="Role Assignment"
        description="Assign or change the system role of one or more user accounts. Every change needs a reason and is kept in the assignment history."
        actions={<Link to="/technical/roles" style={{ ...ghostBtn, textDecoration: 'none' }}><Icon name="shield" size={16} /> Manage Roles</Link>}
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: '18px', marginBottom: '22px', alignItems: 'start' }}>
        {/* Step 1: pick users */}
        <Card title="1. Select Users" subtitle={`${selected.length} selected`} right={selected.length > 0 ? <button style={linkBtn} onClick={() => setSelected([])}>Clear selection</button> : undefined}>
          <div style={{ marginBottom: '10px', display: 'flex' }}>
            <SearchBox value={pickSearch} onChange={setPickSearch} placeholder="Search by name, username or current role..." />
          </div>
          <div style={{ maxHeight: '420px', overflowY: 'auto', border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
            {pickList.map((u) => {
              const e = empOf(u.id)
              const on = selected.includes(u.id)
              return (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderBottom: '1px solid #f0f1f3', cursor: 'pointer', background: on ? '#eef8fd' : 'white' }}>
                  <input type="checkbox" checked={on} onChange={() => toggle(u.id)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{employeeName(e)} {u.id === CURRENT_ACTOR.userId && <span style={{ color: MUTED, fontWeight: 500 }}>(you)</span>}</div>
                    <div style={{ fontSize: '12.5px', color: MUTED }}>{u.username} · {e?.officeCode} · {e?.positionTitle}</div>
                  </div>
                  <RoleBadge name={roleName(u.roleId)} />
                  {u.status !== 'Active' && <Pill text={u.status} dot={false} />}
                </label>
              )
            })}
            {pickList.length === 0 && <div style={{ padding: '20px', color: MUTED, fontSize: '13px', textAlign: 'center' }}>No users found.</div>}
          </div>
        </Card>

        {/* Step 2: choose role + reason */}
        <Card title="2. Choose New Role">
          {error && <div style={errorBox}>{error}</div>}
          <div style={{ display: 'grid', gap: '14px' }}>
            <Field label="New role *">
              <select style={inputStyle} value={targetRole} onChange={(e) => { setTargetRole(Number(e.target.value)); setError('') }}>
                {db.roles.filter((r) => r.status === 'Active').map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
            <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '-6px' }}>{db.roles.find((r) => r.id === targetRole)?.description}</div>
            <Field label="Effective date *"><input type="date" style={inputStyle} value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} /></Field>
            <Field label="Reason for change *"><textarea style={{ ...inputStyle, minHeight: '70px' }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Designated as HR focal person per Office Order No. 2026-118" /></Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#374151' }}>
              <Toggle checked={notify} onChange={setNotify} label="Notify users" /> Notify affected users by email
            </label>
          </div>

          {/* Preview of what will change */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px', color: '#374151', marginBottom: '8px' }}>CHANGES TO APPLY ({changes.length})</div>
            {changes.length === 0 && <div style={{ fontSize: '13px', color: MUTED }}>Select users whose role is different from the new role.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '170px', overflowY: 'auto' }}>
              {changes.map((u) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '13px', background: '#f7f6f4', borderRadius: '6px', padding: '7px 10px' }}>
                  <strong>{u.username}</strong>
                  <span style={{ color: '#374151' }}>{roleName(u.roleId)} <span style={{ color: ACCENT }}>&rarr;</span> <strong style={{ color: NAVY }}>{roleName(targetRole)}</strong></span>
                </div>
              ))}
            </div>
            {(skippedSame > 0 || skippedSelf) && (
              <div style={{ ...infoBox, marginTop: '10px', fontSize: '12.5px' }}>
                {skippedSame > 0 && <>{skippedSame} user(s) already have this role and will be skipped. </>}
                {skippedSelf && <>Your own account is skipped — another Technical Administrator must change your role.</>}
              </div>
            )}
            <button style={{ ...primaryBtn, width: '100%', justifyContent: 'center', marginTop: '14px', opacity: changes.length ? 1 : 0.5 }} onClick={assign}>
              <Icon name="key" size={16} /> Assign Role to {changes.length} User{changes.length === 1 ? '' : 's'}
            </button>
          </div>
        </Card>
      </div>

      {/* History */}
      <Card
        flush
        title="Role Assignment History"
        subtitle="Every role change, newest first"
        right={
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ width: '280px', display: 'flex' }}><SearchBox value={histSearch} onChange={(v) => { setHistSearch(v); setPage(1) }} placeholder="Search user, reason or admin..." /></div>
            <select style={selectStyle} value={histRole} onChange={(e) => { setHistRole(e.target.value); setPage(1) }}>
              <option value="All">All Roles</option>
              {db.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button style={ghostBtn} onClick={exportHistory}><Icon name="download" size={15} /> Export CSV</button>
          </div>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>CHANGED ON</th>
                <th style={thStyle}>USER</th>
                <th style={thStyle}>ROLE CHANGE</th>
                <th style={thStyle}>EFFECTIVE</th>
                <th style={thStyle}>REASON</th>
                <th style={thStyle}>ASSIGNED BY</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map((a) => {
                const u = db.users.find((x) => x.id === a.userId)
                return (
                  <tr key={a.id}>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDateTime(a.at)}</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{employeeName(empOf(a.userId))}</div>
                      <div style={{ color: MUTED, fontSize: '12.5px' }}>{u?.username ?? 'deleted account'}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: MUTED }}>{roleName(a.fromRoleId)}</span> <span style={{ color: ACCENT, fontWeight: 700 }}>&rarr;</span> <strong style={{ color: NAVY }}>{roleName(a.toRoleId)}</strong>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDate(a.effectiveDate)}</td>
                    <td style={{ ...tdStyle, maxWidth: '320px', color: '#374151' }}>{a.reason}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{a.assignedBy}</td>
                  </tr>
                )
              })}
              {p.rows.length === 0 && <EmptyRow colSpan={6} text="No role changes match your search." />}
            </tbody>
          </table>
        </div>
        <TableFooter from={p.from} to={p.to} total={history.length} label="role changes" page={p.current} totalPages={p.totalPages} onPage={setPage} />
      </Card>
    </TechLayout>
  )
}
