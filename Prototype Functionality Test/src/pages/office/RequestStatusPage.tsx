// Concerned Office › Requests › Request Status
// Tracks every addition / update / removal request sent to the Technical Admin.
// Opening a request (?open=ER-2026-015) shows its progress, details and the admin's remarks.
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDb, employeeName, UPDATE_FIELDS } from '../technical/techData'
import { PageHeader, Card, StatCard, StatRow, Tabs, SearchBox, Modal, ConfirmModal, Notice, DetailRow, TableFooter, EmptyRow, Icon } from '../technical/techUi'
import { primaryBtn, ghostBtn, dangerBtn, selectStyle, thStyle, tdStyle, rowGhostBtn, MUTED, BORDER, NAVY, formatDateTime, relativeTime, paginate, downloadCsv, formatDate } from '../technical/techTheme'
import { useOfficeStore, cancelStaffRequest, requestSummary, requestPerson, CURRENT_OFFICE } from './officeData'
import type { RequestType, StaffRequest, StepState } from './officeData'
import { OfficeLayout, RequestStatusPill, RequestTypeTag, StepTracker } from './officeUi'

type TypeTab = 'All' | RequestType
const PER_PAGE = 8

export default function RequestStatusPage() {
  const navigate = useNavigate()
  const db = useDb()
  const office = useOfficeStore()
  const [params, setParams] = useSearchParams()
  const [type, setType] = useState<TypeTab>('All')
  const [status, setStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState(params.get('submitted') ? `Request ${params.get('open')} was sent to the Technical Admin.` : '')

  const open = office.requests.find((r) => r.id === params.get('open'))
  const q = search.trim().toLowerCase()
  const rows = office.requests.filter((r) => {
    if (type !== 'All' && r.type !== type) return false
    if (status === 'Open' && r.status !== 'Pending' && r.status !== 'Under Review') return false
    if (status !== 'All' && status !== 'Open' && r.status !== status) return false
    if (q && !`${r.id} ${requestPerson(r, db.employees)} ${requestSummary(r)}`.toLowerCase().includes(q)) return false
    return true
  })
  const pg = paginate(rows, page, PER_PAGE)
  const count = (f: (r: StaffRequest) => boolean) => office.requests.filter(f).length

  function exportCsv() {
    downloadCsv(`${CURRENT_OFFICE.acronym}_requests.csv`, [
      ['Request', 'Type', 'Employee', 'Details', 'Submitted', 'Status', 'Reviewed by', 'Remarks'],
      ...rows.map((r) => [r.id, r.type, requestPerson(r, db.employees), requestSummary(r), formatDateTime(r.submittedAt), r.status, r.reviewedBy ?? '', r.remarks ?? '']),
    ])
  }

  return (
    <OfficeLayout>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'Requests' }, { label: 'Request Status' }]}
        title="Request Status"
        description="Follow the employee addition, update and removal requests your office sent to the Technical Admin."
        actions={
          <>
            <button style={ghostBtn} onClick={exportCsv}><Icon name="download" size={16} /> Export CSV</button>
            <button style={primaryBtn} onClick={() => navigate('/office/requests/new-employee')}><Icon name="plus" size={16} /> New Request</button>
          </>
        }
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      <StatRow>
        <StatCard label="TOTAL REQUESTS" value={office.requests.length} icon="log" />
        <StatCard label="AWAITING TECHNICAL ADMIN" value={count((r) => r.status === 'Pending' || r.status === 'Under Review')} unit={`${count((r) => r.status === 'Under Review')} under review`} tone="warning" icon="hourglass" />
        <StatCard label="APPROVED" value={count((r) => r.status === 'Approved')} unit="Applied" tone="success" icon="check" />
        <StatCard label="REJECTED" value={count((r) => r.status === 'Rejected')} unit="Needs action" tone="danger" icon="alert" />
      </StatRow>

      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: '#f7f6f4', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '4px' }}>
            <Tabs
              tabs={(['All', 'Addition', 'Update', 'Removal'] as TypeTab[]).map((t) => ({ value: t, label: t, count: t === 'All' ? office.requests.length : count((r) => r.type === t) }))}
              active={type}
              onChange={(t) => { setType(t); setPage(1) }}
            />
          </div>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by request ID, employee or details..." />
          <select style={selectStyle} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} aria-label="Status">
            <option value="All">Status: All</option>
            <option value="Open">Open (pending / under review)</option>
            <option>Pending</option>
            <option>Under Review</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Cancelled</option>
          </select>
        </div>
      </Card>

      <Card flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>REQUEST</th>
                <th style={thStyle}>TYPE</th>
                <th style={thStyle}>EMPLOYEE</th>
                <th style={thStyle}>DETAILS</th>
                <th style={thStyle}>SUBMITTED</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pg.rows.length === 0 && <EmptyRow colSpan={7} text="No requests match these filters." />}
              {pg.rows.map((r) => (
                <tr key={r.id} style={{ background: r.id === open?.id ? '#eef7fc' : undefined }}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap' }}>
                    {r.id}
                    {r.priority === 'Urgent' && <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 700 }}>URGENT</div>}
                  </td>
                  <td style={tdStyle}><RequestTypeTag type={r.type} /></td>
                  <td style={tdStyle}>
                    {r.employeeId ? <Link to={`/office/employees/${r.employeeId}`} style={{ fontWeight: 600, color: '#111827', textDecoration: 'none' }}>{requestPerson(r, db.employees)}</Link> : <span style={{ fontWeight: 600 }}>{requestPerson(r, db.employees)}</span>}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '13px', color: '#374151', maxWidth: '280px' }}>{requestSummary(r)}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{relativeTime(r.submittedAt)}</td>
                  <td style={tdStyle}>
                    <RequestStatusPill status={r.status} />
                    {r.reviewedBy && r.status !== 'Pending' && <div style={{ fontSize: '11.5px', color: MUTED, marginTop: '3px' }}>by {r.reviewedBy}</div>}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button style={rowGhostBtn} onClick={() => setParams({ open: r.id })}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TableFooter from={pg.from} to={pg.to} total={rows.length} label="requests" page={pg.current} totalPages={pg.totalPages} onPage={setPage} />
      </Card>

      {open && <RequestModal request={open} onClose={() => setParams({})} onCancelled={(id) => setNotice(`Request ${id} was cancelled.`)} />}
    </OfficeLayout>
  )
}

