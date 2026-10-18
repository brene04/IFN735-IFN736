// Concerned Office › My Employees › Employees › (employee)
// "View Employee" + "View Employee Competency Information" for one staff member.
// Tabs: Overview · Competencies · History · Requests. Read-only - changes are requested.
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDb, employeeName, officeName } from '../technical/techData'
import type { Employee } from '../technical/techData'
import { PageHeader, Card, Pill, Avatar, Tabs, DetailRow, EmptyRow, Icon } from '../technical/techUi'
import { primaryBtn, ghostBtn, dangerBtn, thStyle, tdStyle, linkBtn, infoBox, MUTED, NAVY, formatDate, relativeTime, nowMs } from '../technical/techTheme'
import { useOfficeStore, officeEmployees, gapRows, matchScore, requirementsFor, competencyByCode, gapStatusOf, requestSummary } from './officeData'
import { OfficeLayout, MatchRing, GapPill, LevelBlocks, CategoryTag, PriorityTag, RequestStatusPill, RequestTypeTag } from './officeUi'

type Tab = 'overview' | 'competencies' | 'history' | 'requests'
const TABS: Tab[] = ['overview', 'competencies', 'history', 'requests']

export default function OfficeEmployeeDetailsPage() {
  const { id } = useParams()
  const db = useDb()
  const employee = officeEmployees(db.employees, true).find((e) => String(e.id) === id)

  return (
    <OfficeLayout>
      {employee ? (
        <EmployeeDetails key={employee.id} employee={employee} />
      ) : (
        <>
          <PageHeader crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'My Employees' }, { label: 'Employees', to: '/office/employees' }, { label: 'Not found' }]} title="Employee not found" />
          <Card>
            <p style={{ margin: 0, color: '#374151' }}>
              This employee does not exist or is not part of your office. <Link to="/office/employees" style={linkBtn}>Back to the directory</Link>
            </p>
          </Card>
        </>
      )}
    </OfficeLayout>
  )
}

