# Competency-Based Human Resource Management System (CB-HRMS)

**Project:** Competency-Based Human Resource Management System (CB-HRMS)  
**Phase:** Phase 1 – Fully Functional Prototype  
**Database:** MySQL  
**Status:** Revised – Aligned with Client-Confirmed Phase 1 System Architecture  
**Owner:** Data & System Architecture Lead

---

# 1. Purpose

This data dictionary defines the Phase 1 database structure for the CB-HRMS prototype. It documents the database entities, fields, data types, keys, relationships, and purpose of each field.

The Phase 1 database supports the client-confirmed system scope, including:

- User and role management
- Office management
- Employee management
- Position management
- Competency management
- Position-to-competency mapping
- Employee competency profiling
- Competency assessment
- Competency gap analysis
- Reporting and decision support
- Historical storage of assessment and gap-analysis results

The database is designed to support the competency profiling and gap-analysis workflow:

**Position → Required Competencies → Employee Competencies → Assessment → Gap Analysis → Historical Results / Reporting**

Training and Development, Individual Development Plan (IDP), and Talent & Succession Planning are **not included in the Phase 1 database scope**. These may be considered for future phases subject to client confirmation.

---

# 2. Key Definitions

| Term | Meaning |
|---|---|
| **PK** | Primary Key – uniquely identifies a record |
| **FK** | Foreign Key – references a record in another table |
| **INT** | Integer / whole number |
| **VARCHAR** | Variable-length character string |
| **TEXT** | Long text field |
| **DATE** | Calendar date |
| **DATETIME** | Date and time |
| **1** | One record |
| **0..1** | Zero or one record |
| **0..*** | Zero or many records |
| **Required Level** | Competency proficiency level required for a position |
| **Current Level** | Competency proficiency level currently recorded for an employee |
| **Assessed Level** | Competency proficiency level determined through an assessment |
| **Gap** | Difference between the required competency level and the employee's assessed/current competency level |
| **Historical Record** | Stored record of a significant previous system activity or generated result |

---

# 3. Database Entities

The Phase 1 database contains the following core entities:

1. `tbl_roles`
2. `tbl_users`
3. `tbl_offices`
4. `tbl_employees`
5. `tbl_positions`
6. `tbl_competencies`
7. `tbl_position_competencies`
8. `tbl_employee_competencies`
9. `tbl_assessments`
10. `tbl_assessment_results`
11. `tbl_gap_analysis_results`
12. `tbl_historical_records`

---

# 4. Database Entity Definitions

## 4.1 `tbl_roles`

Stores the system roles used for role-based access control.

### Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| `role_id` | INT | PK | Unique identifier for the role |
| `role_name` | VARCHAR(50) | | Name of the system role |
| `description` | VARCHAR(255) | | Description of the role and its access responsibilities |
| `status` | VARCHAR(20) | | Current status of the role |
| `created_at` | DATETIME | | Date and time the role was created |
| `updated_at` | DATETIME | | Date and time the role was last updated |

### Purpose

This table supports role-based access control for the four Phase 1 user roles:

- Executive
- Technical Administrator
- Administrative Administrator
- Concerned Office

---

## 4.2 `tbl_users`

Stores system user accounts and their association with employees and roles.

### Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| `user_id` | INT | PK | Unique identifier for the system user |
| `role_id` | INT | FK | References `tbl_roles.role_id` |
| `employee_id` | INT | FK | References `tbl_employees.employee_id`, where applicable |
| `username` | VARCHAR(50) | | Unique username used to access the system |
| `email` | VARCHAR(100) | | User's email address |
| `password_hash` | VARCHAR(255) | | Securely stored password hash |
| `status` | VARCHAR(20) | | Current status of the user account |
| `last_login` | DATETIME | | Date and time of the user's most recent login |
| `created_at` | DATETIME | | Date and time the user account was created |
| `updated_at` | DATETIME | | Date and time the user account was last updated |

### Purpose

Supports authentication, user management, and role-based access to system functions.

---

## 4.3 `tbl_offices`

Stores organisational offices/departments represented in the system.

### Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| `office_id` | INT | PK | Unique identifier for the office |
| `office_code` | VARCHAR(50) | | Unique organisational office code |
| `office_name` | VARCHAR(100) | | Name of the office |
| `description` | TEXT | | Description of the office |
| `status` | VARCHAR(20) | | Current status of the office |
| `created_at` | DATETIME | | Date and time the office was created |
| `updated_at` | DATETIME | | Date and time the office was last updated |

