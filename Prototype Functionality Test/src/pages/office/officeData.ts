// Data for the Concerned Office module.
//
// WHERE THE DATA COMES FROM
// - Employees, their competencies and history are READ from the shared Technical Admin
//   store (../technical/techData). The Concerned Office never edits employees directly.
// - Instead the office sends REQUESTS:
//     * Employee Addition / Update / Removal  → reviewed by the Technical Admin
//       (Technical Admin › Employee Profile Management › Office Requests)
//     * Gap Analysis Report                   → prepared by the Administrative Admin
//       (Administrative Admin › Office Report Requests)
//   Requests are kept in this file's own store (saved in localStorage like techData).
//
// Tables used (Phase 1 ERD): tbl_employees, tbl_positions, tbl_competencies,
// tbl_position_competencies (required_level, priority), tbl_employee_competencies
// (current_level), tbl_proficiency_levels (1–4), tbl_gap_analyses + tbl_gap_analysis_results.
import { useSyncExternalStore } from 'react'
import { getDb, subscribeDb, save as saveTech, applyField, readField, employeeName, positions, nextNumber, UPDATE_FIELDS, POSITION_COMPETENCIES } from '../technical/techData'
import type { Employee, UpdateField, PositionCompetency, RequirementPriority } from '../technical/techData'
import { formatDate } from '../technical/techTheme'

/* ================================================================== */
/* The office that is signed in                                        */
/* ================================================================== */

// The prototype has one Concerned Office login (office@dost.gov.ph), linked to DOST-ASTI.
export const CURRENT_OFFICE = {
  code: 'DOST-ASTI',
  acronym: 'ASTI',
  name: 'Advanced Science and Technology Institute',
  classification: 'R&D Institute',
  head: 'Dr. Ricardo B. Manalo',
  headTitle: 'Director IV',
  focalPerson: 'Patrice L. Uy', // HR focal person who submits requests for the office
  address: 'ASTI Building, C.P. Garcia Avenue, UP Technology Park, Diliman, Quezon City',
  email: 'hr@asti.dost.gov.ph',
  phone: '(02) 8249 8500',
  domain: 'asti.dost.gov.ph',
  established: '1987',
  mandate:
    'Conducts R&D in advanced science and technology fields such as ICT and microelectronics, and provides the DOST system with ICT infrastructure and services.',
}

// Name shown on requests ("Patrice L. Uy (DOST-ASTI)")
export const OFFICE_ACTOR = `${CURRENT_OFFICE.focalPerson} (${CURRENT_OFFICE.code})`

/* ================================================================== */
/* Competency catalogue (tbl_competencies + behavioural indicators)    */
/* ================================================================== */

export type Category = 'Core' | 'Functional' | 'Leadership'

export interface Competency {
  code: string
  title: string
  category: Category
  description: string
  indicators: [string, string, string, string] // what each level 1–4 looks like
}

// The competency list is read from tbl_competencies + tbl_behavioral_indicators (see techData) and
// refreshed whenever that data changes, so edits made by the Administrative Admin show up here.
export const COMPETENCIES: Competency[] = []

function syncCompetencies() {
  const d = getDb()
  COMPETENCIES.length = 0
  d.competencies.forEach((c) => {
      const text = d.behavioralIndicators.filter((b) => b.competencyId === c.id).sort((a, b) => a.proficiencyLevelId - b.proficiencyLevelId).map((b) => b.indicatorText)
      COMPETENCIES.push({
        code: c.competencyCode,
        title: c.competencyName,
        category: c.competencyType as Category,
        description: c.description,
        indicators: [text[0] ?? '', text[1] ?? '', text[2] ?? '', text[3] ?? ''],
      })
    })
}
syncCompetencies()
subscribeDb(syncCompetencies)

export function competencyByCode(code: string) {
  return COMPETENCIES.find((c) => c.code === code)
}

/* ================================================================== */
/* Position requirements (tbl_position_competencies)                   */
/* ================================================================== */

// The table itself lives in ../technical/techData (POSITION_COMPETENCIES) because the
// sample employees are seeded from it; here we only give it the names the pages use.
export type Priority = RequirementPriority
export type Requirement = PositionCompetency
export const POSITION_REQUIREMENTS = POSITION_COMPETENCIES