function EmployeeDetails({ employee: e }: { employee: Employee }) {
  const navigate = useNavigate()
  const db = useDb()
  const office = useOfficeStore()
  const [params, setParams] = useSearchParams()
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'overview'

  const rows = gapRows(e)
  const score = matchScore(rows)
  const history = db.history.filter((h) => h.employeeId === e.id).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))
  const requests = office.requests.filter((r) => r.employeeId === e.id)
  const openRequest = requests.find((r) => r.status === 'Pending' || r.status === 'Under Review')
  const years = Math.floor((nowMs() - new Date(e.dateHired).getTime()) / (365.25 * 86400000))

  // All competencies to show: everything the position requires + anything else the employee has
  const required = requirementsFor(e.positionTitle)
  const competencyList = [
    ...required.map((r) => ({ code: r.code, required: r.level as number | null, priority: r.priority })),
    ...e.competencies.filter((c) => !required.some((r) => r.code === c.code)).map((c) => ({ code: c.code, required: null as number | null, priority: null })),
  ]

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'My Employees' }, { label: 'Employees', to: '/office/employees' }, { label: employeeName(e) }]}
        title={employeeName(e, true)}
        description={`${e.positionTitle} · ${officeName(e.officeCode)}`}
        actions={
          e.status !== 'Separated' && (
            <>
              <button style={ghostBtn} onClick={() => navigate(`/office/requests/update-employee?employee=${e.id}`)}>
                <Icon name="edit" size={16} /> Request Update
              </button>
              <button style={dangerBtn} onClick={() => navigate(`/office/requests/remove-employee?employee=${e.id}`)}>
                <Icon name="userx" size={16} /> Request Removal
              </button>
              <button style={primaryBtn} onClick={() => navigate(`/office/competency-profiles?employee=${e.id}`)}>
                Competency Profile ›
              </button>
            </>
          )
        }
      />

      {openRequest && (
        <div style={{ ...infoBox, marginBottom: '18px' }}>
          <strong>{openRequest.id}</strong> ({openRequest.type}) is {openRequest.status.toLowerCase()} with the Technical Admin.{' '}
          <Link to={`/office/requests?open=${openRequest.id}`} style={{ color: '#0b3d5c', fontWeight: 700 }}>Track request</Link>
        </div>
      )}

      {/* Summary card */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Avatar name={employeeName(e)} size={72} />
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: NAVY }}>{employeeName(e, true)}</div>
            <div style={{ color: MUTED, fontSize: '13.5px', margin: '3px 0 10px' }}>{e.employeeNo} · {e.email}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Pill text={e.status} />
              <Pill text={e.competencyProfile} dot={false} />
              <Pill text={`Assessment: ${e.assessmentStatus}`} tone={e.assessmentStatus === 'Completed' ? 'success' : e.assessmentStatus === 'Overdue' ? 'danger' : e.assessmentStatus === 'Pending' ? 'warning' : 'neutral'} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '8px 28px' }}>
            <DetailRow label="Salary grade" value={`SG ${e.salaryGrade}`} />
            <DetailRow label="Employment" value={e.employmentType} />
            <DetailRow label="Years of service" value={years < 1 ? 'Less than 1' : years} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <MatchRing value={score} />
            <div style={{ fontSize: '12px', color: MUTED }}>Position match</div>
          </div>
        </div>
      </Card>

      <div style={{ marginBottom: '16px' }}>
        <Tabs
          tabs={[
            { value: 'overview', label: 'Overview' },
            { value: 'competencies', label: 'Competencies', count: competencyList.length },
            { value: 'history', label: 'History', count: history.length },
            { value: 'requests', label: 'Requests', count: requests.length },
          ]}
          active={tab}
          onChange={(t) => setParams(t === 'overview' ? {} : { tab: t })}
        />
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Card title="Personal Information">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
              <DetailRow label="First name" value={e.firstName} />
              <DetailRow label="Middle name" value={e.middleName || '-'} />
              <DetailRow label="Last name" value={e.lastName} />
              <DetailRow label="Sex" value={e.sex} />
              <DetailRow label="Date of birth" value={formatDate(e.birthDate)} />
              <DetailRow label="Phone" value={e.phone} />
              <div style={{ gridColumn: '1 / -1' }}><DetailRow label="Email" value={e.email} /></div>
              <div style={{ gridColumn: '1 / -1' }}><DetailRow label="Home address" value={e.address} /></div>
            </div>
          </Card>
          <Card title="Employment">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
              <DetailRow label="Employee no." value={e.employeeNo} />
              <DetailRow label="Office" value={e.officeCode} />
              <div style={{ gridColumn: '1 / -1' }}>
                <DetailRow label="Position" value={<Link to={`/office/position-requirements?position=${encodeURIComponent(e.positionTitle)}`} style={{ ...linkBtn, fontSize: '14px' }}>{e.positionTitle}</Link>} />
              </div>
              <DetailRow label="Salary grade" value={e.salaryGrade} />
              <DetailRow label="Employment type" value={e.employmentType} />
              <DetailRow label="Date hired" value={formatDate(e.dateHired)} />
              <DetailRow label="Status" value={<Pill text={e.status} />} />
            </div>
            <p style={{ fontSize: '12.5px', color: MUTED, margin: '18px 0 0' }}>
              Something wrong? <Link to={`/office/requests/update-employee?employee=${e.id}`} style={linkBtn}>Request an update</Link> - the Technical Admin reviews and applies it.
            </p>
          </Card>
        </div>
      )}

      {tab === 'competencies' && (
        <Card
          title="Employee Competency Information"
          subtitle={`${e.competencies.length} competencies assessed · ${rows.filter((r) => r.status === 'Meets').length} of ${rows.length} position requirements met`}
          right={<Link to={`/office/competency-profiles?employee=${e.id}`} style={linkBtn}>Compare with position ›</Link>}
          flush
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>CODE</th>
                  <th style={thStyle}>COMPETENCY</th>
                  <th style={thStyle}>CATEGORY</th>
                  <th style={thStyle}>CURRENT LEVEL</th>
                  <th style={thStyle}>REQUIRED</th>
                  <th style={thStyle}>STATUS</th>
                  <th style={thStyle}>EVIDENCE</th>
                </tr>
              </thead>
              <tbody>
                {competencyList.length === 0 && <EmptyRow colSpan={7} text="No competency data yet." />}
                {competencyList.map((item) => {
                  const c = competencyByCode(item.code)!
                  const held = e.competencies.find((x) => x.code === item.code)
                  const current = held?.level ?? 0
                  return (
                    <tr key={item.code}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: NAVY }}>{c.code}</td>
                      <td style={tdStyle}>
                        <Link to={`/office/competencies?open=${c.code}`} style={{ fontWeight: 600, color: '#111827', textDecoration: 'none' }}>{c.title}</Link>
                        {item.priority && <div style={{ marginTop: '3px' }}><PriorityTag priority={item.priority} /></div>}
                      </td>
                      <td style={tdStyle}><CategoryTag category={c.category} /></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <LevelBlocks current={current} required={item.required ?? undefined} />
                          <span style={{ fontSize: '13px', color: '#374151' }}>{current ? `L${current} ${db.config.proficiencyLevels[current - 1]?.name ?? ''}` : '-'}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>{item.required ? `L${item.required}` : <span style={{ color: MUTED }}>Not required</span>}</td>
                      <td style={tdStyle}>{item.required ? <GapPill status={gapStatusOf(item.required, current)} /> : <Pill text="Additional" tone="neutral" dot={false} />}</td>
                      <td style={{ ...tdStyle, fontSize: '12.5px', color: '#374151' }}>
                        {held ? (<>{held.evidence}<div style={{ color: MUTED }}>Updated {formatDate(held.lastUpdated)}</div></>) : <span style={{ color: MUTED }}>Not yet assessed</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'history' && (
        <Card title="Employment History" subtitle="From the historical records (tbl_historical_records)" flush>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>EFFECTIVE DATE</th>
                <th style={thStyle}>TYPE</th>
                <th style={thStyle}>DESCRIPTION</th>
                <th style={thStyle}>RECORDED BY</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && <EmptyRow colSpan={4} text="No history records." />}
              {history.map((h) => (
                <tr key={h.id}>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDate(h.effectiveDate)}</td>
                  <td style={tdStyle}><Pill text={h.recordType} tone="navy" dot={false} /></td>
                  <td style={tdStyle}>{h.description}</td>
                  <td style={tdStyle}>{h.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'requests' && (
        <Card title="Requests About This Employee" subtitle="Sent by your office to the Technical Admin" flush>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>REQUEST</th>
                <th style={thStyle}>TYPE</th>
                <th style={thStyle}>DETAILS</th>
                <th style={thStyle}>SUBMITTED</th>
                <th style={thStyle}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && <EmptyRow colSpan={5} text="No requests for this employee." />}
              {requests.map((r) => (
                <tr key={r.id}>
                  <td style={tdStyle}><Link to={`/office/requests?open=${r.id}`} style={{ ...linkBtn, fontSize: '14px' }}>{r.id}</Link></td>
                  <td style={tdStyle}><RequestTypeTag type={r.type} /></td>
                  <td style={tdStyle}>{requestSummary(r)}</td>
                  <td style={tdStyle}>{relativeTime(r.submittedAt)}</td>
                  <td style={tdStyle}><RequestStatusPill status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}
