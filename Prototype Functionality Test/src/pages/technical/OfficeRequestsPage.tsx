// Technical Admin › Employee Profile Management › Office Requests
// Employee Addition / Update / Removal requests sent by Concerned Offices.
// Approving applies the change to the employee records (see decideStaffRequest in ../office/officeData).
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDb, employeeName, positions, offices, UPDATE_FIELDS, readField, CURRENT_ACTOR } from './techData'
import { TechLayout, PageHeader, Card, StatCard, StatRow, Tabs, SearchBox, Modal, Notice, DetailRow, Field, TableFooter, EmptyRow, Icon } from './techUi'
import { selectStyle, inputStyle, thStyle, tdStyle, rowBtn, rowGhostBtn, ghostBtn, smallPrimaryBtn, errorBox, MUTED, BORDER, NAVY, formatDate, formatDateTime, relativeTime, paginate } from './techTheme'
import { useOfficeStore, startStaffReview, decideStaffRequest, requestSummary, requestPerson } from '../office/officeData'
import type { StaffRequest } from '../office/officeData'
import { RequestStatusPill, RequestTypeTag } from '../office/officeUi'

type View = 'open' | 'Approved' | 'Rejected' | 'all'
const PER_PAGE = 8

export default function OfficeRequestsPage() {
  const db = useDb()
  const office = useOfficeStore()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<View>('open')
  const [type, setType] = useState('All')
  const [officeCode, setOfficeCode] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState('')

  // Cancelled requests are hidden from the Technical Admin
  const visible = office.requests.filter((r) => r.status !== 'Cancelled')
  const isOpen = (r: StaffRequest) => r.status === 'Pending' || r.status === 'Under Review'
  const q = search.trim().toLowerCase()
  const rows = visible
    .filter((r) => (view === 'open' ? isOpen(r) : view === 'all' ? true : r.status === view))
    .filter((r) => (type === 'All' || r.type === type) && (officeCode === 'All' || r.officeCode === officeCode))
    .filter((r) => !q || `${r.id} ${requestPerson(r, db.employees)} ${requestSummary(r)} ${r.officeCode}`.toLowerCase().includes(q))
    // urgent first, then oldest first so nothing waits too long
    .sort((a, b) => (isOpen(a) && isOpen(b) ? (a.priority === b.priority ? a.submittedAt.localeCompare(b.submittedAt) : a.priority === 'Urgent' ? -1 : 1) : b.submittedAt.localeCompare(a.submittedAt)))
  const pg = paginate(rows, page, PER_PAGE)
  const reviewing = visible.find((r) => r.id === params.get('open'))
  const count = (f: (r: StaffRequest) => boolean) => visible.filter(f).length

  return (
    <TechLayout>
      <PageHeader
        crumbs={[{ label: 'Technical Admin', to: '/technical/dashboard' }, { label: 'Employee Profile Management' }, { label: 'Office Requests' }]}
        title="Office Requests"
        description="Employee addition, update and removal requests from Concerned Offices. Approving a request applies it to the employee records and the history."
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      <StatRow>
        <StatCard label="PENDING" value={count((r) => r.status === 'Pending')} unit="New" tone="warning" icon="hourglass" />
        <StatCard label="UNDER REVIEW" value={count((r) => r.status === 'Under Review')} tone="accent" icon="edit" />
        <StatCard label="APPROVED" value={count((r) => r.status === 'Approved')} tone="success" icon="check" />
        <StatCard label="REJECTED" value={count((r) => r.status === 'Rejected')} tone="danger" icon="alert" />
      </StatRow>

      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: '#f7f6f4', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '4px' }}>
            <Tabs
              tabs={[
                { value: 'open' as View, label: 'Open', count: count(isOpen) },
                { value: 'Approved' as View, label: 'Approved', count: count((r) => r.status === 'Approved') },
                { value: 'Rejected' as View, label: 'Rejected', count: count((r) => r.status === 'Rejected') },
                { value: 'all' as View, label: 'All', count: visible.length },
              ]}
              active={view}
              onChange={(v) => { setView(v); setPage(1) }}
            />
          </div>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by request ID, employee or office..." />
          <select style={selectStyle} value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} aria-label="Request type">
            <option value="All">All types</option>
            <option>Addition</option>
            <option>Update</option>
            <option>Removal</option>
          </select>
          <select style={selectStyle} value={officeCode} onChange={(e) => { setOfficeCode(e.target.value); setPage(1) }} aria-label="Office">
            <option value="All">All offices</option>
            {[...new Set(visible.map((r) => r.officeCode))].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </Card>

      <Card flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>REQUEST</th>
                <th style={thStyle}>OFFICE</th>
                <th style={thStyle}>TYPE</th>
                <th style={thStyle}>EMPLOYEE</th>
                <th style={thStyle}>DETAILS</th>
                <th style={thStyle}>SUBMITTED</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pg.rows.length === 0 && <EmptyRow colSpan={8} text={view === 'open' ? 'No open requests — all caught up.' : 'No requests match these filters.'} />}
              {pg.rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap' }}>
                    {r.id}
                    {r.priority === 'Urgent' && <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 700 }}>URGENT</div>}
                  </td>
                  <td style={tdStyle}>{r.officeCode}</td>
                  <td style={tdStyle}><RequestTypeTag type={r.type} /></td>
                  <td style={tdStyle}>
                    {r.employeeId ? <Link to={`/technical/employees/${r.employeeId}`} style={{ fontWeight: 600, color: '#111827', textDecoration: 'none' }}>{requestPerson(r, db.employees)}</Link> : <strong>{requestPerson(r, db.employees)}</strong>}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '13px', maxWidth: '260px' }}>{requestSummary(r)}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{relativeTime(r.submittedAt)}</td>
                  <td style={tdStyle}><RequestStatusPill status={r.status} /></td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button style={isOpen(r) ? rowBtn : rowGhostBtn} onClick={() => setParams({ open: r.id })}>{isOpen(r) ? 'Review' : 'View'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TableFooter from={pg.from} to={pg.to} total={rows.length} label="requests" page={pg.current} totalPages={pg.totalPages} onPage={setPage} />
      </Card>

      {reviewing && (
        <ReviewModal
          key={reviewing.id}
          request={reviewing}
          onClose={() => setParams({})}
          onDone={(text) => {
            setNotice(text)
            setParams({})
          }}
        />
      )}
    </TechLayout>
  )
}