// Progress steps for a request
function stepsFor(r: StaffRequest): { label: string; detail?: string; state: StepState }[] {
  const decided = r.status === 'Approved' || r.status === 'Rejected'
  return [
    { label: 'Submitted', detail: formatDateTime(r.submittedAt), state: 'done' },
    {
      label: 'Technical Admin review',
      detail: r.status === 'Cancelled' ? 'Cancelled by your office' : r.reviewStartedAt ? `${r.reviewedBy ?? ''} · ${formatDateTime(r.reviewStartedAt)}` : r.status === 'Pending' ? 'Waiting in queue' : r.reviewedBy,
      state: r.status === 'Cancelled' ? 'failed' : decided ? 'done' : 'current',
    },
    {
      label: r.status === 'Rejected' ? 'Rejected' : r.status === 'Approved' ? 'Approved & applied' : 'Decision',
      detail: r.reviewedAt ? formatDateTime(r.reviewedAt) : undefined,
      state: r.status === 'Approved' ? 'done' : r.status === 'Rejected' ? 'failed' : 'todo',
    },
  ]
}

function RequestModal({ request: r, onClose, onCancelled }: { request: StaffRequest; onClose: () => void; onCancelled: (id: string) => void }) {
  const navigate = useNavigate()
  const db = useDb()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const retryPath = r.type === 'Addition' ? '/office/requests/new-employee' : r.type === 'Update' ? `/office/requests/update-employee?employee=${r.employeeId}` : `/office/requests/remove-employee?employee=${r.employeeId}`

  return (
    <Modal
      title={<span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{r.id} <RequestTypeTag type={r.type} /> <RequestStatusPill status={r.status} /></span>}
      onClose={onClose}
      width={720}
      footer={
        <>
          {r.status === 'Pending' && <button style={dangerBtn} onClick={() => setConfirmCancel(true)}>Cancel Request</button>}
          {r.status === 'Rejected' && <button style={ghostBtn} onClick={() => navigate(retryPath)}>Submit a New Request</button>}
          {r.status === 'Approved' && r.employeeId && <button style={ghostBtn} onClick={() => navigate(`/office/employees/${r.employeeId}`)}>Open Employee</button>}
          <button style={ghostBtn} onClick={onClose}>Close</button>
        </>
      }
    >
      <div style={{ marginBottom: '22px' }}>
        <StepTracker steps={stepsFor(r)} />
      </div>

      {r.remarks && (
        <div style={{ background: r.status === 'Rejected' ? '#fdecec' : '#e9f7e9', border: `1px solid ${r.status === 'Rejected' ? '#f5c2c2' : '#bfe6bf'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13.5px', marginBottom: '18px', color: '#1f2937' }}>
          <strong>Technical Admin remarks:</strong> {r.remarks}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 20px', marginBottom: '18px' }}>
        <DetailRow label="Employee" value={requestPerson(r, db.employees)} />
        <DetailRow label="Submitted by" value={r.submittedBy} />
        <DetailRow label="Priority" value={r.priority} />
      </div>

      {/* Type-specific details */}
      {r.type === 'Addition' && r.newEmployee && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 20px', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
          <DetailRow label="Email" value={r.newEmployee.email} />
          <DetailRow label="Phone" value={r.newEmployee.phone || '-'} />
          <DetailRow label="Sex / Birth date" value={`${r.newEmployee.sex} · ${formatDate(r.newEmployee.birthDate)}`} />
          <DetailRow label="Position" value={r.newEmployee.positionTitle} />
          <DetailRow label="Employment" value={r.newEmployee.employmentType} />
          <DetailRow label="Start date" value={formatDate(r.newEmployee.dateHired)} />
        </div>
      )}
      {r.type === 'Update' && r.changes && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '18px' }}>
          <thead>
            <tr>
              <th style={thStyle}>FIELD</th>
              <th style={thStyle}>FROM</th>
              <th style={thStyle}>TO</th>
            </tr>
          </thead>
          <tbody>
            {r.changes.map((c) => (
              <tr key={c.field}>
                <td style={tdStyle}>{UPDATE_FIELDS[c.field]}</td>
                <td style={{ ...tdStyle, color: MUTED }}>{c.oldValue || '-'}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{c.newValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {r.type === 'Removal' && r.removal && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
          <DetailRow label="Reason" value={r.removal.reason} />
          <DetailRow label="Effective date" value={formatDate(r.removal.effectiveDate)} />
        </div>
      )}

      <DetailRow label="Justification" value={r.justification} />
      <div style={{ marginTop: '12px' }}>
        <DetailRow label="Attachment" value={r.attachment ? <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}><Icon name="log" size={15} />{r.attachment}</span> : <span style={{ color: MUTED }}>None</span>} />
      </div>
      {r.type !== 'Addition' && r.employeeId && (
        <p style={{ fontSize: '12.5px', color: MUTED, margin: '16px 0 0' }}>
          Current record: <Link to={`/office/employees/${r.employeeId}`} style={{ color: '#0b5f8a', fontWeight: 600 }}>{employeeName(db.employees.find((e) => e.id === r.employeeId))}</Link>
        </p>
      )}

      {confirmCancel && (
        <ConfirmModal
          title={`Cancel ${r.id}?`}
          message="The Technical Admin will no longer see this request. You can submit a new one later."
          confirmLabel="Cancel Request"
          danger
          onClose={() => setConfirmCancel(false)}
          onConfirm={() => {
            cancelStaffRequest(r.id)
            setConfirmCancel(false)
            onCancelled(r.id)
          }}
        />
      )}
    </Modal>
  )
}
