// Concerned Office › Gap Analysis › Gap Analysis Reports › (report)
// A finished gap analysis report (snapshot saved by the Administrative Admin):
// KPIs, required vs current per competency, gap distribution, per-employee results,
// recommendations, CSV export and print.
import { Fragment, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader, Card, StatCard, StatRow, Icon } from '../technical/techUi'
import { ghostBtn, primaryBtn, thStyle, tdStyle, infoBox, MUTED, BORDER, NAVY, formatDate, formatDateTime, downloadCsv } from '../technical/techTheme'
import { useOfficeStore, summariseReport, matchScore, markReportViewed, competencyByCode, resultCounts } from './officeData'
import type { ReportRequest } from './officeData'
import { OfficeLayout, CompareBars, StackedBar, MatchRing, GapPill, CategoryTag, PriorityTag, LevelBlocks } from './officeUi'

export default function GapReportViewPage() {
  const { id } = useParams()
  const office = useOfficeStore()
  const request = office.reports.find((r) => r.id === id)

  // Opening the report clears its "NEW" badge and notification
  useEffect(() => {
    if (id) markReportViewed(id)
  }, [id])

  return (
    <OfficeLayout>
      {request?.report && request.status === 'Report Available' ? (
        <ReportView request={request} />
      ) : (
        <>
          <PageHeader crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'Gap Analysis' }, { label: 'Gap Analysis Reports', to: '/office/gap-analysis/reports' }, { label: id ?? '' }]} title="Report not available" />
          <Card>
            <p style={{ margin: 0 }}>
              {request ? `${request.id} is "${request.status}" — the Administrative Admin has not finished this report yet.` : 'This report does not exist.'}{' '}
              <Link to={request ? `/office/gap-analysis?open=${request.id}` : '/office/gap-analysis/reports'} style={{ color: '#0b5f8a', fontWeight: 600 }}>{request ? 'Track the request' : 'Back to reports'}</Link>
            </p>
          </Card>
        </>
      )}
    </OfficeLayout>
  )
}

