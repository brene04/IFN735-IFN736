// Concerned Office › Gap Analysis › Request Gap Analysis Report
// The office asks the Administrative Admin for a competency gap analysis of its staff.
// Flow: Submitted → In Review (Administrative Admin) → Report Available (or Declined).
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDb, employeeName } from '../technical/techData'
import { PageHeader, Card, Field, Modal, ConfirmModal, Notice, DetailRow, StatCard, StatRow, EmptyRow, SearchBox, Icon } from '../technical/techUi'
import { inputStyle, primaryBtn, ghostBtn, dangerBtn, smallPrimaryBtn, rowBtn, rowGhostBtn, errorBox, thStyle, tdStyle, MUTED, BORDER, NAVY, formatDate, formatDateTime, relativeTime, todayIso } from '../technical/techTheme'
import { useOfficeStore, officeEmployees, employeesInScope, gapRows, submitReportRequest, cancelReportRequest, reportSteps, REPORT_PURPOSES, ASSESSMENT_PERIODS, CURRENT_OFFICE } from './officeData'
import type { Category, ReportRequest, ReportScope } from './officeData'
import { OfficeLayout, ReportStatusPill, StepTracker } from './officeUi'

type Purpose = (typeof REPORT_PURPOSES)[number]
const CATEGORIES: Category[] = ['Core', 'Functional', 'Leadership']

