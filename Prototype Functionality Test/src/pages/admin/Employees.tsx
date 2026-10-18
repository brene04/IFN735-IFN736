// Administrative Admin / Executive › Competency Framework › Employee Competency Profiles
// Every employee across all offices with their profile status and position match.
// Same data and components as the Technical Admin and Concerned Office pages.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RoleShell from '../../components/RoleShell'
import { useDb, employeeName, officeName, offices } from '../technical/techData'
import { PageHeader, StatRow, StatCard, Card, SearchBox, Pill, TableFooter, EmptyRow, Avatar, Tabs, Notice } from '../technical/techUi'
import { selectStyle, ghostBtn, rowBtn, thStyle, tdStyle, MUTED, paginate, linkBtn, downloadCsv } from '../technical/techTheme'
import { gapRows, matchScore } from '../office/officeData'
import { MatchRing } from '../office/officeUi'

const PER_PAGE = 8
type Filter = 'all' | 'incomplete' | 'gaps'

export default function Employees() {
  const db = useDb()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [office, setOffice] = useState('All')
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [hideNote, setHideNote] = useState(false)

  const staff = db.employees.filter((e) => e.status !== 'Separated').map((e) => {
    const rows = gapRows(e)
    return { e, rows, score: matchScore(rows), major: rows.filter((r) => r.status === 'Major Gap').length, notAssessed: rows.filter((r) => r.status === 'Not Assessed').length }
  })

  const complete = staff.filter((s) => s.e.competencyProfile === 'Fully Profiled').length
  const incomplete = staff.length - complete
  const avgMatch = staff.length ? Math.round(staff.reduce((t, s) => t + s.score, 0) / staff.length) : 0
  const withGaps = staff.filter((s) => s.major > 0).length

  const q = search.trim().toLowerCase()
  const filtered = staff
    .filter((s) => office === 'All' || s.e.officeCode === office)
    .filter((s) => filter === 'all' || (filter === 'incomplete' ? s.e.competencyProfile !== 'Fully Profiled' : s.major > 0))
    .filter((s) => !q || `${employeeName(s.e, true)} ${s.e.employeeNo} ${s.e.positionTitle}`.toLowerCase().includes(q))
  const p = paginate(filtered, page, PER_PAGE)

  function exportCsv() {
    downloadCsv('employee_competency_profiles.csv', [
      ['Employee ID', 'Name', 'Office', 'Position', 'Profile', 'Match %', 'Major gaps'],
      ...filtered.map((s) => [s.e.employeeNo, employeeName(s.e, true), s.e.officeCode, s.e.positionTitle, s.e.competencyProfile, s.score, s.major]),
    ])
  }

  return (
    <RoleShell>
      <PageHeader
        crumbs={[{ label: 'Dashboard' }, { label: 'Competency Framework' }, { label: 'Employee Competency Profiles' }]}
        title="Employee Competency Profiles"
        description="Current competency levels for each employee against their position's requirements, ready for gap analysis."
        actions={<button style={ghostBtn} onClick={exportCsv}>Export CSV</button>}
      />

      <StatRow>
        <StatCard label="EMPLOYEES" value={staff.length} unit="Personnel" sub={`${new Set(staff.map((s) => s.e.officeCode)).size} offices`} icon="users" />
        <StatCard label="PROFILES COMPLETE" value={complete} unit={`${Math.round((complete / Math.max(1, staff.length)) * 100)}%`} tone="success" sub="Fully profiled employees" icon="check" />
        <StatCard label="PROFILES INCOMPLETE" value={incomplete} unit="Need levels" tone="warning" sub="Skipped by gap analysis until recorded" icon="hourglass" />
        <StatCard label="AVG. POSITION MATCH" value={`${avgMatch}%`} tone="accent" sub={`${withGaps} employees have a major gap`} icon="dashboard" />
      </StatRow>

      {incomplete > 0 && !hideNote && (
        <Notice tone="info" text={`${incomplete} employees are missing current competency levels and will be skipped by the next gap analysis.`} onClose={() => setHideNote(true)} />
      )}

      <Card style={{ marginBottom: '18px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid #eceef2' }}>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search employee by name, ID or position..." />
          <select style={selectStyle} value={office} onChange={(e) => { setOffice(e.target.value); setPage(1) }}>
            <option value="All">Office: All</option>
            {offices.map((o) => <option key={o.code} value={o.code}>Office: {o.code}</option>)}
          </select>
        </div>
        <div style={{ paddingTop: '12px' }}>
          <Tabs<Filter>
            tabs={[
              { value: 'all', label: 'All Employees', count: staff.length },
              { value: 'incomplete', label: 'Incomplete', count: incomplete },
              { value: 'gaps', label: 'Large gaps', count: withGaps },
            ]}
            active={filter}
            onChange={(f) => { setFilter(f); setPage(1) }}
          />
        </div>
      </Card>

      <Card flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>EMPLOYEE</th>
                <th style={thStyle}>OFFICE</th>
                <th style={thStyle}>POSITION</th>
                <th style={thStyle}>PROFILE</th>
                <th style={thStyle}>POSITION MATCH</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map((s) => (
                <tr key={s.e.id}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar name={employeeName(s.e)} size={38} />
                      <div>
                        <Link to={`/employees/${s.e.id}`} style={{ fontWeight: 700, color: '#111827', textDecoration: 'none' }}>{employeeName(s.e, true)}</Link>
                        <div style={{ color: MUTED, fontSize: '12.5px' }}>{s.e.employeeNo}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700 }}>{s.e.officeCode}</div>
                    <div style={{ color: MUTED, fontSize: '12.5px', maxWidth: '180px' }}>{officeName(s.e.officeCode)}</div>
                  </td>
                  <td style={tdStyle}>
                    <div>{s.e.positionTitle}</div>
                    <div style={{ color: MUTED, fontSize: '12.5px' }}>SG {s.e.salaryGrade}</div>
                  </td>
                  <td style={tdStyle}><Pill text={s.e.competencyProfile} /></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MatchRing value={s.score} size={42} />
                      <span style={{ fontSize: '12.5px', color: MUTED }}>{s.major ? `${s.major} major gap${s.major === 1 ? '' : 's'}` : s.notAssessed ? `${s.notAssessed} not assessed` : 'No major gaps'}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button style={rowBtn} onClick={() => navigate(`/employees/${s.e.id}`)}>View Profile &rarr;</button>
                  </td>
                </tr>
              ))}
              {p.rows.length === 0 && <EmptyRow colSpan={6} text="No employees match your search or filters." />}
            </tbody>
          </table>
        </div>
        <TableFooter from={p.from} to={p.to} total={filtered.length} label="employees" page={p.current} totalPages={p.totalPages} onPage={setPage} />
      </Card>
      <div style={{ marginTop: '14px', textAlign: 'right' }}><Link to="/gap-analysis" style={linkBtn}>Run Gap Analysis &rarr;</Link></div>
    </RoleShell>
  )
}
