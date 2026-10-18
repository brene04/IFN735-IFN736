// USERS  (/technical/users)
// User Account Management: create accounts for employees, change role/status,
// reset passwords, unlock accounts and run bulk actions.
// Address options: ?q=name  ?status=Pending Setup  ?filter=locked|no2fa  ?new=1
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDb, save, employeeName, officeName, nextNumber, offices, CURRENT_ACTOR } from './techData'
import type { User, UserStatus } from './techData'
import { TechLayout, PageHeader, StatRow, StatCard, Card, SearchBox, Pill, RoleBadge, Modal, Field, TableFooter, EmptyRow, Notice, Icon, Toggle, DetailRow } from './techUi'
import { ACCENT, MUTED, BORDER, inputStyle, selectStyle, primaryBtn, smallPrimaryBtn, ghostBtn, dangerBtn, rowGhostBtn, thStyle, tdStyle, errorBox, infoBox, relativeTime, paginate, todayIso, nowMs } from './techTheme'

const PER_PAGE = 8
const STATUSES: UserStatus[] = ['Active', 'Pending Approval', 'Pending Setup', 'Suspended', 'Deactivated']
type Pending = { kind: 'status'; user: User; to: UserStatus } | { kind: 'delete'; user: User } | { kind: 'bulk'; to: UserStatus | 'reset' }

