// Concerned Office › Requests › Request Employee Update
// Pick a staff member, type the new values for the fields that should change,
// and send the request to the Technical Admin. One request can change several fields.
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDb, employeeName, offices, positions, UPDATE_FIELDS } from '../technical/techData'
import type { Employee, UpdateField } from '../technical/techData'
import { PageHeader, Card, Field, Modal, Avatar, Pill, EmptyRow } from '../technical/techUi'
import { inputStyle, primaryBtn, ghostBtn, smallPrimaryBtn, errorBox, infoBox, thStyle, tdStyle, MUTED, NAVY } from '../technical/techTheme'
import { useOfficeStore, officeEmployees, submitStaffRequest, readField } from './officeData'
import type { FieldChange } from './officeData'
import { OfficeLayout, RequestGuide } from './officeUi'

const FIELDS = Object.keys(UPDATE_FIELDS) as UpdateField[]

export default function RequestUpdatePage() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const staff = officeEmployees(db.employees)
  const employee = staff.find((e) => String(e.id) === params.get('employee'))

  return (
    <OfficeLayout>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'Requests', to: '/office/requests' }, { label: 'Request Employee Update' }]}
        title="Request Employee Update"
        description="Ask the Technical Admin to correct or update a staff member's profile (name, contact details, position or office)."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="1. Select employee">
            <select
              aria-label="Employee"
              style={{ ...inputStyle, maxWidth: '520px' }}
              value={employee?.id ?? ''}
              onChange={(e) => setParams(e.target.value ? { employee: e.target.value } : {})}
            >
              <option value="">Choose a staff member…</option>
              {staff.map((e) => <option key={e.id} value={e.id}>{employeeName(e, true)} - {e.positionTitle} ({e.employeeNo})</option>)}
            </select>
          </Card>
          {/* key: the form resets when another employee is chosen */}
          {employee ? <UpdateForm key={employee.id} employee={employee} /> : <Card><p style={{ margin: 0, color: MUTED }}>Choose an employee to see their current details.</p></Card>}
        </div>
        <RequestGuide
          type="Update"
          tips={[
            'Only fill in the fields that should change; leave the others blank.',
            'Name changes need a PSA certificate (birth or marriage).',
            'Position changes need the appointment or promotion notice.',
          ]}
        />
      </div>
    </OfficeLayout>
  )
}

