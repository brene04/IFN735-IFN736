// Administrative Admin › Analysis & Reporting › Office Report Requests
// Gap analysis report requests sent by Concerned Offices.
// Flow: Submitted → Start review (In Review) → Generate & send report (Report Available) — or Decline.
// The report is a snapshot of the current employee competency data (see generateReport in ../office/officeData).
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/authContext'
import RoleShell from '../../components/RoleShell'
import { useDb, employeeName } from '../technical/techData'
import { PageHeader, Card, StatCard, StatRow, Tabs, SearchBox, Modal, Notice, DetailRow, Field, EmptyRow, Icon } from '../technical/techUi'
import { inputStyle, thStyle, tdStyle, rowBtn, rowGhostBtn, ghostBtn, smallPrimaryBtn, errorBox, MUTED, BORDER, NAVY, formatDate, formatDateTime, relativeTime, todayIso } from '../technical/techTheme'
import { useOfficeStore, startReportReview, generateReport, declineReport, buildGapReport, summariseReport, employeesInScope, reportSteps } from '../office/officeData'
import type { ReportRequest } from '../office/officeData'
import { ReportStatusPill, StepTracker, MatchRing } from '../office/officeUi'

type View = 'open' | 'done' | 'all'

export default function OfficeReportRequestsPage() {
  const office = useOfficeStore()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<View>('open')
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')

  const visible = office.reports.filter((r) => r.status !== 'Cancelled')
  const isOpen = (r: ReportRequest) => r.status === 'Submitted' || r.status === 'In Review'
  const q = search.trim().toLowerCase()
  const rows = visible
    .filter((r) => (view === 'open' ? isOpen(r) : view === 'done' ? !isOpen(r) : true))
    .filter((r) => !q || `${r.id} ${r.title} ${r.officeCode} ${r.purpose}`.toLowerCase().includes(q))
    .sort((a, b) => (isOpen(a) && isOpen(b) ? a.neededBy.localeCompare(b.neededBy) : b.submittedAt.localeCompare(a.submittedAt)))
  const selected = visible.find((r) => r.id === params.get('open'))
  const count = (f: (r: ReportRequest) => boolean) => visible.filter(f).length
  const today = todayIso()

  return (
    <RoleShell>
      <PageHeader
        crumbs={[{ label: 'Administrative Admin', to: '/admin/dashboard' }, { label: 'Analysis & Reporting' }, { label: 'Office Report Requests' }]}
        title="Office Report Requests"
        description="Gap analysis reports requested by Concerned Offices. Review the scope, generate the report from current competency data, and send it back to the office."
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      <StatRow>
        <StatCard label="NEW REQUESTS" value={count((r) => r.status === 'Submitted')} tone="warning" icon="mail" />
        <StatCard label="IN REVIEW" value={count((r) => r.status === 'In Review')} tone="accent" icon="hourglass" />
        <StatCard label="REPORTS SENT" value={count((r) => r.status === 'Report Available')} tone="success" icon="check" />
        <StatCard label="OVERDUE" value={count((r) => isOpen(r) && r.neededBy < today)} unit="Past needed-by date" tone="danger" icon="alert" />
      </StatRow>

      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: '#f7f6f4', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '4px' }}>
            <Tabs
              tabs={[
                { value: 'open' as View, label: 'To do', count: count(isOpen) },
                { value: 'done' as View, label: 'Completed', count: count((r) => !isOpen(r)) },
                { value: 'all' as View, label: 'All', count: visible.length },
              ]}
              active={view}
              onChange={setView}
            />
          </div>
          <SearchBox value={search} onChange={setSearch} placeholder="Search by request, title or office..." />
        </div>
      </Card>

      <Card flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>REQUEST</th>
                <th style={thStyle}>OFFICE</th>
                <th style={thStyle}>SCOPE</th>
                <th style={thStyle}>PURPOSE</th>
                <th style={thStyle}>REQUESTED</th>
                <th style={thStyle}>NEEDED BY</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={8} text={view === 'open' ? 'No report requests waiting.' : 'Nothing here yet.'} />}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700, color: NAVY }}>{r.title}</div>
                    <div style={{ fontSize: '12px', color: MUTED }}>{r.id}</div>
                  </td>
                  <td style={tdStyle}>{r.officeCode}</td>
                  <td style={{ ...tdStyle, fontSize: '13px' }}>{r.scope}{r.positionTitle ? `: ${r.positionTitle}` : r.scope === 'Selected Employees' ? ` (${r.employeeIds.length})` : ''}</td>
                  <td style={{ ...tdStyle, fontSize: '13px' }}>{r.purpose}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{relativeTime(r.submittedAt)}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: isOpen(r) && r.neededBy < today ? '#b91c1c' : undefined, fontWeight: isOpen(r) && r.neededBy < today ? 700 : 400 }}>{formatDate(r.neededBy)}</td>
                  <td style={tdStyle}><ReportStatusPill status={r.status} /></td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button style={isOpen(r) ? rowBtn : rowGhostBtn} onClick={() => setParams({ open: r.id })}>{isOpen(r) ? 'Process' : 'View'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <ProcessModal
          key={selected.id}
          request={selected}
          onClose={() => setParams({})}
          onDone={(text) => {
            setNotice(text)
            setParams({})
          }}
        />
      )}
    </RoleShell>
  )
}

