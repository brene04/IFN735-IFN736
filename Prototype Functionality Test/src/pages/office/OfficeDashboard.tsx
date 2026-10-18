// Concerned Office › Dashboard
// First page after login. Summarises the office's workforce, competency readiness,
// open requests to the Technical Admin and gap analysis reports from the Administrative Admin.
import { Link, useNavigate } from 'react-router-dom'
import { useDb, employeeName } from '../technical/techData'
import { PageHeader, Card, StatCard, StatRow, Icon } from '../technical/techUi'
import { primaryBtn, ghostBtn, linkBtn, MUTED, BORDER, NAVY, CHART_BLUE, relativeTime } from '../technical/techTheme'
import { useOfficeStore, officeEmployees, gapRows, matchScore, COMPETENCIES, CURRENT_OFFICE, requestPerson } from './officeData'
import type { Category } from './officeData'
import { OfficeLayout, CompareBars, StackedBar, MatchRing, RequestStatusPill, ReportStatusPill, RequestTypeTag } from './officeUi'

export default function OfficeDashboard() {
  const navigate = useNavigate()
  const db = useDb()
  const office = useOfficeStore()
  const staff = officeEmployees(db.employees)

  // Each employee compared with their position's requirements
  const profiles = staff.map((e) => ({ e, rows: gapRows(e) }))
  const allRows = profiles.flatMap((p) => p.rows)
  const assessedProfiles = profiles.filter((p) => p.rows.some((r) => r.current > 0))
  const avgMatch = assessedProfiles.length ? Math.round(assessedProfiles.reduce((s, p) => s + matchScore(p.rows), 0) / assessedProfiles.length) : 0

  const permanent = staff.filter((e) => e.employmentType === 'Permanent').length
  const fully = staff.filter((e) => e.competencyProfile === 'Fully Profiled').length
  const openRequests = office.requests.filter((r) => r.status === 'Pending' || r.status === 'Under Review')
  const reportsInProgress = office.reports.filter((r) => r.status === 'Submitted' || r.status === 'In Review').length

  // Required vs actual, averaged per category (only assessed competencies count towards "actual")
  const categories: Category[] = ['Core', 'Functional', 'Leadership']
  const byCategory = categories
    .map((c) => {
      const list = allRows.filter((r) => r.category === c)
      const assessed = list.filter((r) => r.current > 0)
      return {
        label: `${c} Competencies`,
        sub: `${list.length} requirement${list.length === 1 ? '' : 's'}`,
        required: list.length ? list.reduce((s, r) => s + r.required, 0) / list.length : 0,
        current: assessed.length ? assessed.reduce((s, r) => s + r.current, 0) / assessed.length : 0,
        count: list.length,
      }
    })
    .filter((c) => c.count > 0)

  // Competencies with the most staff below the required level
  const topGaps = COMPETENCIES.map((c) => {
    const list = allRows.filter((r) => r.code === c.code)
    const short = list.filter((r) => r.status === 'Minor Gap' || r.status === 'Major Gap')
    return { c, staff: list.length, short: short.length, avgGap: short.length ? short.reduce((s, r) => s + r.gap, 0) / short.length : 0 }
  })
    .filter((g) => g.short > 0)
    .sort((a, b) => b.short - a.short || b.avgGap - a.avgGap)
    .slice(0, 4)

  const assess = (s: string) => staff.filter((e) => e.assessmentStatus === s).length
  const lowestMatch = [...assessedProfiles].sort((a, b) => matchScore(a.rows) - matchScore(b.rows)).slice(0, 4)

  return (
    <OfficeLayout>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'Dashboard' }]}
        title="Dashboard"
        description={`${CURRENT_OFFICE.name} (${CURRENT_OFFICE.code}) · workforce, competency readiness and the status of your requests.`}
        actions={
          <>
            <button style={ghostBtn} onClick={() => navigate('/office/gap-analysis')}>
              <Icon name="log" size={16} /> Request Gap Analysis Report
            </button>
            <button style={primaryBtn} onClick={() => navigate('/office/requests/new-employee')}>
              <Icon name="plus" size={16} /> Request Employee Addition
            </button>
          </>
        }
      />

      {/* KPI cards - each opens the page with the details */}
      <StatRow>
        <StatCard label="TOTAL STAFF" value={staff.length} unit="Personnel" sub={`${permanent} Permanent · ${staff.length - permanent} Contract of Service`} icon="users" to="/office/employees" />
        <StatCard label="COMPETENCY PROFILED" value={`${staff.length ? Math.round((fully / staff.length) * 100) : 0}%`} unit={`${fully} of ${staff.length}`} tone="accent" sub="Employees with a complete competency profile" icon="id" to="/office/employee-competencies" />
        <StatCard label="AVG. POSITION MATCH" value={`${avgMatch}%`} tone={avgMatch >= 80 ? 'success' : 'warning'} sub="Current vs required proficiency" icon="check" to="/office/competency-profiles" />
        <StatCard label="OPEN REQUESTS" value={openRequests.length} unit={openRequests.length ? 'Pending' : 'None'} tone={openRequests.length ? 'warning' : 'success'} sub={`${reportsInProgress} gap report${reportsInProgress === 1 ? '' : 's'} in progress`} icon="hourglass" to="/office/requests" />
      </StatRow>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <Card title="Required vs. Actual Proficiency" subtitle="Average across your staff, levels 1 to 4 (blue mark = required level)">
          <CompareBars items={byCategory} />
        </Card>
        <Card
          title="Top Competency Gaps"
          subtitle="Competencies where most staff are below their position's requirement"
          right={<Link to="/office/employee-competencies" style={linkBtn}>View matrix ›</Link>}
        >
          {topGaps.length === 0 && <p style={{ color: MUTED, fontSize: '13.5px' }}>No gaps - every assessed competency meets its requirement.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topGaps.map((g, i) => (
              <div key={g.c.code}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                  <Link to={`/office/competencies?open=${g.c.code}`} style={{ fontWeight: 700, color: '#111827', fontSize: '14px', textDecoration: 'none' }}>{g.c.title}</Link>
                  <span style={{ background: i === 0 ? '#fdecec' : '#f3f4f6', color: i === 0 ? '#a12424' : '#374151', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>Gap: -{g.avgGap.toFixed(1)} avg</span>
                </div>
                <div style={{ height: 8, background: '#eef0f3', borderRadius: '999px' }}>
                  <div style={{ width: `${(g.short / Math.max(1, g.staff)) * 100}%`, height: '100%', background: i === 0 ? '#d03b3b' : CHART_BLUE, borderRadius: '999px' }} />
                </div>
                <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '4px' }}>{g.short} of {g.staff} staff below requirement</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
        <Card title="Assessment Status" subtitle="Current assessment cycle">
          <StackedBar
            segments={[
              { label: 'Completed', value: assess('Completed'), color: CHART_BLUE },
              { label: 'Pending', value: assess('Pending'), color: '#fab219' },
              { label: 'Overdue', value: assess('Overdue'), color: '#d03b3b' },
              { label: 'Not started', value: assess('Not Started'), color: '#9ca3af' },
            ]}
          />
          <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: '16px', paddingTop: '12px' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.8px', color: MUTED, fontWeight: 700, marginBottom: '8px' }}>LOWEST POSITION MATCH</div>
            {lowestMatch.map(({ e, rows }) => (
              <Link key={e.id} to={`/office/competency-profiles?employee=${e.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', textDecoration: 'none', color: '#111827' }}>
                <MatchRing value={matchScore(rows)} size={40} />
                <span style={{ fontSize: '13px', lineHeight: 1.3 }}>
                  <strong>{employeeName(e)}</strong>
                  <div style={{ color: MUTED, fontSize: '12px' }}>{e.positionTitle}</div>
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Recent Requests" subtitle="Sent to the Technical Admin" right={<Link to="/office/requests" style={linkBtn}>View all ›</Link>}>
          {office.requests.length === 0 && <p style={{ color: MUTED, fontSize: '13.5px' }}>No requests yet.</p>}
          {office.requests.slice(0, 5).map((r) => (
            <Link key={r.id} to={`/office/requests?open=${r.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #eceef2', textDecoration: 'none', color: '#111827' }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <RequestTypeTag type={r.type} />
                  <strong style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{requestPerson(r, db.employees)}</strong>
                </span>
                <span style={{ fontSize: '12px', color: MUTED }}>{r.id} · {relativeTime(r.submittedAt)}</span>
              </span>
              <RequestStatusPill status={r.status} />
            </Link>
          ))}
        </Card>

        <Card title="Gap Analysis Reports" subtitle="Prepared by the Administrative Admin" right={<Link to="/office/gap-analysis/reports" style={linkBtn}>All reports ›</Link>}>
          {office.reports.length === 0 && <p style={{ color: MUTED, fontSize: '13.5px' }}>No report requests yet.</p>}
          {office.reports.slice(0, 4).map((r) => (
            <Link
              key={r.id}
              to={r.status === 'Report Available' ? `/office/gap-analysis/reports/${r.id}` : `/office/gap-analysis?open=${r.id}`}
              style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid #eceef2', textDecoration: 'none', color: '#111827' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px' }}>{r.title}</strong>
                <ReportStatusPill status={r.status} />
              </div>
              <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>{r.id} · {r.scope}{r.positionTitle ? `: ${r.positionTitle}` : ''}</div>
            </Link>
          ))}
          <button style={{ ...ghostBtn, width: '100%', justifyContent: 'center', marginTop: '14px', color: NAVY }} onClick={() => navigate('/office/gap-analysis')}>
            Request a new report
          </button>
        </Card>
      </div>
    </OfficeLayout>
  )
}