// Automatic checks shown to the reviewer (green = OK, amber = check manually)
function checksFor(r: StaffRequest, employees: ReturnType<typeof useDb>['employees']) {
  const list: { ok: boolean; text: string }[] = []
  const employee = employees.find((e) => e.id === r.employeeId)
  if (r.type === 'Addition' && r.newEmployee) {
    const n = r.newEmployee
    list.push({ ok: n.email.endsWith('dost.gov.ph'), text: 'Email is an official DOST GovMail address' })
    list.push({ ok: !employees.some((e) => e.email.toLowerCase() === n.email.toLowerCase()), text: 'Email is not used by another employee' })
    list.push({ ok: !employees.some((e) => e.firstName === n.firstName && e.lastName === n.lastName && e.status !== 'Separated'), text: 'No active employee with the same name' })
    list.push({ ok: positions.some((p) => p.title === n.positionTitle), text: 'Position exists in the position list' })
  }
  if (r.type === 'Update' && r.changes) {
    list.push({ ok: !!employee && employee.status !== 'Separated', text: 'Employee record exists and is not separated' })
    r.changes.forEach((c) => {
      if (employee) list.push({ ok: readField(employee, c.field) === c.oldValue, text: `${UPDATE_FIELDS[c.field]} still matches the value the office saw (${c.oldValue || '—'})` })
      if (c.field === 'email') list.push({ ok: !employees.some((e) => e.email.toLowerCase() === c.newValue.toLowerCase()), text: 'New email is not used by another employee' })
      if (c.field === 'officeCode') list.push({ ok: offices.some((o) => o.code === c.newValue), text: 'Destination office exists' })
    })
  }
  if (r.type === 'Removal' && r.removal) {
    list.push({ ok: !!employee && employee.status !== 'Separated', text: 'Employee is currently active / on leave' })
    list.push({ ok: !!employee && r.removal.effectiveDate >= employee.dateHired, text: 'Effective date is after the date hired' })
  }
  list.push({ ok: !!r.attachment, text: r.attachment ? `Supporting document attached (${r.attachment})` : 'No supporting document attached' })
  return list
}

