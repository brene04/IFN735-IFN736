import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import Placeholder from './pages/Placeholder'
import Login from './pages/Login'

// Technical Admin view
import TechDashboard from './pages/technical/TechDashboard'
import UsersPage from './pages/technical/UsersPage'
import RolesPage from './pages/technical/RolesPage'
import RoleAssignmentPage from './pages/technical/RoleAssignmentPage'
import AccessLogsPage from './pages/technical/AccessLogsPage'
import EmployeesPage from './pages/technical/EmployeesPage'
import EmployeeDetailsPage from './pages/technical/EmployeeDetailsPage'
import ProfileUpdatesPage from './pages/technical/ProfileUpdatesPage'
import SystemConfigPage from './pages/technical/SystemConfigPage'
import SystemIssuesPage from './pages/technical/SystemIssuesPage'
import OfficeRequestsPage from './pages/technical/OfficeRequestsPage'
import PositionsPage from './pages/technical/PositionsPage'

// Concerned Office view (sign in as office@dost.gov.ph / password123)
import OfficeDashboard from './pages/office/OfficeDashboard'
import MyOfficePage from './pages/office/MyOfficePage'
import OfficeEmployeesPage from './pages/office/OfficeEmployeesPage'
import OfficeEmployeeDetailsPage from './pages/office/OfficeEmployeeDetailsPage'
import EmployeeCompetenciesPage from './pages/office/EmployeeCompetenciesPage'
import OfficeCompetenciesPage from './pages/office/OfficeCompetenciesPage'
import PositionRequirementsPage from './pages/office/PositionRequirementsPage'
import CompetencyProfilesPage from './pages/office/CompetencyProfilesPage'
import RequestAdditionPage from './pages/office/RequestAdditionPage'
import RequestUpdatePage from './pages/office/RequestUpdatePage'
import RequestRemovalPage from './pages/office/RequestRemovalPage'
import RequestStatusPage from './pages/office/RequestStatusPage'
import GapReportRequestPage from './pages/office/GapReportRequestPage'
import GapReportsPage from './pages/office/GapReportsPage'
import GapReportViewPage from './pages/office/GapReportViewPage'

// Executive view
import ExecutiveDashboard from './pages/executive/ExecutiveDashboard'
import ExecutiveUsers from './pages/executive/ExecutiveUsers'
import RolesAccessManagement from './pages/executive/RolesAccessManagement'

// Administrative Admin view (these pages are also opened by the Executive)
import Dashboard from './pages/admin/AdminDashboard'
import Employees from './pages/admin/Employees'
import EmployeeProfile from './pages/admin/EmployeeProfile'
import PositionMapping from './pages/admin/PositionMapping'
import OfficeCompetencyManagement from './pages/admin/OfficeCompetencyManagement'
import GapAnalysis from './pages/admin/GapAnalysis'
import EmployeePositionManagement from './pages/admin/EmployeePositionManagement'
import OfficeReportRequestsPage from './pages/admin/OfficeReportRequestsPage'

import AssessmentGapAnalysis from './pages/AssessmentGapAnalysis'
import IndividualDevelopmentPlan from './pages/IndividualDevelopmentPlan'
import TalentSuccession from './pages/TalentSuccession'
import DevelopmentManagement from './pages/DevelopmentManagement'

