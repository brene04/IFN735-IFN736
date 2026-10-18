// Concerned Office › Requests › Request Employee Removal
// Ask the Technical Admin to mark a staff member as Separated (resignation, retirement,
// end of contract, transfer). Records are never deleted - history is kept.
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDb, employeeName } from '../technical/techData'
import type { Employee } from '../technical/techData'
import { PageHeader, Card, Field, ConfirmModal, Avatar, Pill, DetailRow } from '../technical/techUi'
import { inputStyle, ghostBtn, errorBox, infoBox, MUTED, NAVY, formatDate, todayIso } from '../technical/techTheme'
import { useOfficeStore, officeEmployees, submitStaffRequest, REMOVAL_REASONS, CURRENT_OFFICE } from './officeData'
import { OfficeLayout, RequestGuide } from './officeUi'

type Reason = (typeof REMOVAL_REASONS)[number]

export default function RequestRemovalPage() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const staff = officeEmployees(db.employees)
  const employee = staff.find((e) => String(e.id) === params.get('employee'))

  return (
    <OfficeLayout>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'Requests', to: '/office/requests' }, { label: 'Request Employee Removal' }]}
        title="Request Employee Removal"
        description="Ask the Technical Admin to remove a staff member from your office. The employee is marked as Separated; their records and history are kept."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="1. Select employee">
            <select aria-label="Employee" style={{ ...inputStyle, maxWidth: '520px' }} value={employee?.id ?? ''} onChange={(e) => setParams(e.target.value ? { employee: e.target.value } : {})}>
              <option value="">Choose a staff member…</option>
              {staff.map((e) => <option key={e.id} value={e.id}>{employeeName(e, true)} - {e.positionTitle} ({e.employeeNo})</option>)}
            </select>
          </Card>
          {employee ? <RemovalForm key={employee.id} employee={employee} /> : <Card><p style={{ margin: 0, color: MUTED }}>Choose the employee who is leaving your office.</p></Card>}
        </div>
        <RequestGuide
          type="Removal"
          tips={[
            'Attach the accepted resignation letter, retirement papers or end-of-contract notice.',
            'For transfers within DOST, use “Request Employee Update” and change the office instead.',
            'The employee’s user account is deactivated by the Technical Admin after approval.',
          ]}
        />
      </div>
    </OfficeLayout>
  )
}