export function requirementsFor(positionTitle: string) {
  return POSITION_REQUIREMENTS[positionTitle] ?? []
}

/* ================================================================== */
/* Comparing an employee with their position (gap rows)                */
/* ================================================================== */

export type GapStatus = 'Meets' | 'Minor Gap' | 'Major Gap' | 'Not Assessed'

export interface GapRow {
  code: string
  title: string
  category: Category
  priority: Priority
  required: number
  current: number // 0 = not yet assessed
  gap: number // how many levels short (0 = meets)
  status: GapStatus
}

export function gapStatusOf(required: number, current: number): GapStatus {
  if (current === 0) return 'Not Assessed'
  const gap = required - current
  if (gap <= 0) return 'Meets'
  return gap === 1 ? 'Minor Gap' : 'Major Gap'
}

// One row per competency the employee's position requires
export function gapRows(e: Employee, categories?: Category[]): GapRow[] {
  return requirementsFor(e.positionTitle)
    .filter((r) => competencyByCode(r.code))
    .map((r) => {
      const c = competencyByCode(r.code)!
      const current = e.competencies.find((x) => x.code === r.code)?.level ?? 0
      return {
        code: r.code,
        title: c.title,
        category: c.category,
        priority: r.priority,
        required: r.level,
        current,
        gap: Math.max(0, r.level - current),
        status: gapStatusOf(r.level, current),
      }
    })
    .filter((row) => !categories || categories.includes(row.category))
}

// Match score: how much of the required proficiency the employee already has (0–100%)
export function matchScore(rows: GapRow[]) {
  const needed = rows.reduce((s, r) => s + r.required, 0)
  if (!needed) return 0
  const have = rows.reduce((s, r) => s + Math.min(r.current, r.required), 0)
  return Math.round((have / needed) * 100)
}

/* ================================================================== */
/* Requests to the Technical Admin                                     */
/* ================================================================== */

export type RequestType = 'Addition' | 'Update' | 'Removal'
export type RequestStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Cancelled'

export const REMOVAL_REASONS = ['Resignation', 'Retirement', 'End of Contract', 'Transfer to another agency', 'Separation (other)'] as const

export interface NewEmployeeDetails {
  firstName: string
  middleName: string
  lastName: string
  sex: 'Female' | 'Male'
  birthDate: string
  email: string
  phone: string
  address: string
  positionTitle: string
  employmentType: Employee['employmentType']
  dateHired: string
}

export interface FieldChange {
  field: UpdateField
  oldValue: string
  newValue: string
}

export interface StaffRequest {
  id: string
  type: RequestType
  officeCode: string
  employeeId: number | null // the employee concerned (Update / Removal; Addition after approval)
  newEmployee?: NewEmployeeDetails // Addition
  changes?: FieldChange[] // Update
  removal?: { reason: (typeof REMOVAL_REASONS)[number]; effectiveDate: string } // Removal
  justification: string
  attachment?: string
  priority: 'Normal' | 'Urgent'
  submittedBy: string
  submittedAt: string
  status: RequestStatus
  reviewStartedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  remarks?: string
}

/* ================================================================== */
/* Gap analysis report requests to the Administrative Admin            */
/* ================================================================== */

export type ReportStatus = 'Submitted' | 'In Review' | 'Report Available' | 'Declined' | 'Cancelled'
export type ReportScope = 'Whole Office' | 'Position' | 'Selected Employees'
export const ASSESSMENT_PERIODS = ['FY 2023-2024', 'FY 2024-2025', 'FY 2025-2026', 'FY 2026-2027'] as const
export const REPORT_PURPOSES = ['Annual competency assessment', 'Learning & development planning', 'Promotion / succession review', 'Office restructuring', 'Audit / compliance'] as const

export interface ReportEmployee {
  employeeId: number
  name: string
  employeeNo: string
  positionTitle: string
  rows: GapRow[]
}

// Snapshot saved when the Administrative Admin generates the report
// (like tbl_gap_analyses + tbl_gap_analysis_results)
export interface GapReport {
  generatedAt: string
  generatedBy: string
  employees: ReportEmployee[]
}

