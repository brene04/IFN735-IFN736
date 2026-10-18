// Employee Management + Position Management (one combined page)
// Address: /employee-position-management
//   ?tab=employees  -> Employee Management   (tbl_employees)
//   ?tab=positions  -> Position Management   (tbl_positions + tbl_position_competencies)
// Everything is read from and saved to the shared database (pages/technical/techData), so the
// Technical Admin, Concerned Office, Administrative Admin and Executive all see the same records.
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/authContext'
import RoleShell from '../../components/RoleShell'
import { Icon, StatCard, StatusPill, Pagination, TabButton, PageTabs, useHome } from '../../components/adminUi'
import { PageHeader, StatRow, Modal, Field, DetailRow, SearchBox } from '../technical/techUi'
import { inputStyle, selectStyle, primaryBtn, ghostBtn, dangerBtn, thStyle, tdStyle, errorBox, NAVY, ACCENT, BAR, BORDER, MUTED } from '../technical/techTheme'
import { useDb, save, nextNumber, PRIORITY_NAMES } from '../technical/techData'
import type { Db, Employee, EmployeeStatus, PositionRow } from '../technical/techData'
import { gapRows, matchScore } from '../office/officeData'

const EMPLOYEES_PER_PAGE = 8
const POSITIONS_PER_PAGE = 8
const today = () => new Date().toISOString().slice(0, 10)

function matchLabel(value: number) {
  if (value >= 85) return { text: 'Strong', color: ACCENT, bar: BAR }
  if (value >= 70) return { text: 'Developing', color: '#b45309', bar: '#f5b731' }
  return { text: 'Gap', color: '#b91c1c', bar: '#ef4444' }
}