function UpdateForm({ employee: e }: { employee: Employee }) {
  const navigate = useNavigate()
  const office = useOfficeStore()
  const [values, setValues] = useState<Partial<Record<UpdateField, string>>>({})
  const [justification, setJustification] = useState('')
  const [attachment, setAttachment] = useState('')
  const [priority, setPriority] = useState<'Normal' | 'Urgent'>('Normal')
  const [errors, setErrors] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)

  const open = office.requests.filter((r) => r.employeeId === e.id && (r.status === 'Pending' || r.status === 'Under Review'))

  // Only fields with a new, different value become changes
  const changes: FieldChange[] = FIELDS.map((f) => ({ field: f, oldValue: readField(e, f), newValue: (values[f] ?? '').trim() })).filter((c) => c.newValue && c.newValue !== c.oldValue)

  function validate() {
    const list: string[] = []
    if (changes.length === 0) list.push('Enter at least one new value that is different from the current one.')
    const email = changes.find((c) => c.field === 'email')?.newValue
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) list.push('New email address is not valid.')
    else if (email && !email.toLowerCase().endsWith('dost.gov.ph')) list.push('Email must be an official DOST GovMail address.')
    if (justification.trim().length < 10) list.push('Give a reason for the change (at least 10 characters).')
    setErrors(list)
    return list.length === 0
  }

  function submit() {
    const id = submitStaffRequest({ type: 'Update', employeeId: e.id, changes, justification: justification.trim(), attachment: attachment || undefined, priority })
    navigate(`/office/requests?open=${id}&submitted=1`)
  }

  // Inputs: drop-downs for office and position, text boxes for the rest
  function input(f: UpdateField) {
    const value = values[f] ?? ''
    const onChange = (v: string) => setValues({ ...values, [f]: v })
    if (f === 'officeCode')
      return (
        <select style={inputStyle} value={value} onChange={(ev) => onChange(ev.target.value)} aria-label={`New ${UPDATE_FIELDS[f]}`}>
          <option value="">No change</option>
          {offices.filter((o) => o.code !== e.officeCode).map((o) => <option key={o.code} value={o.code}>{o.code} - transfer</option>)}
        </select>
      )
    if (f === 'positionTitle')
      return (
        <select style={inputStyle} value={value} onChange={(ev) => onChange(ev.target.value)} aria-label={`New ${UPDATE_FIELDS[f]}`}>
          <option value="">No change</option>
          {positions.filter((p) => p.title !== e.positionTitle).map((p) => <option key={p.title} value={p.title}>{p.title} (SG {p.salaryGrade})</option>)}
        </select>
      )
    return <input style={inputStyle} value={value} onChange={(ev) => onChange(ev.target.value)} placeholder="No change" aria-label={`New ${UPDATE_FIELDS[f]}`} />
  }

  return (
    <>
      <Card title="2. Enter the changes" subtitle="Leave a field blank to keep the current value" flush>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '0 22px 16px' }}>
          <Avatar name={employeeName(e)} size={48} />
          <div>
            <Link to={`/office/employees/${e.id}`} style={{ fontWeight: 700, color: NAVY, textDecoration: 'none' }}>{employeeName(e, true)}</Link>
            <div style={{ fontSize: '12.5px', color: MUTED }}>{e.employeeNo} · {e.positionTitle}</div>
          </div>
          <Pill text={e.status} />
        </div>
        {open.length > 0 && (
          <div style={{ ...infoBox, margin: '0 22px 16px' }}>
            This employee already has {open.length} open request{open.length === 1 ? '' : 's'} ({open.map((r) => r.id).join(', ')}). You can still send another.
          </div>
        )}
        {errors.length > 0 && (
          <div style={{ ...errorBox, margin: '0 22px 16px' }} role="alert">
            {errors.map((x) => <div key={x}>• {x}</div>)}
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr>
              <th style={thStyle}>FIELD</th>
              <th style={thStyle}>CURRENT VALUE</th>
              <th style={{ ...thStyle, width: '42%' }}>NEW VALUE</th>
            </tr>
          </thead>
          <tbody>
            {FIELDS.length === 0 && <EmptyRow colSpan={3} text="No editable fields." />}
            {FIELDS.map((f) => {
              const changed = changes.some((c) => c.field === f)
              return (
                <tr key={f} style={{ background: changed ? '#f2f9fd' : undefined }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{UPDATE_FIELDS[f]}</td>
                  <td style={{ ...tdStyle, color: '#374151' }}>{readField(e, f) || '-'}</td>
                  <td style={{ ...tdStyle, padding: '8px 16px' }}>{input(f)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <Card title="3. Reason and supporting document">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          <Field label="Reason for the change *" full>
            <textarea style={{ ...inputStyle, minHeight: '76px', resize: 'vertical' }} value={justification} onChange={(ev) => setJustification(ev.target.value)} />
          </Field>
          <Field label="Supporting document" hint="Only the file name is stored in this prototype.">
            <input type="file" accept=".pdf,.jpg,.png" style={{ fontSize: '13px' }} onChange={(ev) => setAttachment(ev.target.files?.[0]?.name ?? '')} />
          </Field>
          <Field label="Priority">
            <div style={{ display: 'flex', gap: '16px', padding: '9px 0' }}>
              {(['Normal', 'Urgent'] as const).map((p) => (
                <label key={p} style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '14px' }}>
                  <input type="radio" name="priority" checked={priority === p} onChange={() => setPriority(p)} /> {p}
                </label>
              ))}
            </div>
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: MUTED }}>{changes.length} field{changes.length === 1 ? '' : 's'} will change</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={ghostBtn} onClick={() => navigate(`/office/employees/${e.id}`)}>Cancel</button>
            <button style={primaryBtn} onClick={() => validate() && setConfirming(true)}>Review &amp; Submit</button>
          </div>
        </div>
      </Card>

      {confirming && (
        <Modal
          title={`Submit update request for ${employeeName(e)}?`}
          onClose={() => setConfirming(false)}
          width={600}
          footer={
            <>
              <button style={ghostBtn} onClick={() => setConfirming(false)}>Back</button>
              <button style={smallPrimaryBtn} onClick={submit}>Submit to Technical Admin</button>
            </>
          }
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>FIELD</th>
                <th style={thStyle}>FROM</th>
                <th style={thStyle}>TO</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => (
                <tr key={c.field}>
                  <td style={tdStyle}>{UPDATE_FIELDS[c.field]}</td>
                  <td style={{ ...tdStyle, color: MUTED, textDecoration: 'line-through' }}>{c.oldValue || '-'}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#0a6b0a' }}>{c.newValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: '13.5px', color: '#374151' }}><strong>Reason:</strong> {justification}</div>
          {attachment && <div style={{ fontSize: '13.5px', color: '#374151', marginTop: '4px' }}><strong>Attachment:</strong> {attachment}</div>}
        </Modal>
      )}
    </>
  )
}
