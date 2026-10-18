// EMPLOYEE DETAILS  (/technical/employees/:id)
// One employee's full profile: personal + employment details, competency profile,
// linked user account, change history (tbl_historical_records) and update requests.
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDb, save, employeeName, officeName, nextNumber, offices, positions, CURRENT_ACTOR, UPDATE_FIELDS } from './techData'
import type { Employee, EmployeeStatus, RecordType } from './techData'
import { TechLayout, PageHeader, Card, Pill, RoleBadge, Avatar, Modal, Field, DetailRow, Notice, Icon, Tabs, EmptyRow } from './techUi'
import { NAVY, ACCENT, MUTED, BORDER, inputStyle, primaryBtn, smallPrimaryBtn, ghostBtn, dangerBtn, linkBtn, thStyle, tdStyle, errorBox, infoBox, formatDate, relativeTime, todayIso } from './techTheme'

type Tab = 'overview' | 'competencies' | 'account' | 'history' | 'updates'
const levelNames = ['', 'Basic', 'Intermediate', 'Advanced', 'Superior']

// The key makes the page start fresh when you open a different employee
export default function EmployeeDetailsPage() {
  const { id } = useParams()
  return <EmployeeDetails key={id} />
}

function EmployeeDetails() {
  const db = useDb()
  const navigate = useNavigate()
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) ?? 'overview'
  const [editing, setEditing] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  const [levels, setLevels] = useState<Record<string, number>>({})
  const [notice, setNotice] = useState('')

  const emp = db.employees.find((e) => e.id === Number(id))
  const crumbs = [{ label: 'Dashboard', to: '/technical/dashboard' }, { label: 'Employee Profile Management', to: '/technical/employees' }, { label: 'Employees', to: '/technical/employees' }]

  if (!emp) {
    return (
      <TechLayout>
        <PageHeader crumbs={[...crumbs, { label: 'Not found' }]} title="Employee not found" />
        <Card><p style={{ margin: '0 0 14px' }}>There is no employee with ID {id}.</p><Link to="/technical/employees" style={{ ...primaryBtn, textDecoration: 'none' }}>Back to Employees</Link></Card>
      </TechLayout>
    )
  }

  const user = db.users.find((u) => u.employeeId === emp.id)
  const role = user ? db.roles.find((r) => r.id === user.roleId) : undefined
  const history = db.history.filter((h) => h.employeeId === emp.id).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate) || b.id - a.id)
  const requests = db.updates.filter((u) => u.employeeId === emp.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  const userLogs = user ? db.logs.filter((l) => l.userId === user.id).slice(0, 6) : []
  const years = Math.max(0, Math.floor((Date.parse(todayIso()) - Date.parse(emp.dateHired)) / (365.25 * 86400000)))
  const levelChanges = emp.competencies.filter((c) => levels[c.code] !== undefined && levels[c.code] !== c.level)

  function saveLevels() {
    const summary = levelChanges.map((c) => `${c.title} ${c.level} → ${levels[c.code]}`).join('; ')
    save((d) => {
      const e = d.employees.find((x) => x.id === emp!.id)!
      e.competencies.forEach((c) => {
        if (levels[c.code] !== undefined) {
          c.level = levels[c.code]
          c.lastUpdated = todayIso()
        }
      })
      d.history.unshift({ id: nextNumber(d.history.map((h) => h.id)), employeeId: e.id, recordType: 'Profile Update', description: `Competency levels updated: ${summary}`, effectiveDate: todayIso(), createdAt: todayIso(), by: CURRENT_ACTOR.name })
    }, { event: 'Profile Update', details: `${emp!.employeeNo} competency levels: ${summary}` })
    setLevels({})
    setNotice('Competency levels saved.')
  }

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'competencies', label: 'Competency Profile', count: emp.competencies.length },
    { value: 'account', label: 'Account & Access' },
    { value: 'history', label: 'Change History', count: history.length },
    { value: 'updates', label: 'Profile Updates', count: requests.length },
  ]

  return (
    <TechLayout>
      <PageHeader
        crumbs={[...crumbs, { label: employeeName(emp) }]}
        title={employeeName(emp, true)}
        description={`${emp.positionTitle} · ${officeName(emp.officeCode)}`}
        actions={
          <>
            <button style={ghostBtn} onClick={() => navigate('/technical/employees')}>&larr; Back to Employees</button>
            <button style={ghostBtn} onClick={() => setStatusModal(true)}>Change Status</button>
            <button style={primaryBtn} onClick={() => setEditing(true)}><Icon name="edit" size={16} /> Edit Profile</button>
          </>
        }
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      {/* Profile header */}
      <Card style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <Avatar name={employeeName(emp)} size={76} />
          <div style={{ minWidth: '200px' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: NAVY }}>{employeeName(emp)}</div>
            <div style={{ color: ACCENT, fontWeight: 700, margin: '2px 0 8px' }}>{emp.employeeNo}</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <Pill text={emp.status} />
              <Pill text={emp.employmentType === 'Permanent' ? 'Permanent' : 'COS'} tone="navy" dot={false} />
              {role && <RoleBadge name={role.name} />}
            </div>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', borderLeft: `1px solid ${BORDER}`, paddingLeft: '20px' }}>
            <DetailRow label="Office" value={<>{emp.officeCode}<div style={{ color: MUTED, fontSize: '12.5px' }}>{officeName(emp.officeCode)}</div></>} />
            <DetailRow label="Position" value={<>{emp.positionTitle}<div style={{ color: MUTED, fontSize: '12.5px' }}>SG {emp.salaryGrade}</div></>} />
            <DetailRow label="Date hired" value={<>{formatDate(emp.dateHired)}<div style={{ color: MUTED, fontSize: '12.5px' }}>{years} year{years === 1 ? '' : 's'} of service</div></>} />
            <DetailRow label="Competency profile" value={<Pill text={emp.competencyProfile} dot={false} />} />
            <DetailRow label="Assessment" value={<Pill text={emp.assessmentStatus} />} />
          </div>
        </div>
      </Card>

      <div style={{ marginBottom: '16px', background: 'white', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '6px', width: 'fit-content' }}>
        <Tabs tabs={tabs} active={tab} onChange={(t) => setParams({ tab: t })} />
      </div>

      {/* ---- Overview ---- */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px' }}>
          <Card title="Personal Information">
            <div style={{ display: 'grid', gap: '14px' }}>
              <DetailRow label="Full name" value={employeeName(emp, true)} />
              <DetailRow label="Sex" value={emp.sex} />
              <DetailRow label="Birth date" value={formatDate(emp.birthDate)} />
              <DetailRow label="Home address" value={emp.address || '—'} />
            </div>
          </Card>
          <Card title="Contact Details">
            <div style={{ display: 'grid', gap: '14px' }}>
              <DetailRow label="Agency email" value={<a href={`mailto:${emp.email}`} style={{ color: ACCENT }}>{emp.email}</a>} />
              <DetailRow label="Phone" value={emp.phone || '—'} />
              <DetailRow label="System username" value={user ? user.username : 'No user account'} />
            </div>
          </Card>
          <Card title="Employment Details">
            <div style={{ display: 'grid', gap: '14px' }}>
              <DetailRow label="Office / agency" value={`${emp.officeCode} - ${officeName(emp.officeCode)}`} />
              <DetailRow label="Position & salary grade" value={`${emp.positionTitle} (SG ${emp.salaryGrade})`} />
              <DetailRow label="Employment type" value={emp.employmentType} />
              <DetailRow label="Status" value={<Pill text={emp.status} />} />
            </div>
          </Card>
        </div>
      )}

      {/* ---- Competency profile (tbl_employee_competencies) ---- */}
      {tab === 'competencies' && (
        <Card
          flush
          title="Competency Profile"
          subtitle="Current proficiency levels (1 Basic · 2 Intermediate · 3 Advanced · 4 Superior). Change a level and save."
          right={levelChanges.length > 0 ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={ghostBtn} onClick={() => setLevels({})}>Discard</button>
              <button style={smallPrimaryBtn} onClick={saveLevels}>Save {levelChanges.length} change{levelChanges.length === 1 ? '' : 's'}</button>
            </div>
          ) : undefined}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>CODE</th>
                  <th style={thStyle}>COMPETENCY</th>
                  <th style={thStyle}>CATEGORY</th>
                  <th style={thStyle}>CURRENT LEVEL</th>
                  <th style={thStyle}>EVIDENCE</th>
                  <th style={thStyle}>LAST UPDATED</th>
                </tr>
              </thead>
              <tbody>
                {emp.competencies.map((c) => {
                  const value = levels[c.code] ?? c.level
                  return (
                    <tr key={c.code} style={{ background: value !== c.level ? '#fff9e8' : 'white' }}>
                      <td style={{ ...tdStyle, color: ACCENT, fontWeight: 700 }}>{c.code}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{c.title}</td>
                      <td style={tdStyle}>{c.category}</td>
                      <td style={tdStyle}>
                        <select aria-label={`${c.title} level`} style={{ ...inputStyle, width: '190px', padding: '7px 10px' }} value={value} onChange={(e) => setLevels({ ...levels, [c.code]: Number(e.target.value) })}>
                          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} - {levelNames[n]}</option>)}
                        </select>
                      </td>
                      <td style={{ ...tdStyle, color: '#374151' }}>{c.evidence}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDate(c.lastUpdated)}</td>
                    </tr>
                  )
                })}
                {emp.competencies.length === 0 && <EmptyRow colSpan={6} text="No competencies profiled yet. The HRMD Administrative Administrator profiles competencies after the first assessment." />}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ---- Account & access ---- */}
      {tab === 'account' && (
        user ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: '18px' }}>
            <Card title="User Account" right={<Link to={`/technical/users?q=${user.username}`} style={linkBtn}>Manage on Users page &rarr;</Link>}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <DetailRow label="Username" value={<strong>{user.username}</strong>} />
                <DetailRow label="GovMail" value={user.email} />
                <DetailRow label="Role" value={role ? <Link to={`/technical/roles?role=${role.id}`} style={{ textDecoration: 'none' }}><RoleBadge name={role.name} /></Link> : '—'} />
                <DetailRow label="Account status" value={<Pill text={user.status} />} />
                <DetailRow label="Last login" value={relativeTime(user.lastLogin)} />
                <DetailRow label="Two-factor" value={user.twoFactor ? 'Enabled' : 'Not enabled'} />
                <DetailRow label="Failed attempts" value={user.failedAttempts} />
                <DetailRow label="Created" value={formatDate(user.createdAt)} />
              </div>
            </Card>
            <Card title="Recent Access Activity" right={<Link to={`/technical/access-logs?q=${user.username}`} style={linkBtn}>All logs &rarr;</Link>}>
              {userLogs.map((l) => (
                <div key={l.id} style={{ display: 'flex', gap: '10px', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid #f0f1f3' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', marginTop: '5px', background: l.status === 'Failed' ? '#d03b3b' : l.status === 'Warning' ? '#fab219' : '#0ca30c' }} />
                  <span style={{ flex: 1 }}><strong>{l.event}</strong> · {l.details}</span>
                  <span style={{ color: MUTED, whiteSpace: 'nowrap' }}>{relativeTime(l.timestamp)}</span>
                </div>
              ))}
              {userLogs.length === 0 && <div style={{ color: MUTED, fontSize: '13px' }}>No activity recorded yet.</div>}
            </Card>
          </div>
        ) : (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ width: 48, height: 48, borderRadius: '10px', background: '#f1f2f4', color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="users" /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>No user account yet</div>
                <div style={{ fontSize: '13.5px', color: MUTED }}>{emp.status === 'Separated' ? 'Separated employees cannot be given an account.' : 'Create an account so this employee can sign in to CB-HRMS.'}</div>
              </div>
              {emp.status !== 'Separated' && <button style={primaryBtn} onClick={() => navigate(`/technical/users?new=1&employee=${emp.id}`)}><Icon name="plus" size={16} /> Create User Account</button>}
            </div>
          </Card>
        )
      )}

      {/* ---- Change history (tbl_historical_records) ---- */}
      {tab === 'history' && (
        <Card title="Change History" subtitle="Historical records kept for audit and reporting">
          <div style={{ position: 'relative', paddingLeft: '30px' }}>
            <div style={{ position: 'absolute', left: '7px', top: 6, bottom: 6, width: 2, background: BORDER }} />
            {history.map((h) => (
              <div key={h.id} style={{ position: 'relative', paddingBottom: '18px' }}>
                <span style={{ position: 'absolute', left: '-29px', top: '4px', width: 12, height: 12, borderRadius: '50%', background: 'white', border: `3px solid ${h.recordType === 'Role Change' ? '#2a78d6' : h.recordType === 'Status Change' ? '#ec835a' : ACCENT}` }} />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '14px', color: '#111827' }}>{h.recordType}</strong>
                  <span style={{ fontSize: '12.5px', color: MUTED }}>Effective {formatDate(h.effectiveDate)} · by {h.by}</span>
                </div>
                <div style={{ fontSize: '13.5px', color: '#374151', marginTop: '2px' }}>{h.description}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ---- Profile update requests ---- */}
      {tab === 'updates' && (
        <Card flush title="Profile Update Requests" right={<Link to="/technical/profile-updates" style={linkBtn}>Open review queue &rarr;</Link>}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>REQUEST</th>
                <th style={thStyle}>FIELD</th>
                <th style={thStyle}>CHANGE</th>
                <th style={thStyle}>SUBMITTED</th>
                <th style={thStyle}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td style={tdStyle}><Link to={`/technical/profile-updates?open=${r.id}`} style={{ color: ACCENT, fontWeight: 700 }}>{r.id}</Link></td>
                  <td style={tdStyle}>{UPDATE_FIELDS[r.field]}</td>
                  <td style={tdStyle}><span style={{ color: MUTED, textDecoration: 'line-through' }}>{r.oldValue}</span> &rarr; <strong>{r.newValue}</strong></td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{relativeTime(r.submittedAt)}</td>
                  <td style={tdStyle}><Pill text={r.status} /></td>
                </tr>
              ))}
              {requests.length === 0 && <EmptyRow colSpan={5} text="No update requests for this employee." />}
            </tbody>
          </table>
        </Card>
      )}

      {editing && <EditProfileModal emp={emp} onClose={() => setEditing(false)} onSaved={(msg) => { setEditing(false); setNotice(msg) }} />}
      {statusModal && <StatusModal emp={emp} hasActiveAccount={!!user && user.status !== 'Deactivated'} onClose={() => setStatusModal(false)} onSaved={(msg) => { setStatusModal(false); setNotice(msg) }} />}
    </TechLayout>
  )
}