export default function UsersPage() {
  const db = useDb()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  // filters (some can arrive in the address, e.g. from the dashboard cards)
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [roleFilter, setRoleFilter] = useState('All')
  const [officeFilter, setOfficeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState(params.get('status') ?? 'All')
  const special = params.get('filter') // 'locked' | 'no2fa'
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number[]>([])

  // dialogs
  const [adding, setAdding] = useState(params.get('new') === '1')
  const [editing, setEditing] = useState<User | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState('')

  const maxAttempts = db.config.security.maxFailedAttempts
  const isLocked = (u: User) => u.status === 'Active' && u.failedAttempts >= maxAttempts
  const roleName = (id: number) => db.roles.find((r) => r.id === id)?.name ?? '—'
  const empOf = (u: User) => db.employees.find((e) => e.id === u.employeeId)

  // ---- KPI numbers ----
  const total = db.users.length
  const active = db.users.filter((u) => u.status === 'Active').length
  const pendingSetup = db.users.filter((u) => u.status === 'Pending Setup').length
  const pendingApproval = db.users.filter((u) => u.status === 'Pending Approval').length
  const blocked = db.users.filter((u) => u.status === 'Suspended' || u.status === 'Deactivated').length

  // ---- filtering ----
  const q = search.trim().toLowerCase()
  const filtered = db.users.filter((u) => {
    const e = empOf(u)
    return (
      (!q || [u.username, u.email, employeeName(e), e?.employeeNo ?? ''].some((v) => v.toLowerCase().includes(q))) &&
      (roleFilter === 'All' || String(u.roleId) === roleFilter) &&
      (officeFilter === 'All' || e?.officeCode === officeFilter) &&
      (statusFilter === 'All' || u.status === statusFilter) &&
      (special !== 'locked' || isLocked(u)) &&
      (special !== 'no2fa' || (u.status === 'Active' && !u.twoFactor))
    )
  })
  const p = paginate(filtered, page, PER_PAGE)
  const allOnPageSelected = p.rows.length > 0 && p.rows.every((u) => selected.includes(u.id))

  function resetFilters() {
    setSearch(''); setRoleFilter('All'); setOfficeFilter('All'); setStatusFilter('All'); setPage(1)
    setParams({})
  }

  function toggleSelect(id: number) {
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  // ---- actions ----
  function changeStatus(user: User, to: UserStatus, why: string) {
    const event = to === 'Suspended' || to === 'Deactivated' ? 'Account Suspended' : 'Account Activated'
    save((d) => {
      const u = d.users.find((x) => x.id === user.id)!
      u.status = to
      if (to === 'Active') u.failedAttempts = 0
      if (u.employeeId) d.history.unshift({ id: nextNumber(d.history.map((h) => h.id)), employeeId: u.employeeId, recordType: 'Account', description: `User account ${user.status} → ${to}${why ? ` (${why})` : ''}`, effectiveDate: todayIso(), createdAt: todayIso(), by: CURRENT_ACTOR.name })
    }, { event, details: `${user.username}: ${user.status} → ${to}${why ? ` · ${why}` : ''}` })
    setNotice(`${user.username} is now ${to}.`)
  }

  function resetPassword(user: User) {
    save((d) => {
      const u = d.users.find((x) => x.id === user.id)!
      u.failedAttempts = 0
    }, { event: 'Password Reset', details: `Reset link sent to ${user.email}` })
    setNotice(`A password reset link was sent to ${user.email}. It expires in 30 minutes.`)
  }

  function unlock(user: User) {
    save((d) => {
      d.users.find((x) => x.id === user.id)!.failedAttempts = 0
    }, { event: 'Account Activated', details: `${user.username} unlocked after ${user.failedAttempts} failed attempts` })
    setNotice(`${user.username} has been unlocked.`)
  }

  function deleteUser(user: User) {
    save((d) => {
      d.users = d.users.filter((x) => x.id !== user.id)
    }, { event: 'User Updated', details: `Deleted deactivated account ${user.username}` })
    setSelected(selected.filter((x) => x !== user.id))
    setNotice(`Account ${user.username} was deleted.`)
  }

  function runBulk(to: UserStatus | 'reset') {
    const targets = db.users.filter((u) => selected.includes(u.id) && u.id !== CURRENT_ACTOR.userId)
    if (to === 'reset') {
      save((d) => d.users.forEach((u) => { if (selected.includes(u.id)) u.failedAttempts = 0 }), { event: 'Password Reset', details: `Bulk reset links sent to ${targets.length} accounts` })
      setNotice(`Password reset links sent to ${targets.length} account(s).`)
    } else {
      save((d) => d.users.forEach((u) => { if (targets.some((t) => t.id === u.id)) { u.status = to; if (to === 'Active') u.failedAttempts = 0 } }), {
        event: to === 'Active' ? 'Account Activated' : 'Account Suspended',
        details: `Bulk: ${targets.map((t) => t.username).join(', ')} → ${to}`,
      })
      setNotice(`${targets.length} account(s) set to ${to}.`)
    }
    setSelected([])
  }

  function confirmPending() {
    if (!pending) return
    if ((pending.kind === 'status' && (pending.to === 'Suspended' || pending.to === 'Deactivated')) && !reason.trim()) return
    if (pending.kind === 'status') changeStatus(pending.user, pending.to, reason.trim())
    if (pending.kind === 'delete') deleteUser(pending.user)
    if (pending.kind === 'bulk') runBulk(pending.to)
    setPending(null)
    setReason('')
    setEditing(null)
  }

  return (
    <TechLayout>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/technical/dashboard' }, { label: 'User & Access Management' }, { label: 'Users' }]}
        title="User Account Management"
        description="Provision, calibrate, and audit user permissions, role-based access controls (RBAC), and security statuses across all DOST sectoral councils, R&D institutes, and central office units."
        actions={<button style={primaryBtn} onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Add New User</button>}
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      <StatRow>
        <StatCard label="TOTAL SYSTEM ACCOUNTS" value={total} unit="Registered" sub={`Across ${offices.length} Concerned Offices & Units`} icon="users" />
        <StatCard label="ACTIVE USERS" value={active} unit={`${Math.round((active / Math.max(1, total)) * 100)}%`} tone="success" sub="All active sessions authenticated" icon="check" />
        <StatCard label="PENDING APPROVAL / SETUP" value={pendingApproval + pendingSetup} unit="Pending" tone="warning" sub={`${pendingApproval} awaiting Executive approval · ${pendingSetup} awaiting 2FA / GovMail`} icon="hourglass" />
        <StatCard label="DEACTIVATED / SUSPENDED" value={blocked} unit="Suspended" tone="danger" sub="Mandatory security lock or separation" icon="userx" />
      </StatRow>

      {/* Filters */}
      <Card style={{ marginBottom: '18px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search user by full name, Plantilla ID, GovMail, or username..." />
          <select style={selectStyle} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}>
            <option value="All">All Roles ({db.roles.length})</option>
            {db.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select style={{ ...selectStyle, minWidth: '230px' }} value={officeFilter} onChange={(e) => { setOfficeFilter(e.target.value); setPage(1) }}>
            <option value="All">All Offices ({offices.length})</option>
            {offices.map((o) => <option key={o.code} value={o.code}>{o.code}</option>)}
          </select>
          <select style={selectStyle} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="All">Status: All</option>
            {STATUSES.map((s) => <option key={s} value={s}>Status: {s}</option>)}
          </select>
          <button style={{ ...ghostBtn, padding: '10px' }} onClick={resetFilters} aria-label="Reset filters" title="Reset filters"><Icon name="refresh" size={17} /></button>
        </div>
        {special && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Applied filter:
            <span style={{ background: '#e6f5fc', border: '1px solid #a9dcf3', color: '#0b4f73', borderRadius: '6px', padding: '3px 8px' }}>
              {special === 'locked' ? 'Locked accounts' : 'Active users without 2FA'}{' '}
              <button onClick={() => { const n = new URLSearchParams(params); n.delete('filter'); setParams(n) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0b4f73' }}>&times;</button>
            </span>
          </div>
        )}
      </Card>

      {/* Bulk action bar (appears when rows are ticked) */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', background: '#0f2442', color: 'white', borderRadius: '10px', padding: '10px 16px', marginBottom: '14px', fontSize: '13.5px' }}>
          <strong>{selected.length} selected</strong>
          <span style={{ flex: 1 }} />
          <button style={ghostBtn} onClick={() => setPending({ kind: 'bulk', to: 'Active' })}>Activate</button>
          <button style={ghostBtn} onClick={() => setPending({ kind: 'bulk', to: 'Suspended' })}>Suspend</button>
          <button style={ghostBtn} onClick={() => setPending({ kind: 'bulk', to: 'reset' })}>Send reset link</button>
          <button style={ghostBtn} onClick={() => navigate(`/technical/role-assignment?users=${selected.join(',')}`)}>Assign role &rarr;</button>
          <button style={{ ...ghostBtn, background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.4)' }} onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      {/* Users table */}
      <Card flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 40 }}>
                  <input type="checkbox" aria-label="Select all on this page" checked={allOnPageSelected} onChange={() => setSelected(allOnPageSelected ? selected.filter((id) => !p.rows.some((u) => u.id === id)) : [...new Set([...selected, ...p.rows.map((u) => u.id)])])} />
                </th>
                <th style={thStyle}>USER / EMPLOYEE</th>
                <th style={thStyle}>OFFICE / ATTACHED AGENCY</th>
                <th style={thStyle}>ASSIGNED ROLE</th>
                <th style={thStyle}>ACCOUNT STATUS</th>
                <th style={thStyle}>LAST LOGIN</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map((u) => {
                const e = empOf(u)
                return (
                  <tr key={u.id} style={{ background: selected.includes(u.id) ? '#f4f9fd' : 'white' }}>
                    <td style={tdStyle}><input type="checkbox" aria-label={`Select ${u.username}`} checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} /></td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{employeeName(e)}</div>
                      <div style={{ color: MUTED, fontSize: '13px' }}>{u.email} • {u.username}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{e?.officeCode}</div>
                      <div style={{ color: MUTED, fontSize: '13px', maxWidth: '190px' }}>{e ? officeName(e.officeCode) : ''}</div>
                    </td>
                    <td style={tdStyle}><RoleBadge name={roleName(u.roleId)} /></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <Pill text={u.status} />

                        {u.status === 'Pending Approval' && <div style={{ fontSize: '11.5px', color: MUTED, marginTop: '3px' }}>Sent to Executive</div>}

                        {isLocked(u) && (
                          <button onClick={() => unlock(u)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#b91c1c', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                            <Icon name="lock" size={13} /> Locked · Unlock
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{relativeTime(u.lastLogin)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button style={rowGhostBtn} onClick={() => setEditing(u)}>Edit</button>
                    </td>
                  </tr>
                )
              })}
              {p.rows.length === 0 && <EmptyRow colSpan={7} text="No user accounts match your search or filters." />}
            </tbody>
          </table>
        </div>
        <TableFooter from={p.from} to={p.to} total={filtered.length} label="registered accounts" page={p.current} totalPages={p.totalPages} onPage={setPage} />
      </Card>

      {adding && <AddUserModal initialEmployeeId={Number(params.get('employee')) || undefined} onClose={() => { setAdding(false); if (params.get('new')) setParams({}) }} onCreated={(msg) => { setNotice(msg); setAdding(false); setParams({}) }} />}

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => { setNotice(msg); setEditing(null) }}
          onStatus={(to) => setPending({ kind: 'status', user: editing, to })}
          onReset={() => { resetPassword(editing); setEditing(null) }}
          onDelete={() => setPending({ kind: 'delete', user: editing })}
        />
      )}

      {/* Confirm dialog for status changes, bulk actions and delete */}
      {pending && (
        <Modal
          title={pending.kind === 'delete' ? 'Delete account?' : pending.kind === 'bulk' ? 'Apply to selected accounts?' : `Set account to ${pending.to}?`}
          onClose={() => { setPending(null); setReason('') }}
          width={500}
          footer={
            <>
              <button style={ghostBtn} onClick={() => { setPending(null); setReason('') }}>Cancel</button>
              <button style={{ ...smallPrimaryBtn, background: pending.kind === 'delete' || (pending.kind === 'status' && pending.to !== 'Active') ? '#b91c1c' : smallPrimaryBtn.background }} onClick={confirmPending}>Confirm</button>
            </>
          }
        >
          {pending.kind === 'delete' && <p style={{ margin: 0, fontSize: '14px' }}>The deactivated account <strong>{pending.user.username}</strong> will be removed permanently. The employee record is kept.</p>}
          {pending.kind === 'bulk' && (
            <p style={{ margin: 0, fontSize: '14px' }}>
              {pending.to === 'reset' ? 'Send password reset links to' : `Set status to ${pending.to} for`} <strong>{selected.filter((id) => id !== CURRENT_ACTOR.userId).length}</strong> account(s).
              {selected.includes(CURRENT_ACTOR.userId) && <span style={{ color: MUTED }}> Your own account is skipped.</span>}
            </p>
          )}
          {pending.kind === 'status' && (
            <>
              <p style={{ margin: '0 0 12px', fontSize: '14px' }}><strong>{pending.user.username}</strong>: {pending.user.status} → <strong>{pending.to}</strong></p>
              {pending.to !== 'Active' && (
                <Field label="Reason (required, saved in the audit log)">
                  <textarea style={{ ...inputStyle, minHeight: '70px' }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Separated from service on 30 Sep 2026" />
                </Field>
              )}
            </>
          )}
        </Modal>
      )}
    </TechLayout>
  )
}

/* ------------------------------------------------------------------ */
/* Add New User                                                        */
/* ------------------------------------------------------------------ */

function AddUserModal({ onClose, onCreated, initialEmployeeId }: { onClose: () => void; onCreated: (msg: string) => void; initialEmployeeId?: number }) {
  const db = useDb()
  const domain = db.config.security.allowedDomain
  // employees who do not have an account yet
  const candidates = db.employees.filter((e) => e.status !== 'Separated' && !db.users.some((u) => u.employeeId === e.id))
  const [employeeId, setEmployeeId] = useState(candidates.find((e) => e.id === initialEmployeeId)?.id ?? candidates[0]?.id ?? 0)
  const emp = db.employees.find((e) => e.id === employeeId)
  const suggested = emp ? `${emp.firstName[0]}${emp.lastName}`.toLowerCase().replace(/[^a-z]/g, '') : ''
  const [username, setUsername] = useState(suggested)
  const [email, setEmail] = useState(emp?.email ?? '')
  const [roleId, setRoleId] = useState(4)
  const [sendInvite, setSendInvite] = useState(true)
  const [error, setError] = useState('')

  function pickEmployee(id: number) {
    const e = db.employees.find((x) => x.id === id)
    setEmployeeId(id)
    setUsername(e ? `${e.firstName[0]}${e.lastName}`.toLowerCase().replace(/[^a-z]/g, '') : '')
    setEmail(e?.email ?? '')
    setError('')
  }

  function create() {
    const name = username.trim().toLowerCase()
    if (!emp) return setError('Choose an employee.')
    if (!/^[a-z0-9._]{3,}$/.test(name)) return setError('Username must be at least 3 characters: letters, numbers, dots or underscores.')
    if (db.users.some((u) => u.username === name)) return setError(`Username “${name}” is already taken.`)
    if (!email.trim().toLowerCase().endsWith(domain)) return setError(`Email must be a GovMail address ending in ${domain}.`)
    const role = db.roles.find((r) => r.id === roleId)!
    save((d) => {
      const id = nextNumber(d.users.map((u) => u.id))
      d.users.unshift({ id, employeeId: emp.id, username: name, email: email.trim().toLowerCase(), roleId, status: 'Pending Approval', approvalRequestedAt: new Date(nowMs()).toISOString(), lastLogin: null, createdAt: todayIso(), twoFactor: false, failedAttempts: 0 })
      d.assignments.unshift({ id: nextNumber(d.assignments.map((a) => a.id)), userId: id, fromRoleId: null, toRoleId: roleId, effectiveDate: todayIso(), reason: 'Initial account provisioning', assignedBy: CURRENT_ACTOR.name, at: new Date(nowMs()).toISOString() })
      d.history.unshift({ id: nextNumber(d.history.map((h) => h.id)), employeeId: emp.id, recordType: 'Account', description: `User account “${name}” created with role ${role.name} and sent to the Executive for approval`, effectiveDate: todayIso(), createdAt: todayIso(), by: CURRENT_ACTOR.name })
    }, { event: 'User Created', details: `${name} (${employeeName(emp)}) as ${role.name} · sent to Executive for approval` })
    onCreated(`Account “${name}” for ${employeeName(emp)} was sent to the Executive for approval (status: Pending Approval).${sendInvite ? ` The activation email goes to ${email} once approved.` : ''}`)
  }

  return (
    <Modal
      title="Add New User"
      onClose={onClose}
      footer={
        <>
          <button style={ghostBtn} onClick={onClose}>Cancel</button>
          <button style={smallPrimaryBtn} onClick={create} disabled={!emp}>Create &amp; Send for Approval</button>
        </>
      }
    >
      {error && <div style={errorBox}>{error}</div>}
      {candidates.length === 0 ? (
        <div style={infoBox}>Every active employee already has an account. Add the employee first in Employee Profile Management.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="Employee *" full hint="Only employees without an account are listed.">
            <select style={inputStyle} value={employeeId} onChange={(e) => pickEmployee(Number(e.target.value))}>
              {candidates.map((e) => <option key={e.id} value={e.id}>{employeeName(e)} · {e.employeeNo} · {e.officeCode}</option>)}
            </select>
          </Field>
          <Field label="Username *"><input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
          <Field label="GovMail address *"><input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Assigned role *" full>
            <select style={inputStyle} value={roleId} onChange={(e) => setRoleId(Number(e.target.value))}>
              {db.roles.filter((r) => r.status === 'Active').map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#374151' }}>
            <Toggle checked={sendInvite} onChange={setSendInvite} label="Send activation email" /> Send activation email once the Executive approves (the user sets a password and 2FA on first sign-in)
          </label>
          {emp && (
            <div style={{ gridColumn: '1 / -1', ...infoBox }}>
              {employeeName(emp)} · {emp.positionTitle} · {officeName(emp.officeCode)}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Edit User                                                           */
/* ------------------------------------------------------------------ */

function EditUserModal({ user, onClose, onSaved, onStatus, onReset, onDelete }: { user: User; onClose: () => void; onSaved: (msg: string) => void; onStatus: (to: UserStatus) => void; onReset: () => void; onDelete: () => void }) {
  const db = useDb()
  const emp = db.employees.find((e) => e.id === user.employeeId)
  const [email, setEmail] = useState(user.email)
  const [roleId, setRoleId] = useState(user.roleId)
  const [twoFactor, setTwoFactor] = useState(user.twoFactor)
  const [roleReason, setRoleReason] = useState('')
  const [error, setError] = useState('')
  const isSelf = user.id === CURRENT_ACTOR.userId
  const roleChanged = roleId !== user.roleId

  function saveChanges() {
    if (!email.trim().toLowerCase().endsWith(db.config.security.allowedDomain)) return setError(`Email must end in ${db.config.security.allowedDomain}.`)
    if (roleChanged && !roleReason.trim()) return setError('Give a reason for the role change (it is saved in the role assignment history).')
    if (isSelf && roleChanged) return setError('You cannot change your own role. Ask another Technical Administrator.')
    const fromRole = db.roles.find((r) => r.id === user.roleId)!.name
    const toRole = db.roles.find((r) => r.id === roleId)!.name
    save((d) => {
      const u = d.users.find((x) => x.id === user.id)!
      u.email = email.trim().toLowerCase()
      u.twoFactor = twoFactor
      if (roleChanged) {
        u.roleId = roleId
        d.assignments.unshift({ id: nextNumber(d.assignments.map((a) => a.id)), userId: u.id, fromRoleId: user.roleId, toRoleId: roleId, effectiveDate: todayIso(), reason: roleReason.trim(), assignedBy: CURRENT_ACTOR.name, at: new Date(nowMs()).toISOString() })
        if (u.employeeId) d.history.unshift({ id: nextNumber(d.history.map((h) => h.id)), employeeId: u.employeeId, recordType: 'Role Change', description: `System role: ${fromRole} → ${toRole}`, effectiveDate: todayIso(), createdAt: todayIso(), by: CURRENT_ACTOR.name })
      }
    }, roleChanged ? { event: 'Role Change', details: `${user.username}: ${fromRole} → ${toRole} · ${roleReason.trim()}` } : { event: 'User Updated', details: `${user.username}: account details updated` })
    onSaved(roleChanged ? `${user.username} is now ${toRole}.` : `Changes to ${user.username} saved.`)
  }

  return (
    <Modal
      title={`Edit Account · ${user.username}`}
      onClose={onClose}
      width={700}
      footer={
        <>
          {user.status === 'Deactivated' && <button style={dangerBtn} onClick={onDelete}><Icon name="trash" size={15} /> Delete</button>}
          <span style={{ flex: 1 }} />
          <button style={ghostBtn} onClick={onClose}>Cancel</button>
          <button style={smallPrimaryBtn} onClick={saveChanges}>Save Changes</button>
        </>
      }
    >
      {error && <div style={errorBox}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '18px', padding: '14px', background: '#f7f6f4', borderRadius: '10px' }}>
        <DetailRow label="Employee" value={<Link to={`/technical/employees/${emp?.id}`} style={{ color: ACCENT, fontWeight: 600 }}>{employeeName(emp)}</Link>} />
        <DetailRow label="Employee ID" value={emp?.employeeNo ?? '—'} />
        <DetailRow label="Office" value={emp?.officeCode ?? '—'} />
        <DetailRow label="Status" value={<Pill text={user.status} />} />
        <DetailRow label="Last login" value={relativeTime(user.lastLogin)} />
        <DetailRow label="Failed attempts" value={user.failedAttempts} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <Field label="Username"><input style={{ ...inputStyle, background: '#f3f4f6' }} value={user.username} disabled /></Field>
        <Field label="GovMail address"><input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Assigned role" hint={isSelf ? 'You cannot change your own role.' : undefined}>
          <select style={inputStyle} value={roleId} disabled={isSelf} onChange={(e) => setRoleId(Number(e.target.value))}>
            {db.roles.filter((r) => r.status === 'Active' || r.id === user.roleId).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <Field label="Two-factor authentication">
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', padding: '8px 0' }}>
            <Toggle checked={twoFactor} onChange={setTwoFactor} label="Two-factor authentication" /> {twoFactor ? 'Enabled' : 'Disabled'}
          </span>
        </Field>
        {roleChanged && (
          <Field label="Reason for role change *" full>
            <input style={inputStyle} value={roleReason} onChange={(e) => setRoleReason(e.target.value)} placeholder="e.g. Designated as office focal person" />
          </Field>
        )}
      </div>

      {/* Account actions */}
      <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>Account actions</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button style={ghostBtn} onClick={onReset}><Icon name="key" size={15} /> Send password reset link</button>
          {user.status !== 'Active' && <button style={ghostBtn} onClick={() => onStatus('Active')}><Icon name="unlock" size={15} /> Activate</button>}
          {user.status === 'Active' && !isSelf && <button style={dangerBtn} onClick={() => onStatus('Suspended')}><Icon name="lock" size={15} /> Suspend</button>}
          {user.status !== 'Deactivated' && !isSelf && <button style={dangerBtn} onClick={() => onStatus('Deactivated')}><Icon name="userx" size={15} /> Deactivate</button>}
        </div>
      </div>
    </Modal>
  )
}