### Purpose

Supports office-level organisation and allows Concerned Office users to access information associated with their office.

---

## 4.4 `tbl_employees`

Stores employee profiles and organisational information.

### Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| `employee_id` | INT | PK | Unique identifier for the employee |
| `office_id` | INT | FK | References `tbl_offices.office_id` |
| `position_id` | INT | FK | References `tbl_positions.position_id` |
| `employee_no` | VARCHAR(50) | | Unique employee identification number |
| `first_name` | VARCHAR(50) | | Employee's first name |
| `middle_name` | VARCHAR(50) | | Employee's middle name |
| `last_name` | VARCHAR(50) | | Employee's last name |
| `email` | VARCHAR(100) | | Employee's email address |
| `phone` | VARCHAR(20) | | Employee's contact number |
| `date_hired` | DATE | | Employee's date of appointment/hiring |
| `status` | VARCHAR(20) | | Current employment status |
| `created_at` | DATETIME | | Date and time the employee record was created |
| `updated_at` | DATETIME | | Date and time the employee record was last updated |

### Purpose

Provides the employee profile used by competency profiling, assessment, gap analysis, reporting, and office-level employee management.

---

## 4.5 `tbl_positions`

Stores organisational positions and their related position information.

### Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| `position_id` | INT | PK | Unique identifier for the position |
| `position_code` | VARCHAR(50) | | Unique code identifying the position |
| `position_title` | VARCHAR(100) | | Title/name of the position |
| `description` | TEXT | | Description of the position |
| `department` | VARCHAR(100) | | Department or organisational unit associated with the position |
| `employment_type` | VARCHAR(50) | | Type of employment associated with the position |
| `status` | VARCHAR(20) | | Current status of the position |
| `created_at` | DATETIME | | Date and time the position was created |
| `updated_at` | DATETIME | | Date and time the position was last updated |

### Purpose

Defines the positions held by employees and provides the basis for determining the competency requirements for each position.

---

## 4.6 `tbl_competencies`

Stores the core and leadership competencies used by the organisation.

### Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| `competency_id` | INT | PK | Unique identifier for the competency |
| `competency_code` | VARCHAR(50) | | Unique code identifying the competency |
| `competency_name` | VARCHAR(100) | | Name of the competency |
| `description` | TEXT | | Description of the competency |
| `competency_type` | VARCHAR(50) | | Classification of the competency, such as Core or Leadership |
| `status` | VARCHAR(20) | | Current status of the competency |
| `created_at` | DATETIME | | Date and time the competency was created |
| `updated_at` | DATETIME | | Date and time the competency was last updated |

### Purpose

Stores the competency catalogue used throughout the system. Competency names, types, and definitions are based on the competency framework supplied by the client.

---

## 4.7 `tbl_position_competencies`

Maps positions to their required competencies and required proficiency levels.

### Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| `position_competency_id` | INT | PK | Unique identifier for the position-competency mapping |
| `position_id` | INT | FK | References `tbl_positions.position_id` |
| `competency_id` | INT | FK | References `tbl_competencies.competency_id` |
| `required_level` | INT | | Required proficiency level for the competency for the specified position |
| `priority` | INT | | Priority of the competency requirement for the position |
| `created_at` | DATETIME | | Date and time the mapping was created |
| `updated_at` | DATETIME | | Date and time the mapping was last updated |

### Purpose

Represents the competency requirements for each position.

A position may require multiple competencies, and the same competency may be required by multiple positions.

The `required_level` is based on the client's competency proficiency-level standard.

---

## 4.8 `tbl_employee_competencies`

Stores the current competency profile of each employee.

### Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| `employee_competency_id` | INT | PK | Unique identifier for the employee competency record |
| `employee_id` | INT | FK | References `tbl_employees.employee_id` |
| `competency_id` | INT | FK | References `tbl_competencies.competency_id` |
| `current_level` | INT | | Current recorded proficiency level of the employee |
| `evidence` | TEXT | | Supporting evidence or notes for the recorded competency level |
| `assessed_date` | DATE | | Date the current competency level was assessed or recorded |
| `status` | VARCHAR(20) | | Current status of the employee competency record |
| `created_at` | DATETIME | | Date and time the record was created |
| `updated_at` | DATETIME | | Date and time the record was last updated |