export default function GapReportRequestPage() {
  const navigate = useNavigate()
  const db = useDb()
  const office = useOfficeStore()
  const [params, setParams] = useSearchParams()
  const staff = officeEmployees(db.employees)
  const preset = staff.find((e) => String(e.id) === params.get('employee'))

  // Form state (pre-filled when coming from an employee's competency profile)
  const [title, setTitle] = useState(preset ? `Gap analysis - ${employeeName(preset)}` : '')
  const [scope, setScope] = useState<ReportScope>(preset ? 'Selected Employees' : 'Whole Office')
  const [positionTitle, setPositionTitle] = useState('')
  const [employeeIds, setEmployeeIds] = useState<number[]>(preset ? [preset.id] : [])
  const [categories, setCategories] = useState<Category[]>(CATEGORIES)
  const [purpose, setPurpose] = useState<Purpose>(REPORT_PURPOSES[0])
  const [period, setPeriod] = useState('FY 2025-2026') // assessment period the report covers
  const [neededBy, setNeededBy] = useState('')
  const [notes, setNotes] = useState('')
  const [pickSearch, setPickSearch] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)
  const [notice, setNotice] = useState('')

  const open = office.reports.find((r) => r.id === params.get('open'))
  const covered = employeesInScope(db.employees, { scope, positionTitle, employeeIds, officeCode: CURRENT_OFFICE.code })
  const requirementCount = covered.reduce((s, e) => s + gapRows(e, categories).length, 0)
  const officePositions = [...new Set(staff.map((e) => e.positionTitle))]
  const minDate = new Date(Date.parse(todayIso()) + 3 * 86400000).toISOString().slice(0, 10)

  const count = (f: (r: ReportRequest) => boolean) => office.reports.filter(f).length
  const done = office.reports.filter((r) => r.status === 'Report Available' && r.completedAt)
  const avgDays = done.length ? Math.round(done.reduce((s, r) => s + (Date.parse(r.completedAt!) - Date.parse(r.submittedAt)) / 86400000, 0) / done.length) : 0

  function toggleCategory(c: Category) {
    setCategories(categories.includes(c) ? categories.filter((x) => x !== c) : [...categories, c])
  }

  function validate() {
    const list: string[] = []
    if (title.trim().length < 5) list.push('Give the report a short title.')
    if (scope === 'Position' && !positionTitle) list.push('Select the position to analyse.')
    if (scope === 'Selected Employees' && employeeIds.length === 0) list.push('Select at least one employee.')
    if (categories.length === 0) list.push('Select at least one competency category.')
    if (covered.length === 0) list.push('No staff are covered by this scope.')
    if (!neededBy) list.push('Choose the date you need the report by.')
    else if (neededBy < minDate) list.push(`Allow at least 3 days - pick ${formatDate(minDate)} or later.`)
    setErrors(list)
    return list.length === 0
  }

  function submit() {
    const id = submitReportRequest({ title: title.trim(), scope, positionTitle: scope === 'Position' ? positionTitle : undefined, employeeIds: scope === 'Selected Employees' ? employeeIds : [], categories, purpose, period, neededBy, notes: notes.trim() })
    setConfirming(false)
    setTitle('')
    setScope('Whole Office')
    setEmployeeIds([])
    setNotes('')
    setNeededBy('')
    setNotice(`Report request ${id} was sent to the Administrative Admin. You will be notified when the report is available.`)
    setParams({})
  }

  const pickList = staff.filter((e) => !pickSearch.trim() || employeeName(e, true).toLowerCase().includes(pickSearch.trim().toLowerCase()))

  return (
    <OfficeLayout>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'Gap Analysis' }, { label: 'Request Gap Analysis Report' }]}
        title="Request Gap Analysis Report"
        description="Ask the Administrative Admin to analyse your staff's competencies against their position requirements. You are notified when the report is available."
        actions={
          <button style={ghostBtn} onClick={() => navigate('/office/gap-analysis/reports')}>
            <Icon name="log" size={16} /> Gap Analysis Reports
          </button>
        }
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      <StatRow>
        <StatCard label="REPORTS REQUESTED" value={office.reports.length} icon="log" />
        <StatCard label="WITH ADMINISTRATIVE ADMIN" value={count((r) => r.status === 'Submitted' || r.status === 'In Review')} unit={`${count((r) => r.status === 'In Review')} in review`} tone="warning" icon="hourglass" />
        <StatCard label="REPORTS AVAILABLE" value={count((r) => r.status === 'Report Available')} tone="success" icon="check" to="/office/gap-analysis/reports" />
        <StatCard label="AVG. TURNAROUND" value={avgDays || '-'} unit={avgDays ? 'days' : ''} tone="accent" sub="From request to report" icon="clock" />
      </StatRow>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start', marginBottom: '20px' }}>
        <Card title="New Report Request" subtitle="Choose who and what to analyse">
          {errors.length > 0 && <div style={errorBox} role="alert">{errors.map((x) => <div key={x}>• {x}</div>)}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
            <Field label="Report title *" full>
              <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. ASTI FY 2027 L&D planning gap report" />
            </Field>

            <Field label="Scope *" full>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {(['Whole Office', 'Position', 'Selected Employees'] as ReportScope[]).map((s) => (
                  <label key={s} style={{ display: 'flex', gap: '8px', alignItems: 'center', border: `1px solid ${scope === s ? NAVY : BORDER}`, background: scope === s ? '#eef4fa' : 'white', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', cursor: 'pointer' }}>
                    <input type="radio" name="scope" checked={scope === s} onChange={() => setScope(s)} />
                    {s === 'Whole Office' ? `Whole office (${staff.length})` : s === 'Position' ? 'One position' : 'Selected employees'}
                  </label>
                ))}
              </div>
            </Field>

            {scope === 'Position' && (
              <Field label="Position *" full>
                <select style={inputStyle} value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)}>
                  <option value="">Select position…</option>
                  {officePositions.map((p) => <option key={p} value={p}>{p} ({staff.filter((e) => e.positionTitle === p).length} staff)</option>)}
                </select>
              </Field>
            )}

            {scope === 'Selected Employees' && (
              <div style={{ gridColumn: '1 / -1', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <SearchBox value={pickSearch} onChange={setPickSearch} placeholder="Find employee..." />
                  <button style={ghostBtn} onClick={() => setEmployeeIds(staff.map((e) => e.id))}>Select all</button>
                  <button style={ghostBtn} onClick={() => setEmployeeIds([])}>Clear</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', maxHeight: '220px', overflowY: 'auto' }}>
                  {pickList.map((e) => (
                    <label key={e.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13.5px', padding: '5px 0' }}>
                      <input type="checkbox" checked={employeeIds.includes(e.id)} onChange={() => setEmployeeIds(employeeIds.includes(e.id) ? employeeIds.filter((x) => x !== e.id) : [...employeeIds, e.id])} />
                      <span>{employeeName(e)} <span style={{ color: MUTED }}>· {e.positionTitle}</span></span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Field label="Competency categories *">
              <div style={{ display: 'flex', gap: '14px', padding: '9px 0', flexWrap: 'wrap' }}>
                {CATEGORIES.map((c) => (
                  <label key={c} style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '14px' }}>
                    <input type="checkbox" checked={categories.includes(c)} onChange={() => toggleCategory(c)} /> {c}
                  </label>
                ))}
              </div>
            </Field>
            
            <Field label="Assessment period *">
              <select style={inputStyle} value={period} onChange={(e) => setPeriod(e.target.value)}>
                {ASSESSMENT_PERIODS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            
            <Field label="Purpose *">
              <select style={inputStyle} value={purpose} onChange={(e) => setPurpose(e.target.value as Purpose)}>
                {REPORT_PURPOSES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Needed by *" hint="At least 3 days from today">
              <input type="date" style={inputStyle} value={neededBy} min={minDate} onChange={(e) => setNeededBy(e.target.value)} />
            </Field>
            <Field label="Notes for the Administrative Admin">
              <input style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
            </Field>
          </div>

          {/* Live preview of what will be analysed */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13.5px', color: '#374151' }}>
              Covers <strong>{covered.length}</strong> employee{covered.length === 1 ? '' : 's'} and <strong>{requirementCount}</strong> competency requirement{requirementCount === 1 ? '' : 's'}.
            </span>
            <button style={primaryBtn} onClick={() => validate() && setConfirming(true)}>Submit Request</button>
          </div>
        </Card>

        <Card title="How it works">
          <StepTracker
            steps={[
              { label: 'You request', detail: 'Scope & purpose', state: 'done' },
              { label: 'Administrative Admin', detail: 'Runs the analysis', state: 'current' },
              { label: 'Report available', detail: 'View, print, export', state: 'todo' },
            ]}
          />
          <ul style={{ margin: '18px 0 0', paddingLeft: '18px', fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
            <li>The report compares each employee's current level with their position's required level (1-4).</li>
            <li>It is a snapshot: it does not change when profiles are updated later. Request a new one for fresh numbers.</li>
            <li>Staff without an assessment show as “Not Assessed”.</li>
          </ul>
        </Card>
      </div>

      {/* My report requests */}
      <Card title="My Report Requests" subtitle="Requests sent to the Administrative Admin" flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>REQUEST</th>
                <th style={thStyle}>SCOPE</th>
                <th style={thStyle}>PURPOSE</th>
                <th style={thStyle}>REQUESTED</th>
                <th style={thStyle}>NEEDED BY</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {office.reports.length === 0 && <EmptyRow colSpan={7} text="No report requests yet." />}
              {office.reports.map((r) => (
                <tr key={r.id} style={{ background: r.id === open?.id ? '#eef7fc' : undefined }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700, color: NAVY }}>{r.title}</div>
                    <div style={{ fontSize: '12px', color: MUTED }}>{r.id}</div>
                  </td>
                  <td style={tdStyle}>{r.scope}{r.positionTitle ? `: ${r.positionTitle}` : r.scope === 'Selected Employees' ? ` (${r.employeeIds.length})` : ''}</td>
                  <td style={{ ...tdStyle, fontSize: '13px' }}>{r.purpose}{r.period && <div style={{ color: MUTED, fontSize: '12px' }}>{r.period}</div>}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{relativeTime(r.submittedAt)}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDate(r.neededBy)}</td>
                  <td style={tdStyle}><ReportStatusPill status={r.status} /></td>
                  <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {r.status === 'Report Available' && <button style={{ ...rowBtn, marginRight: '6px' }} onClick={() => navigate(`/office/gap-analysis/reports/${r.id}`)}>View Report</button>}
                    <button style={rowGhostBtn} onClick={() => setParams({ open: r.id })}>Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {confirming && (
        <Modal
          title="Send report request?"
          onClose={() => setConfirming(false)}
          width={540}
          footer={
            <>
              <button style={ghostBtn} onClick={() => setConfirming(false)}>Back</button>
              <button style={smallPrimaryBtn} onClick={submit}>Send to Administrative Admin</button>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <div style={{ gridColumn: '1 / -1' }}><DetailRow label="Title" value={<strong>{title}</strong>} /></div>
            <DetailRow label="Scope" value={`${scope}${scope === 'Position' ? `: ${positionTitle}` : ''}`} />
            <DetailRow label="Employees covered" value={covered.length} />
            <DetailRow label="Categories" value={categories.join(', ')} />
            <DetailRow label="Assessment period" value={period} />
            <DetailRow label="Needed by" value={formatDate(neededBy)} />
            <div style={{ gridColumn: '1 / -1' }}><DetailRow label="Purpose" value={purpose} /></div>
          </div>
        </Modal>
      )}

      {open && <ReportRequestModal request={open} onClose={() => setParams({})} onCancelled={() => setNotice(`Report request ${open.id} was cancelled.`)} />}
    </OfficeLayout>
  )
}

function ReportRequestModal({ request: r, onClose, onCancelled }: { request: ReportRequest; onClose: () => void; onCancelled: () => void }) {
  const navigate = useNavigate()
  const db = useDb()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const people = employeesInScope(db.employees, r)
  return (
    <Modal
      title={<span style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>{r.id} <ReportStatusPill status={r.status} /></span>}
      onClose={onClose}
      width={680}
      footer={
        <>
          {r.status === 'Submitted' && <button style={dangerBtn} onClick={() => setConfirmCancel(true)}>Cancel Request</button>}
          {r.status === 'Report Available' && <button style={smallPrimaryBtn} onClick={() => navigate(`/office/gap-analysis/reports/${r.id}`)}>View Report</button>}
          <button style={ghostBtn} onClick={onClose}>Close</button>
        </>
      }
    >
      <div style={{ marginBottom: '22px' }}>
        <StepTracker steps={reportSteps(r)} />
      </div>
      {r.adminRemarks && (
        <div style={{ background: r.status === 'Declined' ? '#fdecec' : '#e9f7e9', border: `1px solid ${r.status === 'Declined' ? '#f5c2c2' : '#bfe6bf'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13.5px', marginBottom: '18px' }}>
          <strong>Administrative Admin remarks:</strong> {r.adminRemarks}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
        <div style={{ gridColumn: '1 / -1' }}><DetailRow label="Title" value={<strong>{r.title}</strong>} /></div>
        <DetailRow label="Scope" value={`${r.scope}${r.positionTitle ? `: ${r.positionTitle}` : ''}`} />
        <DetailRow label="Categories" value={r.categories.join(', ')} />
        <DetailRow label="Purpose" value={r.purpose} />
        <DetailRow label="Assessment period" value={r.period ?? '—'} />
        <DetailRow label="Needed by" value={formatDate(r.neededBy)} />
        <DetailRow label="Requested" value={formatDateTime(r.submittedAt)} />
        <DetailRow label="Requested by" value={r.submittedBy} />
        <div style={{ gridColumn: '1 / -1' }}><DetailRow label="Notes" value={r.notes || '-'} /></div>
        <div style={{ gridColumn: '1 / -1' }}>
          <DetailRow label={`Employees covered (${r.report ? r.report.employees.length : people.length})`} value={(r.report ? r.report.employees.map((e) => e.name) : people.map((e) => employeeName(e))).join(', ') || '-'} />
        </div>
      </div>
      {r.status === 'Submitted' && <p style={{ fontSize: '12.5px', color: MUTED, margin: '16px 0 0' }}>Not yet picked up - you can still cancel. Need changes? Cancel and <Link to="/office/gap-analysis" onClick={onClose} style={{ color: '#0b5f8a' }}>request again</Link>.</p>}
      {confirmCancel && (
        <ConfirmModal
          title={`Cancel ${r.id}?`}
          message="The Administrative Admin will no longer see this request."
          confirmLabel="Cancel Request"
          danger
          onClose={() => setConfirmCancel(false)}
          onConfirm={() => {
            cancelReportRequest(r.id)
            setConfirmCancel(false)
            onCancelled()
          }}
        />
      )}
    </Modal>
  )
}
