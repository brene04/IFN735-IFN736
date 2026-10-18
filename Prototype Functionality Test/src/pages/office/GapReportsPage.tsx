// Concerned Office › Gap Analysis › Gap Analysis Reports ("Report Available")
// Lists the reports the Administrative Admin has prepared for the office,
// plus the requests that are still being worked on.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader, Card, SearchBox, Icon } from '../technical/techUi'
import { primaryBtn, selectStyle, smallPrimaryBtn, MUTED, BORDER, NAVY, formatDate, relativeTime } from '../technical/techTheme'
import { useOfficeStore, summariseReport, reportSteps, REPORT_PURPOSES } from './officeData'
import { OfficeLayout, MatchRing, ReportStatusPill, StepTracker } from './officeUi'

export default function GapReportsPage() {
  const navigate = useNavigate()
  const office = useOfficeStore()
  const [search, setSearch] = useState('')
  const [purpose, setPurpose] = useState('All')

  const q = search.trim().toLowerCase()
  const available = office.reports
    .filter((r) => r.status === 'Report Available' && r.report)
    .filter((r) => (!q || `${r.id} ${r.title} ${r.positionTitle ?? ''}`.toLowerCase().includes(q)) && (purpose === 'All' || r.purpose === purpose))
  const inProgress = office.reports.filter((r) => r.status === 'Submitted' || r.status === 'In Review')

  return (
    <OfficeLayout>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'Gap Analysis' }, { label: 'Gap Analysis Reports' }]}
        title="Gap Analysis Reports"
        description="Competency gap reports prepared for your office by the Administrative Admin."
        actions={
          <button style={primaryBtn} onClick={() => navigate('/office/gap-analysis')}>
            <Icon name="plus" size={16} /> Request New Report
          </button>
        }
      />

      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search reports by title or ID..." />
          <select style={selectStyle} value={purpose} onChange={(e) => setPurpose(e.target.value)} aria-label="Purpose">
            <option value="All">Purpose: All</option>
            {REPORT_PURPOSES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </Card>

      <h2 style={{ fontSize: '13px', letterSpacing: '1px', color: MUTED, margin: '0 0 12px', fontWeight: 700 }}>AVAILABLE REPORTS ({available.length})</h2>
      {available.length === 0 && (
        <Card style={{ marginBottom: '24px' }}>
          <p style={{ margin: 0, color: MUTED }}>No reports {q || purpose !== 'All' ? 'match these filters' : 'yet'}. <Link to="/office/gap-analysis" style={{ color: '#0b5f8a', fontWeight: 600 }}>Request one</Link>.</p>
        </Card>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        {available.map((r) => {
          const s = summariseReport(r.report!)
          return (
            <div key={r.id} style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
              {!r.viewedByOffice && <span style={{ position: 'absolute', top: 16, right: 16, background: '#0ca30c', color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>NEW</span>}
              <div>
                <div style={{ fontSize: '12px', color: MUTED }}>{r.id} · {r.purpose}</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: NAVY, marginTop: '4px', paddingRight: '50px' }}>{r.title}</div>
                <div style={{ fontSize: '13px', color: '#374151', marginTop: '4px' }}>{r.scope}{r.positionTitle ? `: ${r.positionTitle}` : ''} · {r.categories.join(', ')}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <MatchRing value={s.avgMatch} size={70} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 18px', fontSize: '13px' }}>
                  <span><strong>{s.employees}</strong> employees</span>
                  <span><strong style={{ color: '#a12424' }}>{s.gaps}</strong> competency gaps</span>
                  <span><strong style={{ color: '#0a6b0a' }}>{s.meeting}</strong> meeting</span>
                  <span><strong style={{ color: '#0b5f8a' }}>{s.exceeding}</strong> exceeding</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${BORDER}`, paddingTop: '12px', marginTop: 'auto' }}>
                <span style={{ fontSize: '12px', color: MUTED }}>Prepared by {r.report!.generatedBy}<br />{formatDate(r.report!.generatedAt)}</span>
                <button style={smallPrimaryBtn} onClick={() => navigate(`/office/gap-analysis/reports/${r.id}`)}>View Report</button>
              </div>
            </div>
          )
        })}
      </div>

      <h2 style={{ fontSize: '13px', letterSpacing: '1px', color: MUTED, margin: '0 0 12px', fontWeight: 700 }}>BEING PREPARED ({inProgress.length})</h2>
      {inProgress.length === 0 && <Card><p style={{ margin: 0, color: MUTED }}>No requests in progress.</p></Card>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {inProgress.map((r) => (
          <Card key={r.id}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(320px, 1.4fr)', gap: '24px', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Link to={`/office/gap-analysis?open=${r.id}`} style={{ fontWeight: 700, color: NAVY, textDecoration: 'none', fontSize: '15px' }}>{r.title}</Link>
                  <ReportStatusPill status={r.status} />
                </div>
                <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '4px' }}>{r.id} · requested {relativeTime(r.submittedAt)} · needed by {formatDate(r.neededBy)}</div>
              </div>
              <StepTracker steps={reportSteps(r)} />
            </div>
          </Card>
        ))}
      </div>
    </OfficeLayout>
  )
}
