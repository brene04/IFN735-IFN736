import type { Role } from './users'

export interface NavItem { label: string; to: string; section?: string }

export const navByRole: Record<Role, NavItem[]> = {
  executive: [
    { label: 'Dashboard', to: '/executive/dashboard' },
    { label: 'Users', to: '/executive/users', section: 'Access & Users' },
    { label: 'Roles / Access Management', to: '/roles-access', section: 'Access & Users' },
    { label: 'Employees', to: '/employee-position-management?tab=employees', section: 'Organisation Data' },
    { label: 'Offices', to: '/office-competency-management?tab=offices', section: 'Organisation Data' },
    { label: 'Positions', to: '/employee-position-management?tab=positions', section: 'Organisation Data' },
    { label: 'Competencies', to: '/office-competency-management?tab=competencies', section: 'Competency Framework' },
    { label: 'Position–Competency Requirements', to: '/position-mapping', section: 'Competency Framework' },
    { label: 'Employee Competency Profiles', to: '/employees', section: 'Competency Framework' },
    { label: 'Gap Analysis', to: '/gap-analysis', section: 'Analysis & Reporting' },
    { label: 'Gap Analysis Results', to: '/gap-analysis/results/GA-2026-032', section: 'Analysis & Reporting' },
    { label: 'Historical Results', to: '/gap-analysis/history', section: 'Analysis & Reporting' },
  ],
  technical_admin: [
    { label: 'Dashboard', to: '/technical/dashboard' },
    { label: 'Users', to: '/user-management' },
    { label: 'Roles', to: '/technical/roles' },
    { label: 'Role Assignment', to: '/technical/role-assignment' },
    { label: 'Access Logs', to: '/technical/access-logs' },
    { label: 'Employees', to: '/employee-position-management?tab=employees' },
    { label: 'Employee Profile Updates', to: '/technical/profile-updates' },
    { label: 'System Configuration', to: '/technical/system-configuration' },
    { label: 'Technical / System Issues', to: '/technical/system-issues' },
  ],
  administrative_admin: [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Employee Management', to: '/employee-position-management?tab=employees', section: 'People & Positions' },
    { label: 'Position Management', to: '/employee-position-management?tab=positions', section: 'People & Positions' },
    { label: 'Position–Competency Requirements', to: '/position-mapping', section: 'Competency Framework' },
    { label: 'Competency Management', to: '/office-competency-management?tab=competencies', section: 'Competency Framework' },
    { label: 'Employee Competency Profiles', to: '/employees', section: 'Competency Framework' },
    { label: 'Gap Analysis', to: '/gap-analysis', section: 'Analysis & Reporting' },
    { label: 'Gap Analysis Results', to: '/gap-analysis/history', section: 'Analysis & Reporting' },
    { label: 'Office Report Requests', to: '/admin/report-requests', section: 'Analysis & Reporting' },
  ],
  concerned_office: [
    { label: 'Dashboard', to: '/office/dashboard' },
    { label: 'My Office', to: '/office/my-office' },
    { label: 'My Employees', to: '/office/employees' },
    { label: 'Competency Information', to: '/office/competencies' },
    { label: 'Requests', to: '/office/requests' },
    { label: 'Gap Analysis', to: '/office/gap-analysis' },
  ],
}