function ProcessModal({ request: r, onClose, onDone }: { request: ReportRequest; onClose: () => void; onDone: (text: string) => void }) {
  const db = useDb()
  const { user } = useAuth()
  const me = user?.name ?? 'Administrative Admin'
  const [remarks, setRemarks] = useState(r.adminRemarks ?? '')
  const [error, setError] = useState('')
  const open = r.status === 'Submitted' || r.status === 'In Review'

  // Preview: what the report will contain if generated now (or the saved snapshot if already sent)
  const preview = r.report ?? buildGapReport(db.employees, r, me)
  const s = summariseReport(preview)
  const topGaps = [...s.byCompetency].filter((c) => c.withGap > 0).sort((a, b) => b.withGap - a.withGap).slice(0, 4)
  const covered = employeesInScope(db.employees, r)

  function generate() {
    if (covered.length === 0) {
      setError('No employees are in scope — decline the request instead.')
      return
    }
    generateReport(r.id, me, remarks.trim())
    onDone(`Report ${r.id} generated and sent to ${r.officeCode}.`)
  }

  function decline() {
    if (remarks.trim().length < 5) {
      setError('Add remarks explaining why the request is declined.')
      return
    }
    declineReport(r.id, me, remarks.trim())
    onDone(`Report request ${r.id} declined.`)
  }

  return (
    <Modal
      title={<span style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>{r.id} <ReportStatusPill status={r.status} /></span>}
      onClose={onClose}
      width={780}
      footer={
        open ? (
          <>
            {r.status === 'Submitted' && <button style={ghostBtn} onClick={() => startReportReview(r.id, me)}>Start Review</button>}
            <button style={{ ...ghostBtn, color: '#b91c1c', border: '1px solid #fecaca' }} onClick={decline}>Decline</button>
            <button style={smallPrimaryBtn} onClick={generate}><Icon name="check" size={16} /> Generate &amp; Send Report</button>
          </>
        ) : (
          <button style={ghostBtn} onClick={onClose}>Close</button>
        )
      }
    >
      <div style={{ marginBottom: '20px' }}>
        <StepTracker steps={reportSteps(r)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 20px', marginBottom: '18px' }}>
        <div style={{ gridColumn: '1 / -1' }}><DetailRow label="Title" value={<strong>{r.title}</strong>} /></div>
        <DetailRow label="Office" value={r.officeCode} />
        <DetailRow label="Requested by" value={r.submittedBy} />
        <DetailRow label="Requested" value={formatDateTime(r.submittedAt)} />
        <DetailRow label="Scope" value={`${r.scope}${r.positionTitle ? `: ${r.positionTitle}` : ''}`} />
        <DetailRow label="Categories" value={r.categories.join(', ')} />
        <DetailRow label="Needed by" value={formatDate(r.neededBy)} />
        <DetailRow label="Purpose" value={r.purpose} />
        <div style={{ gridColumn: 'span 2' }}><DetailRow label="Notes" value={r.notes || '—'} /></div>
      </div>

      {/* Preview of the analysis */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', letterSpacing: '1px', color: MUTED, fontWeight: 700, marginBottom: '12px' }}>{r.report ? 'REPORT SENT' : 'PREVIEW (CURRENT DATA)'}</div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <MatchRing value={s.avgMatch} size={78} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '6px 24px', fontSize: '13.5px' }}>
            <span><strong>{s.employees}</strong> employees</span>
            <span><strong style={{ color: '#a12424' }}>{s.gaps}</strong> gaps</span>
            <span><strong style={{ color: '#0a6b0a' }}>{s.meeting}</strong> meeting</span>
            <span><strong style={{ color: '#0b5f8a' }}>{s.exceeding}</strong> exceeding</span>
          </div>
        </div>
        {topGaps.length > 0 && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#374151' }}>
            <strong>Widest gaps:</strong> {topGaps.map((g) => `${g.title} (${g.withGap} staff)`).join(' · ')}
          </div>
        )}
        <div style={{ marginTop: '8px', fontSize: '12.5px', color: MUTED }}>
          Staff: {(r.report ? r.report.employees.map((e) => e.name) : covered.map((e) => employeeName(e))).join(', ') || '—'}
        </div>
      </div>

      {open ? (
        <>
          {error && <div style={errorBox}>{error}</div>}
          <Field label="Remarks to the office (shown on the report; required when declining)">
            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={remarks} onChange={(e) => { setRemarks(e.target.value); setError('') }} placeholder="e.g. Key findings or recommended priorities" />
          </Field>
        </>
      ) : (
        r.adminRemarks && <DetailRow label="Remarks" value={r.adminRemarks} />
      )}
    </Modal>
  )
}
