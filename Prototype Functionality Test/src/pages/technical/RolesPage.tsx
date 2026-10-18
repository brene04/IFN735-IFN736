// ROLES  (/technical/roles)
// tbl_roles: role list + permission matrix (which modules each role can use).
// Address option: ?role=2 opens that role.
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDb, save, employeeName, nextNumber, MODULES, ACCESS_LEVELS } from './techData'
import type { Access, ModuleName, Role } from './techData'
import { TechLayout, PageHeader, StatRow, StatCard, Card, Pill, Modal, Field, Notice, Icon, Avatar, ConfirmModal } from './techUi'
import { NAVY, ACCENT, MUTED, BORDER, inputStyle, primaryBtn, smallPrimaryBtn, ghostBtn, dangerBtn, linkBtn, thStyle, tdStyle, errorBox, relativeTime, todayIso } from './techTheme'

// Colour of each access level in the matrix
const accessTone: Record<Access, { bg: string; fg: string }> = {
  None: { bg: '#f3f4f6', fg: '#6b7280' },
  View: { bg: '#e6f5fc', fg: '#0b4f73' },
  Edit: { bg: '#eef1fb', fg: '#1e3a8a' },
  Full: { bg: '#0f2442', fg: '#ffffff' },
}

// These permissions keep the Technical Administrator able to fix the system, so they are locked
const LOCKED: Partial<Record<ModuleName, Access>> = { 'User & Role Management': 'Full', 'System Configuration': 'Full' }

