// Concerned Office › Requests › Request Employee Addition
// The office asks the Technical Admin to create a new employee record.
// Nothing is added until the Technical Admin approves (Technical Admin › Office Requests).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDb, employeeName, positions } from '../technical/techData'
import { PageHeader, Card, Field, Modal, DetailRow } from '../technical/techUi'
import { inputStyle, primaryBtn, ghostBtn, smallPrimaryBtn, errorBox, MUTED, NAVY, linkBtn } from '../technical/techTheme'
import { useOfficeStore, submitStaffRequest, CURRENT_OFFICE, officeEmployees } from './officeData'
import type { NewEmployeeDetails } from './officeData'
import { OfficeLayout, RequestGuide } from './officeUi'

const blank: NewEmployeeDetails = {
  firstName: '', middleName: '', lastName: '', sex: 'Female', birthDate: '', email: '', phone: '', address: '',
  positionTitle: '', employmentType: 'Permanent', dateHired: '',
}

export default function RequestAdditionPage() {
  const navigate = useNavigate()
  const db = useDb()
  const office = useOfficeStore()
  const [form, setForm] = useState<NewEmployeeDetails>(blank)
  const [justification, setJustification] = useState('')
  const [attachment, setAttachment] = useState('')
  const [priority, setPriority] = useState<'Normal' | 'Urgent'>('Normal')
  const [errors, setErrors] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)

  const set = <K extends keyof NewEmployeeDetails>(key: K, value: NewEmployeeDetails[K]) => setForm({ ...form, [key]: value })
  const sg = positions.find((p) => p.title === form.positionTitle)?.salaryGrade

  // Same name already in the office → warning only (could be a different person)
  const sameName = officeEmployees(db.employees, true).find(
    (e) => form.firstName && form.lastName && e.firstName.toLowerCase() === form.firstName.trim().toLowerCase() && e.lastName.toLowerCase() === form.lastName.trim().toLowerCase(),
  )

  function suggestEmail() {
    if (!form.firstName || !form.lastName) return
    set('email', `${form.firstName.trim().toLowerCase().replace(/\s+/g, '')}.${form.lastName.trim().toLowerCase().replace(/\s+/g, '')}@${CURRENT_OFFICE.domain}`)
  }

  // Checks before the request can be sent
  function validate() {
    const list: string[] = []
    if (!form.firstName.trim()) list.push('First name is required.')
    if (!form.lastName.trim()) list.push('Last name is required.')
    if (!form.birthDate) list.push('Date of birth is required.')
    else {
      const age = (new Date(form.dateHired || new Date().toISOString().slice(0, 10)).getTime() - new Date(form.birthDate).getTime()) / (365.25 * 86400000)
      if (age < 18 || age > 65) list.push('The employee must be between 18 and 65 years old on the start date.')
    }
    const email = form.email.trim().toLowerCase()
    if (!email) list.push('GovMail address is required.')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) list.push('Email address is not valid.')
    else if (!email.endsWith('dost.gov.ph')) list.push('Use an official DOST GovMail address (…@asti.dost.gov.ph).')
    else if (db.employees.some((e) => e.email.toLowerCase() === email)) list.push('This email already belongs to an existing employee.')
    else if (office.requests.some((r) => r.type === 'Addition' && (r.status === 'Pending' || r.status === 'Under Review') && r.newEmployee?.email.toLowerCase() === email)) list.push('There is already an open addition request with this email.')
    if (!form.positionTitle) list.push('Select a position.')
    if (!form.dateHired) list.push('Start date is required.')
    if (justification.trim().length < 1) list.push('Give a short justification (at least 1 characters).')
    setErrors(list)
    return list.length === 0
  }

  function submit() {
    const id = submitStaffRequest({
      type: 'Addition',
      employeeId: null,
      newEmployee: { ...form, firstName: form.firstName.trim(), middleName: form.middleName.trim(), lastName: form.lastName.trim(), email: form.email.trim().toLowerCase() },
      justification: justification.trim(),
      attachment: attachment || undefined,
      priority,
    })
    navigate(`/office/requests?open=${id}&submitted=1`)
  }

  const section = (title: string) => <h3 style={{ gridColumn: '1 / -1', fontSize: '13px', letterSpacing: '1px', color: MUTED, margin: '8px 0 0', fontWeight: 700 }}>{title}</h3>

  return (
    <OfficeLayout>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'Requests', to: '/office/requests' }, { label: 'Request Employee Addition' }]}
        title="Request Employee Addition"
        description={`Ask the Technical Admin to add a new staff member to ${CURRENT_OFFICE.code}. The record is created once the request is approved.`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start' }}>
        <Card title="New Employee Details" subtitle="Fields marked * are required">
          {errors.length > 0 && (
            <div style={errorBox} role="alert">
              <strong>Please fix the following:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px 16px' }}>
            {section('PERSONAL INFORMATION')}
            <Field label="First name *"><input style={inputStyle} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
            <Field label="Middle name / initial"><input style={inputStyle} value={form.middleName} onChange={(e) => set('middleName', e.target.value)} /></Field>
            <Field label="Last name *"><input style={inputStyle} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
            <Field label="Sex *">
              <select style={inputStyle} value={form.sex} onChange={(e) => set('sex', e.target.value as NewEmployeeDetails['sex'])}>
                <option>Female</option>
                <option>Male</option>
              </select>
            </Field>
            <Field label="Date of birth *"><input type="date" style={inputStyle} value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></Field>
            <div />
            {sameName && (
              <div style={{ gridColumn: '1 / -1', background: '#fff6e0', border: '1px solid #fde3a3', color: '#8a5a00', borderRadius: '8px', padding: '9px 12px', fontSize: '13px' }}>
                {employeeName(sameName, true)} ({sameName.employeeNo}) already exists in your office. Make sure this is a different person.
              </div>
            )}

            {section('CONTACT')}
            <Field label="GovMail address *" hint={`Must be an official address, e.g. name.surname@${CURRENT_OFFICE.domain}`}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input style={inputStyle} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder={`juan.delacruz@${CURRENT_OFFICE.domain}`} />
                <button type="button" style={{ ...ghostBtn, padding: '8px 10px' }} onClick={suggestEmail} title="Fill from the name">Suggest</button>
              </div>
            </Field>
            <Field label="Mobile number"><input style={inputStyle} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+63 9XX XXX XXXX" /></Field>
            <Field label="Home address"><input style={inputStyle} value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>

            {section('EMPLOYMENT')}
            <Field label="Position *" hint={sg ? `Salary Grade ${sg}` : 'Salary grade is set from the position'}>
              <select style={inputStyle} value={form.positionTitle} onChange={(e) => set('positionTitle', e.target.value)}>
                <option value="">Select position…</option>
                {positions.map((p) => <option key={p.title} value={p.title}>{p.title} (SG {p.salaryGrade})</option>)}
              </select>
            </Field>
            <Field label="Employment type *">
              <select style={inputStyle} value={form.employmentType} onChange={(e) => set('employmentType', e.target.value as NewEmployeeDetails['employmentType'])}>
                <option>Permanent</option>
                <option>Contract of Service</option>
              </select>
            </Field>
            <Field label="Start date *"><input type="date" style={inputStyle} value={form.dateHired} onChange={(e) => set('dateHired', e.target.value)} /></Field>

            {section('REQUEST')}
            <Field label="Justification *" full hint="e.g. plantilla item number, HRMPSB approval, project funding">
              <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={justification} onChange={(e) => setJustification(e.target.value)} />
            </Field>
            <Field label="Supporting document" hint="Appointment paper / contract (PDF). Only the file name is stored in this prototype.">
              <input type="file" accept=".pdf,.jpg,.png" style={{ fontSize: '13px' }} onChange={(e) => setAttachment(e.target.files?.[0]?.name ?? '')} />
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
            <button style={ghostBtn} onClick={() => navigate('/office/employees')}>Cancel</button>
            <button style={primaryBtn} onClick={() => validate() && setConfirming(true)}>Review &amp; Submit</button>
          </div>
        </Card>

        <RequestGuide
          type="Addition"
          tips={[
            'Use the person’s official GovMail address.',
            'Attach the appointment paper or COS contract so the Technical Admin can verify it.',
            'The new employee appears in My Employees as “Not Profiled” until their competencies are assessed.',
          ]}
        />
      </div>

      {confirming && (
        <Modal
          title="Submit addition request?"
          onClose={() => setConfirming(false)}
          width={560}
          footer={
            <>
              <button style={ghostBtn} onClick={() => setConfirming(false)}>Back</button>
              <button style={smallPrimaryBtn} onClick={submit}>Submit to Technical Admin</button>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <DetailRow label="Name" value={<strong style={{ color: NAVY }}>{`${form.firstName} ${form.middleName} ${form.lastName}`.replace(/\s+/g, ' ')}</strong>} />
            <DetailRow label="Email" value={form.email} />
            <DetailRow label="Position" value={`${form.positionTitle} (SG ${sg})`} />
            <DetailRow label="Employment" value={form.employmentType} />
            <DetailRow label="Start date" value={form.dateHired} />
            <DetailRow label="Priority" value={priority} />
            <div style={{ gridColumn: '1 / -1' }}><DetailRow label="Justification" value={justification} /></div>
            <DetailRow label="Attachment" value={attachment || <span style={{ color: MUTED }}>None</span>} />
          </div>
          <p style={{ fontSize: '12.5px', color: MUTED, margin: '16px 0 0' }}>
            You can follow the request in <button style={linkBtn} onClick={() => navigate('/office/requests')}>Request Status</button>.
          </p>
        </Modal>
      )}
    </OfficeLayout>
  )
}