### Purpose

Stores the employee's competency profile and current competency level.

The current competency level is compared against the required competency level during gap analysis.

---

## 4.9 `tbl_assessments`

Stores competency assessment sessions conducted for employees.

### Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| `assessment_id` | INT | PK | Unique identifier for the assessment |
| `employee_id` | INT | FK | References `tbl_employees.employee_id` |
| `assessment_date` | DATE | | Date the assessment was conducted |
| `assessment_type` | VARCHAR(50) | | Type/category of assessment |
| `assessor` | VARCHAR(100) | | Name or identifier of the person who conducted the assessment |
| `status` | VARCHAR(20) | | Current status of the assessment |
| `remarks` | TEXT | | Additional assessment notes |
| `created_at` | DATETIME | | Date and time the assessment record was created |
| `updated_at` | DATETIME | | Date and time the assessment record was last updated |

### Purpose

Represents an assessment session for an employee. One assessment can contain results for multiple competencies.

---

## 4.10 `tbl_assessment_results`

Stores the competency-level results produced during an assessment.

### Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| `assessment_result_id` | INT | PK | Unique identifier for the assessment result |
| `assessment_id` | INT | FK | References `tbl_assessments.assessment_id` |
| `competency_id` | INT | FK | References `tbl_competencies.competency_id` |
| `assessed_level` | INT | | Proficiency level determined for the competency during the assessment |
| `remarks` | TEXT | | Additional comments or observations about the competency result |
| `created_at` | DATETIME | | Date and time the assessment result was created |
| `updated_at` | DATETIME | | Date and time the assessment result was last updated |

### Purpose

Stores the individual competency results within an assessment.

This table allows one assessment to contain multiple competency results.

---

## 4.11 `tbl_gap_analysis_results`

Stores the calculated competency gap results generated by the system.

### Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| `gap_analysis_result_id` | INT | PK | Unique identifier for the gap analysis result |
| `assessment_id` | INT | FK | References `tbl_assessments.assessment_id` |
| `employee_id` | INT | FK | References `tbl_employees.employee_id` |
| `position_id` | INT | FK | References `tbl_positions.position_id` |
| `competency_id` | INT | FK | References `tbl_competencies.competency_id` |
| `required_level` | INT | | Required competency level for the employee's position at the time of analysis |
| `current_level` | INT | | Employee's current competency level used in the analysis |
| `assessed_level` | INT | | Employee's assessed competency level used in the analysis |
| `gap_value` | INT | | Calculated difference between the required level and the level used for gap analysis |
| `gap_status` | VARCHAR(20) | | Result classification, such as Meets, Below Requirement, or Exceeds |
| `analysis_date` | DATE | | Date the gap analysis was generated |
| `remarks` | TEXT | | Additional notes associated with the gap result |
| `created_at` | DATETIME | | Date and time the gap analysis result was created |
| `updated_at` | DATETIME | | Date and time the gap analysis result was last updated |

### Purpose

Stores the actual output of the competency gap-analysis process.

This table is important for Phase 1 because gap-analysis results need to remain available for:

- Employee competency reports
- Position-level competency reports
- Office-level reports
- Executive dashboards
- Historical comparison
- Decision support
- Future reference without recalculating an old result

The system should retain the competency requirement and employee level values used at the time of analysis so that previously generated results remain traceable even if competency requirements or employee profiles are updated later.

---

## 4.12 `tbl_historical_records`

Stores historical records of significant system activities and previously generated results.

### Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| `record_id` | INT | PK | Unique identifier for the historical record |
| `employee_id` | INT | FK | References `tbl_employees.employee_id`, where applicable |
| `record_type` | VARCHAR(50) | | Type of historical record |
| `reference_id` | INT | | Identifier of the related record, where applicable |
| `description` | TEXT | | Description of the historical activity or result |
| `effective_date` | DATE | | Date the historical record became effective |
| `created_at` | DATETIME | | Date and time the historical record was created |
| `updated_at` | DATETIME | | Date and time the historical record was last updated |

### Purpose

Provides historical traceability for significant employee-related system records and activities.

For competency gap analysis, the detailed calculated result is stored in `tbl_gap_analysis_results`. `tbl_historical_records` can additionally provide a general historical reference/audit entry for significant events or previously generated reports/results.

---

