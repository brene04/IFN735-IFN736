// ACCESS LOGS  (/technical/access-logs)
// Audit trail of sign-ins, failed attempts, permission denials and every admin action
// taken in this module (actions are added automatically by save() in techData.ts).
// Address options: ?event=Failed Login  ?status=Failed  ?q=username
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDb, employeeName, EVENT_TYPES } from './techData'
import type { AccessLog } from './techData'
import { TechLayout, PageHeader, StatRow, StatCard, Card, SearchBox, Pill, Modal, TableFooter, EmptyRow, Icon, SignInChart, DetailRow } from './techUi'
import { ACCENT, MUTED, BORDER, CHART_BLUE, inputStyle, selectStyle, ghostBtn, smallPrimaryBtn, rowGhostBtn, thStyle, tdStyle, formatDateTime, relativeTime, paginate, downloadCsv, nowMs } from './techTheme'

const PER_PAGE = 10

export default function AccessLogsPage() {
  const db = useDb()
  const [params] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [eventFilter, setEventFilter] = useState(params.get('event') ?? 'All')
  const [statusFilter, setStatusFilter] = useState(params.get('status') ?? 'All')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState<AccessLog | null>(null)

  const now = nowMs()
  const userOf = (l: AccessLog) => db.users.find((u) => u.id === l.userId)
  const empOf = (l: AccessLog) => db.employees.find((e) => e.id === userOf(l)?.employeeId)
  const roleOf = (l: AccessLog) => db.roles.find((r) => r.id === userOf(l)?.roleId)?.name ?? '—'

  // ---- KPI numbers ----
  const today = new Date(now).toDateString()
  const todays = db.logs.filter((l) => new Date(l.timestamp).toDateString() === today)
  const failed24 = db.logs.filter((l) => l.event === 'Failed Login' && now - new Date(l.timestamp).getTime() < 86400000).length
  const warnings7 = db.logs.filter((l) => l.status === 'Warning' && now - new Date(l.timestamp).getTime() < 7 * 86400000).length
  const week = db.logs.filter((l) => now - new Date(l.timestamp).getTime() < 7 * 86400000)
  const topEvents = EVENT_TYPES.map((e) => ({ event: e, count: week.filter((l) => l.event === e).length })).filter((e) => e.count > 0).sort((a, b) => b.count - a.count).slice(0, 6)
  const maxTop = Math.max(1, ...topEvents.map((e) => e.count))

  // ---- filtering ----
  const q = search.trim().toLowerCase()
  const filtered = db.logs.filter((l) => {
    const day = l.timestamp.slice(0, 10)
    return (
      (!q || `${l.username} ${employeeName(empOf(l))} ${l.details} ${l.ip}`.toLowerCase().includes(q)) &&
      (eventFilter === 'All' || l.event === eventFilter) &&
      (statusFilter === 'All' || l.status === statusFilter) &&
      (!from || day >= from) &&
      (!to || day <= to)
    )
  })
  const p = paginate(filtered, page, PER_PAGE)

  function reset() {
    setSearch(''); setEventFilter('All'); setStatusFilter('All'); setFrom(''); setTo(''); setPage(1)
  }

  function exportCsv() {
    downloadCsv('access_logs.csv', [
      ['Log ID', 'Timestamp', 'Username', 'Employee', 'Role', 'Event', 'Status', 'IP Address', 'Device', 'Details'],
      ...filtered.map((l) => [l.id, l.timestamp, l.username, employeeName(empOf(l)), roleOf(l), l.event, l.status, l.ip, l.device, l.details]),
    ])
  }

  const statusDot = (s: AccessLog['status']) => (s === 'Failed' ? '#d03b3b' : s === 'Warning' ? '#fab219' : '#0ca30c')

  return (
    <TechLayout>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/technical/dashboard' }, { label: 'User & Access Management', to: '/technical/users' }, { label: 'Access Logs' }]}
        title="Access Logs"
        description="Audit trail of sign-ins, failed attempts, permission denials and administrative changes across CB-HRMS."
        actions={<button style={ghostBtn} onClick={exportCsv}><Icon name="download" size={16} /> Export CSV ({filtered.length})</button>}
      />

      <StatRow>
        <StatCard label="EVENTS TODAY" value={todays.length} unit="Events" sub={`${new Set(todays.map((l) => l.username)).size} different users`} icon="log" />
        <StatCard label="SUCCESSFUL SIGN-INS TODAY" value={todays.filter((l) => l.event === 'Login').length} unit="Sign-ins" tone="success" sub="Password + 2FA verified" icon="check" />
        <StatCard label="FAILED SIGN-INS (24 H)" value={failed24} unit="Failed" tone="danger" sub="Wrong password or expired code" icon="lock" />
        <StatCard label="SECURITY WARNINGS (7 DAYS)" value={warnings7} unit="Warnings" tone="warning" sub="Permission denied attempts" icon="alert" />
      </StatRow>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '18px', marginBottom: '18px' }}>
        <Card title="Sign-in Activity" subtitle="Last 7 days · hover a day for details">
          <SignInChart logs={db.logs} />
        </Card>
        <Card title="Most Frequent Events" subtitle="Last 7 days · click to filter">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topEvents.map((e) => (
              <button key={e.event} onClick={() => { setEventFilter(e.event); setPage(1) }} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: '#1f2937', fontWeight: 600 }}>{e.event}</span><strong>{e.count}</strong>
                </div>
                <div style={{ height: '8px', background: '#eceef2', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(e.count / maxTop) * 100}%`, height: '100%', background: CHART_BLUE, borderRadius: '0 4px 4px 0' }} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '18px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search username, employee, details or IP address..." />
          <select style={selectStyle} value={eventFilter} onChange={(e) => { setEventFilter(e.target.value); setPage(1) }}>
            <option value="All">Event: All</option>
            {EVENT_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select style={selectStyle} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="All">Status: All</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Warning">Warning</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>From <input type="date" style={{ ...inputStyle, width: '150px' }} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>To <input type="date" style={{ ...inputStyle, width: '150px' }} value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} /></label>
          <button style={ghostBtn} onClick={reset}><Icon name="filter" size={15} /> Reset</button>
        </div>
      </Card>

      <Card flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr>
                <th style={thStyle}>TIMESTAMP</th>
                <th style={thStyle}>USER</th>
                <th style={thStyle}>EVENT</th>
                <th style={thStyle}>STATUS</th>
                <th style={thStyle}>IP ADDRESS</th>
                <th style={thStyle}>DEVICE</th>
                <th style={thStyle}>DETAILS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map((l) => (
                <tr key={l.id}>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{relativeTime(l.timestamp)}</div>
                    <div style={{ color: MUTED, fontSize: '12px' }}>{formatDateTime(l.timestamp)}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700, color: '#111827' }}>{l.username}</div>
                    <div style={{ color: MUTED, fontSize: '12px' }}>{employeeName(empOf(l))} · {roleOf(l)}</div>
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot(l.status) }} />{l.event}
                    </span>
                  </td>
                  <td style={tdStyle}><Pill text={l.status} /></td>
                  <td style={{ ...tdStyle, fontFamily: 'ui-monospace, monospace', fontSize: '12.5px' }}>{l.ip}</td>
                  <td style={{ ...tdStyle, color: '#374151', whiteSpace: 'nowrap' }}>{l.device}</td>
                  <td style={{ ...tdStyle, color: '#374151', maxWidth: '280px' }}>{l.details}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}><button style={rowGhostBtn} onClick={() => setViewing(l)}>View</button></td>
                </tr>
              ))}
              {p.rows.length === 0 && <EmptyRow colSpan={8} text="No log entries match your filters." />}
            </tbody>
          </table>
        </div>
        <TableFooter from={p.from} to={p.to} total={filtered.length} label="log entries" page={p.current} totalPages={p.totalPages} onPage={setPage} />
      </Card>

      {/* Log detail */}
      {viewing && (() => {
        const u = userOf(viewing)
        const others = db.logs.filter((l) => l.userId === viewing.userId && l.id !== viewing.id).slice(0, 5)
        return (
          <Modal
            title={`Log Entry #${viewing.id}`}
            onClose={() => setViewing(null)}
            width={680}
            footer={
              <>
                <button style={ghostBtn} onClick={() => { setSearch(viewing.username); setViewing(null); setPage(1) }}>Show all events for {viewing.username}</button>
                {u && <Link to={`/technical/users?q=${u.username}`} style={{ ...smallPrimaryBtn, textDecoration: 'none' }}>Open user account</Link>}
              </>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <DetailRow label="Event" value={<strong>{viewing.event}</strong>} />
              <DetailRow label="Status" value={<Pill text={viewing.status} />} />
              <DetailRow label="Timestamp" value={formatDateTime(viewing.timestamp)} />
              <DetailRow label="User" value={<>{viewing.username} · {employeeName(empOf(viewing))}<div style={{ color: MUTED, fontSize: '12.5px' }}>{roleOf(viewing)}</div></>} />
              <DetailRow label="IP address" value={viewing.ip} />
              <DetailRow label="Device / browser" value={viewing.device} />
            </div>
            <DetailRow label="Details" value={viewing.details} />
            {viewing.event === 'Failed Login' && u && u.failedAttempts >= db.config.security.maxFailedAttempts && (
              <div style={{ marginTop: '14px', background: '#fdecec', border: '1px solid #f8caca', color: '#9f2222', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' }}>
                This account is locked after {u.failedAttempts} failed attempts. <Link to={`/technical/users?q=${u.username}`} style={{ color: ACCENT, fontWeight: 700 }}>Unlock it on the Users page</Link>.
              </div>
            )}
            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px', color: '#374151', marginBottom: '8px' }}>OTHER RECENT EVENTS BY THIS USER</div>
              {others.map((l) => (
                <div key={l.id} style={{ display: 'flex', gap: '10px', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid #f0f1f3' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot(l.status), marginTop: '5px' }} />
                  <span style={{ flex: 1 }}><strong>{l.event}</strong> · {l.details}</span>
                  <span style={{ color: MUTED, whiteSpace: 'nowrap' }}>{relativeTime(l.timestamp)}</span>
                </div>
              ))}
              {others.length === 0 && <div style={{ fontSize: '13px', color: MUTED }}>No other events.</div>}
            </div>
          </Modal>
        )
      })()}
    </TechLayout>
  )
}
