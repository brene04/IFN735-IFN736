// Legacy pages (Assessments, Training, Talent Succession, Reports, IDP) now sit inside the same
// shell as every other page, so the sidebar, top bar and role label match for all four roles.
import type { ReactNode } from 'react'
import RoleShell from './RoleShell'
import './Layout.css'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RoleShell>
      <div className="legacy-page">{children}</div>
    </RoleShell>
  )
}