# 5. Entity Relationships

The main database relationships are as follows.

## 5.1 User Management

### `tbl_roles` → `tbl_users`

- One role can be assigned to zero or many users.
- Each user is assigned to one role.

**Relationship:**

`tbl_roles.role_id` → `tbl_users.role_id`

---

## 5.2 Office and Employee Management

### `tbl_offices` → `tbl_employees`

- One office can have zero or many employees.
- Each employee belongs to one office.

**Relationship:**

`tbl_offices.office_id` → `tbl_employees.office_id`

### `tbl_positions` → `tbl_employees`

- One position can be assigned to zero or many employees.
- Each employee is assigned to one position.

**Relationship:**

`tbl_positions.position_id` → `tbl_employees.position_id`

### `tbl_employees` → `tbl_users`

- An employee may have zero or one system user account.
- A user account may be associated with one employee.

**Relationship:**

`tbl_employees.employee_id` → `tbl_users.employee_id`

---

## 5.3 Position and Competency Management

### `tbl_positions` → `tbl_position_competencies`

- One position can have zero or many competency requirements.
- Each position-competency record belongs to one position.

**Relationship:**

`tbl_positions.position_id` → `tbl_position_competencies.position_id`

### `tbl_competencies` → `tbl_position_competencies`

- One competency can be required by zero or many positions.
- Each position-competency record references one competency.

**Relationship:**

`tbl_competencies.competency_id` → `tbl_position_competencies.competency_id`

This creates a many-to-many relationship between positions and competencies through `tbl_position_competencies`.

---

## 5.4 Employee Competency Profiling

### `tbl_employees` → `tbl_employee_competencies`

- One employee can have zero or many competency records.
- Each employee competency record belongs to one employee.

**Relationship:**

`tbl_employees.employee_id` → `tbl_employee_competencies.employee_id`

### `tbl_competencies` → `tbl_employee_competencies`

- One competency can be associated with zero or many employees.
- Each employee competency record references one competency.

**Relationship:**

`tbl_competencies.competency_id` → `tbl_employee_competencies.competency_id`

This creates a many-to-many relationship between employees and competencies through `tbl_employee_competencies`.

---

## 5.5 Assessment Management

### `tbl_employees` → `tbl_assessments`

- One employee can have zero or many assessments.
- Each assessment belongs to one employee.

**Relationship:**

`tbl_employees.employee_id` → `tbl_assessments.employee_id`

### `tbl_assessments` → `tbl_assessment_results`

- One assessment can have zero or many assessment results.
- Each assessment result belongs to one assessment.

**Relationship:**

`tbl_assessments.assessment_id` → `tbl_assessment_results.assessment_id`

### `tbl_competencies` → `tbl_assessment_results`

- One competency can appear in zero or many assessment results.
- Each assessment result references one competency.

**Relationship:**

`tbl_competencies.competency_id` → `tbl_assessment_results.competency_id`

---

## 5.6 Gap Analysis

### `tbl_assessments` → `tbl_gap_analysis_results`

- One assessment can produce zero or many gap-analysis results.
- Each gap-analysis result may be associated with one assessment.

**Relationship:**

`tbl_assessments.assessment_id` → `tbl_gap_analysis_results.assessment_id`

### `tbl_employees` → `tbl_gap_analysis_results`

- One employee can have zero or many historical gap-analysis results.
- Each gap-analysis result belongs to one employee.

**Relationship:**

`tbl_employees.employee_id` → `tbl_gap_analysis_results.employee_id`

### `tbl_positions` → `tbl_gap_analysis_results`

- One position can be associated with zero or many gap-analysis results.
- Each gap-analysis result references the position used during the analysis.

**Relationship:**

`tbl_positions.position_id` → `tbl_gap_analysis_results.position_id`

### `tbl_competencies` → `tbl_gap_analysis_results`

- One competency can have zero or many gap-analysis results.
- Each gap-analysis result references one competency.

**Relationship:**

`tbl_competencies.competency_id` → `tbl_gap_analysis_results.competency_id`

---

## 5.7 Historical Records

### `tbl_employees` → `tbl_historical_records`

- One employee can have zero or many historical records.
- Each historical record may be associated with an employee.

**Relationship:**

`tbl_employees.employee_id` → `tbl_historical_records.employee_id`

---

# 6. Competency Gap Analysis Logic