/* ------------------------------------------------------------------ */
/* Edit profile (admin edit, recorded in history)                      */
/* ------------------------------------------------------------------ */

function EditProfileModal({ emp, onClose, onSaved }: { emp: Employee; onClose: () => void; onSaved: (msg: string) => void }) {
  const db = useDb()
  const [form, setForm] = useState({ ...emp })
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const editable: (keyof Employee)[] = ['firstName', 'middleName', 'lastName', 'email', 'phone', 'sex', 'birthDate', 'address', 'officeCode', 'positionTitle', 'employmentType', 'dateHired']
  const changed = editable.filter((k) => String(form[k]) !== String(emp[k]))

  function submit() {
    if (!form.firstName.trim() || !form.lastName.trim()) return setError('First and last name are required.')
    if (!form.email.trim().toLowerCase().endsWith(db.config.security.allowedDomain)) return setError(`Email must end in ${db.config.security.allowedDomain}.`)
    if (db.employees.some((e) => e.id !== emp.id && e.email === form.email.trim().toLowerCase())) return setError('Another employee already uses this email.')
    if (changed.length === 0) return setError('Nothing has changed.')
    if (!reason.trim()) return setError('Enter a reason for the change. It is saved in the change history.')
    const sg = positions.find((p) => p.title === form.positionTitle)?.salaryGrade ?? form.salaryGrade
    save((d) => {
      const e = d.employees.find((x) => x.id === emp.id)!
      Object.assign(e, { ...form, email: form.email.trim().toLowerCase(), salaryGrade: sg })
      const add = (recordType: RecordType, description: string) =>
        d.history.unshift({ id: nextNumber(d.history.map((h) => h.id)), employeeId: emp.id, recordType, description, effectiveDate: todayIso(), createdAt: todayIso(), by: CURRENT_ACTOR.name })
      if (changed.includes('positionTitle')) add('Position Change', `${emp.positionTitle} → ${form.positionTitle} (${reason.trim()})`)
      if (changed.includes('officeCode')) add('Office Transfer', `${emp.officeCode} → ${form.officeCode} (${reason.trim()})`)
      const others = changed.filter((k) => k !== 'positionTitle' && k !== 'officeCode')
      if (others.length) add('Profile Update', `Updated ${others.join(', ')} (${reason.trim()})`)
    }, { event: 'Profile Update', details: `${emp.employeeNo}: ${changed.join(', ')} updated by admin · ${reason.trim()}` })
    onSaved(`Profile updated (${changed.length} field${changed.length === 1 ? '' : 's'}).`)
  }

  const text = (key: 'firstName' | 'middleName' | 'lastName' | 'email' | 'phone' | 'address', label: string, full = false) => (
    <Field label={label} full={full}><input style={{ ...inputStyle, background: changed.includes(key) ? '#fff9e8' : 'white' }} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></Field>
  )

  return (
    <Modal
      title={`Edit Profile · ${employeeName(emp)}`}
      onClose={onClose}
      width={760}
      footer={
        <>
          <span style={{ marginRight: 'auto', fontSize: '12.5px', color: MUTED }}>{changed.length} field{changed.length === 1 ? '' : 's'} changed</span>
          <button style={ghostBtn} onClick={onClose}>Cancel</button>
          <button style={smallPrimaryBtn} onClick={submit}>Save Changes</button>
        </>
      }
    >
      {error && <div style={errorBox}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
        {text('firstName', 'First name *')}
        {text('middleName', 'Middle name')}
        {text('lastName', 'Last name *')}
        {text('email', 'Agency email *')}
        {text('phone', 'Phone')}
        <Field label="Sex"><select style={inputStyle} value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value as Employee['sex'] })}><option>Female</option><option>Male</option></select></Field>
        <Field label="Birth date"><input type="date" style={inputStyle} value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></Field>
        <Field label="Date hired"><input type="date" style={inputStyle} value={form.dateHired} onChange={(e) => setForm({ ...form, dateHired: e.target.value })} /></Field>
        <Field label="Employment type"><select style={inputStyle} value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value as Employee['employmentType'] })}><option>Permanent</option><option>Contract of Service</option></select></Field>
        <Field label="Office / agency"><select style={{ ...inputStyle, background: changed.includes('officeCode') ? '#fff9e8' : 'white' }} value={form.officeCode} onChange={(e) => setForm({ ...form, officeCode: e.target.value })}>{offices.map((o) => <option key={o.code} value={o.code}>{o.code}</option>)}</select></Field>
        <Field label="Position"><select style={{ ...inputStyle, background: changed.includes('positionTitle') ? '#fff9e8' : 'white' }} value={form.positionTitle} onChange={(e) => setForm({ ...form, positionTitle: e.target.value })}>{positions.map((p) => <option key={p.title} value={p.title}>{p.title} (SG {p.salaryGrade})</option>)}</select></Field>
        <div />
        {text('address', 'Home address', true)}
        <Field label="Reason for change *" full><input style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Correction based on 201 file / Office Order No. 2026-201" /></Field>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Employment status change                                            */