export interface ReportRequest {
  id: string
  officeCode: string
  title: string
  scope: ReportScope
  positionTitle?: string
  employeeIds: number[]
  categories: Category[]
  purpose: (typeof REPORT_PURPOSES)[number]
  period?: string // assessment period the report covers
  neededBy: string
  notes: string
  submittedBy: string
  submittedAt: string
  status: ReportStatus
  assignedTo?: string
  reviewStartedAt?: string
  completedAt?: string
  adminRemarks?: string
  report?: GapReport
  viewedByOffice?: boolean // false = show "new" badge on the office side
}

/* ================================================================== */
/* Small helpers                                                       */
/* ================================================================== */

const DAY = 86400000
const isoAgo = (days: number, hour = 10, minute = 0) => {
  const now = Date.now()
  const d = new Date(now - days * DAY)
  d.setHours(hour, minute, 0, 0)
  if (d.getTime() > now) d.setTime(now - 30 * 60000) // never in the future
  return d.toISOString()
}
const dateAhead = (days: number) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10)

export function officeEmployees(employees: Employee[], includeSeparated = false) {
  return employees.filter((e) => e.officeCode === CURRENT_OFFICE.code && (includeSeparated || e.status !== 'Separated'))
}

function idNumber(id: string) {
  return Number(id.split('-').pop()) || 0
}

