// One layout for the Administrative Admin and Executive pages.
// It is the SAME sidebar + top bar the Technical Admin and Concerned Office use (ShellLayout),
// fed with the menu from auth/navConfig.tsx, so all four roles look and behave the same.
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { navByRole } from '../auth/navConfig'
import type { Role } from '../auth/users'
import { useDb } from '../pages/technical/techData'
import { useOfficeStore } from '../pages/office/officeData'
import { ShellLayout } from '../pages/office/officeUi'
import type { ShellMenuItem, ShellNotification } from '../pages/office/officeUi'
import { MUTED, NAVY, BORDER } from '../pages/technical/techTheme'
import { Link } from 'react-router-dom'

export const ROLE_TITLES: Record<Role, string> = {
  executive: 'Executive',
  technical_admin: 'Technical Admin',
  administrative_admin: 'Administrative Admin',
  concerned_office: 'Concerned Office',
}

export default function RoleShell({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const db = useDb()
  const office = useOfficeStore()
  const role: Role = user?.role ?? 'administrative_admin'

  const newReportRequests = office.reports.filter((r) => r.status === 'Submitted')
  const openReportRequests = office.reports.filter((r) => r.status === 'Submitted' || r.status === 'In Review').length
  const pendingUsers = db.users.filter((u) => u.status === 'Pending Approval')

  // Menu (with section headings) straight from navConfig
  const menu: ShellMenuItem[] = []
  navByRole[role].forEach((item, i, all) => {
    if (item.section && item.section !== all[i - 1]?.section) menu.push({ section: item.section })
    const badge = role === 'administrative_admin' && item.to === '/admin/report-requests' ? openReportRequests
      : role === 'executive' && item.to === '/roles-access' ? pendingUsers.length : undefined
    menu.push({ label: item.label, to: item.to, badge })
  })

  const notifications: ShellNotification[] = [
    ...(role === 'administrative_admin' ? newReportRequests.map((r) => ({ text: `New report request ${r.id} from ${r.officeCode}`, to: `/admin/report-requests?open=${r.id}`, tone: '#fab219' })) : []),
    ...(role === 'executive' ? pendingUsers.map((u) => ({ text: `New user “${u.username}” is waiting for your approval`, to: '/roles-access', tone: '#fab219' })) : []),
  ]

  // Search box: jump to any page in the menu
  const pages = menu.filter((m): m is Extract<ShellMenuItem, { label: string }> => 'label' in m)

  return (
    <ShellLayout
      roleTitle={ROLE_TITLES[role]}
      menu={menu}
      notifications={notifications}
      searchPlaceholder="Search pages..."
      onSearchEnter={(q) => {
        const hit = pages.find((p) => p.label.toLowerCase().includes(q.toLowerCase()))
        if (hit) navigate(hit.to)
      }}
      renderResults={(q, close) => {
        const hits = pages.filter((p) => p.label.toLowerCase().includes(q))
        if (hits.length === 0) return <div style={{ padding: '10px', color: MUTED, fontSize: '13px' }}>No page matches “{q}”.</div>
        return (
          <>
            <div style={{ padding: '6px 10px', fontSize: '11px', letterSpacing: '1px', color: MUTED, fontWeight: 700 }}>PAGES</div>
            {hits.map((p) => (
              <Link key={p.to} to={p.to} onClick={close} style={{ display: 'block', padding: '9px 10px', borderRadius: '6px', textDecoration: 'none', color: NAVY, fontWeight: 600, fontSize: '13.5px', borderBottom: `1px solid ${BORDER}` }}>
                {p.label}
              </Link>
            ))}
          </>
        )
      }}
    >
      {children}
    </ShellLayout>
  )
}
