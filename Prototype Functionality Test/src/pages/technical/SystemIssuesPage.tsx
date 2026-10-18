// TECHNICAL SYSTEM ISSUES  (/technical/system-issues)
// Ticket list for bugs, access problems, data corrections and requests.
// Address options: ?open=TSI-2026-047 opens a ticket · ?new=1 opens "Report Issue".
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDb, save, MODULES, ISSUE_CATEGORIES, TECH_ADMINS, CURRENT_ACTOR } from './techData'
import type { Issue, IssuePriority, IssueStatus, ModuleName } from './techData'
import { TechLayout, PageHeader, StatRow, StatCard, Card, SearchBox, Pill, Modal, Field, DetailRow, TableFooter, EmptyRow, Notice, Icon, Tabs, Avatar } from './techUi'
import { ACCENT, MUTED, BORDER, inputStyle, selectStyle, primaryBtn, smallPrimaryBtn, ghostBtn, rowGhostBtn, thStyle, tdStyle, errorBox, relativeTime, formatDateTime, paginate, nowMs } from './techTheme'

const PER_PAGE = 8
const PRIORITIES: IssuePriority[] = ['Critical', 'High', 'Medium', 'Low']
const STATUSES: IssueStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed']
type Tab = 'Active' | IssueStatus | 'All'
const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 }