const initialsOf = (e: Employee) => `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase()

function useActor() {
  const { user } = useAuth()
  return user?.name ?? 'Administrator'
}

function addHistory(d: Db, employeeId: number, recordType: Db['history'][number]['recordType'], description: string, by: string, effectiveDate = today()) {
  d.history.push({ id: nextNumber(d.history.map((h) => h.id)), employeeId, recordType, description, effectiveDate, createdAt: today(), by })
}

/* ------------------------------------------------------------------ */
/* Screen 1: Employee Management                                       */
/* ------------------------------------------------------------------ */

type EmpType = Employee['employmentType']

interface EmployeeForm {
  employeeNo: string
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
  officeId: number
  positionId: number
  employmentType: EmpType
  status: EmployeeStatus
  dateHired: string
  sex: 'Female' | 'Male'
  // current proficiency level per competency code (0 = not assessed), tbl_employee_competencies
  levels: Record<string, number>
}

// Competencies shown in the form: what the chosen position requires, plus anything the employee already holds
function levelCodes(d: Db, positionId: number, held: { code: string }[]) {
  const req = d.positionCompetencies
    .filter((r) => r.positionId === positionId)
    .sort((a, b) => a.priority - b.priority)
    .map((r) => d.competencies.find((c) => c.id === r.competencyId)?.competencyCode)
    .filter((c): c is string => !!c)
  return [...new Set([...req, ...held.map((h) => h.code)])]
}

// Writes the chosen levels onto an employee and refreshes their profile status. Returns true if anything changed.
function applyLevels(d: Db, e: Employee, positionId: number, codes: string[], levels: Record<string, number>) {
  let changed = false
  codes.forEach((code) => {
    const lvl = levels[code] ?? 0
    const have = e.competencies.find((x) => x.code === code)
    if ((have?.level ?? 0) === lvl) return
    changed = true
    if (lvl === 0) {
      e.competencies = e.competencies.filter((x) => x.code !== code)
    } else if (have) {
      have.level = lvl
      have.lastUpdated = today()
    } else {
      const c = d.competencies.find((x) => x.competencyCode === code)
      if (c) e.competencies.push({ code, title: c.competencyName, category: c.competencyType, level: lvl, evidence: 'Recorded by Administrative Admin', lastUpdated: today() })
    }
  })
  if (!changed) return false
  const required = levelCodes(d, positionId, [])
  const heldRequired = required.filter((c) => e.competencies.some((x) => x.code === c)).length
  e.competencyProfile = e.competencies.length === 0 ? 'Not Profiled' : required.length > 0 && heldRequired === required.length ? 'Fully Profiled' : 'Partially Profiled'
  if (e.competencies.length > 0 && e.assessmentStatus === 'Not Started') e.assessmentStatus = 'Completed'
  return true
}

// Next employee number, e.g. DOST-2026-0267 or COS-2026-0003
function nextEmployeeNo(list: Employee[], type: EmpType) {
  const prefix = type === 'Permanent' ? 'DOST' : 'COS'
  const nums = list.filter((e) => e.employeeNo.startsWith(prefix)).map((e) => Number(e.employeeNo.split('-')[2]) || 0)
  return `${prefix}-${new Date().getFullYear()}-${String(Math.max(0, ...nums) + 1).padStart(4, '0')}`
}

function EmployeeManagement({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  const home = useHome()
  const db = useDb()
  const actor = useActor()
  const [officeFilter, setOfficeFilter] = useState('All')
  // 'Current' = everyone still employed (the same people the Gap Analysis and Competency Profile pages list)
  const [statusFilter, setStatusFilter] = useState<'All' | 'Current' | EmployeeStatus>('Current')
  const [tab, setTab] = useState<'All' | EmpType>('All')
  const [page, setPage] = useState(1)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [form, setForm] = useState<EmployeeForm | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const employees = db.employees
  const viewing = employees.find((e) => e.id === viewingId) ?? null
  const positionOf = (e: Employee) => db.positions.find((p) => p.id === e.positionId)
  const officeOf = (e: Employee) => db.offices.find((o) => o.id === e.officeId)
  const matchOf = (e: Employee) => matchScore(gapRows(e))

  // Stats
  const current = employees.filter((e) => e.status !== 'Separated')
  const permanent = current.filter((e) => e.employmentType === 'Permanent').length
  const avgMatch = current.length ? (current.reduce((s, e) => s + matchOf(e), 0) / current.length).toFixed(1) : '0.0'
  const profiled = current.filter((e) => e.competencyProfile === 'Fully Profiled').length

  // Filtering
  const q = search.trim().toLowerCase()
  const filteredNoTab = employees.filter(
    (e) =>
      (officeFilter === 'All' || e.officeCode === officeFilter) &&
      (statusFilter === 'All' || (statusFilter === 'Current' ? e.status !== 'Separated' : e.status === statusFilter)) &&
      (!q || [e.employeeNo, `${e.firstName} ${e.lastName}`, e.email, e.positionTitle].some((v) => v.toLowerCase().includes(q))),
  )
  const filtered = filteredNoTab.filter((e) => tab === 'All' || e.employmentType === tab)
  const totalPages = Math.max(1, Math.ceil(filtered.length / EMPLOYEES_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * EMPLOYEES_PER_PAGE, currentPage * EMPLOYEES_PER_PAGE)

  function resetFilters() {
    setSearch('')
    setOfficeFilter('All')
    setStatusFilter('Current')
    setTab('All')
    setPage(1)
  }

  function openAdd() {
    setForm({
      employeeNo: nextEmployeeNo(employees, 'Permanent'), firstName: '', middleName: '', lastName: '', email: '', phone: '',
      officeId: db.offices[0]?.id ?? 0, positionId: db.positions[0]?.id ?? 0, employmentType: 'Permanent', status: 'Active', dateHired: today(), sex: 'Female', levels: {},
    })
    setEditingId(null)
    setError('')
  }

  function openEdit(e: Employee) {
    setForm({
      employeeNo: e.employeeNo, firstName: e.firstName, middleName: e.middleName, lastName: e.lastName, email: e.email, phone: e.phone,
      officeId: e.officeId ?? 0, positionId: e.positionId ?? 0, employmentType: e.employmentType, status: e.status, dateHired: e.dateHired, sex: e.sex,
      levels: Object.fromEntries(e.competencies.map((c) => [c.code, c.level])),
    })
    setEditingId(e.id)
    setViewingId(null)
    setError('')
  }

  function saveEmployee() {
    if (!form) return
    if (!form.firstName.trim() || !form.lastName.trim() || !form.positionId || !form.officeId) {
      setError('First name, last name, office and position are required.')
      return
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!form.employeeNo.trim()) {
      setError('Employee number is required.')
      return
    }
    if (employees.some((e) => e.employeeNo === form.employeeNo.trim() && e.id !== editingId)) {
      setError(`Employee number ${form.employeeNo} already exists.`)
      return
    }
    const f = { ...form, employeeNo: form.employeeNo.trim(), firstName: form.firstName.trim(), middleName: form.middleName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), phone: form.phone.trim() }
    save(
      (d) => {
        const pos = d.positions.find((p) => p.id === f.positionId)!
        const off = d.offices.find((o) => o.id === f.officeId)!
        if (editingId === null) {
          const id = nextNumber(d.employees.map((e) => e.id))
          d.employees.push({
            id, employeeNo: f.employeeNo, firstName: f.firstName, middleName: f.middleName, lastName: f.lastName, email: f.email, phone: f.phone,
            officeCode: off.officeCode, positionTitle: pos.positionTitle, salaryGrade: pos.salaryGrade, employmentType: f.employmentType,
            dateHired: f.dateHired, status: f.status, sex: f.sex, birthDate: '', address: '', competencyProfile: 'Not Profiled', assessmentStatus: 'Not Started', competencies: [],
          })
          addHistory(d, id, 'Hired', `Appointed as ${pos.positionTitle} (${f.employmentType})`, actor, f.dateHired)
          const created = d.employees.find((x) => x.id === id)!
          applyLevels(d, created, pos.id, levelCodes(d, pos.id, []), f.levels)
        } else {
          const e = d.employees.find((x) => x.id === editingId)!
          if (e.positionTitle !== pos.positionTitle) addHistory(d, e.id, 'Position Change', `${e.positionTitle} → ${pos.positionTitle}`, actor)
          if (e.officeCode !== off.officeCode) addHistory(d, e.id, 'Office Transfer', `${e.officeCode} → ${off.officeCode}`, actor)
          if (e.status !== f.status) addHistory(d, e.id, 'Status Change', `${e.status} → ${f.status}`, actor)
          Object.assign(e, {
            employeeNo: f.employeeNo, firstName: f.firstName, middleName: f.middleName, lastName: f.lastName, email: f.email, phone: f.phone,
            officeCode: off.officeCode, positionTitle: pos.positionTitle, salaryGrade: pos.salaryGrade, employmentType: f.employmentType, dateHired: f.dateHired, status: f.status, sex: f.sex,
          })
          applyLevels(d, e, pos.id, levelCodes(d, pos.id, e.competencies), f.levels)
        }
      },
      { event: 'Profile Update', details: `${editingId === null ? 'Added' : 'Updated'} employee ${f.employeeNo} (${f.firstName} ${f.lastName})` },
    )
    if (editingId === null) setPage(1)
    setForm(null)
  }

  function setStatus(e: Employee, status: EmployeeStatus) {
    save(
      (d) => {
        const row = d.employees.find((x) => x.id === e.id)!
        addHistory(d, row.id, 'Status Change', `${row.status} → ${status}`, actor)
        row.status = status
      },
      { event: 'Profile Update', details: `${e.employeeNo} status set to ${status}` },
    )
  }

  // An employee that other records point to (user account, gap analysis, profile update) is kept: mark them Separated instead
  function blockers(e: Employee) {
    const out: string[] = []
    if (db.users.some((u) => u.employeeId === e.id)) out.push('a user account')
    if (db.gapAnalyses.some((a) => a.employeeId === e.id)) out.push('gap analysis records')
    if (db.updates.some((u) => u.employeeId === e.id)) out.push('profile update requests')
    return out
  }

  function deleteEmployee(e: Employee) {
    const b = blockers(e)
    if (b.length > 0) {
      window.alert(`${e.firstName} ${e.lastName} still has ${b.join(', ')} linked to this record, so it cannot be deleted. Use "Mark as Separated" instead.`)
      return
    }
    if (!window.confirm(`Delete the record of ${e.firstName} ${e.lastName} (${e.employeeNo})? This cannot be undone.`)) return
    save(
      (d) => {
        d.employees = d.employees.filter((x) => x.id !== e.id)
        d.history = d.history.filter((h) => h.employeeId !== e.id)
      },
      { event: 'Profile Update', details: `Deleted employee ${e.employeeNo}` },
    )
    setViewingId(null)
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: home }, { label: 'Organisation Data' }, { label: 'Employee Management' }]}
        title="Employee Management"
        description="Maintain personnel records and each employee's office, position and competency match across DOST offices."
        actions={<button style={primaryBtn} onClick={openAdd}><Icon name="plus" /> Add Employee</button>}
      />

      <StatRow>
        <StatCard label="TOTAL EMPLOYEES" value={`${current.length} Personnel`} icon="people" />
        <StatCard label="PERMANENT / COS" value={`${permanent} / ${current.length - permanent}`} icon="building" />
        <StatCard label="AVG. COMPETENCY MATCH" value={`${avgMatch}%`} icon="gauge" accent />
        <StatCard label="FULLY PROFILED" value={`${profiled} of ${current.length}`} icon="check" />
      </StatRow>

      {/* Filters */}
      <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 20px 16px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', paddingBottom: '18px', borderBottom: `1px solid ${BORDER}` }}>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search employee by name, number, email, or position..." />
          <select style={selectStyle} value={officeFilter} onChange={(e) => { setOfficeFilter(e.target.value); setPage(1) }}>
            <option value="All">Office: All</option>
            {db.offices.map((o) => (
              <option key={o.id} value={o.officeCode}>Office: {o.officeCode}</option>
            ))}
          </select>
          <select style={selectStyle} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as 'All' | 'Current' | EmployeeStatus); setPage(1) }}>
            <option value="Current">Status: Current</option>
            <option value="All">Status: All (incl. Separated)</option>
            <option value="Active">Status: Active</option>
            <option value="On Leave">Status: On Leave</option>
            <option value="Separated">Status: Separated</option>
          </select>
          <button style={{ ...ghostBtn, display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px' }} onClick={resetFilters}>
            <Icon name="filter" /> Reset
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', flexWrap: 'wrap' }}>
          <TabButton active={tab === 'All'} label="All Employees" count={filteredNoTab.length} onClick={() => { setTab('All'); setPage(1) }} />
          <TabButton active={tab === 'Permanent'} label="Plantilla" count={filteredNoTab.filter((e) => e.employmentType === 'Permanent').length} onClick={() => { setTab('Permanent'); setPage(1) }} />
          <TabButton active={tab === 'Contract of Service'} label="Contract of Service" count={filteredNoTab.filter((e) => e.employmentType === 'Contract of Service').length} onClick={() => { setTab('Contract of Service'); setPage(1) }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>EMPLOYEE NO.</th>
                <th style={thStyle}>NAME &amp; POSITION</th>
                <th style={thStyle}>OFFICE</th>
                <th style={thStyle}>EMPLOYMENT</th>
                <th style={thStyle}>COMPETENCY MATCH</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((e) => {
                const pos = positionOf(e)
                const match = matchOf(e)
                const m = matchLabel(match)
                return (
                  <tr key={e.id}>
                    <td style={{ ...tdStyle, color: ACCENT, fontWeight: 700, fontSize: '14.5px', whiteSpace: 'nowrap' }}>{e.employeeNo}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: 38, height: 38, borderRadius: '50%', background: '#e6f0f8', color: NAVY, fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {initialsOf(e)}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{e.firstName} {e.lastName}</div>
                          <div style={{ color: MUTED }}>{pos?.positionTitle ?? 'No position'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}><div style={{ fontWeight: 600, color: '#111827' }}>{e.officeCode}</div></td>
                    <td style={tdStyle}>
                      <span style={{ background: e.employmentType === 'Permanent' ? '#eef1fb' : '#f1f0ee', color: e.employmentType === 'Permanent' ? '#1e3a8a' : '#374151', fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                        {e.employmentType === 'Permanent' ? 'Plantilla' : 'COS'}
                      </span>
                      <div style={{ color: MUTED, fontSize: '13px', marginTop: '6px' }}>{pos ? `SG ${pos.salaryGrade}` : '—'}</div>
                    </td>
                    <td style={{ ...tdStyle, minWidth: '170px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{match}%</span>
                        <span style={{ color: m.color, fontWeight: 600, fontSize: '13.5px' }}>{m.text}</span>
                      </div>
                      <div style={{ height: '6px', background: '#eceef2', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${match}%`, height: '100%', background: m.bar, borderRadius: '3px' }} />
                      </div>
                    </td>
                    <td style={tdStyle}><StatusPill status={e.status} /></td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button onClick={() => setViewingId(e.id)} style={{ background: ACCENT, color: 'white', border: 'none', borderRadius: '4px', padding: '8px 14px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        View Profile &rarr;
                      </button>
                    </td>
                  </tr>
                )
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: MUTED, padding: '40px' }}>No employees match your search or filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#f7f6f4', borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: '#374151' }}>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * EMPLOYEES_PER_PAGE + 1} to {Math.min(currentPage * EMPLOYEES_PER_PAGE, filtered.length)} of {filtered.length} Employees
          </span>
          <Pagination page={currentPage} total={totalPages} onChange={setPage} />
        </div>
      </div>

      {/* View profile */}
      {viewing && (() => {
        const pos = positionOf(viewing)
        const off = officeOf(viewing)
        const rows = gapRows(viewing)
        const match = matchOf(viewing)
        return (
          <Modal
            title={`${viewing.employeeNo} · Employee Profile`}
            onClose={() => setViewingId(null)}
            footer={
              <>
                <button style={dangerBtn} onClick={() => deleteEmployee(viewing)}>Delete</button>
                {viewing.status !== 'Separated' ? (
                  <button style={ghostBtn} onClick={() => setStatus(viewing, 'Separated')}>Mark as Separated</button>
                ) : (
                  <button style={ghostBtn} onClick={() => setStatus(viewing, 'Active')}>Reactivate</button>
                )}
                <button style={{ ...primaryBtn, padding: '9px 16px', fontSize: '13px' }} onClick={() => openEdit(viewing)}>Edit Employee</button>
              </>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <span style={{ width: 52, height: 52, borderRadius: '50%', background: '#e6f0f8', color: NAVY, fontWeight: 700, fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {initialsOf(viewing)}
              </span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{viewing.firstName} {viewing.middleName} {viewing.lastName}</h3>
                <StatusPill status={viewing.status} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <DetailRow label="Position" value={pos ? `${pos.positionTitle} (SG ${pos.salaryGrade})` : '—'} />
              <DetailRow label="Employment type" value={viewing.employmentType === 'Permanent' ? 'Plantilla' : 'Contract of Service'} />
              <DetailRow label="Office" value={<>{viewing.officeCode}<div style={{ color: MUTED, fontSize: '13px' }}>{off?.officeName}</div></>} />
              <DetailRow label="Email" value={viewing.email || '—'} />
              <DetailRow label="Phone" value={viewing.phone || '—'} />
              <DetailRow label="Date hired" value={viewing.dateHired} />
              <DetailRow label="Competency match" value={`${match}% · ${matchLabel(match).text}`} />
              <DetailRow label="Competency profile" value={viewing.competencyProfile} />
            </div>
            <div style={{ fontSize: '11px', letterSpacing: '0.8px', color: MUTED, fontWeight: 600, marginBottom: '8px' }}>REQUIRED COMPETENCIES VS CURRENT LEVEL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rows.map((r) => (
                <div key={r.code} style={{ display: 'flex', justifyContent: 'space-between', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13.5px' }}>
                  <span><strong style={{ color: ACCENT }}>{r.code}</strong> {r.title}</span>
                  <span style={{ color: MUTED }}>Required L{r.required} · Current {r.current ? `L${r.current}` : 'not assessed'}</span>
                </div>
              ))}
              {rows.length === 0 && <div style={{ color: MUTED, fontSize: '13px' }}>No requirements set for this position yet.</div>}
            </div>
          </Modal>
        )
      })()}

      {/* Add / edit form */}
      {form && (
        <Modal
          title={editingId !== null ? `Edit ${form.employeeNo}` : 'Add Employee'}
          onClose={() => setForm(null)}
          footer={
            <>
              <button style={ghostBtn} onClick={() => setForm(null)}>Cancel</button>
              <button style={{ ...primaryBtn, padding: '9px 16px', fontSize: '13px' }} onClick={saveEmployee}>{editingId !== null ? 'Save Changes' : 'Add Employee'}</button>
            </>
          }
        >
          {error && <div style={errorBox}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="First name *"><input style={inputStyle} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
            <Field label="Last name *"><input style={inputStyle} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
            <Field label="Middle name"><input style={inputStyle} value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} /></Field>
            <Field label="Sex">
              <select style={inputStyle} value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value as 'Female' | 'Male' })}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </Field>
            <Field label="Employment type">
              <select
                style={inputStyle}
                value={form.employmentType}
                onChange={(e) => {
                  const employmentType = e.target.value as EmpType
                  // new employees get a matching number prefix (DOST- or COS-)
                  setForm({ ...form, employmentType, employeeNo: editingId !== null ? form.employeeNo : nextEmployeeNo(employees, employmentType) })
                }}
              >
                <option value="Permanent">Plantilla</option>
                <option value="Contract of Service">Contract of Service (COS)</option>
              </select>
            </Field>
            <Field label="Employee number"><input style={inputStyle} value={form.employeeNo} onChange={(e) => setForm({ ...form, employeeNo: e.target.value })} /></Field>
            <Field label="Email"><input style={inputStyle} type="email" value={form.email} placeholder="name@agency.dost.gov.ph" onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><input style={inputStyle} value={form.phone} placeholder="+63 9XX XXX XXXX" onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Office">
              <select style={inputStyle} value={form.officeId} onChange={(e) => setForm({ ...form, officeId: Number(e.target.value) })}>
                {db.offices.map((o) => (<option key={o.id} value={o.id}>{o.officeCode} – {o.officeName}</option>))}
              </select>
            </Field>
            <Field label="Position *">
              <select style={inputStyle} value={form.positionId} onChange={(e) => setForm({ ...form, positionId: Number(e.target.value) })}>
                {db.positions.map((p) => (<option key={p.id} value={p.id}>{p.positionTitle} (SG {p.salaryGrade})</option>))}
              </select>
            </Field>
            <Field label="Status">
              <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EmployeeStatus })}>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Separated">Separated</option>
              </select>
            </Field>
            <Field label="Date hired"><input style={inputStyle} type="date" value={form.dateHired} onChange={(e) => setForm({ ...form, dateHired: e.target.value })} /></Field>
          </div>

          {/* Current competency levels (tbl_employee_competencies) */}
          {(() => {
            const held = editingId !== null ? employees.find((x) => x.id === editingId)?.competencies ?? [] : []
            const codes = levelCodes(db, form.positionId, held)
            const levels = db.config.proficiencyLevels
            return (
              <div style={{ marginTop: '22px', borderTop: `1px solid ${BORDER}`, paddingTop: '16px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.8px', color: MUTED, fontWeight: 600, marginBottom: '4px' }}>CURRENT COMPETENCY LEVELS (OPTIONAL)</div>
                <div style={{ fontSize: '12.5px', color: MUTED, marginBottom: '10px' }}>Record the employee's current proficiency for the competencies this position requires. Leave as "Not assessed" if unknown.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                  {codes.map((code) => {
                    const c = db.competencies.find((x) => x.competencyCode === code)
                    const req = db.positionCompetencies.find((r) => r.positionId === form.positionId && r.competencyId === c?.id)
                    return (
                      <div key={code} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 190px', gap: '12px', alignItems: 'center', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 12px' }}>
                        <div style={{ fontSize: '13.5px' }}>
                          <strong style={{ color: ACCENT }}>{code}</strong> {c?.competencyName ?? code}
                          <div style={{ fontSize: '12px', color: MUTED }}>{req ? `Required: L${req.requiredLevel} ${levels[req.requiredLevel - 1]?.name ?? ''}` : 'Not required for this position'}</div>
                        </div>
                        <select style={inputStyle} value={form.levels[code] ?? 0} onChange={(e) => setForm({ ...form, levels: { ...form.levels, [code]: Number(e.target.value) } })} aria-label={`Current level for ${code}`}>
                          <option value={0}>Not assessed</option>
                          {levels.map((l, i) => <option key={l.name} value={i + 1}>L{i + 1} {l.name}</option>)}
                        </select>
                      </div>
                    )
                  })}
                  {codes.length === 0 && <div style={{ color: MUTED, fontSize: '13px' }}>This position has no required competencies yet. Map them in Position Management first.</div>}
                </div>
              </div>
            )
          })()}
        </Modal>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Screen 2: Position Management                                       */
