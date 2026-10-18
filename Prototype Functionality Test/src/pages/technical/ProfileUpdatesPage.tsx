// EMPLOYEE PROFILE UPDATES  (/technical/profile-updates)
// Review queue for changes to employee records (name, contact, office transfer, position).
// Approving applies the change to tbl_employees and writes tbl_historical_records.
// Address option: ?open=PU-2026-034 opens that request.
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDb, save, employeeName, officeName, nextNumber, offices, positions, readField, applyField, UPDATE_FIELDS, CURRENT_ACTOR } from './techData'
import type { ProfileUpdate, UpdateField, RecordType } from './techData'
import { TechLayout, PageHeader, StatRow, StatCard, Card, SearchBox, Pill, Avatar, Modal, Field, DetailRow, TableFooter, EmptyRow, Notice, Icon, Tabs } from './techUi'
import { ACCENT, MUTED, BORDER, inputStyle, selectStyle, primaryBtn, smallPrimaryBtn, ghostBtn, dangerBtn, rowBtn, rowGhostBtn, thStyle, tdStyle, errorBox, relativeTime, formatDateTime, paginate, todayIso, nowMs } from './techTheme'

const PER_PAGE = 8
type Tab = 'Pending' | 'Approved' | 'Rejected' | 'All'

// Which history record type a field creates when approved
const recordTypeFor = (field: UpdateField): RecordType => (field === 'positionTitle' ? 'Position Change' : field === 'officeCode' ? 'Office Transfer' : 'Profile Update')