function ReviewModal({ request: r, onClose, onDone }: { request: StaffRequest; onClose: () => void; onDone: (text: string) => void }) {
  const db = useDb()
  const [remarks, setRemarks] = useState(r.remarks ?? '')
  const [error, setError] = useState('')
  const open = r.status === 'Pending' || r.status === 'Under Review'
  const employee = db.employees.find((e) => e.id === r.employeeId)
  const checks = checksFor(r, db.employees)

  function decide(decision: 'Approved' | 'Rejected') {
    if (decision === 'Rejected' && remarks.trim().length < 5) {
      setError('Tell the office why the request is rejected (remarks).')
      return
    }
    decideStaffRequest(r.id, decision, remarks.trim() || (decision === 'Approved' ? 'Approved and applied.' : ''), CURRENT_ACTOR.name)
    onDone(decision === 'Approved' ? `${r.id} approved — the ${r.type.toLowerCase()} was applied to the employee records.` : `${r.id} rejected. The office can see your remarks.`)
  }

  return (
    <Modal
      title={<span style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>{r.id} <RequestTypeTag type={r.type} /> <RequestStatusPill status={r.status} /></span>}
      onClose={onClose}
      width={760}
      footer={
        open ? (
          <>
            {r.status === 'Pending' && <button style={ghostBtn} onClick={() => startStaffReview(r.id, CURRENT_ACTOR.name)}>Mark Under Review</button>}
            <button style={{ ...ghostBtn, color: '#b91c1c', border: '1px solid #fecaca' }} onClick={() => decide('Rejected')}>Reject</button>
            <button style={smallPrimaryBtn} onClick={() => decide('Approved')}><Icon name="check" size={16} /> Approve &amp; Apply</button>
          </>
        ) : (
          <button style={ghostBtn} onClick={onClose}>Close</button>
        )
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 20px', marginBottom: '18px' }}>
        <DetailRow label="Office" value={r.officeCode} />
        <DetailRow label="Submitted by" value={r.submittedBy} />
        <DetailRow label="Submitted" value={formatDateTime(r.submittedAt)} />
        <DetailRow label="Employee" value={employee ? <Link to={`/technical/employees/${employee.id}`} style={{ color: '#0b5f8a', fontWeight: 600 }}>{employeeName(employee, true)}</Link> : requestPerson(r, db.employees)} />
        <DetailRow label="Priority" value={r.priority} />
        {r.reviewedAt && <DetailRow label="Decided" value={`${r.reviewedBy} · ${formatDateTime(r.reviewedAt)}`} />}
      </div>

      {r.type === 'Addition' && r.newEmployee && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 20px', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
          <DetailRow label="Proposed name" value={<strong>{requestPerson(r, db.employees)}</strong>} />
          <DetailRow label="Email" value={r.newEmployee.email} />
          <DetailRow label="Phone" value={r.newEmployee.phone || '—'} />
          <DetailRow label="Position" value={r.newEmployee.positionTitle} />
          <DetailRow label="Employment" value={r.newEmployee.employmentType} />
          <DetailRow label="Start date" value={formatDate(r.newEmployee.dateHired)} />
          <DetailRow label="Sex" value={r.newEmployee.sex} />
          <DetailRow label="Birth date" value={formatDate(r.newEmployee.birthDate)} />
          <DetailRow label="Address" value={r.newEmployee.address || '—'} />
        </div>
      )}
      {r.type === 'Update' && r.changes && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '18px' }}>
          <thead>
            <tr>
              <th style={thStyle}>FIELD</th>
              <th style={thStyle}>CURRENT</th>
              <th style={thStyle}>REQUESTED</th>
            </tr>
          </thead>
          <tbody>
            {r.changes.map((c) => (
              <tr key={c.field}>
                <td style={tdStyle}>{UPDATE_FIELDS[c.field]}</td>
                <td style={{ ...tdStyle, color: MUTED }}>{c.oldValue || '—'}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#0a6b0a' }}>{c.newValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {r.type === 'Removal' && r.removal && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', border: '1px solid #f5c2c2', background: '#fdf6f6', borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
          <DetailRow label="Reason" value={r.removal.reason} />
          <DetailRow label="Effective date" value={formatDate(r.removal.effectiveDate)} />
          <div style={{ gridColumn: '1 / -1', fontSize: '12.5px', color: '#7f1d1d' }}>Approving marks the employee as Separated. Remember to deactivate their user account in Users.</div>
        </div>
      )}

      <DetailRow label="Justification" value={r.justification} />

      <h3 style={{ fontSize: '13px', letterSpacing: '1px', color: MUTED, margin: '18px 0 8px' }}>AUTOMATIC CHECKS</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
        {checks.map((c) => (
          <div key={c.text} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13.5px', color: c.ok ? '#0a6b0a' : '#8a5a00' }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: c.ok ? '#e9f7e9' : '#fff6e0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{c.ok ? '✓' : '!'}</span>
            {c.text}
          </div>
        ))}
      </div>

      {open ? (
        <>
          {error && <div style={errorBox}>{error}</div>}
          <Field label="Remarks to the office (required when rejecting)">
            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={remarks} onChange={(e) => { setRemarks(e.target.value); setError('') }} />
          </Field>
        </>
      ) : (
        r.remarks && <DetailRow label="Remarks" value={r.remarks} />
      )}
    </Modal>
  )
}