function ReportView({ request: r }: { request: ReportRequest }) {
  const navigate = useNavigate()
  const report = r.report!
  const s = summariseReport(report)
  const [expanded, setExpanded] = useState<number | null>(null)

  // One row per employee, in the same format as the database report (sorted by employee no.)
  const people = report.employees.map((e) => ({ ...e, score: matchScore(e.rows), counts: resultCounts(e.rows) })).sort((a, b) => a.employeeNo.localeCompare(b.employeeNo))
  const pct = (n: number) => (s.rows ? Math.round((n / s.rows) * 100) : 0)
  const widest = [...s.byCompetency].sort((a, b) => b.withGap - a.withGap || (b.required - b.current) - (a.required - a.current)).filter((c) => c.withGap > 0).slice(0, 3)
  const notAssessedPeople = people.filter((p) => p.rows.some((x) => x.status === 'Not Assessed'))

  function exportCsv() {
    downloadCsv(`${r.id}_gap_report.csv`, [
      ['Report', r.title],
      ['Generated', formatDateTime(report.generatedAt), 'By', report.generatedBy],
      [],
      ['employee_no', 'employee_name', 'position_title', 'total_competencies', 'competency_gaps', 'competencies_meeting_requirement', 'competencies_exceeding_requirement', 'not_assessed', 'match_percent'],
      ...people.map((p) => [p.employeeNo, p.name, p.positionTitle, p.counts.total, p.counts.gaps, p.counts.meeting, p.counts.exceeding, p.counts.notAssessed, p.score]),
      [],
      ['Employee No.', 'Employee', 'Position', 'Code', 'Competency', 'Category', 'Priority', 'Required', 'Current', 'Gap', 'Status'],
      ...report.employees.flatMap((e) => e.rows.map((x) => [e.employeeNo, e.name, e.positionTitle, x.code, x.title, x.category, x.priority, x.required, x.current || 'Not assessed', x.gap, x.status])),
    ])
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'Gap Analysis' }, { label: 'Gap Analysis Reports', to: '/office/gap-analysis/reports' }, { label: r.id }]}
        title={r.title}
        description={<>{r.period ? `${r.period} · ` : ''}{r.scope}{r.positionTitle ? `: ${r.positionTitle}` : ''} · {r.categories.join(', ')} competencies · prepared by <strong>{report.generatedBy}</strong> on {formatDateTime(report.generatedAt)}</>}
        actions={
          <>
            <button style={ghostBtn} onClick={exportCsv}><Icon name="download" size={16} /> Export CSV</button>
            <button style={ghostBtn} onClick={() => window.print()}>Print</button>
            <button style={primaryBtn} onClick={() => navigate('/office/gap-analysis')}>Request Updated Report</button>
          </>
        }
      />

      {r.adminRemarks && (
        <div style={{ ...infoBox, marginBottom: '20px' }}>
          <strong>Administrative Admin remarks:</strong> {r.adminRemarks}
        </div>
      )}

      <StatRow>
        <StatCard label="EMPLOYEES ANALYSED" value={s.employees} unit={`${s.rows} competencies`} sub={`Average position match ${s.avgMatch}%`} icon="users" />
        <StatCard label="COMPETENCY GAPS" value={s.gaps} unit={`${pct(s.gaps)}%`} tone="danger" sub={`${s.major} major · ${s.minor} minor`} icon="alert" />
        <StatCard label="MEETING REQUIREMENT" value={s.meeting} unit={`${pct(s.meeting)}%`} tone="success" sub="Assessed level equals the required level" icon="check" />
        <StatCard label="EXCEEDING REQUIREMENT" value={s.exceeding} unit={`${pct(s.exceeding)}%`} tone="accent" sub="Assessed level above the required level" icon="shield" />
      </StatRow>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <Card title="Required vs. Current by Competency" subtitle="Average levels across the staff who need each competency (blue mark = required)">
          <CompareBars items={s.byCompetency.map((c) => ({ label: c.title, sub: `${c.withGap} of ${c.staff} below`, required: c.required, current: c.current }))} />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Gap Distribution" subtitle="All requirement checks in this report">
            <StackedBar
              segments={[
                { label: 'Competency gaps', value: s.gaps, color: '#d03b3b' },
                { label: 'Meeting', value: s.meeting, color: '#0ca30c' },
                { label: 'Exceeding', value: s.exceeding, color: '#2a78d6' },
                { label: 'Not assessed', value: s.notAssessed, color: '#9ca3af' },
              ]}
            />
          </Card>
          <Card title="Recommendations" subtitle="Generated from the results">
            <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: '#374151', lineHeight: 1.6 }}>
              {widest.map((c) => (
                <li key={c.code}>
                  Prioritise <strong>{c.title}</strong> training — {c.withGap} staff below the required level (avg {c.current ? c.current.toFixed(1) : '—'} vs {c.required.toFixed(1)}).
                </li>
              ))}
              {notAssessedPeople.length > 0 && (
                <li>
                  Complete competency assessments for <strong>{notAssessedPeople.length}</strong> employee{notAssessedPeople.length === 1 ? '' : 's'} with missing levels ({notAssessedPeople.slice(0, 3).map((p) => p.name.split(' ')[0]).join(', ')}{notAssessedPeople.length > 3 ? '…' : ''}).
                </li>
              )}
              {widest.length === 0 && notAssessedPeople.length === 0 && <li>All requirements are met. Keep levels current through the annual assessment.</li>}
            </ol>
          </Card>
        </div>
      </div>

      {/* Gap analysis results — one row per employee, same columns as the database report */}
      <Card title="Gap Analysis Results" subtitle="One row per employee · select a row to see each competency" flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>EMPLOYEE NO.</th>
                <th style={thStyle}>EMPLOYEE NAME</th>
                <th style={thStyle}>POSITION TITLE</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>TOTAL COMPETENCIES</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>COMPETENCY GAPS</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>MEETING REQUIREMENT</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>EXCEEDING REQUIREMENT</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>MATCH</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => {
                const isOpen = expanded === p.employeeId
                const num = { ...tdStyle, textAlign: 'center' as const, fontWeight: 700, fontSize: '15px' }
                return (
                  <Fragment key={p.employeeId}>
                    <tr onClick={() => setExpanded(isOpen ? null : p.employeeId)} style={{ cursor: 'pointer', background: isOpen ? '#f2f9fd' : undefined }}>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: '#0b5f8a', fontWeight: 600 }}>
                        <span style={{ color: MUTED, marginRight: '8px' }}>{isOpen ? '▾' : '▸'}</span>
                        {p.employeeNo}
                      </td>
                      <td style={tdStyle}>
                        <Link to={`/office/employees/${p.employeeId}`} onClick={(ev) => ev.stopPropagation()} style={{ fontWeight: 700, color: '#0f2442', textDecoration: 'none' }}>{p.name}</Link>
                        {p.counts.notAssessed > 0 && <div style={{ fontSize: '12px', color: MUTED }}>{p.counts.notAssessed} not yet assessed</div>}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '13px' }}>{p.positionTitle}</td>
                      <td style={num}>{p.counts.total}</td>
                      <td style={{ ...num, color: p.counts.gaps ? '#a12424' : '#111827' }}>{p.counts.gaps}</td>
                      <td style={{ ...num, color: '#0a6b0a' }}>{p.counts.meeting}</td>
                      <td style={{ ...num, color: '#0b5f8a' }}>{p.counts.exceeding}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}><MatchRing value={p.score} size={44} /></td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={8} style={{ padding: '6px 20px 16px 44px', background: '#f9fbfd', borderBottom: `1px solid ${BORDER}` }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <tbody>
                              {p.rows.map((x) => (
                                <tr key={x.code}>
                                  <td style={{ padding: '7px 8px', fontWeight: 600, color: NAVY, width: '50px' }}>{x.code}</td>
                                  <td style={{ padding: '7px 8px' }}>{competencyByCode(x.code)?.title}</td>
                                  <td style={{ padding: '7px 8px' }}><CategoryTag category={x.category} /></td>
                                  <td style={{ padding: '7px 8px' }}><PriorityTag priority={x.priority} /></td>
                                  <td style={{ padding: '7px 8px' }}><LevelBlocks current={x.current} required={x.required} /></td>
                                  <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>{x.current || '—'} / {x.required}</td>
                                  <td style={{ padding: '7px 8px' }}>
                                    {x.current > x.required ? (
                                      <span style={{ background: '#e6f0fb', color: '#0b5f8a', border: '1px solid #bcd6f2', fontSize: '12.5px', fontWeight: 600, padding: '3px 11px', borderRadius: '999px' }}>Exceeds</span>
                                    ) : (
                                      <GapPill status={x.status} />
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {/* Totals row */}
              <tr style={{ background: '#f1f0ee' }}>
                <td style={{ ...tdStyle, fontWeight: 800 }} colSpan={3}>TOTAL ({s.employees} employees)</td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800 }}>{s.rows}</td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, color: '#a12424' }}>{s.gaps}</td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, color: '#0a6b0a' }}>{s.meeting}</td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, color: '#0b5f8a' }}>{s.exceeding}</td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800 }}>{s.avgMatch}%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', fontSize: '12.5px', color: MUTED, borderTop: `1px solid ${BORDER}` }}>
          Gap = assessed level below the required level · Meeting = equal · Exceeding = above (levels 1–4). Snapshot taken {formatDate(report.generatedAt)}; request an updated report for current figures.
        </div>
      </Card>
    </>
  )
}