export default function RolesPage() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const selectedId = Number(params.get('role') ?? db.roles[0]?.id)
  const role = db.roles.find((r) => r.id === selectedId) ?? db.roles[0]

  const [editingMatrix, setEditingMatrix] = useState(false)
  const [draft, setDraft] = useState<Record<ModuleName, Access> | null>(null)
  const [form, setForm] = useState<{ mode: 'add' | 'edit' | 'duplicate'; name: string; description: string; copyFrom: number } | null>(null)
  const [confirm, setConfirm] = useState<'delete' | 'status' | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const usersOf = (r: Role) => db.users.filter((u) => u.roleId === r.id)
  const activeRoles = db.roles.filter((r) => r.status === 'Active').length
  const customRoles = db.roles.filter((r) => !r.system).length

  function selectRole(id: number) {
    setParams({ role: String(id) })
    setEditingMatrix(false)
    setDraft(null)
  }

  function startMatrixEdit() {
    setDraft({ ...role.permissions })
    setEditingMatrix(true)
  }

  function saveMatrix() {
    if (!draft) return
    const changes = MODULES.filter((m) => draft[m] !== role.permissions[m]).map((m) => `${m}: ${role.permissions[m]} → ${draft[m]}`)
    if (changes.length === 0) {
      setEditingMatrix(false)
      return
    }
    save((d) => {
      d.roles.find((r) => r.id === role.id)!.permissions = { ...draft }
    }, { event: 'Permission Change', details: `${role.name}: ${changes.join('; ')}` })
    setEditingMatrix(false)
    setDraft(null)
    setNotice(`Permissions for ${role.name} updated (${changes.length} change${changes.length === 1 ? '' : 's'}).`)
  }

  function submitForm() {
    if (!form) return
    const name = form.name.trim()
    if (name.length < 3) return setError('Role name must have at least 3 characters.')
    if (db.roles.some((r) => r.name.toLowerCase() === name.toLowerCase() && !(form.mode === 'edit' && r.id === role.id))) return setError(`A role called “${name}” already exists.`)
    if (form.mode === 'edit') {
      save((d) => {
        const r = d.roles.find((x) => x.id === role.id)!
        r.name = name
        r.description = form.description.trim()
      }, { event: 'Permission Change', details: `Role details updated: ${role.name}${role.name !== name ? ` → ${name}` : ''}` })
      setNotice(`Role ${name} updated.`)
    } else {
      const source = db.roles.find((r) => r.id === form.copyFrom) ?? role
      const id = nextNumber(db.roles.map((r) => r.id))
      save((d) => {
        d.roles.push({
          id, key: name.toLowerCase().replace(/[^a-z]+/g, '_'), name, description: form.description.trim() || `Custom role based on ${source.name}.`,
          status: 'Active', system: false, createdAt: todayIso(), permissions: { ...source.permissions },
        })
      }, { event: 'Permission Change', details: `New role created: ${name} (permissions copied from ${source.name})` })
      setParams({ role: String(id) })
      setNotice(`Role ${name} created. Adjust its permissions below.`)
    }
    setForm(null)
    setError('')
  }

  function toggleStatus() {
    const to = role.status === 'Active' ? 'Inactive' : 'Active'
    save((d) => {
      d.roles.find((r) => r.id === role.id)!.status = to
    }, { event: 'Permission Change', details: `Role ${role.name} set to ${to}` })
    setConfirm(null)
    setNotice(`${role.name} is now ${to}.`)
  }

  function deleteRole() {
    save((d) => {
      d.roles = d.roles.filter((r) => r.id !== role.id)
    }, { event: 'Permission Change', details: `Role deleted: ${role.name}` })
    setConfirm(null)
    setParams({})
    setNotice(`Role ${role.name} deleted.`)
  }

  const matrix = editingMatrix && draft ? draft : role.permissions
  const members = usersOf(role)

  return (
    <TechLayout>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/technical/dashboard' }, { label: 'User & Access Management', to: '/technical/users' }, { label: 'Roles' }]}
        title="Roles & Permissions"
        description="Define system roles and what each role can see and change across CB-HRMS modules (role-based access control)."
        actions={<button style={primaryBtn} onClick={() => setForm({ mode: 'add', name: '', description: '', copyFrom: 4 })}><Icon name="plus" size={16} /> Add Role</button>}
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      <StatRow>
        <StatCard label="TOTAL ROLES" value={db.roles.length} unit="Defined" sub={`${db.roles.length - customRoles} system · ${customRoles} custom`} icon="shield" />
        <StatCard label="ACTIVE ROLES" value={activeRoles} unit="Active" tone="success" sub="Can be assigned to users" icon="check" />
        <StatCard label="MODULES CONTROLLED" value={MODULES.length} unit="Modules" tone="accent" sub="Each with None / View / Edit / Full" icon="dashboard" />
        <StatCard label="ROLE CHANGES (30 DAYS)" value={db.assignments.filter((a) => a.at > new Date(Date.parse(todayIso()) - 30 * 86400000).toISOString()).length} unit="Changes" sub="See Role Assignment history" icon="key" to="/technical/role-assignment" />
      </StatRow>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)', gap: '18px', alignItems: 'start' }}>
        {/* Role list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {db.roles.map((r) => {
            const on = r.id === role.id
            return (
              <button
                key={r.id}
                onClick={() => selectRole(r.id)}
                style={{ textAlign: 'left', background: on ? '#eef8fd' : 'white', border: `1px solid ${on ? ACCENT : BORDER}`, borderLeft: `5px solid ${on ? ACCENT : BORDER}`, borderRadius: '10px', padding: '14px 16px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '15px', color: NAVY }}>{r.name}</strong>
                  <Pill text={r.status} />
                </div>
                <div style={{ fontSize: '12.5px', color: MUTED, marginBottom: '8px', lineHeight: 1.4 }}>{r.description}</div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#374151' }}>
                  <span><strong>{usersOf(r).length}</strong> users</span>·
                  <span>{MODULES.filter((m) => r.permissions[m] !== 'None').length} modules</span>·
                  <span>{r.system ? 'System role' : 'Custom role'}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected role */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Card
            title={<span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{role.name} <Pill text={role.status} /> {role.system && <Pill text="System role" tone="navy" dot={false} />}</span>}
            subtitle={role.description}
            right={
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button style={ghostBtn} onClick={() => setForm({ mode: 'edit', name: role.name, description: role.description, copyFrom: role.id })}><Icon name="edit" size={15} /> Edit details</button>
                <button style={ghostBtn} onClick={() => setForm({ mode: 'duplicate', name: `${role.name} (copy)`, description: role.description, copyFrom: role.id })}>Duplicate</button>
                {role.key !== 'technical_admin' && <button style={ghostBtn} onClick={() => setConfirm('status')}>{role.status === 'Active' ? 'Deactivate' : 'Activate'}</button>}
                {!role.system && <button style={dangerBtn} onClick={() => setConfirm('delete')}><Icon name="trash" size={15} /> Delete</button>}
              </div>
            }
          >
            {/* Permission matrix */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 10px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '12px', letterSpacing: '1px', fontWeight: 700, color: '#374151' }}>MODULE PERMISSIONS</div>
              {editingMatrix ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={ghostBtn} onClick={() => { setEditingMatrix(false); setDraft(null) }}>Cancel</button>
                  <button style={smallPrimaryBtn} onClick={saveMatrix}>Save Permissions</button>
                </div>
              ) : (
                <button style={smallPrimaryBtn} onClick={startMatrixEdit}><Icon name="edit" size={14} /> Edit Permissions</button>
              )}
            </div>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>MODULE</th>
                    {ACCESS_LEVELS.map((a) => <th key={a} style={{ ...thStyle, textAlign: 'center' }}>{a.toUpperCase()}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((m) => {
                    const lockedLevel = role.key === 'technical_admin' ? LOCKED[m] : undefined
                    return (
                      <tr key={m}>
                        <td style={{ ...tdStyle, padding: '10px 16px', fontWeight: 600, color: '#111827' }}>
                          {m}
                          {lockedLevel && <span title="Locked so the Technical Administrator can always manage the system" style={{ marginLeft: '6px', color: MUTED }}><Icon name="lock" size={12} /></span>}
                        </td>
                        {ACCESS_LEVELS.map((a) => {
                          const on = matrix[m] === a
                          const t = accessTone[a]
                          return (
                            <td key={a} style={{ ...tdStyle, padding: '8px', textAlign: 'center' }}>
                              {editingMatrix ? (
                                <button
                                  onClick={() => !lockedLevel && setDraft({ ...draft!, [m]: a })}
                                  disabled={!!lockedLevel && a !== lockedLevel}
                                  aria-pressed={on}
                                  aria-label={`${m}: ${a}`}
                                  style={{ minWidth: 64, padding: '6px 10px', borderRadius: '6px', border: `1px solid ${on ? t.fg : BORDER}`, background: on ? t.bg : 'white', color: on ? t.fg : '#9ca3af', fontWeight: 700, fontSize: '12px', cursor: lockedLevel ? 'not-allowed' : 'pointer' }}
                                >
                                  {on ? '● ' : ''}{a}
                                </button>
                              ) : on ? (
                                <span style={{ display: 'inline-block', minWidth: 54, padding: '4px 10px', borderRadius: '6px', background: t.bg, color: t.fg, fontWeight: 700, fontSize: '12px' }}>{a}</span>
                              ) : (
                                <span style={{ color: '#d1d5db' }}>—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: '12px', color: MUTED, marginTop: '8px' }}>None = hidden · View = read only · Edit = create and update · Full = edit, delete and approve</div>
          </Card>

          <Card title={`Users with this role (${members.length})`} right={<Link to="/technical/role-assignment" style={linkBtn}>Assign roles &rarr;</Link>}>
            {members.length === 0 && <div style={{ color: MUTED, fontSize: '13.5px' }}>No users have this role yet.</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
              {members.map((u) => {
                const e = db.employees.find((x) => x.id === u.employeeId)
                return (
                  <Link key={u.id} to={`/technical/users?q=${u.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '10px 12px', textDecoration: 'none' }}>
                    <Avatar name={employeeName(e)} size={34} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>{employeeName(e)}</div>
                      <div style={{ fontSize: '12px', color: MUTED }}>{u.username} · {e?.officeCode} · {relativeTime(u.lastLogin)}</div>
                    </div>
                    <Pill text={u.status} dot={false} />
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Add / edit / duplicate role */}
      {form && (
        <Modal
          title={form.mode === 'edit' ? `Edit ${role.name}` : form.mode === 'duplicate' ? `Duplicate ${role.name}` : 'Add Role'}
          onClose={() => { setForm(null); setError('') }}
          footer={
            <>
              <button style={ghostBtn} onClick={() => { setForm(null); setError('') }}>Cancel</button>
              <button style={smallPrimaryBtn} onClick={submitForm}>{form.mode === 'edit' ? 'Save Changes' : 'Create Role'}</button>
            </>
          }
        >
          {error && <div style={errorBox}>{error}</div>}
          <div style={{ display: 'grid', gap: '14px' }}>
            <Field label="Role name *"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Regional HR Focal" /></Field>
            <Field label="Description"><textarea style={{ ...inputStyle, minHeight: '70px' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            {form.mode === 'add' && (
              <Field label="Start with the permissions of" hint="You can change every permission after the role is created.">
                <select style={inputStyle} value={form.copyFrom} onChange={(e) => setForm({ ...form, copyFrom: Number(e.target.value) })}>
                  {db.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </Field>
            )}
          </div>
        </Modal>
      )}

      {confirm === 'delete' && (
        members.length > 0 ? (
          <ConfirmModal title="Role still in use" message={<>Move the <strong>{members.length}</strong> user(s) with {role.name} to another role in Role Assignment before deleting it.</>} confirmLabel="OK" onConfirm={() => setConfirm(null)} onClose={() => setConfirm(null)} />
        ) : (
          <ConfirmModal title={`Delete ${role.name}?`} message="This custom role will be removed permanently." confirmLabel="Delete Role" danger onConfirm={deleteRole} onClose={() => setConfirm(null)} />
        )
      )}
      {confirm === 'status' && (
        <ConfirmModal
          title={`${role.status === 'Active' ? 'Deactivate' : 'Activate'} ${role.name}?`}
          message={role.status === 'Active' ? <>The role can no longer be assigned. The <strong>{members.length}</strong> current user(s) keep it until reassigned.</> : 'The role can be assigned to users again.'}
          confirmLabel={role.status === 'Active' ? 'Deactivate' : 'Activate'}
          danger={role.status === 'Active'}
          onConfirm={toggleStatus}
          onClose={() => setConfirm(null)}
        />
      )}
    </TechLayout>
  )
}
