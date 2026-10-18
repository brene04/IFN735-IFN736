// Data for the Technical Admin module.
// The tables follow the Phase 1 ERD: tbl_roles, tbl_users, tbl_employees,
// tbl_employee_competencies, tbl_historical_records, tbl_proficiency_levels and
// tbl_competency_categories (plus access logs, profile update requests and issue tickets).
//
// HOW SAVING WORKS
// Every change goes through save(). save() updates the data, writes an audit entry when
// asked, stores everything in the browser (localStorage) so it survives a refresh, and
// tells every page to re-draw. When a real backend exists, replace the body of save()
// with an API call; the pages do not need to change.
import { useSyncExternalStore } from 'react'
import { OFFICE_SEED, POSITION_SEED, COMPETENCY_SEED } from './erdSeed'

/* ================================================================== */
/* Types                                                               */
/* ================================================================== */

export const MODULES = [
  'Dashboard',
  'User & Role Management',
  'Employee Profiles',
  'Competency Management',
  'Position–Competency Mapping',
  'Assessment & Gap Analysis',
  'Reports & Decision Support',
  'Office Management',
  'System Configuration',
  'Access Logs',
  'Technical System Issues',
] as const
export type ModuleName = (typeof MODULES)[number]
export type Access = 'None' | 'View' | 'Edit' | 'Full'
export const ACCESS_LEVELS: Access[] = ['None', 'View', 'Edit', 'Full']

export interface Role {
  id: number
  key: string // matches the login role keys in src/auth/users.tsx for system roles
  name: string
  description: string
  status: 'Active' | 'Inactive'
  system: boolean // the 4 built-in roles cannot be deleted
  permissions: Record<ModuleName, Access>
  createdAt: string
  updatedAt?: string
}

export type UserStatus = 'Active' | 'Pending Approval' | 'Pending Setup' | 'Suspended' | 'Deactivated'

export interface User {
  id: number
  employeeId: number | null
  username: string
  email: string
  roleId: number
  status: UserStatus
  lastLogin: string | null
  createdAt: string
  twoFactor: boolean
  failedAttempts: number
  approvalRequestedAt?: string // when the Technical Admin sent the account to the Executive
  passwordHash?: string // tbl_users.password_hash (demo value only, no real passwords are stored)
  updatedAt?: string
}

export type EmployeeStatus = 'Active' | 'On Leave' | 'Separated'
export type CompetencyProfile = 'Fully Profiled' | 'Partially Profiled' | 'Not Profiled'
export type AssessmentStatus = 'Completed' | 'Pending' | 'Overdue' | 'Not Started'

