// EMPLOYEES  (/technical/employees)
// Employee Directory & Profiling: search, filter, export and add employee records
// (tbl_employees). "View Profile" opens Employee Details.
// Address option: ?q=name
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDb, save, employeeName, officeName, nextNumber, offices, positions, CURRENT_ACTOR } from './techData'
import type { Employee, CompetencyProfile, AssessmentStatus } from './techData'
import { TechLayout, PageHeader, StatRow, StatCard, Card, Pill, Avatar, Modal, Field, TableFooter, EmptyRow, Notice, Icon } from './techUi'
import { ACCENT, MUTED, BORDER, inputStyle, primaryBtn, smallPrimaryBtn, ghostBtn, thStyle, tdStyle, errorBox, paginate, downloadCsv, todayIso } from './techTheme'

const PER_PAGE = 8
const PROFILES: CompetencyProfile[] = ['Fully Profiled', 'Partially Profiled', 'Not Profiled']
const ASSESSMENTS: AssessmentStatus[] = ['Completed', 'Pending', 'Overdue', 'Not Started']

interface Filters {
  search: string
  office: string
  position: string
  profile: string
  assessment: string
  status: string
}

export default function EmployeesPage() {
  const db = useDb()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [f, setF] = useState<Filters>({ search: params.get('q') ?? '', office: 'All', position: 'All', profile: 'All', assessment: 'All', status: 'All' })
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState('')

  const set = (patch: Partial<Filters>) => { setF({ ...f, ...patch }); setPage(1) }

  // ---- KPI numbers ----
  const current = db.employees.filter((e) => e.status !== 'Separated')
  const fully = current.filter((e) => e.competencyProfile === 'Fully Profiled').length
  const due = current.filter((e) => e.assessmentStatus === 'Pending' || e.assessmentStatus === 'Overdue').length
  const pendingUpdates = db.updates.filter((u) => u.status === 'Pending').length

  // ---- filtering ----
  const q = f.search.trim().toLowerCase()
  const filtered = db.employees.filter((e) =>
    (!q || [employeeName(e), employeeName(e, true), e.employeeNo, e.email, e.positionTitle].some((v) => v.toLowerCase().includes(q))) &&
    (f.office === 'All' || e.officeCode === f.office) &&
    (f.position === 'All' || e.positionTitle === f.position) &&
    (f.profile === 'All' || e.competencyProfile === f.profile) &&
    (f.assessment === 'All' || e.assessmentStatus === f.assessment) &&
    (f.status === 'All' || e.status === f.status),
  )
  const p = paginate(filtered, page, PER_PAGE)

  // chips for the "Applied Filters" row
  const chips: { label: string; clear: Partial<Filters> }[] = [
    ...(f.search ? [{ label: `Search: ${f.search}`, clear: { search: '' } }] : []),
    ...(f.office !== 'All' ? [{ label: `Office: ${f.office}`, clear: { office: 'All' } }] : []),
    ...(f.position !== 'All' ? [{ label: `Position: ${f.position}`, clear: { position: 'All' } }] : []),
    ...(f.profile !== 'All' ? [{ label: `Profile: ${f.profile}`, clear: { profile: 'All' } }] : []),
    ...(f.assessment !== 'All' ? [{ label: `Assessment: ${f.assessment}`, clear: { assessment: 'All' } }] : []),
    ...(f.status !== 'All' ? [{ label: `Status: ${f.status}`, clear: { status: 'All' } }] : []),
  ]

  function exportRoster() {
    downloadCsv('employee_roster.csv', [
      ['Employee ID', 'Last Name', 'First Name', 'Middle Name', 'Email', 'Phone', 'Office', 'Position', 'Salary Grade', 'Employment Type', 'Date Hired', 'Status', 'Competency Profile', 'Assessment Status'],
      ...filtered.map((e) => [e.employeeNo, e.lastName, e.firstName, e.middleName, e.email, e.phone, e.officeCode, e.positionTitle, e.salaryGrade, e.employmentType, e.dateHired, e.status, e.competencyProfile, e.assessmentStatus]),
    ])
    save(() => {}, { event: 'Data Export', details: `Exported employee roster (${filtered.length} records)` })
  }

  // table headers may wrap onto two lines (like the mockup) so the table fits a laptop screen
  const th = { ...thStyle, whiteSpace: 'normal' as const, padding: '14px 10px' }
  const td = { ...tdStyle, padding: '12px 10px' }
  const filterLabel = (text: string) => <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.6px', color: '#374151' }}>{text}</span>
  const sel = { ...inputStyle, cursor: 'pointer' }

  return (
    <TechLayout>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/technical/dashboard' }, { label: 'Employee Profile Management' }, { label: 'Employees' }]}
        title="Employee Directory & Profiling"
        description="Manage personnel roster, monitor competency calibration status, and maintain employee profiles across DOST agencies and institutes."
        actions={
          <>
            <button style={{ ...ghostBtn, borderColor: '#0f2442', color: '#0f2442', padding: '10px 16px', fontSize: '14px' }} onClick={exportRoster}><Icon name="download" size={16} /> Export Roster / CSV</button>
            <button style={primaryBtn} onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Add Employee</button>
          </>
        }
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      <StatRow>
        <StatCard label="TOTAL REGISTERED PERSONNEL" value={current.length.toLocaleString()} sub={`${db.employees.length - current.length} separated record(s) kept`} icon="users" />
        <StatCard label="PROFILES COMPLETED & BASELINED" value={fully} unit={`${Math.round((fully / Math.max(1, current.length)) * 100)}% Calibrated`} tone="accent" sub="All required competencies profiled" icon="check" />
        <StatCard label="ASSESSMENT PENDING / DUE" value={due} unit="Action Required" tone="warning" sub="Pending or overdue assessments" icon="clock" />
        <StatCard label="PENDING PROFILE UPDATES" value={pendingUpdates} unit="To Review" tone="danger" sub="Submitted change requests" icon="id" to="/technical/profile-updates" />
      </StatRow>

      {/* Filters */}
      <Card style={{ marginBottom: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 2fr) repeat(5, minmax(140px, 1fr)) auto', gap: '12px', alignItems: 'end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filterLabel('EMPLOYEE SEARCH')}
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0 12px', background: 'white' }}>
              <span style={{ color: MUTED, display: 'flex' }}><Icon name="search" size={16} /></span>
              <input value={f.search} onChange={(e) => set({ search: e.target.value })} placeholder="Search by name, plantilla item, or ID..." style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 0', fontSize: '13.5px' }} />
            </span>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{filterLabel('OFFICE / INSTITUTE')}
            <select style={sel} value={f.office} onChange={(e) => set({ office: e.target.value })}><option value="All">All Offices / Bureaus</option>{offices.map((o) => <option key={o.code} value={o.code}>{o.code}</option>)}</select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{filterLabel('POSITION TITLE')}
            <select style={sel} value={f.position} onChange={(e) => set({ position: e.target.value })}><option value="All">All Positions</option>{positions.map((p) => <option key={p.title} value={p.title}>{p.title}</option>)}</select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{filterLabel('COMPETENCY PROFILE')}
            <select style={sel} value={f.profile} onChange={(e) => set({ profile: e.target.value })}><option value="All">Competency: All</option>{PROFILES.map((x) => <option key={x} value={x}>{x}</option>)}</select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{filterLabel('ASSESSMENT STATUS')}
            <select style={sel} value={f.assessment} onChange={(e) => set({ assessment: e.target.value })}><option value="All">Status: All</option>{ASSESSMENTS.map((x) => <option key={x} value={x}>{x}</option>)}</select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{filterLabel('EMPLOYMENT')}
            <select style={sel} value={f.status} onChange={(e) => set({ status: e.target.value })}><option value="All">All</option><option value="Active">Active</option><option value="On Leave">On Leave</option><option value="Separated">Separated</option></select>
          </label>
          <button style={{ ...ghostBtn, padding: '10px' }} title="Clear all filters" aria-label="Clear all filters" onClick={() => { setF({ search: '', office: 'All', position: 'All', profile: 'All', assessment: 'All', status: 'All' }); setPage(1) }}><Icon name="filter" size={17} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${BORDER}`, fontSize: '13.5px' }}>
          <span style={{ color: MUTED }}>Applied Filters:</span>
          <span style={{ background: '#f1f0ee', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '4px 10px' }}>Cycle: {db.config.general.assessmentCycle}</span>
          {chips.map((c) => (
            <span key={c.label} style={{ background: '#e6f5fc', border: '1px solid #a9dcf3', color: '#0b4f73', borderRadius: '6px', padding: '4px 6px 4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {c.label}
              <button aria-label={`Remove ${c.label}`} onClick={() => set(c.clear)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0b4f73', fontSize: '15px' }}>&times;</button>
            </span>
          ))}
          {chips.length === 0 && <span style={{ color: MUTED }}>None</span>}
          {chips.length > 0 && <button onClick={() => { setF({ search: '', office: 'All', position: 'All', profile: 'All', assessment: 'All', status: 'All' }); setPage(1) }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: ACCENT, textDecoration: 'underline', cursor: 'pointer', fontSize: '13.5px' }}>Clear all</button>}
        </div>
      </Card>

      {/* Directory table */}
      <Card flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={th}>E.ID</th>
                <th style={th}>EMPLOYEE NAME &amp; EMAIL</th>
                <th style={th}>OFFICE / DIVISION</th>
                <th style={th}>POSITION / SALARY GRADE</th>
                <th style={th}>COMPETENCY PROFILE</th>
                <th style={th}>ASSESSMENT STATUS</th>
                <th style={{ ...th, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map((e) => (
                <tr key={e.id} style={{ opacity: e.status === 'Separated' ? 0.65 : 1 }}>
                  <td style={{ ...td, whiteSpace: 'nowrap', color: '#374151', fontSize: '13px' }}>{e.employeeNo}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar name={employeeName(e)} size={38} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{employeeName(e)} {e.status !== 'Active' && <Pill text={e.status} dot={false} />}</div>
                        <div title={e.email} style={{ color: MUTED, fontSize: '12.5px', maxWidth: '210px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <div style={{ background: '#f1f0ee', borderRadius: '6px', padding: '6px 10px', textAlign: 'center', fontSize: '12.5px', maxWidth: '140px' }}>
                      <div style={{ fontWeight: 700 }}>{e.officeCode.replace('DOST-', '')}</div>
                      <div style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{officeName(e.officeCode)}</div>
                    </div>
                  </td>
                  <td style={td}>
                    <div style={{ color: '#111827' }}>{e.positionTitle}</div>
                    <div style={{ color: MUTED, fontSize: '13px', whiteSpace: 'nowrap' }}>SG {e.salaryGrade} · {e.employmentType === 'Permanent' ? 'Permanent' : 'COS'}</div>
                  </td>
                  <td style={td}><Pill text={e.competencyProfile} dot={false} /></td>
                  <td style={td}><Pill text={e.assessmentStatus} /></td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <button onClick={() => navigate(`/technical/employees/${e.id}`)} style={{ background: '#e6f5fc', color: ACCENT, border: '1px solid #a9dcf3', borderRadius: '6px', padding: '7px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>View &rsaquo;</button>
                  </td>
                </tr>
              ))}
              {p.rows.length === 0 && <EmptyRow colSpan={7} text="No employees match your filters." />}
            </tbody>
          </table>
        </div>
        <TableFooter from={p.from} to={p.to} total={filtered.length} label="personnel records" page={p.current} totalPages={p.totalPages} onPage={setPage} />
      </Card>

      {adding && (
        <AddEmployeeModal
          onClose={() => setAdding(false)}
          onCreated={(emp) => {
            setAdding(false)
            setNotice(`${employeeName(emp)} (${emp.employeeNo}) was added.`)
            navigate(`/technical/employees/${emp.id}`)
          }}
        />
      )}
    </TechLayout>
  )
}

/* ------------------------------------------------------------------ */
/* Add Employee (fields follow tbl_employees)                          */
/* ------------------------------------------------------------------ */

function AddEmployeeModal({ onClose, onCreated }: { onClose: () => void; onCreated: (e: Employee) => void }) {
  const db = useDb()
  const year = todayIso().slice(0, 4)
  const [type, setType] = useState<Employee['employmentType']>('Permanent')
  const prefix = type === 'Permanent' ? 'DOST' : 'COS'
  const nextNo = `${prefix}-${year}-${String(nextNumber(db.employees.filter((e) => e.employeeNo.startsWith(prefix)).map((e) => Number(e.employeeNo.split('-')[2]) || 0))).padStart(4, '0')}`
  const [form, setForm] = useState({ firstName: '', middleName: '', lastName: '', email: '', phone: '', sex: 'Female' as Employee['sex'], birthDate: '', address: '', officeCode: offices[0].code, positionTitle: positions[positions.length - 3].title, dateHired: todayIso() })
  const [error, setError] = useState('')
  const domain = db.config.security.allowedDomain

  function create() {
    if (!form.firstName.trim() || !form.lastName.trim()) return setError('First and last name are required.')
    const email = form.email.trim().toLowerCase()
    if (!email.endsWith(domain)) return setError(`Email must be an agency address ending in ${domain}.`)
    if (db.employees.some((e) => e.email === email)) return setError('Another employee already uses this email.')
    if (!form.dateHired) return setError('Date hired is required.')
    const id = nextNumber(db.employees.map((e) => e.id))
    const emp: Employee = {
      id, employeeNo: nextNo, ...form, firstName: form.firstName.trim(), middleName: form.middleName.trim(), lastName: form.lastName.trim(), email,
      salaryGrade: positions.find((p) => p.title === form.positionTitle)?.salaryGrade ?? 1,
      employmentType: type, status: 'Active', competencyProfile: 'Not Profiled', assessmentStatus: 'Not Started', competencies: [],
    }
    save((d) => {
      d.employees.unshift(emp)
      d.history.unshift({ id: nextNumber(d.history.map((h) => h.id)), employeeId: id, recordType: 'Hired', description: `Appointed as ${emp.positionTitle} (${type})`, effectiveDate: form.dateHired, createdAt: todayIso(), by: CURRENT_ACTOR.name })
    }, { event: 'Profile Update', details: `Employee record created: ${nextNo} ${employeeName(emp)}` })
    onCreated(emp)
  }

  const input = (key: keyof typeof form, label: string, extra?: { type?: string; full?: boolean; placeholder?: string }) => (
    <Field label={label} full={extra?.full}>
      <input style={inputStyle} type={extra?.type ?? 'text'} placeholder={extra?.placeholder} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </Field>
  )

  return (
    <Modal
      title="Add Employee"
      onClose={onClose}
      width={760}
      footer={
        <>
          <span style={{ marginRight: 'auto', fontSize: '12.5px', color: MUTED }}>After saving you can create a user account from the employee’s profile.</span>
          <button style={ghostBtn} onClick={onClose}>Cancel</button>
          <button style={smallPrimaryBtn} onClick={create}>Save Employee</button>
        </>
      }
    >
      {error && <div style={errorBox}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
        <Field label="Employment type">
          <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value as Employee['employmentType'])}><option value="Permanent">Permanent (Plantilla)</option><option value="Contract of Service">Contract of Service</option></select>
        </Field>
        <Field label="Employee ID (auto)"><input style={{ ...inputStyle, background: '#f3f4f6' }} value={nextNo} disabled /></Field>
        {input('dateHired', 'Date hired *', { type: 'date' })}
        {input('firstName', 'First name *')}
        {input('middleName', 'Middle name')}
        {input('lastName', 'Last name *')}
        {input('email', 'Agency email *', { placeholder: `name@asti.${domain}` })}
        {input('phone', 'Phone', { placeholder: '+63 9XX XXX XXXX' })}
        <Field label="Sex"><select style={inputStyle} value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value as Employee['sex'] })}><option>Female</option><option>Male</option></select></Field>
        <Field label="Office / Agency *">
          <select style={inputStyle} value={form.officeCode} onChange={(e) => setForm({ ...form, officeCode: e.target.value })}>{offices.map((o) => <option key={o.code} value={o.code}>{o.code} - {o.name}</option>)}</select>
        </Field>
        <Field label="Position *">
          <select style={inputStyle} value={form.positionTitle} onChange={(e) => setForm({ ...form, positionTitle: e.target.value })}>{positions.map((p) => <option key={p.title} value={p.title}>{p.title} (SG {p.salaryGrade})</option>)}</select>
        </Field>
        {input('birthDate', 'Birth date', { type: 'date' })}
        {input('address', 'Home address', { full: true })}
      </div>
      <div style={{ marginTop: '12px', fontSize: '12.5px', color: MUTED }}>
        Already have the person in another office? Use <Link to="/technical/profile-updates" style={{ color: ACCENT }}>Profile Updates</Link> to transfer them instead of creating a duplicate.
      </div>
    </Modal>
  )
}