The Phase 1 system compares the competency requirement of an employee's position with the employee's competency level.

The basic calculation is:

```text
Gap = Required Level - Comparison Level
```

The comparison level may be based on the current employee competency level and/or the assessed competency level according to the assessment workflow.

A positive gap indicates that the employee's level is below the required level.

A zero gap indicates that the required level is met.

A negative gap indicates that the employee's level exceeds the required level.

The exact business rule for selecting `current_level` versus `assessed_level` as the comparison value should follow the client's confirmed assessment/gap-analysis workflow.

---

# 7. Historical Gap Analysis Storage

Gap-analysis results are treated as generated system results and should not rely only on recalculating data from the current employee profile.

For each generated gap-analysis result, the system stores:

- Employee
- Position
- Competency
- Required level
- Current level
- Assessed level
- Calculated gap
- Gap status
- Analysis date
- Related assessment

This preserves the values used when the analysis was generated.

For example, if a position originally required competency level `3` and later the requirement is changed to level `4`, an older gap-analysis result should still retain the original `required_level = 3` used when that historical analysis was generated.

---

# 8. Phase 1 Scope Exclusions

The following modules are excluded from the Phase 1 database:

- Training & Development
- Individual Development Plan (IDP)
- Talent & Succession Planning

These are considered potential future enhancements and should not be implemented as Phase 1 database entities unless the client provides further confirmation.

---

# 9. Data Integrity and Design Considerations

The database should maintain referential integrity between related entities.

Recommended considerations include:

- Primary keys must uniquely identify each record.
- Foreign keys must reference valid parent records.
- Employee numbers should be unique.
- Position codes should be unique.
- Competency codes should be unique.
- Usernames should be unique.
- Position-competency combinations should not be duplicated.
- Employee-competency combinations should not be duplicated where only one current profile record is intended.
- Required and competency levels should follow the proficiency scale defined by the client.
- Historical gap-analysis results should retain the values used during the original analysis.
- Status fields should use a consistent set of application-level values.

---

# 10. Summary of Phase 1 Tables

| No. | Table | Main Purpose |
|---:|---|---|
| 1 | `tbl_roles` | System roles and access categories |
| 2 | `tbl_users` | User accounts and authentication-related data |
| 3 | `tbl_offices` | Organisational offices |
| 4 | `tbl_employees` | Employee profiles |
| 5 | `tbl_positions` | Organisational positions |
| 6 | `tbl_competencies` | Competency catalogue |
| 7 | `tbl_position_competencies` | Position competency requirements |
| 8 | `tbl_employee_competencies` | Employee competency profiles |
| 9 | `tbl_assessments` | Assessment sessions |
| 10 | `tbl_assessment_results` | Competency-level assessment results |
| 11 | `tbl_gap_analysis_results` | Generated competency gap-analysis results |
| 12 | `tbl_historical_records` | Historical/audit records and references |

---

# 11. Phase 1 Database Flow

```text
OFFICE
   │
   └── EMPLOYEE
          │
          ├── USER
          │     └── ROLE
          │
          ├── POSITION
          │     └── POSITION_COMPETENCIES
          │              └── COMPETENCY
          │
          ├── EMPLOYEE_COMPETENCIES
          │              └── COMPETENCY
          │
          └── ASSESSMENTS
                 │
                 └── ASSESSMENT_RESULTS
                           │
                           └── COMPETENCY

POSITION + COMPETENCY + EMPLOYEE/ASSESSMENT DATA
                         │
                         ▼
                GAP ANALYSIS RESULTS
                         │
                         ▼
              HISTORICAL / REPORTING
```

---

# 12. Notes

1. Table and field names are indicative and may be adjusted during implementation if required.
2. Data types are based on common MySQL/Laravel-compatible types.
3. The database is aligned with the client-confirmed Phase 1 system architecture.
4. The competency proficiency levels should be populated according to the competency-level standards supplied by the client.
5. The database design supports employee competency profiling, competency assessment, gap analysis, reporting, and historical result storage.
6. Training & Development, IDP, and Talent & Succession Planning are excluded from Phase 1.
7. Additional fields may be introduced during implementation if required by confirmed business rules, security requirements, or API integration.
8. The ERD and data dictionary should remain synchronised with the implemented MySQL schema and Laravel models/migrations.
9. This document represents the current Phase 1 database design and may be refined following further client validation or implementation findings.