export interface EmployeeCompetency {
  code: string
  title: string
  category: string
  level: number // 1–4, see tbl_proficiency_levels
  evidence: string
  lastUpdated: string
  // tbl_employee_competencies columns (filled in by normalise() so older code need not set them)
  id?: number
  competencyId?: number
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface Employee {
  id: number
  employeeNo: string
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
  officeCode: string
  positionTitle: string
  salaryGrade: number
  employmentType: 'Permanent' | 'Contract of Service'
  dateHired: string
  status: EmployeeStatus
  sex: 'Female' | 'Male'
  birthDate: string
  address: string
  competencyProfile: CompetencyProfile
  assessmentStatus: AssessmentStatus
  competencies: EmployeeCompetency[]
  // tbl_employees foreign keys + timestamps, kept in step with officeCode / positionTitle by normalise()
  officeId?: number
  positionId?: number
  createdAt?: string
  updatedAt?: string
}

export type RecordType = 'Profile Update' | 'Role Change' | 'Position Change' | 'Office Transfer' | 'Account' | 'Status Change' | 'Hired'

// tbl_historical_records
export interface HistoryRecord {
  id: number
  employeeId: number
  recordType: RecordType
  description: string
  effectiveDate: string
  createdAt: string
  updatedAt?: string
  by: string
}

export interface RoleAssignment {
  id: number
  userId: number
  fromRoleId: number | null
  toRoleId: number
  effectiveDate: string
  reason: string
  assignedBy: string
  at: string
}

export const EVENT_TYPES = [
  'Login',
  'Logout',
  'Failed Login',
  'Password Reset',
  'User Created',
  'User Updated',
  'Account Suspended',
  'Account Activated',
  'Role Change',
  'Permission Change',
  'Permission Denied',
  'Profile Update',
  'Config Change',
  'Position Change',
  'Data Export',
  'Issue Update',
] as const
export type EventType = (typeof EVENT_TYPES)[number]
export type LogStatus = 'Success' | 'Failed' | 'Warning'

export interface AccessLog {
  id: number
  timestamp: string
  userId: number | null
  username: string
  event: EventType
  status: LogStatus
  ip: string
  device: string
  details: string
}

export const UPDATE_FIELDS = {
  firstName: 'First Name',
  middleName: 'Middle Name',
  lastName: 'Last Name',
  email: 'Email Address',
  phone: 'Phone Number',
  address: 'Home Address',
  officeCode: 'Office / Agency',
  positionTitle: 'Position',
} as const
export type UpdateField = keyof typeof UPDATE_FIELDS

export interface ProfileUpdate {
  id: string
  employeeId: number
  field: UpdateField
  oldValue: string
  newValue: string
  reason: string
  submittedBy: string
  submittedAt: string
  status: 'Pending' | 'Approved' | 'Rejected'
  reviewedBy?: string
  reviewedAt?: string
  remarks?: string
  attachment?: string
}

export type IssuePriority = 'Critical' | 'High' | 'Medium' | 'Low'
export type IssueStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed'
export const ISSUE_CATEGORIES = ['Bug', 'Access & Login', 'Performance', 'Data Correction', 'Feature Request', 'Infrastructure'] as const

export interface IssueComment {
  author: string
  text: string
  at: string
}

export interface Issue {
  id: string
  title: string
  description: string
  module: ModuleName
  category: (typeof ISSUE_CATEGORIES)[number]
  priority: IssuePriority
  status: IssueStatus
  reportedBy: string
  assignedTo: string
  createdAt: string
  updatedAt: string
  comments: IssueComment[]
  resolution?: string
}

export interface ProficiencyLevel {
  number: number
  name: string
  description: string
  status: 'Active' | 'Inactive'
  id?: number // proficiency_level_id (level_number is `number`)
  createdAt?: string
  updatedAt?: string
}

export interface CompetencyCategory {
  id: number
  name: string
  description: string
  status: 'Active' | 'Inactive'
  createdAt?: string
  updatedAt?: string
}

export interface Backup {
  id: string
  at: string
  by: string
  size: string
  type: 'Automatic' | 'Manual'
}

export interface SystemConfig {
  general: {
    systemName: string
    agency: string
    fiscalYear: string
    assessmentCycle: string
    timezone: string
    supportEmail: string
  }
  security: {
    minPasswordLength: number
    requireComplexity: boolean
    passwordExpiryDays: number
    maxFailedAttempts: number
    sessionTimeoutMinutes: number
    require2FA: boolean
    allowedDomain: string
  }
  proficiencyLevels: ProficiencyLevel[]
  categories: CompetencyCategory[]
  notifications: {
    newUser: boolean
    roleChange: boolean
    profileUpdateSubmitted: boolean
    issueUpdate: boolean
    weeklySecurityDigest: boolean
  }
  maintenance: {
    maintenanceMode: boolean
    message: string
    autoBackup: string
    backups: Backup[]
  }
}

// tbl_position_competencies: the level a position requires for one competency
export type RequirementPriority = 'Critical' | 'Important' | 'Desirable'

export interface PositionCompetency {
  code: string // competency code, e.g. 'F43'
  level: number // required proficiency level, 1–4
  priority: RequirementPriority
}


/* ------------------------------------------------------------------ */
/* Phase 1 ERD tables that did not exist in this store before          */
/* (column names follow the ERD, written in camelCase)                 */
/* ------------------------------------------------------------------ */

export interface OfficeRow { id: number; officeName: string; officeCode: string; description: string; status: 'Active' | 'Inactive'; createdAt: string; updatedAt: string }

export interface PositionRow {
  id: number
  positionCode: string
  positionTitle: string
  description: string
  department: string
  employmentType: 'Plantilla' | 'Contract of Service'
  status: 'Active' | 'Inactive'
  salaryGrade: number // extra column (not in the ERD): the older pages show it
  // extra columns (not in the ERD) kept for the Technical Admin's Positions page
  itemNo?: string
  level?: string
  qualifications?: PositionQualifications
  createdAt: string
  updatedAt: string
}

export interface PositionQualifications { education: string; experience: string; training: string; eligibility: string }

// CSC levels by salary grade
export function levelFor(salaryGrade: number) {
  if (salaryGrade <= 9) return 'First Level'
  if (salaryGrade <= 23) return 'Second Level'
  return 'Third Level'
}

// Sample CSC qualification standards for a salary grade (edit them to match the approved QS)
export function defaultQualifications(salaryGrade: number): PositionQualifications {
  if (salaryGrade <= 4) return { education: 'Completed elementary or high school', experience: 'None required', training: 'None required', eligibility: 'Career Service Sub-professional (or none required)' }
  if (salaryGrade <= 9) return { education: 'Completed 2 years of college', experience: '1 year of relevant experience', training: '4 hours of relevant training', eligibility: 'Career Service Sub-professional' }
  if (salaryGrade <= 15) return { education: "Bachelor's degree relevant to the job", experience: 'None to 1 year of relevant experience', training: '4 to 8 hours of relevant training', eligibility: 'Career Service Professional / RA 1080' }
  if (salaryGrade <= 23) return { education: "Bachelor's degree relevant to the job", experience: '2 to 3 years of relevant experience', training: '8 to 16 hours of relevant training', eligibility: 'Career Service Professional / RA 1080' }
  return { education: "Master's degree relevant to the job", experience: '5 years of relevant experience, including supervisory work', training: '40 hours of management training', eligibility: 'Career Executive Service eligibility or Career Service Professional' }
}

export type CompetencyStatus = 'Active' | 'Draft' | 'Archived'

export interface CompetencyRow {
  id: number
  categoryId: number
  competencyCode: string
  competencyName: string
  description: string
  competencyType: string
  status: CompetencyStatus
  createdAt: string
  updatedAt: string
}

// tbl_position_competencies: priority is a number (1 Critical, 2 Important, 3 Desirable)
export interface PositionCompetencyRow { id: number; positionId: number; competencyId: number; requiredLevel: number; priority: number; createdAt: string; updatedAt: string }

export interface BehavioralIndicatorRow { id: number; competencyId: number; proficiencyLevelId: number; indicatorText: string; createdAt: string; updatedAt: string }

export type GapAnalysisStatus = 'Completed' | 'Superseded'

export interface GapAnalysisRow { id: number; employeeId: number; positionId: number; analysisDate: string; status: GapAnalysisStatus; remarks: string; createdBy: number; createdAt: string; updatedAt: string }

export interface GapResultRow { id: number; gapAnalysisId: number; competencyId: number; requiredLevel: number; currentLevel: number; gapLevel: number; status: string; remarks: string; createdAt: string; updatedAt: string }

export const PRIORITY_NAMES: Record<number, RequirementPriority> = { 1: 'Critical', 2: 'Important', 3: 'Desirable' }
export const priorityNumber = (p: RequirementPriority) => (p === 'Critical' ? 1 : p === 'Important' ? 2 : 3)

export interface Db {
  roles: Role[]
  users: User[]
  employees: Employee[]
  history: HistoryRecord[]
  assignments: RoleAssignment[]
  logs: AccessLog[]
  updates: ProfileUpdate[]
  issues: Issue[]
  config: SystemConfig
  offices: OfficeRow[]
  positions: PositionRow[]
  competencies: CompetencyRow[]
  positionCompetencies: PositionCompetencyRow[]
  behavioralIndicators: BehavioralIndicatorRow[]
  gapAnalyses: GapAnalysisRow[]
  gapResults: GapResultRow[]
}

/* ================================================================== */
/* Reference lists                                                     */
/* ================================================================== */

// Legacy views of tbl_offices / tbl_positions / tbl_position_competencies. They are kept in step with the
// database tables below (see syncLegacy) so every older page that imports them keeps working.
export const offices: { code: string; name: string }[] = []

export const positions: { title: string; salaryGrade: number }[] = []

const competencyPool = [
  { code: 'C4', title: 'Oral and Written Communication', category: 'Core' },
  { code: 'C8', title: 'Planning and Organizing', category: 'Core' },
  { code: 'C5', title: 'Exemplifying Integrity', category: 'Core' },
  { code: 'C9', title: 'Team Management (Team Work)', category: 'Core' },
  { code: 'F43', title: 'Statistics and Data Analysis', category: 'Functional' },
  { code: 'F32', title: 'Program/Project Management', category: 'Functional' },
  { code: 'F45', title: 'Talent Planning, Sourcing, Selection, and Management', category: 'Functional' },
  { code: 'F16', title: 'Information Systems Management', category: 'Functional' },
  { code: 'L4', title: 'Managing Performance and Coaching for Results', category: 'Leadership' },
  { code: 'F28', title: 'Performance Management', category: 'Functional' },
]

export const TECH_ADMINS = ['Carmela P. Reyes', 'Ana S. Dizon']

// tbl_position_competencies, keyed by position title. Read by the Concerned Office pages
// (src/pages/office/officeData.ts) to work out each employee's competency gaps.
const need = (code: string, level: number, priority: RequirementPriority = 'Important'): PositionCompetency => ({ code, level, priority })

const POSITION_REQUIREMENT_SEED: Record<string, PositionCompetency[]> = {
  'Director IV': [need('C4', 4, 'Critical'), need('C8', 4, 'Critical'), need('C5', 4, 'Critical'), need('F32', 4, 'Critical'), need('L4', 4), need('F28', 4)],
  'Chief Science Research Specialist': [need('C4', 4), need('C8', 3), need('C5', 3), need('F43', 4, 'Critical'), need('F32', 3), need('L4', 3), need('F28', 3)],
  'Supervising Science Research Specialist': [need('C4', 3), need('C8', 3), need('C5', 3), need('F43', 3, 'Critical'), need('F32', 3), need('L4', 2), need('F28', 2, 'Desirable')],
  'Information Technology Officer III': [need('C4', 3), need('C9', 3), need('F16', 4, 'Critical'), need('F32', 3), need('F43', 2), need('F28', 2, 'Desirable')],
  'Senior Science Research Specialist': [need('C4', 3), need('C5', 3), need('C9', 3), need('F43', 3, 'Critical'), need('F32', 2)],
  'Information Technology Officer I': [need('C4', 2), need('C9', 2), need('F16', 3, 'Critical'), need('F43', 2)],
  'Accountant III': [need('C4', 3), need('C8', 3), need('C5', 4, 'Critical'), need('C9', 2)],
  'Administrative Officer V': [need('C4', 3), need('C8', 3), need('C5', 3), need('C9', 3), need('F45', 2, 'Desirable')],
  'Science Research Specialist II': [need('C4', 2), need('C5', 2), need('C9', 2), need('F43', 3, 'Critical'), need('F32', 2)],
  'Human Resource Management Officer II': [need('C4', 3), need('C5', 3), need('C9', 3), need('F45', 3, 'Critical')],
  'Science Research Specialist I': [need('C4', 2), need('C5', 2), need('C9', 2), need('F43', 2, 'Critical')],
  'Administrative Assistant II': [need('C4', 2), need('C8', 2), need('C5', 2), need('C9', 2)],
  'Science Aide': [need('C4', 1), need('C5', 2), need('C9', 2), need('F43', 1, 'Desirable')],
}

export const POSITION_COMPETENCIES: Record<string, PositionCompetency[]> = {}

/* ================================================================== */
/* Seed (sample) data                                                  */
/* ================================================================== */

// Small repeatable random generator so the sample data is the same every time
function rng(seed: number) {
  let t = seed
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const DAY = 86400000
// A time "days" ago at hour:minute — never later than now (sample data must not be in the future)
const isoAgo = (days: number, hour = 9, minute = 0) => {
  const now = Date.now()
  const d = new Date(now - days * DAY)
  d.setHours(hour, minute, 0, 0)
  if (d.getTime() > now) d.setTime(now - (((hour * 37 + minute) % 240) + 5) * 60000)
  return d.toISOString()
}
const dateAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString().slice(0, 10)

const allAccess = (a: Access) => Object.fromEntries(MODULES.map((m) => [m, a])) as Record<ModuleName, Access>

function seedRoles(): Role[] {
  return [
    {
      id: 1, key: 'executive', name: 'Executive', status: 'Active', system: true, createdAt: '2026-01-15',
      description: 'DOST executives. Read-only access to dashboards, analytics and reports across all offices for decision-making.',
      permissions: { ...allAccess('View'), 'User & Role Management': 'None', 'System Configuration': 'None', 'Access Logs': 'None', 'Reports & Decision Support': 'Full', 'Technical System Issues': 'Edit' },
    },
    {
      id: 2, key: 'technical_admin', name: 'Technical Administrator', status: 'Active', system: true, createdAt: '2026-01-15',
      description: 'System maintainer and technical assistant to the Executive. Manages users, roles, system configuration, employee profiles and technical issues.',
      permissions: { ...allAccess('View'), Dashboard: 'Full', 'User & Role Management': 'Full', 'Employee Profiles': 'Full', 'Office Management': 'Edit', 'System Configuration': 'Full', 'Access Logs': 'Full', 'Technical System Issues': 'Full' },
    },
    {
      id: 3, key: 'administrative_admin', name: 'Administrative Administrator', status: 'Active', system: true, createdAt: '2026-01-15',
      description: 'HRMD administrators. Maintain competencies, positions, assessments, gap analysis and offices.',
      permissions: { ...allAccess('Full'), 'User & Role Management': 'View', 'Employee Profiles': 'Edit', 'System Configuration': 'View', 'Access Logs': 'View', 'Technical System Issues': 'Edit' },
    },
    {
      id: 4, key: 'concerned_office', name: 'Concerned Office', status: 'Active', system: true, createdAt: '2026-01-15',
      description: 'Office focal persons. View their own office’s employees and submit competency assessments.',
      permissions: { ...allAccess('View'), 'User & Role Management': 'None', 'System Configuration': 'None', 'Access Logs': 'None', 'Assessment & Gap Analysis': 'Edit', 'Technical System Issues': 'Edit' },
    },
  ]
}

type EmpSeed = [string, string, string, string, string, string, number, Employee['employmentType'], string, EmployeeStatus, 'Female' | 'Male', CompetencyProfile, AssessmentStatus]
// [employeeNo, first, middle, last, office, position, SG, type, dateHired, status, sex, profile, assessment]
const employeeSeeds: EmpSeed[] = [
  ['DOST-2012-0041', 'Ricardo', 'B.', 'Manalo', 'DOST-ASTI', 'Director IV', 28, 'Permanent', '2012-03-01', 'Active', 'Male', 'Fully Profiled', 'Completed'],
  ['DOST-2009-0017', 'Maria', 'L.', 'Santos', 'DOST-FNRI', 'Director IV', 28, 'Permanent', '2009-06-15', 'Active', 'Female', 'Fully Profiled', 'Completed'],
  ['DOST-2011-0088', 'Elena', 'R.', 'Mendoza', 'DOST-PNRI', 'Director IV', 28, 'Permanent', '2011-01-10', 'Active', 'Female', 'Fully Profiled', 'Completed'],
  ['DOST-2014-0120', 'Ramon', 'C.', 'Villanueva', 'DOST-ITDI', 'Chief Science Research Specialist', 24, 'Permanent', '2014-08-04', 'Active', 'Male', 'Fully Profiled', 'Completed'],
  ['DOST-2015-0133', 'Liza', 'G.', 'Navarro', 'DOST-PCHRD', 'Chief Science Research Specialist', 24, 'Permanent', '2015-02-16', 'On Leave', 'Female', 'Fully Profiled', 'Pending'],
  ['DOST-2016-0157', 'Carlo', 'B.', 'Aquino', 'DOST-ASTI', 'Supervising Science Research Specialist', 22, 'Permanent', '2016-05-02', 'Active', 'Male', 'Fully Profiled', 'Completed'],
  ['DOST-2017-0172', 'Grace', 'T.', 'Lim', 'DOST-PHIVOLCS', 'Supervising Science Research Specialist', 22, 'Permanent', '2017-09-11', 'Active', 'Female', 'Fully Profiled', 'Completed'],
  ['DOST-2018-0190', 'Paolo', 'S.', 'Reyes', 'DOST-ITDI', 'Senior Science Research Specialist', 19, 'Permanent', '2018-01-22', 'Active', 'Male', 'Partially Profiled', 'Pending'],
  ['DOST-2018-0204', 'Andrea', 'V.', 'Flores', 'DOST-FNRI', 'Senior Science Research Specialist', 19, 'Permanent', '2018-07-09', 'Active', 'Female', 'Fully Profiled', 'Completed'],
  ['DOST-2019-0142', 'Noel', 'F.', 'Castillo', 'DOST-PNRI', 'Senior Science Research Specialist', 19, 'Permanent', '2019-03-18', 'Active', 'Male', 'Fully Profiled', 'Overdue'],
  ['DOST-2020-0215', 'Joy', 'C.', 'Pascual', 'DOST-ASTI', 'Science Research Specialist II', 15, 'Permanent', '2020-02-03', 'Active', 'Female', 'Fully Profiled', 'Completed'],
  ['DOST-2020-0228', 'Mark', 'D.', 'Ramos', 'DOST-PHIVOLCS', 'Science Research Specialist II', 15, 'Permanent', '2020-10-12', 'Active', 'Male', 'Partially Profiled', 'Pending'],
  ['DOST-2021-0236', 'Teresa', 'A.', 'Gomez', 'DOST-ITDI', 'Science Research Specialist II', 15, 'Permanent', '2021-04-05', 'Separated', 'Female', 'Fully Profiled', 'Completed'],
  ['DOST-2022-0251', 'Rico', 'J.', 'Salazar', 'DOST-FNRI', 'Science Research Specialist I', 11, 'Permanent', '2022-06-20', 'Active', 'Male', 'Partially Profiled', 'Overdue'],
  ['DOST-2023-0266', 'Ana', 'S.', 'Dizon', 'DOST-ASTI', 'Information Technology Officer I', 19, 'Permanent', '2023-01-16', 'Active', 'Female', 'Fully Profiled', 'Completed'],
  ['DOST-2016-0161', 'Victor', 'E.', 'Morales', 'DOST-FMS', 'Administrative Officer V', 18, 'Permanent', '2016-11-07', 'Active', 'Male', 'Fully Profiled', 'Pending'],
  ['DOST-2017-0180', 'Patricia', 'M.', 'Torres', 'DOST-FMS', 'Accountant III', 19, 'Permanent', '2017-04-24', 'Active', 'Female', 'Fully Profiled', 'Completed'],
  ['DOST-2019-0199', 'Jose', 'M.', 'Bautista', 'DOST-HRMD', 'Human Resource Management Officer II', 15, 'Permanent', '2019-08-19', 'Active', 'Male', 'Fully Profiled', 'Completed'],
  ['DOST-2021-0240', 'Kristine', 'L.', 'Ocampo', 'DOST-HRMD', 'Administrative Assistant II', 8, 'Permanent', '2021-09-01', 'Active', 'Female', 'Partially Profiled', 'Completed'],
  ['COS-2024-0012', 'Miguel', 'A.', 'Tan', 'DOST-ASTI', 'Science Research Specialist I', 11, 'Contract of Service', '2024-01-08', 'Active', 'Male', 'Not Profiled', 'Not Started'],
  ['COS-2024-0019', 'Bea', 'R.', 'Garcia', 'DOST-ITDI', 'Science Aide', 6, 'Contract of Service', '2024-03-04', 'Active', 'Female', 'Partially Profiled', 'Pending'],
  ['COS-2025-0004', 'Jerome', 'P.', 'Cruz', 'DOST-PNRI', 'Science Aide', 6, 'Contract of Service', '2025-02-10', 'Active', 'Male', 'Not Profiled', 'Not Started'],
  ['COS-2025-0011', 'Hazel', 'N.', 'Rivera', 'DOST-PCHRD', 'Administrative Assistant II', 8, 'Contract of Service', '2025-05-19', 'On Leave', 'Female', 'Not Profiled', 'Not Started'],
  ['COS-2026-0002', 'Dennis', 'O.', 'Lopez', 'DOST-PHIVOLCS', 'Information Technology Officer I', 19, 'Contract of Service', '2026-01-12', 'Active', 'Male', 'Partially Profiled', 'Pending'],
  ['DOST-2015-0110', 'Carmela', 'P.', 'Reyes', 'DOST-ASTI', 'Information Technology Officer III', 22, 'Permanent', '2015-07-01', 'Active', 'Female', 'Fully Profiled', 'Completed'],
]

const evidenceOptions = ['SPMS supervisor rating', 'Competency self-assessment', 'Work sample review', 'Behavioural event interview', 'Training certificate']

function agencyDomain(officeCode: string) {
  return `${officeCode.replace('DOST-', '').toLowerCase()}.dost.gov.ph`
}

function seedEmployees(): Employee[] {
  const random = rng(42)
  return employeeSeeds.map((s, i) => {
    const [employeeNo, firstName, middleName, lastName, officeCode, positionTitle, salaryGrade, employmentType, dateHired, status, sex, competencyProfile, assessmentStatus] = s
    const count = competencyProfile === 'Fully Profiled' ? 6 : competencyProfile === 'Partially Profiled' ? 3 : 0
    const start = Math.floor(random() * competencyPool.length)
    const competencies = Array.from({ length: count }, (_, k) => {
      const c = competencyPool[(start + k) % competencyPool.length]
      return { ...c, level: 1 + Math.floor(random() * 4), evidence: evidenceOptions[Math.floor(random() * evidenceOptions.length)], lastUpdated: dateAgo(20 + Math.floor(random() * 300)) }
    })
    return {
      id: i + 1,
      employeeNo, firstName, middleName, lastName, officeCode, positionTitle, salaryGrade, employmentType, dateHired, status, sex, competencyProfile, assessmentStatus,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@${agencyDomain(officeCode)}`,
      phone: `+63 917 ${String(200 + i * 37).padStart(3, '0')} ${String(1000 + i * 271).slice(0, 4)}`,
      birthDate: `${1970 + ((i * 7) % 28)}-${String(1 + (i % 12)).padStart(2, '0')}-${String(3 + ((i * 5) % 25)).padStart(2, '0')}`,
      address: ['Taguig City, Metro Manila', 'Quezon City, Metro Manila', 'Los Baños, Laguna', 'Bicutan, Taguig City', 'Pasig City, Metro Manila'][i % 5],
      competencies,
    }
  })
}

const empIdByNo = (no: string) => employeeSeeds.findIndex((s) => s[0] === no) + 1

type UserSeed = [string, string, number, UserStatus, number | null, boolean, number]
// [employeeNo, username, roleId, status, lastLogin (days ago, null = never), 2FA, failedAttempts]
const userSeeds: UserSeed[] = [
  ['DOST-2015-0110', 'tech.admin', 2, 'Active', 0, true, 0],
  ['DOST-2009-0017', 'executive', 1, 'Active', 0, true, 0],
  ['DOST-2019-0199', 'admin', 3, 'Active', 0, true, 0],
  ['DOST-2020-0215', 'office', 4, 'Active', 1, false, 0],
  ['DOST-2012-0041', 'rmanalo', 1, 'Active', 0, true, 0],
  ['DOST-2011-0088', 'emendoza', 1, 'Active', 2, true, 0],
  ['DOST-2014-0120', 'rvillanueva', 4, 'Active', 0, true, 0],
  ['DOST-2015-0133', 'lnavarro', 4, 'Suspended', 21, true, 0],
  ['DOST-2016-0157', 'caquino', 4, 'Active', 1, true, 0],
  ['DOST-2017-0172', 'glim', 4, 'Active', 0, true, 0],
  ['DOST-2018-0190', 'preyes', 4, 'Pending Setup', null, false, 0],
  ['DOST-2018-0204', 'aflores', 4, 'Active', 3, true, 0],
  ['DOST-2023-0266', 'adizon', 2, 'Active', 0, true, 0],
  ['DOST-2016-0161', 'vmorales', 3, 'Active', 1, true, 0],
  ['DOST-2017-0180', 'ptorres', 3, 'Pending Setup', null, false, 0],
  ['DOST-2021-0240', 'kocampo', 3, 'Active', 4, true, 0],
  ['DOST-2021-0236', 'tgomez', 4, 'Deactivated', 160, true, 0],
  ['COS-2026-0002', 'dlopez', 4, 'Pending Setup', null, false, 0],
  ['DOST-2019-0142', 'ncastillo', 4, 'Active', 0, true, 4],
]

// The 4 accounts used on Brene's login page keep the same emails
const loginEmails: Record<string, string> = {
  'tech.admin': 'tech.admin@dost.gov.ph',
  executive: 'executive@dost.gov.ph',
  admin: 'admin@dost.gov.ph',
  office: 'office@dost.gov.ph',
}

function seedUsers(employees: Employee[]): User[] {
  return userSeeds.map(([no, username, roleId, status, last, twoFactor, failedAttempts], i) => {
    const emp = employees[empIdByNo(no) - 1]
    return {
      id: i + 1,
      employeeId: emp.id,
      username,
      email: loginEmails[username] ?? emp.email,
      roleId,
      status,
      lastLogin: last === null ? null : isoAgo(last, 8 + (i % 9), (i * 13) % 60),
      createdAt: dateAgo(30 + i * 9),
      twoFactor,
      failedAttempts,
    }
  })
}

const devices = ['Chrome 129 · Windows 11', 'Edge 129 · Windows 10', 'Safari 18 · macOS', 'Firefox 131 · Ubuntu', 'Chrome 129 · Android']

function seedLogs(users: User[]): AccessLog[] {
  const random = rng(7)
  const logs: Omit<AccessLog, 'id'>[] = []
  const now = Date.now()
  const active = users.filter((u) => u.status === 'Active')
  for (let d = 6; d >= 0; d--) {
    const count = d === 0 ? 14 : 10 + Math.floor(random() * 8)
    for (let k = 0; k < count; k++) {
      const u = active[Math.floor(random() * active.length)]
      const day = new Date(now - d * DAY)
      day.setHours(7 + Math.floor(random() * 11), Math.floor(random() * 60), 0, 0)
      // today's sample activity happens in the hours just before "now"
      if (day.getTime() > now) day.setTime(now - Math.floor(random() * 6 * 60 + 40) * 60000)
      const ip = `10.12.${4 + (u.id % 6)}.${20 + u.id * 3}`
      const device = devices[u.id % devices.length]
      const roll = random()
      const base = { userId: u.id, username: u.username, ip, device }
      if (roll < 0.62) {
        logs.push({ ...base, timestamp: day.toISOString(), event: 'Login', status: 'Success', details: 'Signed in with password + 2FA' })
        logs.push({ ...base, timestamp: new Date(day.getTime() + (20 + random() * 160) * 60000).toISOString(), event: 'Logout', status: 'Success', details: 'Signed out' })
      } else if (roll < 0.74) {
        logs.push({ ...base, timestamp: day.toISOString(), event: 'Failed Login', status: 'Failed', details: 'Incorrect password' })
      } else if (roll < 0.84) {
        logs.push({ ...base, timestamp: day.toISOString(), event: 'Data Export', status: 'Success', details: 'Exported Competency Gap Report (CSV)' })
      } else if (roll < 0.92) {
        logs.push({ ...base, timestamp: day.toISOString(), event: 'Permission Denied', status: 'Warning', details: 'Tried to open System Configuration' })
      } else {
        logs.push({ ...base, timestamp: day.toISOString(), event: 'Profile Update', status: 'Success', details: 'Submitted a profile update request' })
      }
    }
  }
  // Repeated failed logins for one account today (shows on the dashboard as a security alert)
  const nc = users.find((u) => u.username === 'ncastillo')!
  for (let k = 0; k < 4; k++) {
    const t = new Date(now - (35 - k * 6) * 60000)
    logs.push({ userId: nc.id, username: nc.username, timestamp: t.toISOString(), event: 'Failed Login', status: 'Failed', ip: '10.12.9.77', device: 'Chrome 129 · Windows 11', details: `Incorrect password (attempt ${k + 1})` })
  }
  logs.push({ userId: 1, username: 'tech.admin', timestamp: isoAgo(3, 10, 12), event: 'Role Change', status: 'Success', ip: '10.12.5.23', device: devices[0], details: 'kocampo: Concerned Office → Administrative Administrator' })
  logs.push({ userId: 1, username: 'tech.admin', timestamp: isoAgo(5, 14, 40), event: 'Config Change', status: 'Success', ip: '10.12.5.23', device: devices[0], details: 'Security: session timeout 45 → 30 minutes' })
  logs.push({ userId: 1, username: 'tech.admin', timestamp: isoAgo(21, 9, 5), event: 'Account Suspended', status: 'Success', ip: '10.12.5.23', device: devices[0], details: 'lnavarro suspended: extended leave' })
  return logs
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((l, i) => ({ ...l, id: i + 1 }))
    .reverse()
}

function seedHistory(employees: Employee[]): HistoryRecord[] {
  const records: Omit<HistoryRecord, 'id'>[] = employees.map((e) => ({
    employeeId: e.id, recordType: 'Hired', description: `Appointed as ${e.positionTitle} (${e.employmentType})`, effectiveDate: e.dateHired, createdAt: e.dateHired, by: 'HRMD',
  }))
  const ana = empIdByNo('DOST-2023-0266')
  records.push({ employeeId: ana, recordType: 'Position Change', description: 'Science Research Specialist I → Information Technology Officer I', effectiveDate: '2025-03-01', createdAt: '2025-02-20', by: 'Carmela P. Reyes' })
  const grace = empIdByNo('DOST-2017-0172')
  records.push({ employeeId: grace, recordType: 'Profile Update', description: 'Phone Number updated (request PU-2026-029)', effectiveDate: dateAgo(12), createdAt: dateAgo(12), by: 'Carmela P. Reyes' })
  const kris = empIdByNo('DOST-2021-0240')
  records.push({ employeeId: kris, recordType: 'Role Change', description: 'System role: Concerned Office → Administrative Administrator', effectiveDate: dateAgo(3), createdAt: dateAgo(3), by: 'Carmela P. Reyes' })
  const teresa = empIdByNo('DOST-2021-0236')
  records.push({ employeeId: teresa, recordType: 'Status Change', description: 'Active → Separated (resignation)', effectiveDate: '2026-05-31', createdAt: '2026-05-31', by: 'HRMD' })
  return records.map((r, i) => ({ ...r, id: i + 1 }))
}

function seedAssignments(): RoleAssignment[] {
  return [
    { id: 1, userId: 16, fromRoleId: 4, toRoleId: 3, effectiveDate: dateAgo(3), reason: 'Transferred to HRMD records unit; needs administrative access.', assignedBy: 'Carmela P. Reyes', at: isoAgo(3, 10, 12) },
    { id: 2, userId: 13, fromRoleId: 4, toRoleId: 2, effectiveDate: '2025-03-01', reason: 'Designated backup Technical Administrator after promotion to ITO I.', assignedBy: 'Carmela P. Reyes', at: '2025-03-01T09:00:00.000Z' },
    { id: 3, userId: 5, fromRoleId: null, toRoleId: 1, effectiveDate: '2026-01-20', reason: 'Initial account provisioning (Director, ASTI).', assignedBy: 'Carmela P. Reyes', at: '2026-01-20T09:00:00.000Z' },
  ]
}

function seedUpdates(employees: Employee[]): ProfileUpdate[] {
  const e = empIdByNo
  const list: ProfileUpdate[] = [
    { id: 'PU-2026-036', employeeId: e('DOST-2022-0251'), field: 'middleName', oldValue: 'J.', newValue: 'Jimenez', reason: 'Spell out full middle name as on PSA birth certificate.', submittedBy: 'Rico J. Salazar (self)', submittedAt: isoAgo(0, 8, 41), status: 'Pending', attachment: 'PSA_Birth_Certificate.pdf' },
    { id: 'PU-2026-035', employeeId: e('COS-2024-0019'), field: 'officeCode', oldValue: 'DOST-ITDI', newValue: 'DOST-MIRDC', reason: 'Contract renewed under MIRDC project starting 01 Nov 2026.', submittedBy: 'Jose M. Bautista (HRMD)', submittedAt: isoAgo(1, 15, 20), status: 'Pending', attachment: 'COS_Contract_2026-2027.pdf' },
    { id: 'PU-2026-034', employeeId: e('DOST-2020-0228'), field: 'positionTitle', oldValue: 'Science Research Specialist II', newValue: 'Senior Science Research Specialist', reason: 'Promotion approved by the HRMPSB.', submittedBy: 'Jose M. Bautista (HRMD)', submittedAt: isoAgo(1, 10, 5), status: 'Pending', attachment: 'Appointment_Paper_CSForm33.pdf' },
    { id: 'PU-2026-033', employeeId: e('DOST-2018-0190'), field: 'email', oldValue: 'paolo.reyes@itdi.dost.gov.ph', newValue: 'psreyes@itdi.dost.gov.ph', reason: 'New GovMail address issued by ITDI.', submittedBy: 'Paolo S. Reyes (self)', submittedAt: isoAgo(2, 13, 50), status: 'Pending' },
    { id: 'PU-2026-032', employeeId: e('DOST-2015-0133'), field: 'lastName', oldValue: 'Navarro', newValue: 'Navarro-Tan', reason: 'Change of surname after marriage.', submittedBy: 'Liza G. Navarro (self)', submittedAt: isoAgo(4, 9, 12), status: 'Pending', attachment: 'PSA_Marriage_Certificate.pdf' },
    { id: 'PU-2026-031', employeeId: e('DOST-2020-0215'), field: 'phone', oldValue: '+63 917 607 3710', newValue: '+63 918 555 0142', reason: 'Changed mobile number.', submittedBy: 'Joy C. Pascual (self)', submittedAt: isoAgo(5, 11, 30), status: 'Pending' },
    { id: 'PU-2026-030', employeeId: e('DOST-2018-0204'), field: 'email', oldValue: 'andrea.flores@fnri.dost.gov.ph', newValue: 'andreaflores88@gmail.com', reason: 'Prefers personal email.', submittedBy: 'Andrea V. Flores (self)', submittedAt: isoAgo(9, 10, 0), status: 'Rejected', reviewedBy: 'Carmela P. Reyes', reviewedAt: isoAgo(8, 14, 0), remarks: 'Personal email addresses are not allowed. Please use your agency GovMail.' },
    { id: 'PU-2026-029', employeeId: e('DOST-2017-0172'), field: 'phone', oldValue: '+63 917 459 2897', newValue: '+63 917 811 2044', reason: 'Updated contact number.', submittedBy: 'Grace T. Lim (self)', submittedAt: isoAgo(13, 9, 30), status: 'Approved', reviewedBy: 'Carmela P. Reyes', reviewedAt: isoAgo(12, 10, 0), remarks: 'Verified with employee.' },
  ]
  // pending requests show the employee's real current value as the "old" value
  return list.map((u) => (u.status === 'Pending' ? { ...u, oldValue: readField(employees[u.employeeId - 1], u.field) } : u))
}

function seedIssues(): Issue[] {
  const c = (author: string, text: string, days: number, hour = 10): IssueComment => ({ author, text, at: isoAgo(days, hour) })
  return [
    { id: 'TSI-2026-047', title: 'GovMail 2FA codes not delivered to some PHIVOLCS accounts', description: 'Several PHIVOLCS users report that the 6-digit 2FA code email never arrives, so they cannot sign in.', module: 'User & Role Management', category: 'Access & Login', priority: 'Critical', status: 'Open', reportedBy: 'Grace T. Lim', assignedTo: 'Unassigned', createdAt: isoAgo(0, 8, 15), updatedAt: isoAgo(0, 8, 15), comments: [] },
    { id: 'TSI-2026-046', title: 'Radar chart labels overlap on small laptop screens', description: 'On 1366×768 screens the Gap Analysis radar chart labels overlap.', module: 'Assessment & Gap Analysis', category: 'Bug', priority: 'Low', status: 'In Progress', reportedBy: 'Jose M. Bautista', assignedTo: 'Ana S. Dizon', createdAt: isoAgo(2, 11), updatedAt: isoAgo(1, 16), comments: [c('Ana S. Dizon', 'Reproduced. Testing a wider chart margin.', 1, 16)] },
    { id: 'TSI-2026-045', title: 'Duplicate employee record for Miguel Tan (COS)', description: 'Miguel Tan appears twice in the Employee Directory with different IDs.', module: 'Employee Profiles', category: 'Data Correction', priority: 'Medium', status: 'Resolved', reportedBy: 'Kristine L. Ocampo', assignedTo: 'Carmela P. Reyes', createdAt: isoAgo(6, 9), updatedAt: isoAgo(4, 15), comments: [c('Carmela P. Reyes', 'Merged the duplicate into COS-2024-0012.', 4, 15)], resolution: 'Duplicate record merged; competency data kept from the newer record.' },
    { id: 'TSI-2026-044', title: 'Request: add Regional Office field to employee profile', description: 'Regional offices want to filter employees by region.', module: 'Employee Profiles', category: 'Feature Request', priority: 'Low', status: 'Open', reportedBy: 'Victor E. Morales', assignedTo: 'Unassigned', createdAt: isoAgo(7, 14), updatedAt: isoAgo(7, 14), comments: [] },
    { id: 'TSI-2026-043', title: 'Employee Directory takes more than 8 seconds to load', description: 'Loading all 1,248 personnel records is slow during the morning peak.', module: 'Employee Profiles', category: 'Performance', priority: 'Medium', status: 'Open', reportedBy: 'Ramon C. Villanueva', assignedTo: 'Carmela P. Reyes', createdAt: isoAgo(3, 9, 30), updatedAt: isoAgo(2, 10), comments: [c('Carmela P. Reyes', 'Checking database indexes on tbl_employees.', 2, 10)] },
    { id: 'TSI-2026-042', title: 'PNRI staff locked out after 3 failed attempts', description: 'Users are locked after 3 attempts and must wait for an admin to unlock.', module: 'User & Role Management', category: 'Access & Login', priority: 'High', status: 'Open', reportedBy: 'Noel F. Castillo', assignedTo: 'Ana S. Dizon', createdAt: isoAgo(0, 9, 5), updatedAt: isoAgo(0, 9, 5), comments: [] },
    { id: 'TSI-2026-041', title: 'Competency Gap report fails to export to PDF', description: 'Clicking Export PDF on the Competency Gap Report shows a blank page.', module: 'Reports & Decision Support', category: 'Bug', priority: 'High', status: 'In Progress', reportedBy: 'Jose M. Bautista', assignedTo: 'Carmela P. Reyes', createdAt: isoAgo(5, 13), updatedAt: isoAgo(1, 11), comments: [c('Carmela P. Reyes', 'Caused by a print stylesheet issue; fix in testing.', 1, 11)] },
    { id: 'TSI-2026-040', title: 'Office Management shows wrong staff count for PAGASA', description: 'Total staff did not include COS personnel.', module: 'Office Management', category: 'Data Correction', priority: 'Medium', status: 'Closed', reportedBy: 'Maria L. Santos', assignedTo: 'Ana S. Dizon', createdAt: isoAgo(15, 10), updatedAt: isoAgo(11, 16), comments: [c('Ana S. Dizon', 'Recalculated totals from tbl_employees.', 12, 9)], resolution: 'Staff count now includes COS personnel.' },
    { id: 'TSI-2026-038', title: 'Password reset link expires immediately', description: 'Reset links opened within minutes showed "link expired".', module: 'User & Role Management', category: 'Bug', priority: 'High', status: 'Resolved', reportedBy: 'Andrea V. Flores', assignedTo: 'Carmela P. Reyes', createdAt: isoAgo(18, 9), updatedAt: isoAgo(16, 15), comments: [], resolution: 'Server clock corrected; token lifetime set to 30 minutes.' },
    { id: 'TSI-2026-036', title: 'Nightly database backup failed on 02 Oct', description: 'The 02:00 backup job stopped with a disk-space error.', module: 'System Configuration', category: 'Infrastructure', priority: 'Critical', status: 'Closed', reportedBy: 'System Monitor', assignedTo: 'Carmela P. Reyes', createdAt: '2026-10-02T02:10:00.000Z', updatedAt: '2026-10-02T09:30:00.000Z', comments: [], resolution: 'Old backups archived; backup re-run successfully.' },
  ]
}

function seedConfig(): SystemConfig {
  return {
    general: {
      systemName: 'DOST Competency-Based HRMS (CB-HRMS)',
      agency: 'Department of Science and Technology',
      fiscalYear: '2026',
      assessmentCycle: 'FY 2026-2027',
      timezone: 'Asia/Manila (GMT+8)',
      supportEmail: 'servicedesk@dost.gov.ph',
    },
    security: { minPasswordLength: 12, requireComplexity: true, passwordExpiryDays: 90, maxFailedAttempts: 3, sessionTimeoutMinutes: 30, require2FA: true, allowedDomain: 'dost.gov.ph' },
    // tbl_proficiency_levels (the ERD uses levels 1–4)
    proficiencyLevels: [
      { number: 1, name: 'Basic', description: 'Applies basic knowledge with close supervision.', status: 'Active' },
      { number: 2, name: 'Intermediate', description: 'Applies the competency in routine situations with some guidance.', status: 'Active' },
      { number: 3, name: 'Advanced', description: 'Applies the competency independently in complex situations.', status: 'Active' },
      { number: 4, name: 'Superior', description: 'Sets standards and guides others across the agency.', status: 'Active' },
    ],
    // tbl_competency_categories
    categories: [
      { id: 1, name: 'Core', description: 'Competencies expected of every DOST employee.', status: 'Active' },
      { id: 2, name: 'Functional', description: 'Technical competencies specific to a job or field (S&T, admin, ICT).', status: 'Active' },
      { id: 3, name: 'Leadership', description: 'Competencies for supervisory and managerial positions.', status: 'Active' },
    ],
    notifications: { newUser: true, roleChange: true, profileUpdateSubmitted: true, issueUpdate: true, weeklySecurityDigest: false },
    maintenance: {
      maintenanceMode: false,
      message: 'CB-HRMS is under scheduled maintenance from 10:00 PM to 12:00 MN. Please save your work.',
      autoBackup: 'Daily at 02:00 AM',
      backups: [
        { id: 'BK-20261014', at: isoAgo(0, 2, 0), by: 'System', size: '412 MB', type: 'Automatic' },
        { id: 'BK-20261013', at: isoAgo(1, 2, 0), by: 'System', size: '411 MB', type: 'Automatic' },
        { id: 'BK-20261012', at: isoAgo(2, 2, 0), by: 'System', size: '409 MB', type: 'Automatic' },
      ],
    },
  }
}


/* ================================================================== */
/* ERD tables: seed rows                                               */
/* ================================================================== */

const SEED_DATE = '2026-01-15'

function seedOffices(): OfficeRow[] {
  return OFFICE_SEED.map((o, i) => ({ id: i + 1, officeName: o.name, officeCode: o.code, description: o.description, status: o.status, createdAt: SEED_DATE, updatedAt: SEED_DATE }))
}

function seedPositions(): PositionRow[] {
  return POSITION_SEED.map((p, i) => ({
    id: i + 1, positionCode: p.code, positionTitle: p.title, description: p.description, department: p.department,
    employmentType: 'Plantilla', status: 'Active', salaryGrade: p.salaryGrade, createdAt: SEED_DATE, updatedAt: SEED_DATE,
  }))
}

const CATEGORY_IDS: Record<string, number> = { Core: 1, Functional: 2, Leadership: 3 }

function seedCompetencies(): CompetencyRow[] {
  return COMPETENCY_SEED.map((c, i) => ({
    id: i + 1, categoryId: CATEGORY_IDS[c.type] ?? 1, competencyCode: c.code, competencyName: c.name, description: c.description,
    competencyType: c.type, status: 'Active', createdAt: SEED_DATE, updatedAt: SEED_DATE,
  }))
}

// One behavioural indicator per competency per proficiency level (4 levels)
export function defaultIndicators(name: string): [string, string, string, string] {
  const t = name.toLowerCase()
  return [
    `Shows basic understanding of ${t} and applies it with guidance.`,
    `Applies ${t} independently in routine work assignments.`,
    `Applies ${t} in complex situations and guides colleagues.`,
    `Sets standards for ${t} and champions it across the agency.`,
  ]
}

function seedIndicators(competencies: CompetencyRow[]): BehavioralIndicatorRow[] {
  const rows: BehavioralIndicatorRow[] = []
  competencies.forEach((c) => {
    const text = COMPETENCY_SEED.find((x) => x.code === c.competencyCode)?.indicators ?? defaultIndicators(c.competencyName)
    text.forEach((t, k) => rows.push({ id: rows.length + 1, competencyId: c.id, proficiencyLevelId: k + 1, indicatorText: t, createdAt: SEED_DATE, updatedAt: SEED_DATE }))
  })
  return rows
}

function seedPositionCompetencies(positions: PositionRow[], competencies: CompetencyRow[]): PositionCompetencyRow[] {
  const rows: PositionCompetencyRow[] = []
  positions.forEach((p) => {
    ;(POSITION_REQUIREMENT_SEED[p.positionTitle] ?? []).forEach((r) => {
      const c = competencies.find((x) => x.competencyCode === r.code)
      if (c) rows.push({ id: rows.length + 1, positionId: p.id, competencyId: c.id, requiredLevel: r.level, priority: priorityNumber(r.priority), createdAt: SEED_DATE, updatedAt: SEED_DATE })
    })
  })
  return rows
}

// Which result text goes with a gap (the gap analysis screens turn it back into a severity)
export function resultStatusText(requiredLevel: number, currentLevel: number, critical: boolean) {
  if (currentLevel === 0) return 'Not Assessed'
  const gap = requiredLevel - currentLevel
  if (gap <= 0) return 'Meets Requirement'
  if (gap >= 3 || (gap === 2 && critical)) return 'Needs Improvement'
  if (gap === 2) return 'Needs Development'
  return 'Gap Identified'
}

function resultRemark(gap: number, current: number) {
  if (current === 0) return 'No current level recorded for this competency yet.'
  if (gap <= 0) return 'Consistently demonstrates the behavioural indicators expected at the required level.'
  if (gap === 1) return 'Demonstrates most indicators at the required level; needs more consistent application.'
  if (gap === 2) return 'Demonstrates working knowledge but requires a more advanced level of competency for the position.'
  return 'Shows foundational awareness only; a structured development intervention is needed.'
}

// Builds the stored results for one employee: the position's requirements against the employee's
// current levels (tbl_employee_competencies). `shift` lowers the current levels, used for older sample analyses.
export function buildGapResults(d: Pick<Db, 'positionCompetencies' | 'competencies'>, employee: Employee, positionId: number, shift = 0) {
  return d.positionCompetencies
    .filter((r) => r.positionId === positionId)
    .map((r) => {
      const c = d.competencies.find((x) => x.id === r.competencyId)
      const have = employee.competencies.find((x) => x.code === c?.competencyCode)
      const current = have ? Math.max(1, have.level - shift) : 0
      const gap = current === 0 ? r.requiredLevel : Math.max(0, r.requiredLevel - current)
      return { competencyId: r.competencyId, requiredLevel: r.requiredLevel, currentLevel: current, gapLevel: gap, status: resultStatusText(r.requiredLevel, current, r.priority === 1), remarks: resultRemark(gap, current) }
    })
}

// [analysis number, employee no., date, status, how many levels lower the sample "current" levels were]
const GAP_SEEDS: [number, string, string, GapAnalysisStatus, number][] = [
  [11, 'DOST-2017-0172', '2024-10-15', 'Completed', 2],
  [15, 'DOST-2018-0190', '2024-10-18', 'Completed', 2],
  [12, 'DOST-2020-0215', '2025-10-08', 'Completed', 1],
  [14, 'DOST-2016-0161', '2025-10-09', 'Completed', 1],
  [16, 'DOST-2017-0172', '2025-10-10', 'Completed', 1],
  [18, 'DOST-2019-0199', '2025-10-13', 'Completed', 1],
  [21, 'DOST-2023-0266', '2025-10-12', 'Completed', 1],
  [25, 'DOST-2021-0240', '2026-10-02', 'Superseded', 0],
  [27, 'DOST-2018-0190', '2026-10-06', 'Completed', 0],
  [29, 'DOST-2016-0161', '2026-10-07', 'Completed', 0],
  [31, 'DOST-2021-0240', '2026-10-09', 'Completed', 0],
  [30, 'DOST-2017-0172', '2026-10-10', 'Completed', 0],
  [32, 'DOST-2023-0266', '2026-10-14', 'Completed', 0],
]

function seedGap(employees: Employee[], positions: PositionRow[], pcs: PositionCompetencyRow[], comps: CompetencyRow[]) {
  const analyses: GapAnalysisRow[] = []
  const results: GapResultRow[] = []
  GAP_SEEDS.slice().sort((a, b) => a[0] - b[0]).forEach(([id, no, date, status, shift]) => {
    const e = employees.find((x) => x.employeeNo === no)
    const pos = positions.find((p) => p.positionTitle === e?.positionTitle)
    if (!e || !pos) return
    analyses.push({ id, employeeId: e.id, positionId: pos.id, analysisDate: date, status, remarks: '', createdBy: 3, createdAt: date, updatedAt: date })
    buildGapResults({ positionCompetencies: pcs, competencies: comps }, e, pos.id, shift).forEach((r) => results.push({ id: results.length + 1, gapAnalysisId: id, ...r, createdAt: date, updatedAt: date }))
  })
  return { analyses, results }
}

export const gapAnalysisCode = (id: number) => `GA-2026-${String(id).padStart(3, '0')}`

// Saves a new gap analysis for each employee (used by the Administrative Admin screens).
// Earlier completed analyses of the same employee become "Superseded". Returns the new analysis ids.
export function runGapAnalyses(employeeIds: number[], createdBy: number, remarks = ''): number[] {
  const made: number[] = []
  save((d) => {
    const today = new Date().toISOString().slice(0, 10)
    employeeIds.forEach((eid) => {
      const e = d.employees.find((x) => x.id === eid)
      const pos = d.positions.find((p) => p.positionTitle === e?.positionTitle)
      if (!e || !pos) return
      d.gapAnalyses.forEach((a) => {
        if (a.employeeId === eid && a.status === 'Completed') a.status = 'Superseded'
      })
      const id = nextNumber(d.gapAnalyses.map((a) => a.id))
      d.gapAnalyses.push({ id, employeeId: eid, positionId: pos.id, analysisDate: today, status: 'Completed', remarks, createdBy, createdAt: '', updatedAt: '' })
      buildGapResults(d, e, pos.id).forEach((r) => d.gapResults.push({ id: nextNumber(d.gapResults.map((x) => x.id)), gapAnalysisId: id, ...r, createdAt: '', updatedAt: '' }))
      made.push(id)
    })
  })
  return made
}

function seed(): Db {
  const employees = seedEmployees()
  const users = seedUsers(employees)
  const offices = seedOffices()
  const positions = seedPositions()
  const competencies = seedCompetencies()
  const positionCompetencies = seedPositionCompetencies(positions, competencies)
  const gap = seedGap(employees, positions, positionCompetencies, competencies)
  return {
    roles: seedRoles(),
    users,
    employees,
    history: seedHistory(employees),
    assignments: seedAssignments(),
    logs: seedLogs(users),
    updates: seedUpdates(employees),
    issues: seedIssues(),
    config: seedConfig(),
    offices,
    positions,
    competencies,
    positionCompetencies,
    behavioralIndicators: seedIndicators(competencies),
    gapAnalyses: gap.analyses,
    gapResults: gap.results,
  }
}

/* ================================================================== */
/* Store                                                               */
/* ================================================================== */

const STORAGE_KEY = 'cbhr_technical_admin_v3' // v3: official 65-competency list (older saved data is ignored)

function load(): Db {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Db
      // data saved before the ERD tables existed: take the missing tables from the sample data
      const fresh = seed()
      const keys: (keyof Db)[] = ['offices', 'positions', 'competencies', 'positionCompetencies', 'behavioralIndicators', 'gapAnalyses', 'gapResults']
      keys.forEach((k) => {
        if (!saved[k]) (saved as unknown as Record<string, unknown>)[k] = fresh[k]
      })
      // the 65 official competencies (COMPETENCY_SEED) must all be present, otherwise start again from the sample data
      if (!COMPETENCY_SEED.every((c) => saved.competencies?.some((x) => x.competencyCode === c.code))) return seed()
      return saved
    }
  } catch {
    // storage blocked or data unreadable: fall back to the sample data
  }
  return seed()
}

// Small stand-in for password_hash: the prototype stores no real passwords
function demoHash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return 'demo$' + (h >>> 0).toString(16).padStart(8, '0')
}

// Fills in every ERD column that is not set yet (foreign keys, timestamps, hash) so that
// each table matches the Phase 1 ERD. Safe to run again and again.
function normalise(d: Db) {
  const now = new Date().toISOString()
  d.roles.forEach((r) => { r.updatedAt ??= r.createdAt })
  d.users.forEach((u) => {
    u.passwordHash ??= demoHash(u.username)
    u.updatedAt ??= u.createdAt
  })
  d.config.proficiencyLevels.forEach((l, i) => {
    l.id ??= i + 1
    l.createdAt ??= SEED_DATE
    l.updatedAt ??= l.createdAt
  })
  d.config.categories.forEach((c) => {
    c.createdAt ??= SEED_DATE
    c.updatedAt ??= c.createdAt
  })
  d.history.forEach((h) => { h.updatedAt ??= h.createdAt })
  let nextEc = Math.max(0, ...d.employees.flatMap((e) => e.competencies.map((c) => c.id ?? 0))) + 1
  d.employees.forEach((e) => {
    e.officeId = d.offices.find((o) => o.officeCode === e.officeCode)?.id
    e.positionId = d.positions.find((p) => p.positionTitle === e.positionTitle)?.id
    e.createdAt ??= e.dateHired || now
    e.updatedAt ??= e.createdAt
    e.competencies.forEach((c) => {
      c.competencyId = d.competencies.find((x) => x.competencyCode === c.code)?.id
      if (c.id === undefined) c.id = nextEc++
      c.status ??= 'Active'
      c.createdAt ??= e.createdAt
      c.updatedAt ??= c.lastUpdated || e.createdAt
    })
  })
}

type TableRows = { id: number; createdAt?: string; updatedAt?: string }[]
function tables(d: Db): TableRows[] {
  return [d.roles, d.users, d.employees, d.history, d.offices, d.positions, d.competencies, d.positionCompetencies, d.behavioralIndicators, d.gapAnalyses, d.gapResults] as unknown as TableRows[]
}
const rowKey = (r: object) => JSON.stringify(r, (k, v) => (k === 'updatedAt' ? undefined : v))

function snapshot(d: Db) {
  return tables(d).map((rows) => new Map(rows.map((r) => [r.id, rowKey(r)])))
}

// After a change: new rows get created_at / updated_at, edited rows get a new updated_at
function stamp(d: Db, before: Map<number, string>[]) {
  const now = new Date().toISOString()
  tables(d).forEach((rows, i) => {
    rows.forEach((r) => {
      const old = before[i].get(r.id)
      if (old === undefined) {
        if (!r.createdAt) r.createdAt = now
        r.updatedAt = now
      } else if (old !== rowKey(r)) {
        r.updatedAt = now
      }
    })
  })
}

// Keeps the older list-style exports (offices, positions, POSITION_COMPETENCIES) equal to the tables
function syncLegacy(d: Db) {
  offices.length = 0
  offices.push(...d.offices.map((o) => ({ code: o.officeCode, name: o.officeName })))
  positions.length = 0
  positions.push(...d.positions.map((p) => ({ title: p.positionTitle, salaryGrade: p.salaryGrade })))
  Object.keys(POSITION_COMPETENCIES).forEach((k) => delete POSITION_COMPETENCIES[k])
  d.positions.forEach((p) => {
    POSITION_COMPETENCIES[p.positionTitle] = d.positionCompetencies
      .filter((r) => r.positionId === p.id)
      .map((r) => ({ code: d.competencies.find((c) => c.id === r.competencyId)?.competencyCode ?? '', level: r.requiredLevel, priority: PRIORITY_NAMES[r.priority] ?? 'Important' }))
      .filter((r) => r.code)
  })
}

let db: Db = load()
normalise(db)
syncLegacy(db)

// Read the current data outside a React page (used by the Concerned Office store)
export function getDb(): Db {
  return db
}
let version = 0
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // storage full or blocked: changes still work until the page is refreshed
  }
}

function notify() {
  version++
  listeners.forEach((l) => l())
}

export function subscribeDb(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Use in a page: const db = useDb()  — the page re-draws whenever data changes
export function useDb(): Db {
  useSyncExternalStore(subscribeDb, () => version)
  return db
}

// The person currently using the Technical Admin pages (for audit entries)
export const CURRENT_ACTOR = { userId: 1, username: 'tech.admin', name: 'Carmela P. Reyes', ip: '10.12.5.23', device: 'Chrome 129 · Windows 11' }

interface AuditEntry {
  event: EventType
  details: string
  status?: LogStatus
}

// The ONE place where data changes. Pass a function that edits the data and,
// optionally, an audit entry that is added to the Access Logs.
export function save(change: (d: Db) => void, audit?: AuditEntry) {
  const before = snapshot(db)
  change(db)
  normalise(db)
  stamp(db, before)
  syncLegacy(db)
  if (audit) {
    const id = Math.max(0, ...db.logs.map((l) => l.id)) + 1
    db.logs.unshift({
      id,
      timestamp: new Date().toISOString(),
      userId: CURRENT_ACTOR.userId,
      username: CURRENT_ACTOR.username,
      event: audit.event,
      status: audit.status ?? 'Success',
      ip: CURRENT_ACTOR.ip,
      device: CURRENT_ACTOR.device,
      details: audit.details,
    })
  }
  persist()
  notify()
}

// Puts the sample data back (System Configuration → Maintenance)
export function resetDemoData() {
  db = seed()
  normalise(db)
  syncLegacy(db)
  persist()
  notify()
}

/* ================================================================== */
/* Look-up helpers                                                     */
/* ================================================================== */

export function employeeName(e: Employee | undefined, withMiddle = false) {
  if (!e) return '—'
  return withMiddle ? `${e.firstName} ${e.middleName} ${e.lastName}` : `${e.firstName} ${e.lastName}`
}

export function initialsOf(name: string) {
  return name
    .split(' ')
    .filter((w) => /^[A-Za-z]/.test(w) && !w.endsWith('.'))
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function officeName(code: string) {
  return offices.find((o) => o.code === code)?.name ?? code
}

export function nextNumber(ids: number[]) {
  return Math.max(0, ...ids) + 1
}

// Fields an employee record exposes to the profile-update workflow
export function readField(e: Employee, field: UpdateField) {
  return String(e[field])
}

export function applyField(e: Employee, field: UpdateField, value: string) {
  if (field === 'positionTitle') {
    e.positionTitle = value
    e.salaryGrade = positions.find((p) => p.title === value)?.salaryGrade ?? e.salaryGrade
  } else {
    e[field] = value
  }
}