/* ------------------------------------------------------------------ */

interface RequirementForm { competencyId: number; requiredLevel: number; priority: number }

interface PositionForm {
  positionCode: string
  positionTitle: string
  department: string
  employmentType: PositionRow['employmentType']
  status: PositionRow['status']
  salaryGrade: number
  description: string
  requirements: RequirementForm[]
}

function nextPositionCode(list: PositionRow[]) {
  const nums = list.map((p) => Number(p.positionCode.split('-')[1]) || 0)
  return `POS-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`
}

function PositionManagement({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  const home = useHome()
  const db = useDb()
  const actor = useActor()
  const [deptFilter, setDeptFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All')
  const [tab, setTab] = useState<'All' | PositionRow['employmentType']>('All')
  const [page, setPage] = useState(1)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [form, setForm] = useState<PositionForm | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const positions = db.positions
  const viewing = positions.find((p) => p.id === viewingId) ?? null
  const levels = db.config.proficiencyLevels
  const reqsOf = (p: PositionRow) => db.positionCompetencies.filter((r) => r.positionId === p.id)
  const competencyOf = (id: number) => db.competencies.find((c) => c.id === id)
  const staffOf = (p: PositionRow) => db.employees.filter((e) => e.positionId === p.id && e.status !== 'Separated')
  const departments = [...new Set(positions.map((p) => p.department).filter(Boolean))].sort()

  // Stats
  const active = positions.filter((p) => p.status === 'Active').length
  const mapped = positions.filter((p) => reqsOf(p).length > 0).length
  const assigned = positions.reduce((s, p) => s + staffOf(p).length, 0)

  // Filtering
  const q = search.trim().toLowerCase()
  const filteredNoTab = positions.filter(
    (p) =>
      (deptFilter === 'All' || p.department === deptFilter) &&
      (statusFilter === 'All' || p.status === statusFilter) &&
      (!q || [p.positionCode, p.positionTitle, p.description, p.department, ...reqsOf(p).map((r) => `${competencyOf(r.competencyId)?.competencyCode} ${competencyOf(r.competencyId)?.competencyName}`)].some((v) => (v ?? '').toLowerCase().includes(q))),
  )
  const filtered = filteredNoTab.filter((p) => tab === 'All' || p.employmentType === tab)
  const totalPages = Math.max(1, Math.ceil(filtered.length / POSITIONS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * POSITIONS_PER_PAGE, currentPage * POSITIONS_PER_PAGE)

  function resetFilters() {
    setSearch('')
    setDeptFilter('All')
    setStatusFilter('All')
    setTab('All')
    setPage(1)
  }

  function openAdd() {
    setForm({ positionCode: nextPositionCode(positions), positionTitle: '', department: departments[0] ?? '', employmentType: 'Plantilla', status: 'Active', salaryGrade: 11, description: '', requirements: [] })
    setEditingId(null)
    setError('')
  }

  function openEdit(p: PositionRow) {
    setForm({
      positionCode: p.positionCode, positionTitle: p.positionTitle, department: p.department, employmentType: p.employmentType, status: p.status, salaryGrade: p.salaryGrade, description: p.description,
      requirements: reqsOf(p).map((r) => ({ competencyId: r.competencyId, requiredLevel: r.requiredLevel, priority: r.priority })),
    })
    setEditingId(p.id)
    setViewingId(null)
    setError('')
  }

  function savePosition() {
    if (!form) return
    const code = form.positionCode.trim().toUpperCase()
    if (!code || !form.positionTitle.trim()) {
      setError('Position code and title are required.')
      return
    }
    if (form.salaryGrade < 1 || form.salaryGrade > 33) {
      setError('Salary grade must be between 1 and 33.')
      return
    }
    if (positions.some((p) => p.positionCode === code && p.id !== editingId)) {
      setError(`Position code ${code} is already used.`)
      return
    }
    if (positions.some((p) => p.positionTitle.toLowerCase() === form.positionTitle.trim().toLowerCase() && p.id !== editingId)) {
      setError('Another position already has this title.')
      return
    }
    const ids = form.requirements.map((r) => r.competencyId)
    if (new Set(ids).size !== ids.length) {
      setError('Each competency can only be listed once.')
      return
    }
    const f = { ...form, positionCode: code, positionTitle: form.positionTitle.trim(), department: form.department.trim(), description: form.description.trim() }
    save(
      (d) => {
        let id = editingId
        if (id === null) {
          id = nextNumber(d.positions.map((p) => p.id))
          d.positions.push({ id, positionCode: f.positionCode, positionTitle: f.positionTitle, description: f.description, department: f.department, employmentType: f.employmentType, status: f.status, salaryGrade: f.salaryGrade, createdAt: '', updatedAt: '' })
        } else {
          const row = d.positions.find((p) => p.id === id)!
          const oldTitle = row.positionTitle
          Object.assign(row, { positionCode: f.positionCode, positionTitle: f.positionTitle, description: f.description, department: f.department, employmentType: f.employmentType, status: f.status, salaryGrade: f.salaryGrade })
          // employees keep pointing at this position: carry the new title and salary grade over
          d.employees.forEach((e) => {
            if (e.positionTitle === oldTitle) {
              e.positionTitle = f.positionTitle
              e.salaryGrade = f.salaryGrade
            }
          })
        }
        // tbl_position_competencies: rewrite this position's rows
        d.positionCompetencies = d.positionCompetencies.filter((r) => r.positionId !== id)
        f.requirements.forEach((r) => {
          d.positionCompetencies.push({ id: nextNumber(d.positionCompetencies.map((x) => x.id)), positionId: id!, competencyId: r.competencyId, requiredLevel: r.requiredLevel, priority: r.priority, createdAt: '', updatedAt: '' })
        })
      },
      { event: 'Config Change', details: `${actor}: ${editingId === null ? 'added' : 'updated'} position ${f.positionCode} – ${f.positionTitle}` },
    )
    setForm(null)
  }

  function deletePosition(p: PositionRow) {
    const people = db.employees.filter((e) => e.positionId === p.id).length
    const analyses = db.gapAnalyses.filter((a) => a.positionId === p.id).length
    if (people > 0 || analyses > 0) {
      window.alert(`${p.positionTitle} is still used by ${people} employee record(s) and ${analyses} gap analysis record(s). Reassign the employees, or set the position to Inactive instead.`)
      return
    }
    if (!window.confirm(`Delete ${p.positionCode} – ${p.positionTitle}? This cannot be undone.`)) return
    save(
      (d) => {
        d.positions = d.positions.filter((x) => x.id !== p.id)
        d.positionCompetencies = d.positionCompetencies.filter((r) => r.positionId !== p.id)
      },
      { event: 'Config Change', details: `${actor}: deleted position ${p.positionCode}` },
    )
    setViewingId(null)
  }

  function updateRequirement(index: number, change: Partial<RequirementForm>) {
    if (!form) return
    setForm({ ...form, requirements: form.requirements.map((r, i) => (i === index ? { ...r, ...change } : r)) })
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: home }, { label: 'Organisation Data' }, { label: 'Position Management' }]}
        title="Position Management"
        description="Define positions and map the competencies and proficiency level each role requires."
        actions={<button style={primaryBtn} onClick={openAdd}><Icon name="plus" /> Add Position</button>}
      />

      <StatRow>
        <StatCard label="TOTAL POSITIONS" value={`${positions.length} Positions`} icon="building" />
        <StatCard label="ACTIVE POSITIONS" value={`${active} Active`} icon="check" />
        <StatCard label="WITH REQUIREMENTS" value={`${mapped} of ${positions.length}`} icon="gauge" accent />
        <StatCard label="EMPLOYEES ASSIGNED" value={`${assigned} Personnel`} icon="people" />
      </StatRow>

      {/* Filters */}
      <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 20px 16px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', paddingBottom: '18px', borderBottom: `1px solid ${BORDER}` }}>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search position by title, code, or required competency..." />
          <select style={selectStyle} value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1) }}>
            <option value="All">Department: All</option>
            {departments.map((d) => (<option key={d} value={d}>Department: {d}</option>))}
          </select>
          <select style={selectStyle} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive'); setPage(1) }}>
            <option value="All">Status: All</option>
            <option value="Active">Status: Active</option>
            <option value="Inactive">Status: Inactive</option>
          </select>
          <button style={{ ...ghostBtn, display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px' }} onClick={resetFilters}>
            <Icon name="filter" /> Reset
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', flexWrap: 'wrap' }}>
          <TabButton active={tab === 'All'} label="All Positions" count={filteredNoTab.length} onClick={() => { setTab('All'); setPage(1) }} />
          <TabButton active={tab === 'Plantilla'} label="Plantilla" count={filteredNoTab.filter((p) => p.employmentType === 'Plantilla').length} onClick={() => { setTab('Plantilla'); setPage(1) }} />
          <TabButton active={tab === 'Contract of Service'} label="Contract of Service" count={filteredNoTab.filter((p) => p.employmentType === 'Contract of Service').length} onClick={() => { setTab('Contract of Service'); setPage(1) }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>POSITION CODE</th>
                <th style={thStyle}>POSITION TITLE &amp; DEPARTMENT</th>
                <th style={thStyle}>SALARY GRADE</th>
                <th style={thStyle}>REQUIRED COMPETENCIES</th>
                <th style={thStyle}>EMPLOYEES</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((p) => {
                const reqs = reqsOf(p)
                return (
                  <tr key={p.id}>
                    <td style={{ ...tdStyle, color: ACCENT, fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap' }}>{p.positionCode}</td>
                    <td style={{ ...tdStyle, maxWidth: '300px' }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginBottom: '6px' }}>{p.positionTitle}</div>
                      <span style={{ background: '#f1f0ee', fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', color: '#1f2937' }}>{p.department || 'No department'}</span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, fontSize: '15px' }}>SG {p.salaryGrade}</td>
                    <td style={{ ...tdStyle, maxWidth: '260px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {reqs.map((r) => (
                          <span key={r.id} title={`${competencyOf(r.competencyId)?.competencyName} – Level ${r.requiredLevel}`} style={{ background: '#e6f5fc', color: '#0b4f73', border: '1px solid #a9dcf3', fontSize: '12.5px', padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                            {competencyOf(r.competencyId)?.competencyCode} · L{r.requiredLevel}
                          </span>
                        ))}
                        {reqs.length === 0 && <span style={{ color: '#b45309', fontSize: '13px' }}>None mapped</span>}
                      </div>
                    </td>
                    <td style={tdStyle}>{staffOf(p).length}</td>
                    <td style={tdStyle}><StatusPill status={p.status} /></td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button onClick={() => setViewingId(p.id)} style={{ background: ACCENT, color: 'white', border: 'none', borderRadius: '4px', padding: '8px 14px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        View Detail &rarr;
                      </button>
                    </td>
                  </tr>
                )
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: MUTED, padding: '40px' }}>No positions match your search or filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#f7f6f4', borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: '#374151' }}>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * POSITIONS_PER_PAGE + 1} to {Math.min(currentPage * POSITIONS_PER_PAGE, filtered.length)} of {filtered.length} Positions
          </span>
          <Pagination page={currentPage} total={totalPages} onChange={setPage} />
        </div>
      </div>

      {/* View detail */}
      {viewing && (() => {
        const incumbents = staffOf(viewing)
        const reqs = reqsOf(viewing)
        return (
          <Modal
            title={`${viewing.positionCode} · Position Detail`}
            onClose={() => setViewingId(null)}
            footer={
              <>
                <button style={dangerBtn} onClick={() => deletePosition(viewing)}>Delete</button>
                <button style={{ ...primaryBtn, padding: '9px 16px', fontSize: '13px' }} onClick={() => openEdit(viewing)}>Edit Position</button>
              </>
            }
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>{viewing.positionTitle}</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <span style={{ background: '#f1f0ee', fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>{viewing.department || 'No department'}</span>
              <StatusPill status={viewing.status} />
            </div>
            <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 16px' }}>{viewing.description || '—'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <DetailRow label="Salary grade" value={`SG ${viewing.salaryGrade}`} />
              <DetailRow label="Employment type" value={viewing.employmentType} />
              <DetailRow label="Employees" value={incumbents.length} />
            </div>
            <div style={{ fontSize: '11px', letterSpacing: '0.8px', color: MUTED, fontWeight: 600, marginBottom: '8px' }}>REQUIRED COMPETENCIES &amp; LEVEL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {reqs.map((r) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13.5px' }}>
                  <span><strong style={{ color: ACCENT }}>{competencyOf(r.competencyId)?.competencyCode}</strong> {competencyOf(r.competencyId)?.competencyName}</span>
                  <span style={{ color: MUTED }}>L{r.requiredLevel} {levels[r.requiredLevel - 1]?.name} · {PRIORITY_NAMES[r.priority]}</span>
                </div>
              ))}
              {reqs.length === 0 && <div style={{ color: '#b45309', fontSize: '13px' }}>No competencies mapped yet. Click Edit Position to add them.</div>}
            </div>
            <div style={{ fontSize: '11px', letterSpacing: '0.8px', color: MUTED, fontWeight: 600, marginBottom: '8px' }}>CURRENT INCUMBENTS ({incumbents.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {incumbents.map((e) => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', padding: '8px 12px', background: '#f7f6f4', borderRadius: '6px' }}>
                  <span><strong>{e.firstName} {e.lastName}</strong> <span style={{ color: MUTED }}>· {e.officeCode}</span></span>
                  <span style={{ color: MUTED }}>{e.employmentType} · {e.status}</span>
                </div>
              ))}
              {incumbents.length === 0 && <div style={{ color: MUTED, fontSize: '13px' }}>Nobody is assigned to this position.</div>}
            </div>
          </Modal>
        )
      })()}

      {/* Add / edit form */}
      {form && (
        <Modal
          title={editingId !== null ? `Edit ${form.positionCode}` : 'Add Position'}
          onClose={() => setForm(null)}
          footer={
            <>
              <button style={ghostBtn} onClick={() => setForm(null)}>Cancel</button>
              <button style={{ ...primaryBtn, padding: '9px 16px', fontSize: '13px' }} onClick={savePosition}>{editingId !== null ? 'Save Changes' : 'Add Position'}</button>
            </>
          }
        >
          {error && <div style={errorBox}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Position code *"><input style={inputStyle} value={form.positionCode} onChange={(e) => setForm({ ...form, positionCode: e.target.value })} /></Field>
            <Field label="Salary grade *"><input style={inputStyle} type="number" min={1} max={33} value={form.salaryGrade} onChange={(e) => setForm({ ...form, salaryGrade: Number(e.target.value) })} /></Field>
            <Field label="Position title *" full><input style={inputStyle} value={form.positionTitle} placeholder="e.g. Science Research Specialist II" onChange={(e) => setForm({ ...form, positionTitle: e.target.value })} /></Field>
            <Field label="Department">
              <input style={inputStyle} list="position-departments" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              <datalist id="position-departments">{departments.map((d) => (<option key={d} value={d} />))}</datalist>
            </Field>
            <Field label="Employment type">
              <select style={inputStyle} value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value as PositionRow['employmentType'] })}>
                <option value="Plantilla">Plantilla</option>
                <option value="Contract of Service">Contract of Service</option>
              </select>
            </Field>
            <Field label="Status">
              <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PositionRow['status'] })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Description" full>
              <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.8px', color: MUTED, fontWeight: 600 }}>REQUIRED COMPETENCIES</div>
              <button
                style={{ ...ghostBtn, padding: '6px 12px' }}
                onClick={() => {
                  const free = db.competencies.find((c) => c.status === 'Active' && !form.requirements.some((r) => r.competencyId === c.id))
                  if (free) setForm({ ...form, requirements: [...form.requirements, { competencyId: free.id, requiredLevel: 2, priority: 2 }] })
                }}
              >
                + Add competency
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {form.requirements.map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr) minmax(0, 1fr) auto', gap: '8px', alignItems: 'center' }}>
                  <select style={inputStyle} value={r.competencyId} onChange={(e) => updateRequirement(i, { competencyId: Number(e.target.value) })}>
                    {db.competencies.filter((c) => c.status === 'Active' || c.id === r.competencyId).map((c) => (<option key={c.id} value={c.id}>{c.competencyCode} – {c.competencyName}</option>))}
                  </select>
                  <select style={inputStyle} value={r.requiredLevel} onChange={(e) => updateRequirement(i, { requiredLevel: Number(e.target.value) })}>
                    {levels.map((l, k) => (<option key={l.name} value={k + 1}>L{k + 1} {l.name}</option>))}
                  </select>
                  <select style={inputStyle} value={r.priority} onChange={(e) => updateRequirement(i, { priority: Number(e.target.value) })}>
                    {[1, 2, 3].map((n) => (<option key={n} value={n}>{PRIORITY_NAMES[n]}</option>))}
                  </select>
                  <button style={{ ...ghostBtn, padding: '8px 12px' }} aria-label="Remove competency" onClick={() => setForm({ ...form, requirements: form.requirements.filter((_, k) => k !== i) })}>&times;</button>
                </div>
              ))}
              {form.requirements.length === 0 && <div style={{ color: MUTED, fontSize: '13px' }}>No competencies added yet.</div>}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Page wrapper                                                        */
/* ------------------------------------------------------------------ */

export default function EmployeePositionManagement() {
  const db = useDb()
  const [searchParams, setSearchParams] = useSearchParams()
  const isEmployee = searchParams.get('tab') !== 'positions'
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [positionSearch, setPositionSearch] = useState('')

  return (
    <RoleShell>
      <PageTabs
        active={isEmployee ? 'employees' : 'positions'}
        onChange={(key) => setSearchParams({ tab: key })}
        tabs={[
          { key: 'employees', label: 'Employee Management', count: db.employees.filter((e) => e.status !== 'Separated').length },
          { key: 'positions', label: 'Position Management', count: db.positions.length },
        ]}
      />
      {isEmployee ? <EmployeeManagement search={employeeSearch} setSearch={setEmployeeSearch} /> : <PositionManagement search={positionSearch} setSearch={setPositionSearch} />}
    </RoleShell>
  )
}