export default function SystemIssuesPage() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('Active')
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('All')
  const [category, setCategory] = useState('All')
  const [module, setModule] = useState('All')
  const [assignee, setAssignee] = useState('All')
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState('')
  const openId = params.get('open')
  const viewing = db.issues.find((i) => i.id === openId) ?? null
  const creating = params.get('new') === '1'
  const now = nowMs()

  // ---- KPI numbers ----
  const active = db.issues.filter((i) => i.status === 'Open' || i.status === 'In Progress')
  const urgent = active.filter((i) => i.priority === 'Critical' || i.priority === 'High').length
  const resolved30 = db.issues.filter((i) => (i.status === 'Resolved' || i.status === 'Closed') && now - new Date(i.updatedAt).getTime() < 30 * 86400000)
  const avgDays = resolved30.length ? (resolved30.reduce((s, i) => s + (new Date(i.updatedAt).getTime() - new Date(i.createdAt).getTime()) / 86400000, 0) / resolved30.length).toFixed(1) : '—'

  // ---- filtering ----
  const q = search.trim().toLowerCase()
  const inTab = (i: Issue) => tab === 'All' || (tab === 'Active' ? i.status === 'Open' || i.status === 'In Progress' : i.status === tab)
  const filtered = db.issues
    .filter((i) =>
      inTab(i) &&
      (!q || `${i.id} ${i.title} ${i.description} ${i.reportedBy}`.toLowerCase().includes(q)) &&
      (priority === 'All' || i.priority === priority) &&
      (category === 'All' || i.category === category) &&
      (module === 'All' || i.module === module) &&
      (assignee === 'All' || i.assignedTo === assignee),
    )
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.updatedAt.localeCompare(a.updatedAt))
  const p = paginate(filtered, page, PER_PAGE)

  const tabCount = (t: Tab) => db.issues.filter((i) => t === 'All' || (t === 'Active' ? i.status === 'Open' || i.status === 'In Progress' : i.status === t)).length

  return (
    <TechLayout>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/technical/dashboard' }, { label: 'System' }, { label: 'Technical System Issues' }]}
        title="Technical System Issues"
        description="Track and resolve bugs, sign-in problems, data corrections and improvement requests reported by CB-HRMS users."
        actions={<button style={primaryBtn} onClick={() => setParams({ new: '1' })}><Icon name="plus" size={16} /> Report Issue</button>}
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      <StatRow>
        <StatCard label="OPEN ISSUES" value={db.issues.filter((i) => i.status === 'Open').length} unit="Open" sub={`${db.issues.filter((i) => i.status === 'Open' && i.assignedTo === 'Unassigned').length} not yet assigned`} icon="alert" />
        <StatCard label="CRITICAL / HIGH PRIORITY" value={urgent} unit="Urgent" tone="danger" sub="Open or in progress" icon="lock" />
        <StatCard label="IN PROGRESS" value={db.issues.filter((i) => i.status === 'In Progress').length} unit="Working" tone="accent" sub="Assigned and being fixed" icon="wrench" />
        <StatCard label="RESOLVED (30 DAYS)" value={resolved30.length} unit={`avg ${avgDays} days`} tone="success" sub="Average time to resolve" icon="check" />
      </StatRow>

      <Card style={{ marginBottom: '18px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', paddingBottom: '14px', borderBottom: `1px solid ${BORDER}`, marginBottom: '12px' }}>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search ticket ID, title, description or reporter..." />
          <select style={selectStyle} value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1) }}><option value="All">Priority: All</option>{PRIORITIES.map((x) => <option key={x}>{x}</option>)}</select>
          <select style={selectStyle} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}><option value="All">Category: All</option>{ISSUE_CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select>
          <select style={selectStyle} value={module} onChange={(e) => { setModule(e.target.value); setPage(1) }}><option value="All">Module: All</option>{MODULES.map((x) => <option key={x}>{x}</option>)}</select>
          <select style={selectStyle} value={assignee} onChange={(e) => { setAssignee(e.target.value); setPage(1) }}><option value="All">Assigned: All</option><option>Unassigned</option>{TECH_ADMINS.map((x) => <option key={x}>{x}</option>)}</select>
        </div>
        <Tabs
          tabs={(['Active', 'Open', 'In Progress', 'Resolved', 'Closed', 'All'] as Tab[]).map((t) => ({ value: t, label: t === 'Active' ? 'Open & In Progress' : t, count: tabCount(t) }))}
          active={tab}
          onChange={(t) => { setTab(t); setPage(1) }}
        />
      </Card>

      <Card flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>TICKET</th>
                <th style={thStyle}>ISSUE</th>
                <th style={thStyle}>PRIORITY</th>
                <th style={thStyle}>STATUS</th>
                <th style={thStyle}>REPORTED BY</th>
                <th style={thStyle}>ASSIGNED TO</th>
                <th style={thStyle}>LAST UPDATE</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map((i) => (
                <tr key={i.id}>
                  <td style={{ ...tdStyle, color: ACCENT, fontWeight: 700, whiteSpace: 'nowrap' }}>{i.id}</td>
                  <td style={{ ...tdStyle, maxWidth: '380px' }}>
                    <div style={{ fontWeight: 700, color: '#111827' }}>{i.title}</div>
                    <div style={{ color: MUTED, fontSize: '12.5px' }}>{i.category} · {i.module}{i.comments.length ? ` · ${i.comments.length} comment${i.comments.length === 1 ? '' : 's'}` : ''}</div>
                  </td>
                  <td style={tdStyle}><Pill text={i.priority} dot={false} /></td>
                  <td style={tdStyle}><Pill text={i.status} /></td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{i.reportedBy}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: i.assignedTo === 'Unassigned' ? '#b45309' : '#111827', fontWeight: i.assignedTo === 'Unassigned' ? 600 : 400 }}>{i.assignedTo}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{relativeTime(i.updatedAt)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}><button style={rowGhostBtn} onClick={() => setParams({ open: i.id })}>View</button></td>
                </tr>
              ))}
              {p.rows.length === 0 && <EmptyRow colSpan={8} text="No issues match your filters." />}
            </tbody>
          </table>
        </div>
        <TableFooter from={p.from} to={p.to} total={filtered.length} label="issues" page={p.current} totalPages={p.totalPages} onPage={setPage} />
      </Card>

      {creating && <NewIssueModal onClose={() => setParams({})} onCreated={(id) => { setParams({ open: id }); setTab('Active'); setNotice(`Issue ${id} reported.`) }} />}
      {viewing && <IssueModal key={viewing.id} issue={viewing} onClose={() => setParams({})} onMessage={setNotice} />}
    </TechLayout>
  )
}

/* ------------------------------------------------------------------ */
/* Report a new issue                                                  */
/* ------------------------------------------------------------------ */

function NewIssueModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const db = useDb()
  const [form, setForm] = useState({ title: '', description: '', module: 'User & Role Management' as ModuleName, category: ISSUE_CATEGORIES[0] as Issue['category'], priority: 'Medium' as IssuePriority, reportedBy: CURRENT_ACTOR.name, assignedTo: 'Unassigned' })
  const [error, setError] = useState('')

  function create() {
    if (form.title.trim().length < 8) return setError('Give the issue a short title (at least 8 characters).')
    if (form.description.trim().length < 15) return setError('Describe what happens and how to reproduce it (at least 15 characters).')
    const year = new Date(nowMs()).getFullYear()
    const id = `TSI-${year}-${String(Math.max(0, ...db.issues.map((i) => Number(i.id.split('-')[2]) || 0)) + 1).padStart(3, '0')}`
    const at = new Date(nowMs()).toISOString()
    save((d) => {
      d.issues.unshift({ id, ...form, title: form.title.trim(), description: form.description.trim(), status: 'Open', createdAt: at, updatedAt: at, comments: [] })
    }, { event: 'Issue Update', details: `${id} reported: ${form.title.trim()} (${form.priority})` })
    onCreated(id)
  }

  return (
    <Modal title="Report Technical Issue" onClose={onClose} width={700} footer={<><button style={ghostBtn} onClick={onClose}>Cancel</button><button style={smallPrimaryBtn} onClick={create}>Submit Issue</button></>}>
      {error && <div style={errorBox}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <Field label="Title *" full><input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Export button does nothing on Reports page" /></Field>
        <Field label="Description & steps to reproduce *" full><textarea style={{ ...inputStyle, minHeight: '100px' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={'1. Go to …\n2. Click …\n3. Expected … but …'} /></Field>
        <Field label="Module"><select style={inputStyle} value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value as ModuleName })}>{MODULES.map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label="Category"><select style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Issue['category'] })}>{ISSUE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Priority" hint="Critical = system down or no one can sign in"><select style={inputStyle} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as IssuePriority })}>{PRIORITIES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Assign to"><select style={inputStyle} value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}><option>Unassigned</option>{TECH_ADMINS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Reported by" full><input style={inputStyle} value={form.reportedBy} onChange={(e) => setForm({ ...form, reportedBy: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* View / work on an issue                                             */
/* ------------------------------------------------------------------ */

function IssueModal({ issue, onClose, onMessage }: { issue: Issue; onClose: () => void; onMessage: (m: string) => void }) {
  const [comment, setComment] = useState('')
  const [resolution, setResolution] = useState(issue.resolution ?? '')
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState('')

  // Applies a change to this ticket, adds a system comment and an audit entry
  function update(patch: Partial<Issue>, note: string) {
    save((d) => {
      const i = d.issues.find((x) => x.id === issue.id)!
      Object.assign(i, patch, { updatedAt: new Date(nowMs()).toISOString() })
      i.comments.push({ author: 'System', text: `${CURRENT_ACTOR.name}: ${note}`, at: new Date(nowMs()).toISOString() })
    }, { event: 'Issue Update', details: `${issue.id}: ${note}` })
    onMessage(`${issue.id}: ${note}.`)
  }

  function addComment() {
    if (!comment.trim()) return
    save((d) => {
      const i = d.issues.find((x) => x.id === issue.id)!
      i.comments.push({ author: CURRENT_ACTOR.name, text: comment.trim(), at: new Date(nowMs()).toISOString() })
      i.updatedAt = new Date(nowMs()).toISOString()
    }, { event: 'Issue Update', details: `${issue.id}: comment added` })
    setComment('')
  }

  function resolve() {
    if (resolution.trim().length < 10) return setError('Describe how the issue was fixed (at least 10 characters).')
    update({ status: 'Resolved', resolution: resolution.trim() }, 'marked Resolved')
    setResolving(false)
    setError('')
  }

  const closedish = issue.status === 'Resolved' || issue.status === 'Closed'

  return (
    <Modal
      title={<span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{issue.id} <Pill text={issue.status} /> <Pill text={issue.priority} dot={false} /></span>}
      onClose={onClose}
      width={860}
      footer={
        <>
          {issue.status === 'Open' && <button style={ghostBtn} onClick={() => update({ status: 'In Progress', assignedTo: issue.assignedTo === 'Unassigned' ? CURRENT_ACTOR.name : issue.assignedTo }, 'started work (In Progress)')}>Start Work</button>}
          {!closedish && <button style={{ ...smallPrimaryBtn, background: '#15803d' }} onClick={() => setResolving(true)}><Icon name="check" size={15} /> Resolve</button>}
          {issue.status === 'Resolved' && <button style={ghostBtn} onClick={() => update({ status: 'Closed' }, 'closed the ticket')}>Close Ticket</button>}
          {closedish && <button style={ghostBtn} onClick={() => update({ status: 'Open' }, 'reopened the ticket')}>Reopen</button>}
          <button style={ghostBtn} onClick={onClose}>Done</button>
        </>
      }
    >
      <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#111827' }}>{issue.title}</h3>
      <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{issue.description}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', padding: '14px', background: '#f7f6f4', borderRadius: '10px', marginBottom: '16px' }}>
        <DetailRow label="Module" value={issue.module} />
        <DetailRow label="Category" value={issue.category} />
        <DetailRow label="Reported by" value={<>{issue.reportedBy}<div style={{ color: MUTED, fontSize: '12px' }}>{formatDateTime(issue.createdAt)}</div></>} />
        <DetailRow label="Last update" value={relativeTime(issue.updatedAt)} />
      </div>

      {/* Quick changes (each one is saved straight away) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '16px' }}>
        <Field label="Status">
          <select style={inputStyle} value={issue.status} onChange={(e) => {
            const v = e.target.value as IssueStatus
            if (v === 'Resolved') setResolving(true)
            else update({ status: v }, `status ${issue.status} → ${v}`)
          }}>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
        </Field>
        <Field label="Priority">
          <select style={inputStyle} value={issue.priority} onChange={(e) => update({ priority: e.target.value as IssuePriority }, `priority ${issue.priority} → ${e.target.value}`)}>{PRIORITIES.map((x) => <option key={x}>{x}</option>)}</select>
        </Field>
        <Field label="Assigned to">
          <select style={inputStyle} value={issue.assignedTo} onChange={(e) => update({ assignedTo: e.target.value }, `assigned to ${e.target.value}`)}><option>Unassigned</option>{TECH_ADMINS.map((x) => <option key={x}>{x}</option>)}</select>
        </Field>
      </div>

      {resolving && (
        <div style={{ border: '1px solid #c7ebd3', background: '#f2fbf5', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
          {error && <div style={errorBox}>{error}</div>}
          <Field label="Resolution note *"><textarea style={{ ...inputStyle, minHeight: '64px' }} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="What was the cause and what was changed?" /></Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button style={ghostBtn} onClick={() => { setResolving(false); setError('') }}>Cancel</button>
            <button style={{ ...smallPrimaryBtn, background: '#15803d' }} onClick={resolve}>Mark as Resolved</button>
          </div>
        </div>
      )}
      {issue.resolution && !resolving && (
        <div style={{ border: '1px solid #c7ebd3', background: '#f2fbf5', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13.5px', color: '#14532d' }}>
          <strong>Resolution:</strong> {issue.resolution}
        </div>
      )}

      {/* Activity thread */}
      <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px', color: '#374151', marginBottom: '8px' }}>ACTIVITY ({issue.comments.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        {issue.comments.map((c, k) => (
          <div key={k} style={{ display: 'flex', gap: '10px' }}>
            {c.author === 'System' ? (
              <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#f1f2f4', color: MUTED, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="settings" size={14} /></span>
            ) : <Avatar name={c.author} size={30} />}
            <div style={{ flex: 1, background: c.author === 'System' ? 'transparent' : '#f7f6f4', borderRadius: '8px', padding: c.author === 'System' ? '5px 0' : '8px 12px' }}>
              <div style={{ fontSize: '12.5px', color: MUTED }}><strong style={{ color: '#111827' }}>{c.author === 'System' ? '' : c.author}</strong> {relativeTime(c.at)}</div>
              <div style={{ fontSize: '13.5px', color: c.author === 'System' ? MUTED : '#1f2937', fontStyle: c.author === 'System' ? 'italic' : 'normal' }}>{c.text}</div>
            </div>
          </div>
        ))}
        {issue.comments.length === 0 && <div style={{ fontSize: '13px', color: MUTED }}>No activity yet.</div>}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input style={inputStyle} value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} placeholder="Add a comment for the team or the reporter..." />
        <button style={{ ...smallPrimaryBtn, background: comment.trim() ? smallPrimaryBtn.background : '#9ca3af' }} onClick={addComment}>Comment</button>
      </div>
      <div style={{ fontSize: '12px', color: MUTED, marginTop: '8px', borderTop: `1px solid ${BORDER}`, paddingTop: '8px' }}>
        Tip: copy this link to share the ticket — <span style={{ color: ACCENT }}>/technical/system-issues?open={issue.id}</span>
      </div>
    </Modal>
  )
}
