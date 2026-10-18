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

const largestGaps = [
  { name: 'A. Villanueva', position: 'Science Research Specialist', gap: '42%' },
  { name: 'C. Ramos', position: 'Project Evaluation Officer', gap: '37%' },
  { name: 'D. Lim', position: 'Policy Analyst', gap: '31%' },
]
const statusTone = { Pending: 'warning', Approved: 'success', Declined: 'danger' } as const

export default function OfficeDashboard() {
  const [requests, setRequests] = useState<{ id: number; what: string; to: string; status: keyof typeof statusTone }[]>([
    { id: 1, what: 'Remove employee: J. Harpy', to: 'Technical Admin', status: 'Pending' },
  ])
  const send = (what: string, to: string) =>
    setRequests(r => [{ id: Date.now(), what, to, status: 'Pending' }, ...r])
  const open = requests.filter(r => r.status === 'Pending').length

  return (
    <RoleLayout navItems={navByRole.concerned_office} roleLabel="Concerned Office">
      <PageHeader title="Office Dashboard" subtitle="Competency status of employees in your office" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Employees in Office" value="112" />
        <StatCard label="Assessed" value="98" sub="87% of office" valueColor="#1b7a4b" />
        <StatCard label="Employees with Gaps" value="41" valueColor="#b42318" />
        <StatCard label="Open Requests" value={open} valueColor="#a86a00" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Panel title="Employees with Largest Gaps">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Name</th><th style={th}>Position</th><th style={th}>Gap</th></tr></thead>
            <tbody>
              {largestGaps.map(e => (
                <tr key={e.name}><td style={td}>{e.name}</td><td style={td}>{e.position}</td><td style={td}><Badge tone="danger">{e.gap}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Quick Actions" subtitle="Requests are routed to the right administrator">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
            <ActionButton onClick={() => send('Add employee', 'Technical Admin')}>Request employee addition</ActionButton>
            <ActionButton onClick={() => send('Remove employee', 'Technical Admin')}>Request employee removal</ActionButton>
            <ActionButton variant="ghost" onClick={() => send('Gap analysis report', 'Administrative Admin')}>Request gap analysis report</ActionButton>
          </div>
        </Panel>
      </div>
      <Panel title="My Requests">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Request</th><th style={th}>Sent To</th><th style={th}>Status</th></tr></thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}><td style={td}>{r.what}</td><td style={td}>{r.to}</td><td style={td}><Badge tone={statusTone[r.status]}>{r.status}</Badge></td></tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </RoleLayout>
  )
}