// Who may open the shared competency / gap-analysis pages
const ADMIN_AND_EXEC = ['administrative_admin', 'executive'] as const

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Role-based dashboards */}
          <Route path="/executive/dashboard" element={<ProtectedRoute allowedRoles={['executive']}><ExecutiveDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['administrative_admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/office/dashboard" element={<ProtectedRoute allowedRoles={['concerned_office']}><OfficeDashboard /></ProtectedRoute>} />

          {/* Executive-only pages */}
          <Route path="/executive/users" element={<ProtectedRoute allowedRoles={['executive']}><ExecutiveUsers /></ProtectedRoute>} />
          <Route path="/roles-access" element={<ProtectedRoute allowedRoles={['executive']}><RolesAccessManagement /></ProtectedRoute>} />

          {/* Technical Admin module (sign in as tech.admin@dost.gov.ph / password123) */}
          {/* Order follows the left menu: Dashboard → User & Access → Employee Profiles → System */}
          <Route path="/technical" element={<Navigate to="/technical/dashboard" replace />} />
          <Route path="/technical/dashboard" element={<ProtectedRoute allowedRoles={['technical_admin']}><TechDashboard /></ProtectedRoute>} />
          <Route path="/technical/users" element={<ProtectedRoute allowedRoles={['technical_admin']}><UsersPage /></ProtectedRoute>} />
          <Route path="/technical/roles" element={<ProtectedRoute allowedRoles={['technical_admin']}><RolesPage /></ProtectedRoute>} />
          <Route path="/technical/role-assignment" element={<ProtectedRoute allowedRoles={['technical_admin']}><RoleAssignmentPage /></ProtectedRoute>} />
          <Route path="/technical/access-logs" element={<ProtectedRoute allowedRoles={['technical_admin']}><AccessLogsPage /></ProtectedRoute>} />
          <Route path="/technical/employees" element={<ProtectedRoute allowedRoles={['technical_admin']}><EmployeesPage /></ProtectedRoute>} />
          <Route path="/technical/employees/:id" element={<ProtectedRoute allowedRoles={['technical_admin']}><EmployeeDetailsPage /></ProtectedRoute>} />
          <Route path="/technical/positions" element={<ProtectedRoute allowedRoles={['technical_admin']}><PositionsPage /></ProtectedRoute>} />
          <Route path="/technical/profile-updates" element={<ProtectedRoute allowedRoles={['technical_admin']}><ProfileUpdatesPage /></ProtectedRoute>} />
          <Route path="/technical/system-configuration" element={<ProtectedRoute allowedRoles={['technical_admin']}><SystemConfigPage /></ProtectedRoute>} />
          <Route path="/technical/system-issues" element={<ProtectedRoute allowedRoles={['technical_admin']}><SystemIssuesPage /></ProtectedRoute>} />
          {/* Receives the Concerned Office's employee addition / update / removal requests */}
          <Route path="/technical/office-requests" element={<ProtectedRoute allowedRoles={['technical_admin']}><OfficeRequestsPage /></ProtectedRoute>} />

          {/* Concerned Office module (sign in as office@dost.gov.ph / password123) */}
          {/* Order follows the left menu: Dashboard → My Office → My Employees → Competency Information → Requests → Gap Analysis */}
          <Route path="/office" element={<Navigate to="/office/dashboard" replace />} />
          <Route path="/office/my-office" element={<ProtectedRoute allowedRoles={['concerned_office']}><MyOfficePage /></ProtectedRoute>} />
          <Route path="/office/employees" element={<ProtectedRoute allowedRoles={['concerned_office']}><OfficeEmployeesPage /></ProtectedRoute>} />
          <Route path="/office/employees/:id" element={<ProtectedRoute allowedRoles={['concerned_office']}><OfficeEmployeeDetailsPage /></ProtectedRoute>} />
          <Route path="/office/employee-competencies" element={<ProtectedRoute allowedRoles={['concerned_office']}><EmployeeCompetenciesPage /></ProtectedRoute>} />
          <Route path="/office/competencies" element={<ProtectedRoute allowedRoles={['concerned_office']}><OfficeCompetenciesPage /></ProtectedRoute>} />
          <Route path="/office/position-requirements" element={<ProtectedRoute allowedRoles={['concerned_office']}><PositionRequirementsPage /></ProtectedRoute>} />
          <Route path="/office/competency-profiles" element={<ProtectedRoute allowedRoles={['concerned_office']}><CompetencyProfilesPage /></ProtectedRoute>} />
          <Route path="/office/requests" element={<ProtectedRoute allowedRoles={['concerned_office']}><RequestStatusPage /></ProtectedRoute>} />
          <Route path="/office/requests/new-employee" element={<ProtectedRoute allowedRoles={['concerned_office']}><RequestAdditionPage /></ProtectedRoute>} />
          <Route path="/office/requests/update-employee" element={<ProtectedRoute allowedRoles={['concerned_office']}><RequestUpdatePage /></ProtectedRoute>} />
          <Route path="/office/requests/remove-employee" element={<ProtectedRoute allowedRoles={['concerned_office']}><RequestRemovalPage /></ProtectedRoute>} />
          <Route path="/office/gap-analysis" element={<ProtectedRoute allowedRoles={['concerned_office']}><GapReportRequestPage /></ProtectedRoute>} />
          <Route path="/office/gap-analysis/reports" element={<ProtectedRoute allowedRoles={['concerned_office']}><GapReportsPage /></ProtectedRoute>} />
          <Route path="/office/gap-analysis/reports/:id" element={<ProtectedRoute allowedRoles={['concerned_office']}><GapReportViewPage /></ProtectedRoute>} />

          {/* Administrative Admin: receives the Concerned Office's gap analysis report requests */}
          <Route path="/admin/report-requests" element={<ProtectedRoute allowedRoles={['administrative_admin']}><OfficeReportRequestsPage /></ProtectedRoute>} />

          {/* Shared pages: Administrative Admin + Executive */}
          <Route path="/employees" element={<ProtectedRoute allowedRoles={[...ADMIN_AND_EXEC]}><Employees /></ProtectedRoute>} />
          <Route path="/employees/:id" element={<ProtectedRoute allowedRoles={[...ADMIN_AND_EXEC]}><EmployeeProfile /></ProtectedRoute>} />
          <Route path="/employees/:id/idp" element={<IndividualDevelopmentPlan />} />

          {/* Page A: Employee + Position Management (one combined page with tabs) */}
          <Route path="/employee-position-management" element={<ProtectedRoute allowedRoles={[...ADMIN_AND_EXEC]}><EmployeePositionManagement /></ProtectedRoute>} />
          <Route path="/employee-management" element={<Navigate to="/employee-position-management?tab=employees" replace />} />
          <Route path="/position-management" element={<Navigate to="/employee-position-management?tab=positions" replace />} />

          {/* Page B: Office + Competency Management (one combined page with tabs) */}
          <Route path="/office-competency-management" element={<ProtectedRoute allowedRoles={[...ADMIN_AND_EXEC]}><OfficeCompetencyManagement /></ProtectedRoute>} />
          <Route path="/office-management" element={<Navigate to="/office-competency-management?tab=offices" replace />} />
          <Route path="/competency-management" element={<Navigate to="/office-competency-management?tab=competencies" replace />} />
          <Route path="/position-mapping" element={<ProtectedRoute allowedRoles={[...ADMIN_AND_EXEC]}><PositionMapping /></ProtectedRoute>} />
          <Route path="/assessments" element={<AssessmentGapAnalysis />} />

          {/* Assessment & Gap Analysis module: Gap Analysis -> Results -> History */}
          <Route path="/gap-analysis" element={<ProtectedRoute allowedRoles={[...ADMIN_AND_EXEC]}><GapAnalysis /></ProtectedRoute>} />
          <Route path="/gap-analysis/results/:analysisId" element={<ProtectedRoute allowedRoles={[...ADMIN_AND_EXEC]}><GapAnalysis /></ProtectedRoute>} />
          <Route path="/gap-analysis/history" element={<ProtectedRoute allowedRoles={[...ADMIN_AND_EXEC]}><GapAnalysis /></ProtectedRoute>} />

          <Route path="/user-management" element={<Placeholder title="User management" />} />
          <Route path="/talent-succession" element={<TalentSuccession />} />
          <Route path="/training" element={<DevelopmentManagement />} />

          {/* Anything else (e.g. Concerned Office sidebar links that aren't built yet) */}
          <Route path="*" element={<Placeholder title="Coming soon" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App