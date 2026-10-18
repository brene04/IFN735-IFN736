import { useState, type ReactNode, type CSSProperties } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import dostLogo from '../assets/logo_dost.png'
import { navByRole, type NavItem } from '../auth/navConfig'

function RoleLayout({ navItems, roleLabel, children }: { navItems: NavItem[]; roleLabel: string; children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = (user?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6fb', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: 250, background: '#16233f', color: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 8px' }}>
          <img src={dostLogo} alt="DOST" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>DOST | CBHR</div>
          </div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {navItems.map(item => (
            <NavLink key={item.label} to={item.to} end style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8,
              color: '#fff', textDecoration: 'none', fontSize: 14,
              background: isActive ? '#233962' : 'transparent', opacity: isActive ? 1 : 0.8,
            })}>
              <span style={{ width: 14, height: 14, background: '#6f8fd6', clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)' }} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => { logout(); navigate('/') }} style={{
          background: 'transparent', border: '1px solid #3a4d78', color: '#fff', padding: '10px 12px',
          borderRadius: 8, cursor: 'pointer', fontSize: 14, textAlign: 'left',
        }}>Log out</button>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #e3e8f2', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <input placeholder="Search..." style={{ width: 320, maxWidth: '100%', padding: '9px 14px', border: '1px solid #d5dcea', borderRadius: 8, fontSize: 14 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#16233f' }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: '#6b7a99' }}>{roleLabel}</div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#16233f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }}>{initials}</div>
          </div>
        </header>
        <main style={{ padding: 32, flex: 1 }}>{children}</main>
      </div>
    </div>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ margin: 0, fontSize: 26, color: '#16233f' }}>{title}</h1>
      <p style={{ marginTop: 4, color: '#6b7a99', fontSize: 14 }}>{subtitle}</p>
    </div>
  )
}

function StatCard({ label, value, sub, valueColor = '#16233f' }: { label: string; value: ReactNode; sub?: string; valueColor?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e3e8f2' }}>
      <div style={{ fontSize: 13, color: '#6b7a99' }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, margin: '6px 0', color: valueColor }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#8a97b3' }}>{sub}</div>}
    </div>
  )
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section style={{ background: '#fff', borderRadius: 12, padding: 22, border: '1px solid #e3e8f2' }}>
      <h2 style={{ margin: 0, fontSize: 17, color: '#16233f' }}>{title}</h2>
      {subtitle && <p style={{ marginTop: 2, fontSize: 13, color: '#8a97b3' }}>{subtitle}</p>}
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  )
}

const tones = {
  success: ['#e3f6ec', '#1b7a4b'], warning: ['#fff3dc', '#a86a00'],
  danger: ['#fde8e8', '#b42318'], info: ['#e5edfb', '#27478f'],
} as const

function Badge({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return <span style={{ background: tones[tone][0], color: tones[tone][1], padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{children}</span>
}

function ActionButton({ onClick, children, variant = 'primary' }: { onClick: () => void; children: ReactNode; variant?: 'primary' | 'ghost' }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', marginRight: 6,
      background: variant === 'primary' ? '#16233f' : '#fff', color: variant === 'primary' ? '#fff' : '#16233f',
      border: '1px solid #16233f',
    }}>{children}</button>
  )
}

const th: CSSProperties = { textAlign: 'left', fontSize: 12, color: '#6b7a99', fontWeight: 600, padding: '8px 10px', borderBottom: '1px solid #e3e8f2' }
const td: CSSProperties = { fontSize: 14, color: '#16233f', padding: '12px 10px', borderBottom: '1px solid #f0f3f9' }

const typeTone = { Add: 'success', Update: 'info', Remove: 'danger' } as const
const activity = [
  { who: 'admin@dost.gov.ph', what: 'Account created', when: 'Today, 9:12 AM' },
  { who: 'office@dost.gov.ph', what: 'Role changed to Concerned Office', when: 'Today, 8:40 AM' },
  { who: 'executive@dost.gov.ph', what: 'Password reset', when: 'Yesterday' },
]

export default function TechnicalDashboard() {
  const [requests, setRequests] = useState<{ id: number; type: keyof typeof typeTone; employee: string; office: string }[]>([
    { id: 1, type: 'Add', employee: 'L. Garcia', office: 'Region IV-A' },
    { id: 2, type: 'Update', employee: 'R. Dela Cruz', office: 'Central Office' },
    { id: 3, type: 'Remove', employee: 'P. Mendoza', office: 'Region VII' },
  ])
  const process = (id: number) => setRequests(r => r.filter(x => x.id !== id))

  return (
    <RoleLayout navItems={navByRole.technical_admin} roleLabel="Technical Administrator">
      <PageHeader title="Technical Administrator Dashboard" subtitle="Manage users, roles and employee records" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Active Users" value="148" sub="System accounts" />
        <StatCard label="Pending Employee Requests" value={requests.length} sub="From Concerned Offices" valueColor="#a86a00" />
        <StatCard label="Roles Configured" value="4" sub="Executive, Admin, Tech, Office" />
        <StatCard label="System Status" value="Normal" sub="All services running" valueColor="#1b7a4b" />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Panel title="Employee Requests" subtitle="Add, update or remove employee records">
          {requests.length === 0 ? <p style={{ color: '#8a97b3', fontSize: 14 }}>No pending requests.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Type</th><th style={th}>Employee</th><th style={th}>Office</th><th style={th}>Action</th></tr></thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td style={td}><Badge tone={typeTone[r.type]}>{r.type}</Badge></td>
                    <td style={td}>{r.employee}</td><td style={td}>{r.office}</td>
                    <td style={td}><ActionButton onClick={() => process(r.id)}>Process</ActionButton></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <Panel title="Recent Account Activity">
          {activity.map(a => (
            <div key={a.who + a.when} style={{ padding: '10px 0', borderBottom: '1px solid #f0f3f9', fontSize: 14, color: '#16233f' }}>
              <strong>{a.who}</strong> – {a.what}
              <div style={{ fontSize: 12, color: '#8a97b3' }}>{a.when}</div>
            </div>
          ))}
        </Panel>
        <Panel title="System Status">
          {[['Database', 'Operational'], ['API', 'Operational']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f3f9', fontSize: 14 }}>
              <span>{k}</span><Badge tone="success">{v}</Badge>
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 13, color: '#8a97b3' }}>Last backup: Today, 2:00 AM</div>
        </Panel>
      </div>
    </RoleLayout>
  )
}