export default function ProfileUpdatesPage() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('Pending')
  const [search, setSearch] = useState('')
  const [fieldFilter, setFieldFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')
  const openId = params.get('open')
  const reviewing = db.updates.find((u) => u.id === openId) ?? null

  const empOf = (u: ProfileUpdate) => db.employees.find((e) => e.id === u.employeeId)
  const now = nowMs()

  // ---- KPI numbers ----
  const pending = db.updates.filter((u) => u.status === 'Pending')
  const within30 = (iso?: string) => !!iso && now - new Date(iso).getTime() < 30 * 86400000
  const approved30 = db.updates.filter((u) => u.status === 'Approved' && within30(u.reviewedAt)).length
  const rejected30 = db.updates.filter((u) => u.status === 'Rejected' && within30(u.reviewedAt)).length
  const reviewed = db.updates.filter((u) => u.reviewedAt)
  const avgHours = reviewed.length ? Math.round(reviewed.reduce((s, u) => s + (new Date(u.reviewedAt!).getTime() - new Date(u.submittedAt).getTime()) / 3600000, 0) / reviewed.length) : 0
  const oldest = pending.length ? pending.reduce((a, b) => (a.submittedAt < b.submittedAt ? a : b)) : null

  // ---- filtering ----
  const q = search.trim().toLowerCase()
  const inTab = (u: ProfileUpdate) => tab === 'All' || u.status === tab
  const filtered = db.updates
    .filter((u) => inTab(u) && (fieldFilter === 'All' || u.field === fieldFilter) && (!q || `${u.id} ${employeeName(empOf(u))} ${empOf(u)?.employeeNo} ${u.newValue} ${u.submittedBy}`.toLowerCase().includes(q)))
    .sort((a, b) => (a.status === 'Pending' && b.status === 'Pending' ? a.submittedAt.localeCompare(b.submittedAt) : b.submittedAt.localeCompare(a.submittedAt)))
  const p = paginate(filtered, page, PER_PAGE)
  const pendingOnPage = p.rows.filter((u) => u.status === 'Pending')
  const allSelected = pendingOnPage.length > 0 && pendingOnPage.every((u) => selected.includes(u.id))

  function decide(update: ProfileUpdate, decision: 'Approved' | 'Rejected', remarks: string) {
    const emp = empOf(update)!
    save((d) => {
      const u = d.updates.find((x) => x.id === update.id)!
      u.status = decision
      u.reviewedBy = CURRENT_ACTOR.name
      u.reviewedAt = new Date(nowMs()).toISOString()
      u.remarks = remarks
      if (decision === 'Approved') {
        const e = d.employees.find((x) => x.id === update.employeeId)!
        applyField(e, update.field, update.newValue)
        d.history.unshift({ id: nextNumber(d.history.map((h) => h.id)), employeeId: e.id, recordType: recordTypeFor(update.field), description: `${UPDATE_FIELDS[update.field]}: ${update.oldValue} → ${update.newValue} (request ${update.id})`, effectiveDate: todayIso(), createdAt: todayIso(), by: CURRENT_ACTOR.name })
      }
    }, { event: 'Profile Update', details: `${update.id} ${decision.toLowerCase()}: ${employeeName(emp)} · ${UPDATE_FIELDS[update.field]}${remarks ? ` · ${remarks}` : ''}` })
    setNotice(`${update.id} ${decision.toLowerCase()}${decision === 'Approved' ? ` — ${employeeName(emp)}’s record was updated` : ''}.`)
    setSelected(selected.filter((x) => x !== update.id))
    setParams({})
  }

  function bulkApprove() {
    const items = db.updates.filter((u) => selected.includes(u.id) && u.status === 'Pending')
    items.forEach((u) => decide(u, 'Approved', 'Bulk approved'))
    setNotice(`${items.length} request(s) approved and applied to employee records.`)
    setSelected([])
    setBulkConfirm(false)
  }

  return (
    <TechLayout>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/technical/dashboard' }, { label: 'Employee Profile Management', to: '/technical/employees' }, { label: 'Profile Updates' }]}
        title="Employee Profile Updates"
        description="Review and approve changes to employee records submitted by employees or HRMD. Approved changes are applied to the employee profile and kept in the change history."
        actions={<button style={primaryBtn} onClick={() => setCreating(true)}><Icon name="plus" size={16} /> New Update Request</button>}
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      <StatRow>
        <StatCard label="PENDING REVIEW" value={pending.length} unit="Requests" tone="warning" sub={oldest ? `Oldest submitted ${relativeTime(oldest.submittedAt).toLowerCase()}` : 'Queue is empty'} icon="hourglass" />
        <StatCard label="APPROVED (30 DAYS)" value={approved30} unit="Applied" tone="success" sub="Changes written to employee records" icon="check" />
        <StatCard label="REJECTED (30 DAYS)" value={rejected30} unit="Returned" tone="danger" sub="Returned with reviewer remarks" icon="userx" />
        <StatCard label="AVERAGE TURNAROUND" value={avgHours < 48 ? avgHours : Math.round(avgHours / 24)} unit={avgHours < 48 ? 'Hours' : 'Days'} tone="accent" sub="From submission to decision" icon="clock" />
      </StatRow>

      <Card style={{ marginBottom: '18px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', paddingBottom: '14px', borderBottom: `1px solid ${BORDER}`, marginBottom: '12px' }}>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search request ID, employee, new value or submitter..." />
          <select style={selectStyle} value={fieldFilter} onChange={(e) => { setFieldFilter(e.target.value); setPage(1) }}>
            <option value="All">Field: All</option>
            {Object.entries(UPDATE_FIELDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <Tabs
          tabs={(['Pending', 'Approved', 'Rejected', 'All'] as Tab[]).map((t) => ({ value: t, label: t, count: t === 'All' ? db.updates.length : db.updates.filter((u) => u.status === t).length }))}
          active={tab}
          onChange={(t) => { setTab(t); setPage(1); setSelected([]) }}
        />
      </Card>

      {selected.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0f2442', color: 'white', borderRadius: '10px', padding: '10px 16px', marginBottom: '14px', fontSize: '13.5px' }}>
          <strong>{selected.length} selected</strong>
          <span style={{ flex: 1 }} />
          <button style={ghostBtn} onClick={() => setBulkConfirm(true)}><Icon name="check" size={15} /> Approve selected</button>
          <button style={{ ...ghostBtn, background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.4)' }} onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      <Card flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 40 }}><input type="checkbox" aria-label="Select all pending" disabled={pendingOnPage.length === 0} checked={allSelected} onChange={() => setSelected(allSelected ? [] : pendingOnPage.map((u) => u.id))} /></th>
                <th style={thStyle}>REQUEST</th>
                <th style={thStyle}>EMPLOYEE</th>
                <th style={thStyle}>FIELD</th>
                <th style={thStyle}>CURRENT → REQUESTED</th>
                <th style={thStyle}>SUBMITTED</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map((u) => {
                const e = empOf(u)
                return (
                  <tr key={u.id}>
                    <td style={tdStyle}>{u.status === 'Pending' && <input type="checkbox" aria-label={`Select ${u.id}`} checked={selected.includes(u.id)} onChange={() => setSelected(selected.includes(u.id) ? selected.filter((x) => x !== u.id) : [...selected, u.id])} />}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <div style={{ color: ACCENT, fontWeight: 700 }}>{u.id}</div>
                      {u.attachment && <div style={{ color: MUTED, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="log" size={12} /> 1 attachment</div>}
                    </td>
                    <td style={tdStyle}>
                      <Link to={`/technical/employees/${e?.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <Avatar name={employeeName(e)} size={34} />
                        <div>
                          <div style={{ fontWeight: 700, color: '#111827' }}>{employeeName(e)}</div>
                          <div style={{ color: MUTED, fontSize: '12.5px' }}>{e?.employeeNo} · {e?.officeCode}</div>
                        </div>
                      </Link>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{UPDATE_FIELDS[u.field]}</td>
                    <td style={{ ...tdStyle, maxWidth: '320px' }}>
                      <span style={{ color: MUTED, textDecoration: u.status === 'Approved' ? 'line-through' : 'none' }}>{u.oldValue || '—'}</span>
                      <span style={{ color: ACCENT, fontWeight: 700 }}> &rarr; </span>
                      <strong style={{ color: '#111827' }}>{u.newValue}</strong>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ whiteSpace: 'nowrap' }}>{relativeTime(u.submittedAt)}</div>
                      <div style={{ color: MUTED, fontSize: '12px' }}>{u.submittedBy}</div>
                    </td>
                    <td style={tdStyle}><Pill text={u.status} /></td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button style={u.status === 'Pending' ? rowBtn : rowGhostBtn} onClick={() => setParams({ open: u.id })}>{u.status === 'Pending' ? 'Review' : 'View'}</button>
                    </td>
                  </tr>
                )
              })}
              {p.rows.length === 0 && <EmptyRow colSpan={8} text={tab === 'Pending' ? 'No pending requests — the queue is clear.' : 'No requests match your filters.'} />}
            </tbody>
          </table>
        </div>
        <TableFooter from={p.from} to={p.to} total={filtered.length} label="requests" page={p.current} totalPages={p.totalPages} onPage={setPage} />
      </Card>

      {reviewing && <ReviewModal update={reviewing} onClose={() => setParams({})} onDecide={(d, r) => decide(reviewing, d, r)} />}
      {creating && <NewRequestModal onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); setTab('Pending'); setNotice(`Request ${id} added to the review queue.`) }} />}
      {bulkConfirm && (
        <Modal title="Approve selected requests?" onClose={() => setBulkConfirm(false)} width={480} footer={<><button style={ghostBtn} onClick={() => setBulkConfirm(false)}>Cancel</button><button style={smallPrimaryBtn} onClick={bulkApprove}>Approve {selected.length}</button></>}>
          <p style={{ margin: 0, fontSize: '14px' }}>The {selected.length} selected change(s) will be applied to the employee records immediately and recorded in each employee’s change history.</p>
        </Modal>
      )}
    </TechLayout>
  )
}

/* ------------------------------------------------------------------ */
/* Review one request                                                  */
/* ------------------------------------------------------------------ */

function ReviewModal({ update, onClose, onDecide }: { update: ProfileUpdate; onClose: () => void; onDecide: (d: 'Approved' | 'Rejected', remarks: string) => void }) {
  const db = useDb()
  const emp = db.employees.find((e) => e.id === update.employeeId)!
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')
  const [showAttachment, setShowAttachment] = useState(false)
  const current = readField(emp, update.field)
  const domain = db.config.security.allowedDomain

  // Automatic checks shown to the reviewer
  const checks: { ok: boolean; text: string }[] = []
  if (update.status === 'Pending') checks.push({ ok: current === update.oldValue, text: current === update.oldValue ? 'Current record matches the value in the request.' : `The record has changed since this request (now “${current}”).` })
  if (update.field === 'email') checks.push({ ok: update.newValue.endsWith(domain), text: update.newValue.endsWith(domain) ? `New email is a ${domain} GovMail address.` : `New email is not a ${domain} address — this breaks the account policy.` })
  if (update.field === 'email') checks.push({ ok: !db.employees.some((e) => e.id !== emp.id && e.email === update.newValue), text: 'No other employee uses the new email.' })
  if (update.field === 'positionTitle' || update.field === 'officeCode' || update.field === 'lastName') checks.push({ ok: !!update.attachment, text: update.attachment ? 'Supporting document attached.' : 'No supporting document attached (required for this field).' })

  function reject() {
    if (!remarks.trim()) return setError('Enter remarks so the employee knows why the request was rejected.')
    onDecide('Rejected', remarks.trim())
  }

  const showValue = (v: string) => (update.field === 'officeCode' ? `${v} - ${officeName(v)}` : v || '-')

  return (
    <Modal
      title={`${update.status === 'Pending' ? 'Review' : 'View'} Request · ${update.id}`}
      onClose={onClose}
      width={720}
      footer={update.status === 'Pending' ? (
        <>
          <button style={ghostBtn} onClick={onClose}>Close</button>
          <button style={dangerBtn} onClick={reject}>Reject</button>
          <button style={{ ...smallPrimaryBtn, background: '#15803d' }} onClick={() => onDecide('Approved', remarks.trim())}><Icon name="check" size={15} /> Approve &amp; Apply</button>
        </>
      ) : <button style={ghostBtn} onClick={onClose}>Close</button>}
    >
      {error && <div style={errorBox}>{error}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Avatar name={employeeName(emp)} size={46} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '16px' }}>{employeeName(emp, true)}</div>
          <div style={{ color: MUTED, fontSize: '13px' }}>{emp.employeeNo} · {emp.positionTitle} · {emp.officeCode}</div>
        </div>
        <Pill text={update.status} />
      </div>

      <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px', color: '#374151', marginBottom: '8px' }}>{UPDATE_FIELDS[update.field].toUpperCase()}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px', background: '#f7f6f4' }}>
          <div style={{ fontSize: '11px', color: MUTED, fontWeight: 700, letterSpacing: '0.8px' }}>CURRENT</div>
          <div style={{ fontSize: '14.5px', marginTop: '4px' }}>{showValue(update.oldValue)}</div>
        </div>
        <span style={{ color: ACCENT, fontWeight: 800 }}>&rarr;</span>
        <div style={{ border: `1px solid #a9dcf3`, borderRadius: '10px', padding: '12px', background: '#e6f5fc' }}>
          <div style={{ fontSize: '11px', color: '#0b4f73', fontWeight: 700, letterSpacing: '0.8px' }}>REQUESTED</div>
          <div style={{ fontSize: '14.5px', marginTop: '4px', fontWeight: 700 }}>{showValue(update.newValue)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
        <DetailRow label="Reason given" value={update.reason} />
        <DetailRow label="Submitted" value={<>{formatDateTime(update.submittedAt)}<div style={{ color: MUTED, fontSize: '12.5px' }}>by {update.submittedBy}</div></>} />
        <DetailRow label="Supporting document" value={update.attachment ? <button onClick={() => setShowAttachment(!showAttachment)} style={{ background: 'none', border: 'none', color: ACCENT, fontWeight: 600, cursor: 'pointer', padding: 0 }}>{update.attachment}</button> : 'None'} />
        {update.reviewedBy && <DetailRow label="Decision" value={<>{update.status} by {update.reviewedBy}<div style={{ color: MUTED, fontSize: '12.5px' }}>{formatDateTime(update.reviewedAt!)}{update.remarks ? ` · “${update.remarks}”` : ''}</div></>} />}
      </div>
      {showAttachment && update.attachment && (
        <div style={{ border: `1px dashed ${BORDER}`, borderRadius: '10px', padding: '18px', textAlign: 'center', color: MUTED, fontSize: '13px', marginBottom: '16px' }}>
          <Icon name="log" size={28} /><br />{update.attachment}<br />(document preview appears here once file storage is connected)
        </div>
      )}

      {checks.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px', color: '#374151', marginBottom: '6px' }}>AUTOMATIC CHECKS</div>
          {checks.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: c.ok ? '#15803d' : '#b91c1c', padding: '3px 0' }}>
              <Icon name={c.ok ? 'check' : 'alert'} size={15} /> {c.text}
            </div>
          ))}
        </div>
      )}

      {update.status === 'Pending' && (
        <Field label="Reviewer remarks (required to reject)">
          <textarea style={{ ...inputStyle, minHeight: '64px' }} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Verified against the PSA certificate." />
        </Field>
      )}
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Log a new request on behalf of an employee                          */
/* ------------------------------------------------------------------ */

function NewRequestModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const db = useDb()
  const list = db.employees.filter((e) => e.status !== 'Separated')
  const [employeeId, setEmployeeId] = useState(list[0]?.id ?? 0)
  const [field, setField] = useState<UpdateField>('phone')
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')
  const [attachment, setAttachment] = useState('')
  const [error, setError] = useState('')
  const emp = db.employees.find((e) => e.id === employeeId)

  function create() {
    if (!emp) return setError('Choose an employee.')
    if (!value.trim()) return setError('Enter the new value.')
    if (value.trim() === readField(emp, field)) return setError('The new value is the same as the current value.')
    if (!reason.trim()) return setError('Enter the reason for the change.')
    const year = todayIso().slice(0, 4)
    const id = `PU-${year}-${String(nextNumber(db.updates.map((u) => Number(u.id.split('-')[2]) || 0))).padStart(3, '0')}`
    save((d) => {
      d.updates.unshift({ id, employeeId: emp.id, field, oldValue: readField(emp, field), newValue: value.trim(), reason: reason.trim(), submittedBy: `${CURRENT_ACTOR.name} (on behalf)`, submittedAt: new Date(nowMs()).toISOString(), status: 'Pending', attachment: attachment.trim() || undefined })
    }, { event: 'Profile Update', details: `${id} logged for ${employeeName(emp)}: ${UPDATE_FIELDS[field]}` })
    onCreated(id)
  }

  return (
    <Modal title="New Update Request" onClose={onClose} footer={<><button style={ghostBtn} onClick={onClose}>Cancel</button><button style={smallPrimaryBtn} onClick={create}>Add to Queue</button></>}>
      {error && <div style={errorBox}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <Field label="Employee *" full>
          <select style={inputStyle} value={employeeId} onChange={(e) => setEmployeeId(Number(e.target.value))}>{list.map((e) => <option key={e.id} value={e.id}>{employeeName(e)} · {e.employeeNo}</option>)}</select>
        </Field>
        <Field label="Field to change *">
          <select style={inputStyle} value={field} onChange={(e) => { setField(e.target.value as UpdateField); setValue('') }}>{Object.entries(UPDATE_FIELDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </Field>
        <Field label="Current value"><input style={{ ...inputStyle, background: '#f3f4f6' }} value={emp ? readField(emp, field) : ''} disabled /></Field>
        <Field label="New value *" full>
          {field === 'officeCode' ? (
            <select style={inputStyle} value={value} onChange={(e) => setValue(e.target.value)}><option value="">Choose office…</option>{offices.map((o) => <option key={o.code} value={o.code}>{o.code} - {o.name}</option>)}</select>
          ) : field === 'positionTitle' ? (
            <select style={inputStyle} value={value} onChange={(e) => setValue(e.target.value)}><option value="">Choose position…</option>{positions.map((p) => <option key={p.title} value={p.title}>{p.title} (SG {p.salaryGrade})</option>)}</select>
          ) : (
            <input style={inputStyle} value={value} onChange={(e) => setValue(e.target.value)} />
          )}
        </Field>
        <Field label="Reason *" full><input style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Paper request form received from the employee" /></Field>
        <Field label="Supporting document file name" full hint="File upload is added when storage is connected; for now type the document name."><input style={inputStyle} value={attachment} onChange={(e) => setAttachment(e.target.value)} placeholder="e.g. Office_Order_2026-118.pdf" /></Field>
      </div>
    </Modal>
  )
}