function RemovalForm({ employee: e }: { employee: Employee }) {
  const navigate = useNavigate()
  const office = useOfficeStore()
  const [reason, setReason] = useState<Reason>('Resignation')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [justification, setJustification] = useState('')
  const [attachment, setAttachment] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)

  // Only one open removal request per employee
  const openRemoval = office.requests.find((r) => r.employeeId === e.id && r.type === 'Removal' && (r.status === 'Pending' || r.status === 'Under Review'))

  function validate() {
    const list: string[] = []
    if (!effectiveDate) list.push('Effective date is required.')
    else if (effectiveDate < e.dateHired) list.push('Effective date cannot be before the date hired.')
    if (justification.trim().length < 10) list.push('Add details (at least 10 characters).')
    if (!attachment && (reason === 'Resignation' || reason === 'Retirement')) list.push(`Attach the ${reason === 'Resignation' ? 'accepted resignation letter' : 'retirement papers'}.`)
    if (!confirmed) list.push('Tick the confirmation box.')
    setErrors(list)
    return list.length === 0
  }

  function submit() {
    const id = submitStaffRequest({ type: 'Removal', employeeId: e.id, removal: { reason, effectiveDate }, justification: justification.trim(), attachment: attachment || undefined, priority: 'Normal' })
    navigate(`/office/requests?open=${id}&submitted=1`)
  }

  if (openRemoval) {
    return (
      <Card>
        <div style={infoBox}>
          A removal request for {employeeName(e)} is already {openRemoval.status.toLowerCase()} (<Link to={`/office/requests?open=${openRemoval.id}`} style={{ color: '#0b3d5c', fontWeight: 700 }}>{openRemoval.id}</Link>). Wait for the Technical Admin's decision.
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card title="2. Employee leaving">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Avatar name={employeeName(e)} size={56} />
          <div style={{ flex: 1 }}>
            <Link to={`/office/employees/${e.id}`} style={{ fontWeight: 800, fontSize: '17px', color: NAVY, textDecoration: 'none' }}>{employeeName(e, true)}</Link>
            <div style={{ fontSize: '13px', color: MUTED }}>{e.employeeNo} · {e.email}</div>
          </div>
          <DetailRow label="Position" value={e.positionTitle} />
          <DetailRow label="Employment" value={e.employmentType} />
          <DetailRow label="Date hired" value={formatDate(e.dateHired)} />
          <Pill text={e.status} />
        </div>
      </Card>

      <Card title="3. Removal details">
        {errors.length > 0 && (
          <div style={errorBox} role="alert">
            {errors.map((x) => <div key={x}>• {x}</div>)}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          <Field label="Reason *">
            <select style={inputStyle} value={reason} onChange={(ev) => setReason(ev.target.value as Reason)}>
              {REMOVAL_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Effective date (last working day) *">
            <input type="date" style={inputStyle} value={effectiveDate} min={e.dateHired} onChange={(ev) => setEffectiveDate(ev.target.value)} />
          </Field>
          <Field label="Details *" full>
            <textarea style={{ ...inputStyle, minHeight: '76px', resize: 'vertical' }} value={justification} onChange={(ev) => setJustification(ev.target.value)} placeholder="e.g. Resignation accepted by the Director on…, clearance in progress" />
          </Field>
          <Field label={`Supporting document${reason === 'Resignation' || reason === 'Retirement' ? ' *' : ''}`} hint="Only the file name is stored in this prototype.">
            <input type="file" accept=".pdf,.jpg,.png" style={{ fontSize: '13px' }} onChange={(ev) => setAttachment(ev.target.files?.[0]?.name ?? '')} />
          </Field>
          {reason === 'Transfer to another agency' && (
            <div style={{ ...infoBox, fontSize: '12.5px', alignSelf: 'end' }}>Moving to another DOST office? Use <Link to={`/office/requests/update-employee?employee=${e.id}`} style={{ color: '#0b3d5c', fontWeight: 700 }}>Request Employee Update</Link> instead.</div>
          )}
          <label style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13.5px', color: '#374151', background: '#fdf3f3', border: '1px solid #f5c2c2', borderRadius: '8px', padding: '12px' }}>
            <input type="checkbox" checked={confirmed} onChange={(ev) => setConfirmed(ev.target.checked)} style={{ marginTop: '2px' }} />
            I confirm that {employeeName(e)} will no longer work for {CURRENT_OFFICE.code}{effectiveDate ? ` after ${formatDate(effectiveDate)}` : ''}, and that this request is authorised by the office head.
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button style={ghostBtn} onClick={() => navigate(`/office/employees/${e.id}`)}>Cancel</button>
          <button style={{ ...ghostBtn, background: '#b91c1c', color: 'white', border: 'none', padding: '11px 18px', fontSize: '14px' }} onClick={() => validate() && setConfirming(true)}>
            Submit Removal Request
          </button>
        </div>
      </Card>

      {confirming && (
        <ConfirmModal
          title="Submit removal request?"
          danger
          confirmLabel="Submit to Technical Admin"
          onClose={() => setConfirming(false)}
          onConfirm={submit}
          message={
            <>
              <strong>{employeeName(e, true)}</strong> ({e.positionTitle}) will be marked as <strong>Separated</strong> - {reason.toLowerCase()}, effective {formatDate(effectiveDate || todayIso())} - once the Technical Admin approves.
            </>
          }
        />
      )}
    </>
  )
}