function nextId(prefix: 'ER' | 'GAR', ids: string[]) {
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(nextNumber(ids.map(idNumber))).padStart(3, '0')}`
}

// Which employees a report request covers
export function employeesInScope(employees: Employee[], r: Pick<ReportRequest, 'scope' | 'positionTitle' | 'employeeIds' | 'officeCode'>) {
  const pool = employees.filter((e) => e.officeCode === r.officeCode && e.status !== 'Separated')
  if (r.scope === 'Position') return pool.filter((e) => e.positionTitle === r.positionTitle)
  if (r.scope === 'Selected Employees') return pool.filter((e) => r.employeeIds.includes(e.id))
  return pool
}

export function buildGapReport(employees: Employee[], r: ReportRequest, by: string): GapReport {
  return {
    generatedAt: new Date().toISOString(),
    generatedBy: by,
    employees: employeesInScope(employees, r).map((e) => ({
      employeeId: e.id,
      name: employeeName(e, true),
      employeeNo: e.employeeNo,
      positionTitle: e.positionTitle,
      rows: gapRows(e, r.categories),
    })),
  }
}

// How many of a set of rows are below / equal to / above the required level (levels 1–4)
export function resultCounts(rows: GapRow[]) {
  const assessed = rows.filter((r) => r.current > 0)
  return {
    total: rows.length,
    gaps: assessed.filter((r) => r.current < r.required).length,
    meeting: assessed.filter((r) => r.current === r.required).length,
    exceeding: assessed.filter((r) => r.current > r.required).length,
    notAssessed: rows.length - assessed.length,
    major: rows.filter((r) => r.status === 'Major Gap').length,
    minor: rows.filter((r) => r.status === 'Minor Gap').length,
  }
}

// Totals used by the report page, dashboard and admin preview
export function summariseReport(report: GapReport) {
  const rows = report.employees.flatMap((e) => e.rows)
  const count = (s: GapStatus) => rows.filter((r) => r.status === s).length
  const scores = report.employees.map((e) => matchScore(e.rows))
  // average required vs current per competency
  const byCompetency = COMPETENCIES.map((c) => {
    const list = rows.filter((r) => r.code === c.code)
    const assessed = list.filter((r) => r.current > 0)
    return {
      code: c.code,
      title: c.title,
      category: c.category,
      staff: list.length,
      required: list.length ? list.reduce((s, r) => s + r.required, 0) / list.length : 0,
      current: assessed.length ? assessed.reduce((s, r) => s + r.current, 0) / assessed.length : 0,
      withGap: list.filter((r) => r.status === 'Minor Gap' || r.status === 'Major Gap').length,
      notAssessed: list.filter((r) => r.status === 'Not Assessed').length,
    }
  }).filter((c) => c.staff > 0)
  return {
    employees: report.employees.length,
    rows: rows.length,
    ...resultCounts(rows),
    meets: count('Meets'),
    minor: count('Minor Gap'),
    major: count('Major Gap'),
    notAssessed: count('Not Assessed'),
    avgMatch: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    byCompetency,
  }
}

/* ================================================================== */
/* Sample data                                                         */
/* ================================================================== */

interface OfficeStore {
  requests: StaffRequest[]
  reports: ReportRequest[]
}

function seed(): OfficeStore {
  const employees = getDb().employees
  const byNo = (no: string) => employees.find((e) => e.employeeNo === no)
  const joy = byNo('DOST-2020-0215')
  const kevin = byNo('DOST-2023-0271')
  const bryan = byNo('COS-2026-0007')
  const camille = byNo('DOST-2019-0207')
  const code = CURRENT_OFFICE.code

  const requests: StaffRequest[] = [
    {
      id: 'ER-2026-015', type: 'Addition', officeCode: code, employeeId: null, priority: 'Normal', status: 'Pending', submittedBy: OFFICE_ACTOR, submittedAt: isoAgo(0, 9, 20),
      newEmployee: { firstName: 'Lea', middleName: 'M.', lastName: 'Fernandez', sex: 'Female', birthDate: '1998-04-12', email: 'lea.fernandez@asti.dost.gov.ph', phone: '+63 917 640 2231', address: 'Quezon City, Metro Manila', positionTitle: 'Science Research Specialist I', employmentType: 'Permanent', dateHired: dateAhead(14) },
      justification: 'New hire for the Data Science R&D Division (plantilla item ASTI-SRS1-021) approved by the HRMPSB.', attachment: 'Appointment_CSForm33_Fernandez.pdf',
    },
    {
      id: 'ER-2026-014', type: 'Update', officeCode: code, employeeId: joy?.id ?? null, priority: 'Normal', status: 'Under Review', submittedBy: OFFICE_ACTOR, submittedAt: isoAgo(2, 14, 5), reviewStartedAt: isoAgo(1, 9, 40), reviewedBy: 'Carmela P. Reyes',
      changes: joy ? [{ field: 'positionTitle', oldValue: joy.positionTitle, newValue: 'Senior Science Research Specialist' }] : [],
      justification: 'Promotion approved by the HRMPSB effective next month.', attachment: 'Promotion_Notice_Pascual.pdf',
    },
    {
      id: 'ER-2026-012', type: 'Removal', officeCode: code, employeeId: kevin?.id ?? null, priority: 'Normal', status: 'Rejected', submittedBy: OFFICE_ACTOR, submittedAt: isoAgo(9, 10, 30),
      removal: { reason: 'Resignation', effectiveDate: '2026-10-31' }, justification: 'Employee submitted a resignation letter.',
      reviewedBy: 'Carmela P. Reyes', reviewedAt: isoAgo(8, 15, 10), remarks: 'Please attach the accepted resignation letter and the clearance form, then submit again.',
    },
    {
      id: 'ER-2026-009', type: 'Addition', officeCode: code, employeeId: bryan?.id ?? null, priority: 'Urgent', status: 'Approved', submittedBy: OFFICE_ACTOR, submittedAt: '2026-02-09T09:00:00.000Z',
      newEmployee: { firstName: 'Bryan', middleName: 'C.', lastName: 'Dela Cruz', sex: 'Male', birthDate: '2000-08-30', email: bryan?.email ?? 'bryan.delacruz@asti.dost.gov.ph', phone: bryan?.phone ?? '', address: bryan?.address ?? '', positionTitle: 'Science Aide', employmentType: 'Contract of Service', dateHired: '2026-02-16' },
      justification: 'Contract of Service for the ASTI COARE project.', attachment: 'COS_Contract_DelaCruz.pdf',
      reviewedBy: 'Ana S. Dizon', reviewedAt: '2026-02-11T10:20:00.000Z', remarks: 'Employee record created.',
    },
    {
      id: 'ER-2026-007', type: 'Update', officeCode: code, employeeId: camille?.id ?? null, priority: 'Normal', status: 'Approved', submittedBy: OFFICE_ACTOR, submittedAt: isoAgo(40, 11),
      changes: camille ? [{ field: 'phone', oldValue: '+63 917 300 1188', newValue: camille.phone }] : [],
      justification: 'Employee changed mobile number.', reviewedBy: 'Carmela P. Reyes', reviewedAt: isoAgo(39, 9), remarks: 'Updated.',
    },
  ]

  const base: Omit<ReportRequest, 'id' | 'title' | 'scope' | 'employeeIds' | 'status' | 'submittedAt' | 'purpose' | 'neededBy' | 'notes'> = {
    officeCode: code, categories: ['Core', 'Functional', 'Leadership'], submittedBy: OFFICE_ACTOR,
  }
  const available: ReportRequest = {
    ...base, id: 'GAR-2026-011', title: 'ASTI annual competency gap report', scope: 'Whole Office', employeeIds: [], status: 'Report Available',
    purpose: 'Annual competency assessment', period: 'FY 2025-2026', neededBy: '2026-10-09', notes: 'For the FY 2027 L&D plan.', submittedAt: isoAgo(12, 9),
    assignedTo: 'Jose M. Bautista', reviewStartedAt: isoAgo(11, 10), completedAt: isoAgo(6, 15, 30), viewedByOffice: true,
    adminRemarks: 'Statistics and Data Analysis and Program/Project Management are the widest gaps. Prioritise these in the FY 2027 L&D plan.',
  }
  available.report = { ...buildGapReport(employees, available, 'Jose M. Bautista'), generatedAt: isoAgo(6, 15, 30) }

  const reports: ReportRequest[] = [
    {
      ...base, id: 'GAR-2026-014', title: 'SRS II readiness for promotion', scope: 'Position', positionTitle: 'Science Research Specialist II', employeeIds: [], status: 'In Review',
      categories: ['Core', 'Functional'], purpose: 'Promotion / succession review', period: 'FY 2025-2026', neededBy: dateAhead(10), notes: 'Needed before the HRMPSB deliberation.',
      submittedAt: isoAgo(3, 13, 15), assignedTo: 'Jose M. Bautista', reviewStartedAt: isoAgo(2, 9, 30),
    },
    available,
  ]
  return { requests, reports }
}

/* ================================================================== */
/* Store (same pattern as techData: one save() function)               */
/* ================================================================== */

const STORAGE_KEY = 'cbhr_concerned_office_v1'

function load(): OfficeStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as OfficeStore
  } catch {
    // storage blocked or unreadable: use the sample data
  }
  return seed()
}

let store: OfficeStore = load()
let version = 0
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // storage full or blocked: changes still work until refresh
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Use in a page: const office = useOfficeStore()
export function useOfficeStore(): OfficeStore {
  useSyncExternalStore(subscribe, () => version)
  return store
}

function saveOffice(change: (s: OfficeStore) => void) {
  change(store)
  persist()
  version++
  listeners.forEach((l) => l())
}

export function resetOfficeDemoData() {
  store = seed()
  persist()
  version++
  listeners.forEach((l) => l())
}

/* ================================================================== */
/* Actions - Concerned Office                                          */
/* ================================================================== */

export function submitStaffRequest(data: Pick<StaffRequest, 'type' | 'employeeId' | 'newEmployee' | 'changes' | 'removal' | 'justification' | 'attachment' | 'priority'>) {
  const id = nextId('ER', store.requests.map((r) => r.id))
  saveOffice((s) => {
    s.requests.unshift({ ...data, id, officeCode: CURRENT_OFFICE.code, submittedBy: OFFICE_ACTOR, submittedAt: new Date().toISOString(), status: 'Pending' })
  })
  return id
}

export function cancelStaffRequest(id: string) {
  saveOffice((s) => {
    const r = s.requests.find((x) => x.id === id)
    if (r && r.status === 'Pending') r.status = 'Cancelled'
  })
}

export function submitReportRequest(data: Pick<ReportRequest, 'title' | 'scope' | 'positionTitle' | 'employeeIds' | 'categories' | 'purpose' | 'period' | 'neededBy' | 'notes'>) {
  const id = nextId('GAR', store.reports.map((r) => r.id))
  saveOffice((s) => {
    s.reports.unshift({ ...data, id, officeCode: CURRENT_OFFICE.code, submittedBy: OFFICE_ACTOR, submittedAt: new Date().toISOString(), status: 'Submitted' })
  })
  return id
}

export function cancelReportRequest(id: string) {
  saveOffice((s) => {
    const r = s.reports.find((x) => x.id === id)
    if (r && r.status === 'Submitted') r.status = 'Cancelled'
  })
}

export function markReportViewed(id: string) {
  const r = store.reports.find((x) => x.id === id)
  if (r && r.status === 'Report Available' && !r.viewedByOffice) saveOffice(() => (r.viewedByOffice = true))
}

/* ================================================================== */
/* Actions - Technical Admin (reviews employee requests)               */
/* ================================================================== */

export function startStaffReview(id: string, by: string) {
  saveOffice((s) => {
    const r = s.requests.find((x) => x.id === id)
    if (r && r.status === 'Pending') {
      r.status = 'Under Review'
      r.reviewStartedAt = new Date().toISOString()
      r.reviewedBy = by
    }
  })
}

// Next employee number, e.g. DOST-2026-0301 or COS-2026-0012
function nextEmployeeNo(employees: Employee[], type: Employee['employmentType']) {
  const prefix = `${type === 'Permanent' ? 'DOST' : 'COS'}-${new Date().getFullYear()}-`
  const used = employees.filter((e) => e.employeeNo.startsWith(prefix)).map((e) => idNumber(e.employeeNo))
  return prefix + String(Math.max(type === 'Permanent' ? 300 : 20, ...used) + 1).padStart(4, '0')
}

// Approve or reject. Approving changes the shared employee data (tbl_employees)
// and writes a history record (tbl_historical_records) + an access-log entry.
export function decideStaffRequest(id: string, decision: 'Approved' | 'Rejected', remarks: string, by: string) {
  const r = store.requests.find((x) => x.id === id)
  if (!r || r.status === 'Approved' || r.status === 'Rejected' || r.status === 'Cancelled') return
  const today = new Date().toISOString().slice(0, 10)
  let employeeId = r.employeeId

  if (decision === 'Approved') {
    if (r.type === 'Addition' && r.newEmployee) {
      const n = r.newEmployee
      saveTech(
        (d) => {
          employeeId = nextNumber(d.employees.map((e) => e.id))
          d.employees.push({
            id: employeeId,
            employeeNo: nextEmployeeNo(d.employees, n.employmentType),
            firstName: n.firstName, middleName: n.middleName, lastName: n.lastName, email: n.email, phone: n.phone, address: n.address,
            sex: n.sex, birthDate: n.birthDate, officeCode: r.officeCode, positionTitle: n.positionTitle,
            salaryGrade: positions.find((p) => p.title === n.positionTitle)?.salaryGrade ?? 1,
            employmentType: n.employmentType, dateHired: n.dateHired, status: 'Active',
            competencyProfile: 'Not Profiled', assessmentStatus: 'Not Started', competencies: [],
          })
          d.history.unshift({ id: nextNumber(d.history.map((h) => h.id)), employeeId, recordType: 'Hired', description: `Appointed as ${n.positionTitle} (${n.employmentType}) - office request ${r.id}`, effectiveDate: n.dateHired, createdAt: today, by })
        },
        { event: 'Profile Update', details: `Created employee ${n.firstName} ${n.lastName} from office request ${r.id} (${r.officeCode})` },
      )
    }
    if (r.type === 'Update' && r.changes && employeeId) {
      const changes = r.changes
      saveTech(
        (d) => {
          const e = d.employees.find((x) => x.id === employeeId)
          if (!e) return
          changes.forEach((c) => applyField(e, c.field, c.newValue))
          d.history.unshift({
            id: nextNumber(d.history.map((h) => h.id)), employeeId: e.id,
            recordType: changes.some((c) => c.field === 'positionTitle') ? 'Position Change' : changes.some((c) => c.field === 'officeCode') ? 'Office Transfer' : 'Profile Update',
            description: `${changes.map((c) => `${UPDATE_FIELDS[c.field]}: ${c.oldValue || '-'} → ${c.newValue}`).join('; ')} (office request ${r.id})`,
            effectiveDate: today, createdAt: today, by,
          })
        },
        { event: 'Profile Update', details: `Applied office request ${r.id}: ${changes.map((c) => UPDATE_FIELDS[c.field]).join(', ')} updated` },
      )
    }
    if (r.type === 'Removal' && r.removal && employeeId) {
      const removal = r.removal
      saveTech(
        (d) => {
          const e = d.employees.find((x) => x.id === employeeId)
          if (!e) return
          const before = e.status
          e.status = 'Separated'
          d.history.unshift({ id: nextNumber(d.history.map((h) => h.id)), employeeId: e.id, recordType: 'Status Change', description: `${before} → Separated (${removal.reason.toLowerCase()}) - office request ${r.id}`, effectiveDate: removal.effectiveDate, createdAt: today, by })
        },
        { event: 'Profile Update', details: `Marked employee as Separated from office request ${r.id} (${removal.reason})` },
      )
    }
  }

  saveOffice(() => {
    r.status = decision
    r.reviewedBy = by
    r.reviewedAt = new Date().toISOString()
    r.remarks = remarks
    r.employeeId = employeeId
  })
}

/* ================================================================== */
/* Actions - Administrative Admin (prepares gap analysis reports)      */
/* ================================================================== */

export function startReportReview(id: string, by: string) {
  saveOffice((s) => {
    const r = s.reports.find((x) => x.id === id)
    if (r && r.status === 'Submitted') {
      r.status = 'In Review'
      r.assignedTo = by
      r.reviewStartedAt = new Date().toISOString()
    }
  })
}

// Runs the gap analysis on the current employee data and saves the result as a snapshot
export function generateReport(id: string, by: string, remarks: string) {
  const employees = getDb().employees
  saveOffice((s) => {
    const r = s.reports.find((x) => x.id === id)
    if (!r || (r.status !== 'Submitted' && r.status !== 'In Review')) return
    r.report = buildGapReport(employees, r, by)
    r.status = 'Report Available'
    r.assignedTo = r.assignedTo ?? by
    r.reviewStartedAt = r.reviewStartedAt ?? new Date().toISOString()
    r.completedAt = r.report.generatedAt
    r.adminRemarks = remarks
    r.viewedByOffice = false
  })
}

export function declineReport(id: string, by: string, remarks: string) {
  saveOffice((s) => {
    const r = s.reports.find((x) => x.id === id)
    if (!r || (r.status !== 'Submitted' && r.status !== 'In Review')) return
    r.status = 'Declined'
    r.assignedTo = by
    r.completedAt = new Date().toISOString()
    r.adminRemarks = remarks
  })
}

/* ================================================================== */
/* Look-ups used by several pages                                      */
/* ================================================================== */

// One-line summary of a request ("Position: SRS II → Senior SRS")
export function requestSummary(r: StaffRequest) {
  if (r.type === 'Addition' && r.newEmployee) return `${r.newEmployee.positionTitle} · ${r.newEmployee.employmentType}`
  if (r.type === 'Update' && r.changes) return r.changes.map((c) => `${UPDATE_FIELDS[c.field]}: ${c.newValue}`).join('; ')
  if (r.type === 'Removal' && r.removal) return `${r.removal.reason} · effective ${r.removal.effectiveDate}`
  return '-'
}

// Name of the person a request is about
export function requestPerson(r: StaffRequest, employees: Employee[]) {
  if (r.type === 'Addition' && r.newEmployee) return `${r.newEmployee.firstName} ${r.newEmployee.middleName} ${r.newEmployee.lastName}`.replace(/\s+/g, ' ')
  return employeeName(employees.find((e) => e.id === r.employeeId), true)
}

// Progress steps for a gap analysis report request (shown with <StepTracker>)
export type StepState = 'done' | 'current' | 'todo' | 'failed'

export function reportSteps(r: ReportRequest): { label: string; detail?: string; state: StepState }[] {
  const finished = r.status === 'Report Available' || r.status === 'Declined'
  return [
    { label: 'Requested', detail: formatDate(r.submittedAt), state: 'done' },
    {
      label: 'Administrative Admin',
      detail: r.status === 'Cancelled' ? 'Cancelled' : r.assignedTo ? `${r.assignedTo}${r.reviewStartedAt ? ` · ${formatDate(r.reviewStartedAt)}` : ''}` : 'Waiting to be picked up',
      state: r.status === 'Cancelled' ? 'failed' : finished ? 'done' : r.status === 'In Review' ? 'current' : 'todo',
    },
    {
      label: r.status === 'Declined' ? 'Declined' : 'Report available',
      detail: r.completedAt ? formatDate(r.completedAt) : `Needed by ${formatDate(r.neededBy)}`,
      state: r.status === 'Report Available' ? 'done' : r.status === 'Declined' ? 'failed' : 'todo',
    },
  ]
}

export { readField }
