// Shared building blocks for the Technical Admin pages:
// the sidebar + top bar layout, page header with breadcrumbs, cards, pills,
// modal, pagination, form fields and a small sign-in activity chart.
import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import dostLogo from '../../assets/logo_dost.png'
import { useAuth } from '../../auth/authContext'
import { useDb, employeeName, initialsOf } from './techData'
import type { AccessLog } from './techData'
import { SIDEBAR, SIDEBAR_ACTIVE, NAVY, ACCENT, BORDER, MUTED, CHART_BLUE, CHART_RED, ghostBtn, smallPrimaryBtn, nowMs } from './techTheme'

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

const iconPaths: Record<string, ReactNode> = {
  search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  bell: (<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>),
  users: (<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M15 20c0-2.2 1-4 3-4.6" /></>),
  shield: (<><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>),
  key: (<><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M17 6l2 2M15 8l2 2" /></>),
  log: (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>),
  id: (<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M14 10h4M14 13h3" /></>),
  edit: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>),
  alert: (<><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>),
  plus: (<><path d="M12 5v14M5 12h14" /></>),
  filter: (<><path d="M3 5h18l-7 8v6l-4 2v-8z" /></>),
  download: (<><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>),
  refresh: (<><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>),
  check: (<><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>),
  lock: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  unlock: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></>),
  dashboard: (<><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
  trash: (<><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></>),
  server: (<><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 7.5h.01M7 16.5h.01" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  hourglass: (<><path d="M6 3h12M6 21h12M7 3c0 6 10 6 10 9s-10 3-10 9M17 3c0 6-10 6-10 9" /></>),
  userx: (<><circle cx="9" cy="8" r="4" /><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7M17 8l5 5M22 8l-5 5" /></>),
  wrench: (<><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" /></>),
  arrow: (<><path d="M5 12h14M13 6l6 6-6 6" /></>),
}

export type IconName = keyof typeof iconPaths

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {iconPaths[name]}
    </svg>
  )
}

function HexIcon({ size = 20, color = 'white' }: { size?: number; color?: string }) {
  return (
    <span
      style={{ width: size, height: size, flexShrink: 0, display: 'inline-block', background: color, clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Layout: sidebar + top bar                                           */
/* ------------------------------------------------------------------ */

// Left menu, in the order of the Technical Admin flow.
// "section" rows are group headings; "badge" shows a live count.
type MenuItem = { section: string } | { label: string; to: string; badge?: 'updates' | 'issues' }
const menu: MenuItem[] = [
  { label: 'Dashboard', to: '/technical/dashboard' },
  { section: 'User & Access Management' },
  { label: 'Users', to: '/technical/users' },
  { label: 'Roles', to: '/technical/roles' },
  { label: 'Role Assignment', to: '/technical/role-assignment' },
  { label: 'Access Logs', to: '/technical/access-logs' },
  { section: 'Employee Profile Management' },
  { label: 'Employees', to: '/technical/employees' },
  { label: 'Positions', to: '/technical/positions' }, // Position Management (DOST plantilla format)
  { label: 'Profile Updates', to: '/technical/profile-updates', badge: 'updates' },
  { label: 'Office Requests', to: '/technical/office-requests' },
  { section: 'System' },
  { label: 'System Configuration', to: '/technical/system-configuration' },
  { label: 'Technical System Issues', to: '/technical/system-issues', badge: 'issues' },
]

export function TechLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const db = useDb()
  const [query, setQuery] = useState('')
  const [showBell, setShowBell] = useState(false)

  const pendingUpdates = db.updates.filter((u) => u.status === 'Pending').length
  const openIssues = db.issues.filter((i) => i.status === 'Open' || i.status === 'In Progress').length
  const badges = { updates: pendingUpdates, issues: openIssues }

  // Notifications shown under the bell
  const maxAttempts = db.config.security.maxFailedAttempts
  const locked = db.users.filter((u) => u.failedAttempts >= maxAttempts && u.status === 'Active')
  const urgentIssues = db.issues.filter((i) => (i.priority === 'Critical' || i.priority === 'High') && i.status === 'Open')
  const pendingSetup = db.users.filter((u) => u.status === 'Pending Setup')
  const pendingApproval = db.users.filter((u) => u.status === 'Pending Approval')
  const notifications = [
    ...locked.map((u) => ({ text: `${u.username} is locked after ${u.failedAttempts} failed sign-ins`, to: `/technical/users?q=${u.username}`, tone: '#d03b3b' })),
    ...urgentIssues.map((i) => ({ text: `${i.priority}: ${i.title}`, to: `/technical/system-issues?open=${i.id}`, tone: '#ec835a' })),
    ...(pendingUpdates ? [{ text: `${pendingUpdates} profile update request${pendingUpdates === 1 ? '' : 's'} waiting for review`, to: '/technical/profile-updates', tone: '#fab219' }] : []),
    ...(pendingApproval.length ? [{ text: `${pendingApproval.length} new account${pendingApproval.length === 1 ? '' : 's'} waiting for Executive approval`, to: '/technical/users?status=Pending Approval', tone: '#fab219' }] : []),
    ...(pendingSetup.length ? [{ text: `${pendingSetup.length} account${pendingSetup.length === 1 ? '' : 's'} pending setup`, to: '/technical/users?status=Pending Setup', tone: CHART_BLUE }] : []),
  ]

  // Global search: employees and user accounts
  const q = query.trim().toLowerCase()
  const empHits = q ? db.employees.filter((e) => `${employeeName(e)} ${e.employeeNo} ${e.email}`.toLowerCase().includes(q)).slice(0, 4) : []
  const userHits = q ? db.users.filter((u) => `${u.username} ${u.email}`.toLowerCase().includes(q)).slice(0, 3) : []

  const name = user?.name ?? 'Technical Admin'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", background: '#f4f5f7' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', background: SIDEBAR, color: 'white', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '26px 24px 18px' }}>
          <img src={dostLogo} alt="DOST logo" style={{ width: 34, height: 34 }} />
          <span style={{ fontSize: '19px', letterSpacing: '0.5px' }}>
            <strong>DOST</strong> | CBHR
          </span>
        </div>
        <div style={{ margin: '0 24px 14px', fontSize: '11px', letterSpacing: '1px', color: '#9fb3cf', fontWeight: 700 }}>TECHNICAL ADMIN</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {menu.map((item) => {
            if ('section' in item) {
              return (
                <div key={item.section} style={{ padding: '16px 24px 6px', fontSize: '10.5px', letterSpacing: '1.2px', color: '#9fb3cf', fontWeight: 700 }}>
                  {item.section.toUpperCase()}
                </div>
              )
            }
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            const count = item.badge ? badges[item.badge] : 0
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'white',
                  background: isActive ? SIDEBAR_ACTIVE : 'transparent',
                  borderLeft: `5px solid ${isActive ? '#dbe7f5' : 'transparent'}`,
                  textDecoration: 'none',
                }}
              >
                <HexIcon size={18} color={isActive ? 'white' : 'rgba(255,255,255,0.85)'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {count > 0 && (
                  <span style={{ background: '#fab219', color: '#3b2600', fontSize: '11px', fontWeight: 700, borderRadius: '999px', padding: '1px 8px' }}>{count}</span>
                )}
              </Link>
            )
          })}
        </nav>
        <div style={{ margin: 'auto 20px 22px', paddingTop: '18px' }}>
          <div style={{ background: '#f3f4f6', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HexIcon size={20} />
            </span>
            <div style={{ fontSize: '12px', color: '#374151', textAlign: 'center' }}>
              <strong>{name}</strong>
              <div style={{ color: MUTED }}>Technical Administrator</div>
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/')
              }}
              style={{ width: '100%', background: '#d1d5db', color: '#374151', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', padding: '16px 32px', background: 'white', position: 'relative', zIndex: 20 }}>
          <div style={{ flex: 1, maxWidth: '1000px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f7f8fa', borderRadius: '10px', padding: '0 18px', color: '#9ca3af' }}>
              <Icon name="search" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setQuery('')
                  if (e.key === 'Enter' && q) {
                    navigate(`/technical/employees?q=${encodeURIComponent(query.trim())}`)
                    setQuery('')
                  }
                }}
                placeholder="Search employees or user accounts..."
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '13px 0', fontSize: '14px', fontStyle: 'italic', color: '#1f2937' }}
              />
            </div>
            {q && (
              <div style={{ position: 'absolute', top: '52px', left: 0, right: 0, background: 'white', border: `1px solid ${BORDER}`, borderRadius: '10px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', padding: '8px', zIndex: 30 }}>
                {empHits.length === 0 && userHits.length === 0 && <div style={{ padding: '10px', color: MUTED, fontSize: '13px' }}>No matches for “{query}”.</div>}
                {empHits.length > 0 && <div style={{ padding: '6px 10px', fontSize: '11px', letterSpacing: '1px', color: MUTED, fontWeight: 700 }}>EMPLOYEES</div>}
                {empHits.map((e) => (
                  <Link key={e.id} to={`/technical/employees/${e.id}`} onClick={() => setQuery('')} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', textDecoration: 'none', color: '#111827', fontSize: '13.5px' }}>
                    <span><strong>{employeeName(e)}</strong> <span style={{ color: MUTED }}>· {e.employeeNo}</span></span>
                    <span style={{ color: MUTED }}>{e.officeCode}</span>
                  </Link>
                ))}
                {userHits.length > 0 && <div style={{ padding: '6px 10px', fontSize: '11px', letterSpacing: '1px', color: MUTED, fontWeight: 700 }}>USER ACCOUNTS</div>}
                {userHits.map((u) => (
                  <Link key={u.id} to={`/technical/users?q=${u.username}`} onClick={() => setQuery('')} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', textDecoration: 'none', color: '#111827', fontSize: '13.5px' }}>
                    <span><strong>{u.username}</strong> <span style={{ color: MUTED }}>· {u.email}</span></span>
                    <span style={{ color: MUTED }}>{u.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowBell(!showBell)} aria-label="Notifications" style={{ position: 'relative', color: '#6b7280', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
                <Icon name="bell" size={20} />
                {notifications.length > 0 && <span style={{ position: 'absolute', top: 3, right: 3, width: 9, height: 9, borderRadius: '50%', background: '#dc2626', border: '2px solid white' }} />}
              </button>
              {showBell && (
                <div style={{ position: 'absolute', right: 0, top: '42px', width: '360px', background: 'white', border: `1px solid ${BORDER}`, borderRadius: '10px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', padding: '8px', zIndex: 30 }}>
                  <div style={{ padding: '6px 10px 8px', fontWeight: 700, color: NAVY, fontSize: '14px' }}>Notifications ({notifications.length})</div>
                  {notifications.length === 0 && <div style={{ padding: '10px', color: MUTED, fontSize: '13px' }}>You are all caught up.</div>}
                  {notifications.map((n, i) => (
                    <Link key={i} to={n.to} onClick={() => setShowBell(false)} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '9px 10px', borderRadius: '6px', textDecoration: 'none', color: '#1f2937', fontSize: '13px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: n.tone, marginTop: '5px', flexShrink: 0 }} />
                      {n.text}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <span style={{ width: 1, height: 32, background: '#d1d5db' }} />
            <span style={{ width: 44, height: 44, borderRadius: '50%', background: '#e5e7eb', color: '#6b7280', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {initialsOf(name) || 'TA'}
            </span>
            <div style={{ fontSize: '14px', lineHeight: 1.3 }}>
              <div style={{ fontWeight: 700, color: NAVY }}>{name}</div>
              <div style={{ color: NAVY }}>Technical Administrator</div>
            </div>
          </div>
        </div>

        {/* Maintenance banner (System Configuration → Maintenance) */}
        {db.config.maintenance.maintenanceMode && (
          <div style={{ background: '#fff6dd', borderBottom: '1px solid #f6d98a', color: '#7a5000', padding: '10px 32px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon name="wrench" size={16} />
            <span><strong>Maintenance mode is ON.</strong> Only Technical Administrators can sign in. {db.config.maintenance.message}</span>
            <Link to="/technical/system-configuration?tab=maintenance" style={{ marginLeft: 'auto', color: '#7a5000', fontWeight: 700 }}>Manage</Link>
          </div>
        )}

        {/* Page content (light grid background like the HIFI designs) */}
        <div
          onClick={() => showBell && setShowBell(false)}
          style={{
            flex: 1,
            padding: '26px 32px 40px',
            backgroundColor: '#f6f7f9',
            backgroundImage: 'linear-gradient(#eceef2 1px, transparent 1px), linear-gradient(90deg, #eceef2 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page header with breadcrumbs                                        */
/* ------------------------------------------------------------------ */

export interface Crumb {
  label: string
  to?: string
}

export function PageHeader({ crumbs, title, description, actions }: { crumbs: Crumb[]; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', paddingBottom: '18px', borderBottom: `1px solid ${BORDER}`, marginBottom: '22px', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: '13px', color: MUTED, marginBottom: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: 'flex', gap: '8px' }}>
              {i > 0 && <span>&rsaquo;</span>}
              {c.to && i < crumbs.length - 1 ? (
                <Link to={c.to} style={{ color: MUTED, textDecoration: 'none' }}>{c.label}</Link>
              ) : (
                <span style={{ color: i === crumbs.length - 1 ? NAVY : MUTED, fontWeight: i === crumbs.length - 1 ? 600 : 400 }}>{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 style={{ fontSize: '30px', fontWeight: 800, color: NAVY, margin: '0 0 6px', letterSpacing: '0.2px' }}>{title}</h1>
        {description && <p style={{ fontSize: '14.5px', color: '#1f2937', margin: 0, maxWidth: '820px' }}>{description}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

export function Card({ title, subtitle, right, children, style, flush }: { title?: ReactNode; subtitle?: ReactNode; right?: ReactNode; children: ReactNode; style?: CSSProperties; flush?: boolean }) {
  return (
    <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: flush ? 0 : '20px 22px', overflow: flush ? 'hidden' : undefined, ...style }}>
      {(title || right) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', padding: flush ? '18px 22px 0' : 0, flexWrap: 'wrap' }}>
          <div>
            {title && <h2 style={{ fontSize: '16px', fontWeight: 700, color: NAVY, margin: 0 }}>{title}</h2>}
            {subtitle && <p style={{ fontSize: '12.5px', color: MUTED, margin: '3px 0 0' }}>{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

type Tone = 'navy' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

const toneColors: Record<Tone, { fg: string; bg: string; border: string }> = {
  navy: { fg: NAVY, bg: '#eef1fb', border: '#c7d2f0' },
  accent: { fg: ACCENT, bg: '#e6f5fc', border: '#a9dcf3' },
  success: { fg: '#15803d', bg: '#e7f6ec', border: '#c7ebd3' },
  warning: { fg: '#b45309', bg: '#fef6e4', border: '#fde3b0' },
  danger: { fg: '#b91c1c', bg: '#fdecec', border: '#f8caca' },
  neutral: { fg: '#4b5563', bg: '#f3f4f6', border: '#e5e7eb' },
}

// KPI card like the "Total System Accounts" cards in the mockups
export function StatCard({ label, value, unit, sub, icon, tone = 'navy', to }: { label: string; value: ReactNode; unit?: ReactNode; sub?: ReactNode; icon: IconName; tone?: Tone; to?: string }) {
  const c = toneColors[tone]
  const body = (
    <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 22px', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>
        <span style={{ fontSize: '12px', letterSpacing: '1px', color: '#4b5563', fontWeight: 600 }}>{label}</span>
        <span style={{ width: 36, height: 36, borderRadius: '8px', background: c.bg, color: c.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={icon} />
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '30px', fontWeight: 700, color: tone === 'danger' ? '#b91c1c' : '#111827', lineHeight: 1.1 }}>{value}</span>
        {unit && <span style={{ fontSize: '15px', color: tone === 'navy' || tone === 'neutral' ? MUTED : c.fg, fontWeight: 600 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: '13px', color: '#374151', marginTop: '8px' }}>{sub}</div>}
    </div>
  )
  return to ? (
    <Link to={to} style={{ flex: 1, minWidth: '200px', textDecoration: 'none' }}>{body}</Link>
  ) : (
    <div style={{ flex: 1, minWidth: '200px' }}>{body}</div>
  )
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: '18px', marginBottom: '22px', flexWrap: 'wrap' }}>{children}</div>
}

/* ------------------------------------------------------------------ */
/* Pills, avatar, tabs                                                 */
/* ------------------------------------------------------------------ */

// Maps every status word used in the module to a colour
const statusTones: Record<string, Tone> = {
  Active: 'success', Completed: 'success', Approved: 'success', Success: 'success', Resolved: 'success', 'Fully Profiled': 'success',
  'Pending Approval': 'warning','Pending Setup': 'warning', Pending: 'warning', 'On Leave': 'warning', Warning: 'warning', 'In Progress': 'accent', 'Partially Profiled': 'warning', Medium: 'warning',
  Suspended: 'danger', Failed: 'danger', Rejected: 'danger', Overdue: 'danger', Critical: 'danger', High: 'danger', Open: 'navy',
  Deactivated: 'neutral', Inactive: 'neutral', Separated: 'neutral', Closed: 'neutral', 'Not Profiled': 'neutral', 'Not Started': 'neutral', Low: 'neutral',
}

export function Pill({ text, tone, dot = true }: { text: string; tone?: Tone; dot?: boolean }) {
  const c = toneColors[tone ?? statusTones[text] ?? 'neutral']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: c.bg, color: c.fg, border: `1px solid ${c.border}`, fontSize: '12.5px', fontWeight: 600, padding: '3px 11px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
      {dot && <span style={{ fontSize: '8px' }}>&#9679;</span>}
      {text}
    </span>
  )
}

// Dark role badge like "Executive" in the User Account Management mockup
export function RoleBadge({ name }: { name: string }) {
  return <span style={{ background: '#0f2442', color: 'white', fontSize: '12.5px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', whiteSpace: 'nowrap' }}>{name}</span>
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', background: '#e6f0f8', color: NAVY, fontWeight: 700, fontSize: Math.round(size * 0.34), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid white', boxShadow: `0 0 0 1px ${BORDER}` }}>
      {initialsOf(name)}
    </span>
  )
}

export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: { value: T; label: string; count?: number }[]; active: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {tabs.map((t) => {
        const on = t.value === active
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            style={{ background: on ? '#0f2442' : 'transparent', color: on ? 'white' : '#1f2937', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '14px', fontWeight: on ? 700 : 500, cursor: 'pointer' }}
          >
            {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', background: '#f7f6f4', minWidth: '240px' }}>
      <span style={{ color: MUTED, display: 'flex' }}><Icon name="search" /></span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '11px 0', fontSize: '14px' }}
      />
      {value && (
        <button onClick={() => onChange('')} aria-label="Clear search" style={{ background: 'none', border: `1.5px solid ${MUTED}`, color: MUTED, borderRadius: '50%', width: 18, height: 18, fontSize: '11px', lineHeight: 1, cursor: 'pointer', padding: 0 }}>
          &times;
        </button>
      )}
    </div>
  )
}

export function Field({ label, children, full, hint }: { label: string; children: ReactNode; full?: boolean; hint?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: full ? '1 / -1' : undefined }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: '11.5px', color: MUTED }}>{hint}</span>}
    </label>
  )
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '11px', letterSpacing: '0.8px', color: MUTED, fontWeight: 600, marginBottom: '3px' }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: '14px', color: '#111827' }}>{value}</div>
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{ width: 44, height: 24, borderRadius: '999px', border: 'none', background: checked ? ACCENT : '#d1d5db', position: 'relative', cursor: 'pointer', flexShrink: 0, padding: 0 }}
    >
      <span style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
    </button>
  )
}

// Green "saved" / red "error" message strip at the top of a page
export function Notice({ text, tone = 'success', onClose }: { text: string; tone?: 'success' | 'danger' | 'info'; onClose: () => void }) {
  const c = tone === 'success' ? toneColors.success : tone === 'danger' ? toneColors.danger : toneColors.accent
  return (
    <div role="status" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: c.bg, border: `1px solid ${c.border}`, color: c.fg, borderRadius: '8px', padding: '10px 14px', fontSize: '13.5px', marginBottom: '18px' }}>
      <Icon name={tone === 'danger' ? 'alert' : 'check'} size={16} />
      <span style={{ flex: 1 }}>{text}</span>
      <button onClick={onClose} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: c.fg, cursor: 'pointer', fontSize: '18px' }}>&times;</button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal + pagination                                                  */
/* ------------------------------------------------------------------ */

export function Modal({ title, onClose, children, footer, width = 640 }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
      <div
        role="dialog"
        aria-modal
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', borderRadius: '12px', width: `${width}px`, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: NAVY, margin: 0 }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: MUTED }}>&times;</button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto' }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 22px', borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>{footer}</div>}
      </div>
    </div>
  )
}

// Simple "Are you sure?" dialog
export function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onClose }: { title: string; message: ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      width={480}
      footer={
        <>
          <button style={ghostBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...smallPrimaryBtn, background: danger ? '#b91c1c' : NAVY }} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{message}</div>
    </Modal>
  )
}

function pageList(page: number, total: number): (number | '...')[] {
  const wanted = new Set([1, total, page - 1, page, page + 1])
  if (page <= 3) [1, 2, 3].forEach((n) => wanted.add(n))
  const nums = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const result: (number | '...')[] = []
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) result.push('...')
    result.push(n)
  })
  return result
}

export function TableFooter({ from, to, total, label, page, totalPages, onPage }: { from: number; to: number; total: number; label: string; page: number; totalPages: number; onPage: (p: number) => void }) {
  const box = (active: boolean, disabled = false): CSSProperties => ({
    minWidth: 34, height: 34, borderRadius: '6px', border: active ? 'none' : `1px solid ${BORDER}`,
    background: active ? '#0f2442' : 'white', color: active ? 'white' : disabled ? '#c4c8cf' : '#1f2937',
    fontSize: '14px', fontWeight: active ? 700 : 500, cursor: disabled ? 'default' : 'pointer',
  })
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#f7f6f4', borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: '10px' }}>
      <span style={{ fontSize: '14px', color: '#374151' }}>Showing <strong>{from}</strong> to <strong>{to}</strong> of <strong>{total}</strong> {label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button style={box(false, page === 1)} disabled={page === 1} onClick={() => onPage(1)} aria-label="First page">|&lsaquo;</button>
        <button style={box(false, page === 1)} disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page">&lsaquo;</button>
        {pageList(page, totalPages).map((p, i) =>
          p === '...' ? <span key={`gap-${i}`} style={{ padding: '0 4px', color: MUTED }}>...</span> : <button key={p} style={box(p === page)} onClick={() => onPage(p)}>{p}</button>,
        )}
        <button style={box(false, page === totalPages)} disabled={page === totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">&rsaquo;</button>
        <button style={box(false, page === totalPages)} disabled={page === totalPages} onClick={() => onPage(totalPages)} aria-label="Last page">&rsaquo;|</button>
      </div>
    </div>
  )
}

export function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: '36px', textAlign: 'center', color: MUTED, fontSize: '14px' }}>{text}</td>
    </tr>
  )
}

/* ------------------------------------------------------------------ */
/* Sign-in activity chart (Dashboard + Access Logs)                    */
/* ------------------------------------------------------------------ */

export function SignInChart({ logs, days = 7 }: { logs: AccessLog[]; days?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  // Count successful and failed sign-ins per day
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(nowMs() - (days - 1 - i) * 86400000)
    const key = d.toDateString()
    const dayLogs = logs.filter((l) => new Date(l.timestamp).toDateString() === key)
    return {
      label: i === days - 1 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit' }),
      success: dayLogs.filter((l) => l.event === 'Login').length,
      failed: dayLogs.filter((l) => l.event === 'Failed Login').length,
    }
  })
  const max = Math.max(4, ...buckets.map((b) => Math.max(b.success, b.failed)))
  const h = 170
  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: '#374151', marginBottom: '10px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 10, height: 10, borderRadius: '3px', background: CHART_BLUE }} />Successful sign-ins</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 10, height: 10, borderRadius: '3px', background: CHART_RED }} />Failed sign-ins</span>
      </div>
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: `repeat(${days}, 1fr)`, gap: '10px', alignItems: 'end', height: h, borderBottom: `1px solid ${BORDER}`, backgroundImage: `linear-gradient(${BORDER} 1px, transparent 1px)`, backgroundSize: `100% ${h / 4}px` }}>
        {buckets.map((b, i) => (
          <div
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '3px', height: '100%', position: 'relative', background: hover === i ? 'rgba(42,120,214,0.06)' : 'transparent', borderRadius: '6px 6px 0 0' }}
          >
            <div title={`${b.success} successful`} style={{ width: '38%', maxWidth: 22, height: `${(b.success / max) * 100}%`, background: CHART_BLUE, borderRadius: '4px 4px 0 0', minHeight: b.success ? 2 : 0 }} />
            <div title={`${b.failed} failed`} style={{ width: '38%', maxWidth: 22, height: `${(b.failed / max) * 100}%`, background: CHART_RED, borderRadius: '4px 4px 0 0', minHeight: b.failed ? 2 : 0 }} />
            {hover === i && (
              <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translate(-50%, -6px)', background: '#0f2442', color: 'white', fontSize: '12px', padding: '7px 10px', borderRadius: '6px', whiteSpace: 'nowrap', zIndex: 5, pointerEvents: 'none' }}>
                <strong>{b.label}</strong><br />{b.success} successful · {b.failed} failed
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${days}, 1fr)`, gap: '10px', marginTop: '6px' }}>
        {buckets.map((b, i) => (
          <span key={i} style={{ textAlign: 'center', fontSize: '11.5px', color: i === days - 1 ? NAVY : MUTED, fontWeight: i === days - 1 ? 700 : 400 }}>{b.label}</span>
        ))}
      </div>
    </div>
  )
}
