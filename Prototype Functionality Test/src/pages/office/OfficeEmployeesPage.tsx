// Concerned Office › My Employees › Employees ("View Employee")
// Read-only directory of the office's staff with filters, CSV export and shortcuts
// to the employee's profile, competency profile and change requests.
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDb, employeeName, positions } from '../technical/techData'
import { PageHeader, Card, StatCard, StatRow, Pill, Avatar, SearchBox, TableFooter, EmptyRow, Icon } from '../technical/techUi'
import { primaryBtn, ghostBtn, selectStyle, thStyle, tdStyle, rowBtn, linkBtn, MUTED, BORDER, paginate, downloadCsv } from '../technical/techTheme'
import { officeEmployees, gapRows, matchScore, useOfficeStore, CURRENT_OFFICE } from './officeData'
import { OfficeLayout } from './officeUi'

const PER_PAGE = 8

export default function OfficeEmployeesPage() {
  const navigate = useNavigate()
  const db = useDb()
  const office = useOfficeStore()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [position, setPosition] = useState('All')
  const [profile, setProfile] = useState('All')
  const [assessment, setAssessment] = useState('All')
  const [status, setStatus] = useState(params.get('status') ?? 'Current')
  const [page, setPage] = useState(1)
  const [menuFor, setMenuFor] = useState<number | null>(null) // row whose "⋯" menu is open

  const all = officeEmployees(db.employees, true)
  const current = all.filter((e) => e.status !== 'Separated')

  // Filters (search matches name, employee no., email and position)
  const q = search.trim().toLowerCase()
  const rows = all.filter((e) => {
    if (q && !`${employeeName(e, true)} ${employeeName(e)} ${e.employeeNo} ${e.email} ${e.positionTitle}`.toLowerCase().includes(q)) return false
    if (position !== 'All' && e.positionTitle !== position) return false
    if (profile !== 'All' && e.competencyProfile !== profile) return false
    if (assessment !== 'All' && e.assessmentStatus !== assessment) return false
    if (status === 'Current' && e.status === 'Separated') return false
    if (status !== 'Current' && status !== 'All' && e.status !== status) return false
    return true
  })
  const pg = paginate(rows, page, PER_PAGE)

  const fully = current.filter((e) => e.competencyProfile === 'Fully Profiled').length
  const due = current.filter((e) => e.assessmentStatus === 'Pending' || e.assessmentStatus === 'Overdue').length
  const withMajorGap = current.filter((e) => gapRows(e).some((r) => r.status === 'Major Gap')).length
  const pendingFor = (id: number) => office.requests.find((r) => r.employeeId === id && (r.status === 'Pending' || r.status === 'Under Review'))

  const applied = [
    q && { label: `Search: “${search.trim()}”`, clear: () => setSearch('') },
    position !== 'All' && { label: `Position: ${position}`, clear: () => setPosition('All') },
    profile !== 'All' && { label: `Profile: ${profile}`, clear: () => setProfile('All') },
    assessment !== 'All' && { label: `Assessment: ${assessment}`, clear: () => setAssessment('All') },
    status !== 'Current' && { label: `Status: ${status}`, clear: () => setStatus('Current') },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  function clearAll() {
    setSearch('')
    setPosition('All')
    setProfile('All')
    setAssessment('All')
    setStatus('Current')
    setPage(1)
    setParams({})
  }

  function exportCsv() {
    downloadCsv(`${CURRENT_OFFICE.acronym}_employees.csv`, [
      ['Employee No.', 'Name', 'Email', 'Position', 'SG', 'Employment', 'Status', 'Competency Profile', 'Assessment', 'Position Match %'],
      ...rows.map((e) => [e.employeeNo, employeeName(e, true), e.email, e.positionTitle, e.salaryGrade, e.employmentType, e.status, e.competencyProfile, e.assessmentStatus, e.competencies.length ? matchScore(gapRows(e)) : '']),
    ])
  }

  const filterLabel = { fontSize: '12px', fontWeight: 700, letterSpacing: '0.8px', color: '#374151', marginBottom: '6px' } as const

  return (
    <OfficeLayout>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'My Employees' }, { label: 'Employees' }]}
        title="Employee Directory"
        description={`Personnel of ${CURRENT_OFFICE.name}. View profiles and competency information; changes are requested from the Technical Admin.`}
        actions={
          <>
            <button style={ghostBtn} onClick={exportCsv}>
              <Icon name="download" size={16} /> Export Roster / CSV
            </button>
            
            <button style={ghostBtn} onClick={() => navigate('/office/gap-analysis')}>
              <Icon name="log" size={16} /> Request Competency Report
            </button>

            <button style={primaryBtn} onClick={() => navigate('/office/requests/new-employee')}>
              <Icon name="plus" size={16} /> Request Employee Addition
            </button>
          </>
        }
      />

      <StatRow>
        <StatCard label="TOTAL REGISTERED PERSONNEL" value={current.length} icon="users" />
        <StatCard label="PROFILES COMPLETED" value={fully} unit={`${current.length ? ((fully / current.length) * 100).toFixed(1) : 0}% Calibrated`} tone="accent" icon="id" />
        <StatCard label="ASSESSMENT PENDING / DUE" value={due} unit={due ? 'Action Required' : 'All done'} tone={due ? 'warning' : 'success'} icon="hourglass" />
        <StatCard label="CRITICAL COMPETENCY GAP" value={withMajorGap} unit="Staff affected" tone="danger" sub="2 or more levels below requirement" icon="alert" to="/office/employee-competencies" />
      </StatRow>

      {/* Filters */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: '240px' }}>
            <div style={filterLabel}>EMPLOYEE SEARCH</div>
            <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by name, employee no., email or position..." />
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <div style={filterLabel}>POSITION TITLE</div>
            <select style={{ ...selectStyle, width: '100%', minWidth: 0 }} value={position} onChange={(e) => { setPosition(e.target.value); setPage(1) }}>
              <option value="All">All Positions</option>
              {positions.filter((p) => all.some((e) => e.positionTitle === p.title)).map((p) => <option key={p.title}>{p.title}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <div style={filterLabel}>COMPETENCY PROFILE</div>
            <select style={{ ...selectStyle, width: '100%', minWidth: 0 }} value={profile} onChange={(e) => { setProfile(e.target.value); setPage(1) }}>
              <option value="All">Competency: All</option>
              <option>Fully Profiled</option>
              <option>Partially Profiled</option>
              <option>Not Profiled</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <div style={filterLabel}>ASSESSMENT STATUS</div>
            <select style={{ ...selectStyle, width: '100%', minWidth: 0 }} value={assessment} onChange={(e) => { setAssessment(e.target.value); setPage(1) }}>
              <option value="All">Status: All</option>
              <option>Completed</option>
              <option>Pending</option>
              <option>Overdue</option>
              <option>Not Started</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <div style={filterLabel}>EMPLOYMENT STATUS</div>
            <select style={{ ...selectStyle, width: '100%', minWidth: 0 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
              <option value="Current">Current staff</option>
              <option>Active</option>
              <option>On Leave</option>
              <option>Separated</option>
              <option value="All">All (incl. separated)</option>
            </select>
          </div>
          <button title="Clear filters" aria-label="Clear filters" onClick={clearAll} style={{ ...ghostBtn, padding: '10px 12px' }}>
            <Icon name="filter" size={16} />
          </button>
        </div>
        {applied.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', borderTop: `1px solid ${BORDER}`, marginTop: '16px', paddingTop: '14px' }}>
            <span style={{ color: MUTED, fontSize: '14px' }}>Applied Filters:</span>
            {applied.map((a) => (
              <span key={a.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eef6fb', border: '1px solid #bfdcef', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', color: '#0b3d5c' }}>
                {a.label}
                <button onClick={() => { a.clear(); setPage(1) }} aria-label={`Remove ${a.label}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0b3d5c', fontSize: '15px', padding: 0 }}>&times;</button>
              </span>
            ))}
            <button style={{ ...linkBtn, marginLeft: 'auto', textDecoration: 'underline' }} onClick={clearAll}>Clear all</button>
          </div>
        )}
      </Card>

      {/* Directory table */}
      <Card flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>E.ID</th>
                <th style={thStyle}>EMPLOYEE NAME &amp; EMAIL</th>
                <th style={thStyle}>POSITION / SALARY GRADE</th>
                <th style={thStyle}>COMPETENCY PROFILE</th>
                <th style={thStyle}>ASSESSMENT STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pg.rows.length === 0 && <EmptyRow colSpan={6} text="No employees match these filters." />}
              {pg.rows.map((e) => {
                const pending = pendingFor(e.id)
                return (
                  <tr key={e.id} style={{ opacity: e.status === 'Separated' ? 0.6 : 1 }}>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontSize: '13px' }}>{e.employeeNo}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar name={employeeName(e)} />
                        <div style={{ minWidth: 0 }}>
                          <Link to={`/office/employees/${e.id}`} style={{ fontWeight: 700, color: '#0f2442', textDecoration: 'none' }}>{employeeName(e, true)}</Link>
                          <div style={{ fontSize: '12.5px', color: MUTED }}>{e.email}</div>
                          {(e.status !== 'Active' || pending) && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                              {e.status !== 'Active' && <Pill text={e.status} />}
                              {pending && <Link to={`/office/requests?open=${pending.id}`} style={{ textDecoration: 'none' }}><Pill text={`${pending.type} request ${pending.status.toLowerCase()}`} tone="accent" /></Link>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ color: '#111827' }}>{e.positionTitle}</div>
                      <div style={{ fontSize: '12.5px', color: MUTED }}>SG {e.salaryGrade} · {e.employmentType === 'Permanent' ? 'Permanent' : 'COS'}</div>
                    </td>
                    <td style={tdStyle}><Pill text={e.competencyProfile} dot={false} /></td>
                    <td style={tdStyle}><Pill text={e.assessmentStatus} /></td>
                    <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap', position: 'relative' }}>
                      <button style={rowBtn} onClick={() => navigate(`/office/employees/${e.id}`)}>View Profile ›</button>
                      <button
                        aria-label={`More actions for ${employeeName(e)}`}
                        onClick={() => setMenuFor(menuFor === e.id ? null : e.id)}
                        style={{ ...ghostBtn, padding: '6px 10px', marginLeft: '6px', fontSize: '15px', lineHeight: 1 }}
                      >
                        ⋯
                      </button>
                      {menuFor === e.id && (
                        <div onMouseLeave={() => setMenuFor(null)} style={{ position: 'absolute', right: '16px', top: '52px', background: 'white', border: `1px solid ${BORDER}`, borderRadius: '8px', boxShadow: '0 10px 24px rgba(0,0,0,0.12)', zIndex: 10, minWidth: '220px', textAlign: 'left', padding: '6px' }}>
                          {[
                            { label: 'Competency information', to: `/office/employees/${e.id}?tab=competencies` },
                            { label: 'Competency profile vs position', to: `/office/competency-profiles?employee=${e.id}` },
                            ...(e.status !== 'Separated'
                              ? [
                                  { label: 'Request profile update', to: `/office/requests/update-employee?employee=${e.id}` },
                                  { label: 'Request removal', to: `/office/requests/remove-employee?employee=${e.id}` },
                                ]
                              : []),
                          ].map((m) => (
                            <Link key={m.label} to={m.to} style={{ display: 'block', padding: '8px 10px', borderRadius: '6px', fontSize: '13.5px', color: m.label === 'Request removal' ? '#b91c1c' : '#1f2937', textDecoration: 'none' }}>
                              {m.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <TableFooter from={pg.from} to={pg.to} total={rows.length} label="personnel records" page={pg.current} totalPages={pg.totalPages} onPage={setPage} />
      </Card>
    </OfficeLayout>
  )
}