/* ------------------------------------------------------------------ */

function StatusModal({ emp, hasActiveAccount, onClose, onSaved }: { emp: Employee; hasActiveAccount: boolean; onClose: () => void; onSaved: (msg: string) => void }) {
  const [status, setStatus] = useState<EmployeeStatus>(emp.status)
  const [date, setDate] = useState(todayIso())
  const [reason, setReason] = useState('')
  const [deactivate, setDeactivate] = useState(true)
  const [error, setError] = useState('')

  function submit() {
    if (status === emp.status) return setError('Choose a different status.')
    if (!reason.trim()) return setError('Enter a reason.')
    const alsoDeactivate = status === 'Separated' && hasActiveAccount && deactivate
    save((d) => {
      d.employees.find((x) => x.id === emp.id)!.status = status
      d.history.unshift({ id: nextNumber(d.history.map((h) => h.id)), employeeId: emp.id, recordType: 'Status Change', description: `${emp.status} → ${status} (${reason.trim()})`, effectiveDate: date, createdAt: todayIso(), by: CURRENT_ACTOR.name })
      if (alsoDeactivate) {
        const u = d.users.find((x) => x.employeeId === emp.id)
        if (u) u.status = 'Deactivated'
      }
    }, { event: alsoDeactivate ? 'Account Suspended' : 'Profile Update', details: `${emp.employeeNo}: employment ${emp.status} → ${status}${alsoDeactivate ? ' · user account deactivated' : ''} · ${reason.trim()}` })
    onSaved(`${employeeName(emp)} is now ${status}${alsoDeactivate ? ' and the user account was deactivated' : ''}.`)
  }

  return (
    <Modal
      title="Change Employment Status"
      onClose={onClose}
      width={520}
      footer={<><button style={ghostBtn} onClick={onClose}>Cancel</button><button style={status === 'Separated' ? { ...dangerBtn, background: '#b91c1c', color: 'white' } : smallPrimaryBtn} onClick={submit}>Save Status</button></>}
    >
      {error && <div style={errorBox}>{error}</div>}
      <div style={{ display: 'grid', gap: '14px' }}>
        <Field label="New status">
          <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as EmployeeStatus)}>
            <option>Active</option><option>On Leave</option><option>Separated</option>
          </select>
        </Field>
        <Field label="Effective date"><input type="date" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Reason *"><textarea style={{ ...inputStyle, minHeight: '64px' }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Resignation accepted per memo dated 30 Sep 2026" /></Field>
        {status === 'Separated' && hasActiveAccount && (
          <label style={{ ...infoBox, display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="checkbox" checked={deactivate} onChange={(e) => setDeactivate(e.target.checked)} /> Also deactivate this employee’s user account (recommended)
          </label>
        )}
      </div>
    </Modal>
  )
}
