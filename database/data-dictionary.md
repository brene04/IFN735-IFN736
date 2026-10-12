# Competency-Based Human Resource Management System (CB-HRMS)

**Project:** Competency-Based Human Resource Management System (CB-HRMS)  
**Phase:** Phase 1 — Fully Functional Prototype  
**Database:** MySQL  
**Status:** Final — Synchronized with the supplied `cb_hrms_database.sql`  
**Owner:** Data & System Architecture Lead

---

# 1. Purpose

This data dictionary defines the Phase 1 database structure represented by the supplied MySQL database script. It documents the database entities, fields, data types, keys, relationships, and purpose of each field.

The Phase 1 database supports:

- User and role management
- Office management
- Employee management
- Position management
- Competency management
- Competency category management
- Proficiency level management
- Behavioural indicator management
- Position-to-competency mapping
- Employee competency profiling
- Competency gap analysis
- Reporting
- Historical records

Training & Development, Individual Development Plan (IDP), and Talent & Succession Planning are excluded from Phase 1.

> **Source-of-truth note:** This version is synchronized to the supplied SQL script. It documents the schema that the SQL actually creates and modifies, including `category_id`, `salary_grade`, and the competency-support tables.

---

# 2. Key Definitions

| Term | Meaning |
|---|---|
| **PK** | Primary Key — uniquely identifies a record |
| **FK** | Foreign Key — references a record in another table |
| **INT** | Integer / whole number |
| **VARCHAR** | Variable-length character string |
| **TEXT** | Long text field |
| **DATE** | Calendar date |
| **DATETIME** | Date and time |
| **Required Level** | Proficiency level required for a position |
| **Current Level** | Proficiency level currently recorded for an employee |
| **Gap Level** | Calculated difference between required level and current level |

---

# 3. Phase 1 Database Entities

The supplied SQL script contains the following **14 tables**:

1. `tbl_roles`
2. `tbl_users`
3. `tbl_offices`
4. `tbl_employees`
5. `tbl_positions`
6. `tbl_competencies`
7. `tbl_position_competencies`
8. `tbl_employee_competencies`
9. `tbl_gap_analyses`
10. `tbl_gap_analysis_results`
11. `tbl_historical_records`
12. `tbl_competency_categories`
13. `tbl_proficiency_levels`
14. `tbl_behavioral_indicators`

---

# 4. Database Entity Definitions

## 4.1 `tbl_roles`

Stores system roles used for access control.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `role_id` | INT | PK | NO | AUTO_INCREMENT | Unique role identifier |
| `role_name` | VARCHAR(50) | | NO | — | Name of the system role |
| `description` | TEXT | | YES | NULL | Role description |
| `status` | VARCHAR(20) | | YES | Active | Current role status |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Date/time role was created |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Date/time role was last updated |

**Purpose:** Supports role-based access control.

---

## 4.2 `tbl_users`

Stores system user accounts and their assigned roles.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `user_id` | INT | PK | NO | AUTO_INCREMENT | Unique system user identifier |
| `role_id` | INT | FK | NO | — | References `tbl_roles.role_id` |
| `employee_id` | INT | FK | YES | NULL | References `tbl_employees.employee_id` |
| `username` | VARCHAR(50) | | NO | — | Username used to access the system |
| `email` | VARCHAR(100) | | YES | NULL | User email address |
| `password_hash` | VARCHAR(255) | | NO | — | Securely stored password hash |
| `status` | VARCHAR(20) | | YES | Active | Current account status |
| `last_login` | DATETIME | | YES | NULL | Last login date/time |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Account creation date/time |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Last update date/time |

**Purpose:** Supports authentication, user management, and role-based access.

---

## 4.3 `tbl_offices`

Stores organisational offices represented in the system.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `office_id` | INT | PK | NO | AUTO_INCREMENT | Unique office identifier |
| `office_name` | VARCHAR(100) | | NO | — | Name of the office |
| `office_code` | VARCHAR(50) | | YES | NULL | Office code |
| `description` | TEXT | | YES | NULL | Office description |
| `status` | VARCHAR(20) | | YES | Active | Current office status |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Office creation date/time |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Last update date/time |

**Purpose:** Supports organisational structure and office-level employee information.

---

## 4.4 `tbl_employees`

Stores employee profile and organisational information.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `employee_id` | INT | PK | NO | AUTO_INCREMENT | Unique employee identifier |
| `position_id` | INT | FK | NO | — | References `tbl_positions.position_id` |
| `office_id` | INT | FK | NO | — | References `tbl_offices.office_id` |
| `employee_no` | VARCHAR(50) | | NO | — | Employee identification number |
| `first_name` | VARCHAR(50) | | NO | — | Employee first name |
| `middle_name` | VARCHAR(50) | | YES | NULL | Employee middle name |
| `last_name` | VARCHAR(50) | | NO | — | Employee last name |
| `email` | VARCHAR(100) | | YES | NULL | Employee email address |
| `phone` | VARCHAR(20) | | YES | NULL | Employee contact number |
| `date_hired` | DATE | | YES | NULL | Hiring/appointment date |
| `status` | VARCHAR(20) | | YES | Active | Current employment status |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Record creation date/time |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Last update date/time |

**Purpose:** Provides employee information used for competency profiling, gap analysis, and reporting.

---

## 4.5 `tbl_positions`

Stores organisational positions.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `position_id` | INT | PK | NO | AUTO_INCREMENT | Unique position identifier |
| `position_code` | VARCHAR(50) | | YES | NULL | Position code |
| `position_title` | VARCHAR(100) | | NO | — | Position title/name |
| `salary_grade` | INT | | YES | NULL | Salary grade associated with the position |
| `description` | TEXT | | YES | NULL | Position description |
| `department` | VARCHAR(100) | | YES | NULL | Department associated with the position |
| `employment_type` | VARCHAR(50) | | YES | NULL | Employment type |
| `status` | VARCHAR(20) | | YES | Active | Current position status |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Position creation date/time |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Last update date/time |

**Purpose:** Defines employee positions and provides the basis for determining competency requirements.

---

## 4.6 `tbl_competency_categories`

Stores competency categories.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `category_id` | INT | PK | NO | AUTO_INCREMENT | Unique category identifier |
| `category_code` | VARCHAR(50) | | YES | NULL | Category code |
| `category_name` | VARCHAR(100) | | NO | — | Category name |
| `description` | TEXT | | YES | NULL | Category description |
| `status` | VARCHAR(20) | | YES | Active | Current category status |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Category creation date/time |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Last update date/time |

**Purpose:** Classifies competencies into categories such as Core, Functional, and Leadership.

---

## 4.7 `tbl_competencies`

Stores the competency catalogue.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `competency_id` | INT | PK | NO | AUTO_INCREMENT | Unique competency identifier |
| `category_id` | INT | FK | YES | NULL | References `tbl_competency_categories.category_id` |
| `competency_code` | VARCHAR(50) | | YES | NULL | Competency code |
| `competency_name` | VARCHAR(255) | | NO | — | Competency name |
| `description` | TEXT | | YES | NULL | Competency description |
| `competency_type` | VARCHAR(50) | | YES | NULL | Competency classification/type |
| `status` | VARCHAR(20) | | YES | Active | Current competency status |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Competency creation date/time |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Last update date/time |

**Purpose:** Stores competency definitions and their category classifications.

---

## 4.8 `tbl_proficiency_levels`

Stores the competency proficiency scale.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `proficiency_level_id` | INT | PK | NO | AUTO_INCREMENT | Unique proficiency-level identifier |
| `level_number` | INT | | NO | — | Numeric proficiency level |
| `level_name` | VARCHAR(50) | | NO | — | Proficiency level name |
| `description` | TEXT | | YES | NULL | Meaning/description of the level |
| `status` | VARCHAR(20) | | YES | Active | Current level status |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Level creation date/time |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Last update date/time |

**Purpose:** Defines the proficiency scale used when recording competency levels.

---

## 4.9 `tbl_behavioral_indicators`

Stores behavioural indicators associated with competencies and proficiency levels.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `behavioral_indicator_id` | INT | PK | NO | AUTO_INCREMENT | Unique indicator identifier |
| `competency_id` | INT | FK | NO | — | References `tbl_competencies.competency_id` |
| `proficiency_level_id` | INT | FK | NO | — | References `tbl_proficiency_levels.proficiency_level_id` |
| `indicator_text` | TEXT | | NO | — | Behavioural indicator description |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Indicator creation date/time |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Last update date/time |

**Purpose:** Provides observable behavioural indicators for competencies at specific proficiency levels.

---

## 4.10 `tbl_position_competencies`

Maps positions to required competencies and proficiency levels.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `position_competency_id` | INT | PK | NO | AUTO_INCREMENT | Unique mapping identifier |
| `position_id` | INT | FK | NO | — | References `tbl_positions.position_id` |
| `competency_id` | INT | FK | NO | — | References `tbl_competencies.competency_id` |
| `required_level` | INT | | NO | — | Required proficiency level |
| `priority` | INT | | YES | NULL | Priority of the competency requirement |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Mapping creation date/time |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Last update date/time |

**Purpose:** Defines which competencies are required for each position and at what level.

---

## 4.11 `tbl_employee_competencies`

Stores the current competency profile of each employee.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `employee_competency_id` | INT | PK | NO | AUTO_INCREMENT | Unique employee competency record |
| `employee_id` | INT | FK | NO | — | References `tbl_employees.employee_id` |
| `competency_id` | INT | FK | NO | — | References `tbl_competencies.competency_id` |
| `current_level` | INT | | NO | — | Current recorded proficiency level |
| `evidence` | TEXT | | YES | NULL | Supporting evidence or notes |
| `last_updated` | DATE | | YES | NULL | Date competency record was last updated |
| `status` | VARCHAR(20) | | YES | Active | Current record status |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Record creation date/time |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Last update date/time |

**Purpose:** Stores current employee competency levels used as inputs to gap analysis.

---

## 4.12 `tbl_gap_analyses`

Stores each generated competency gap-analysis instance.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `gap_analysis_id` | INT | PK | NO | AUTO_INCREMENT | Unique gap-analysis identifier |
| `employee_id` | INT | FK | NO | — | References `tbl_employees.employee_id` |
| `position_id` | INT | FK | NO | — | References `tbl_positions.position_id` |
| `analysis_date` | DATE | | NO | — | Date the analysis was generated |
| `status` | VARCHAR(20) | | YES | Completed | Current analysis status |
| `remarks` | TEXT | | YES | NULL | Additional analysis notes |
| `created_by` | INT | FK | YES | NULL | References `tbl_users.user_id` |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Analysis creation date/time |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Last update date/time |

**Purpose:** Represents one complete gap-analysis run for an employee and position.

---

## 4.13 `tbl_gap_analysis_results`

Stores individual competency-level results produced by a gap analysis.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `gap_analysis_result_id` | INT | PK | NO | AUTO_INCREMENT | Unique gap-analysis result identifier |
| `gap_analysis_id` | INT | FK | NO | — | References `tbl_gap_analyses.gap_analysis_id` |
| `competency_id` | INT | FK | NO | — | References `tbl_competencies.competency_id` |
| `required_level` | INT | | NO | — | Required level used in the analysis |
| `current_level` | INT | | NO | — | Current level used in the analysis |
| `gap_level` | INT | | NO | — | Calculated gap between required and current level |
| `status` | VARCHAR(20) | | YES | NULL | Result classification/status |
| `remarks` | TEXT | | YES | NULL | Additional result notes |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Result creation date/time |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Last update date/time |

**Purpose:** Preserves detailed competency-level results for reporting and historical tracking.

### Gap Calculation

```text
Gap Level = Required Level - Current Level
```

Example:

```text
Required Level = 4
Current Level  = 2
Gap Level      = 2
```

---

## 4.14 `tbl_historical_records`

Stores historical employee-related records.

| Field | Data Type | Key | Null | Default | Description |
|---|---|---|---|---|---|
| `record_id` | INT | PK | NO | AUTO_INCREMENT | Unique historical record identifier |
| `employee_id` | INT | FK | NO | — | References `tbl_employees.employee_id` |
| `record_type` | VARCHAR(50) | | NO | — | Type/category of historical record |
| `description` | TEXT | | YES | NULL | Historical record description |
| `effective_date` | DATE | | YES | NULL | Date the record became effective |
| `created_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Record creation date/time |
| `updated_at` | DATETIME | | YES | CURRENT_TIMESTAMP | Last update date/time |

**Purpose:** Provides storage for significant employee-related historical records and activities represented by the system.

---

# 5. Entity Relationships

## 5.1 Roles → Users

```text
tbl_users.role_id → tbl_roles.role_id
```

- One role can be associated with zero or many users.
- Each user references one role.

**Cardinality:** `1 : 0..*`

---

## 5.2 Employees → Users

```text
tbl_users.employee_id → tbl_employees.employee_id
```

- An employee can be associated with zero or many user accounts under the database relationship.
- A user may optionally reference an employee because `employee_id` is nullable.

**Cardinality:** `1 : 0..*` at the employee-to-user relationship level.

---

## 5.3 Offices → Employees

```text
tbl_employees.office_id → tbl_offices.office_id
```

**Cardinality:** `1 : 0..*`

---

## 5.4 Positions → Employees

```text
tbl_employees.position_id → tbl_positions.position_id
```

**Cardinality:** `1 : 0..*`

---

## 5.5 Positions → Position Competencies

```text
tbl_position_competencies.position_id → tbl_positions.position_id
```

**Cardinality:** `1 : 0..*`

---

## 5.6 Competencies → Position Competencies

```text
tbl_position_competencies.competency_id → tbl_competencies.competency_id
```

**Cardinality:** `1 : 0..*`

This creates a many-to-many relationship between positions and competencies through `tbl_position_competencies`.

---

## 5.7 Competency Categories → Competencies

```text
tbl_competencies.category_id → tbl_competency_categories.category_id
```

**Cardinality:** `1 : 0..*`

A competency may optionally belong to one competency category because `category_id` is nullable in the supplied SQL.

---

## 5.8 Employees → Employee Competencies

```text
tbl_employee_competencies.employee_id → tbl_employees.employee_id
```

**Cardinality:** `1 : 0..*`

---

## 5.9 Competencies → Employee Competencies

```text
tbl_employee_competencies.competency_id → tbl_competencies.competency_id
```

**Cardinality:** `1 : 0..*`

This creates a many-to-many relationship between employees and competencies through `tbl_employee_competencies`.

---

## 5.10 Competencies → Behavioural Indicators

```text
tbl_behavioral_indicators.competency_id → tbl_competencies.competency_id
```

**Cardinality:** `1 : 0..*`

---

## 5.11 Proficiency Levels → Behavioural Indicators

```text
tbl_behavioral_indicators.proficiency_level_id
    → tbl_proficiency_levels.proficiency_level_id
```

**Cardinality:** `1 : 0..*`

This allows behavioural indicators to be associated with a specific proficiency level.

---

## 5.12 Employees → Gap Analyses

```text
tbl_gap_analyses.employee_id → tbl_employees.employee_id
```

**Cardinality:** `1 : 0..*`

---

## 5.13 Positions → Gap Analyses

```text
tbl_gap_analyses.position_id → tbl_positions.position_id
```

**Cardinality:** `1 : 0..*`

---

## 5.14 Users → Gap Analyses

```text
tbl_gap_analyses.created_by → tbl_users.user_id
```

**Cardinality:** `1 : 0..*`

`created_by` is nullable, so an analysis record may exist without a recorded creating user.

---

## 5.15 Gap Analyses → Gap Analysis Results

```text
tbl_gap_analysis_results.gap_analysis_id
    → tbl_gap_analyses.gap_analysis_id
```

**Cardinality:** `1 : 0..*`

One gap analysis can contain multiple competency-level results.

---

## 5.16 Competencies → Gap Analysis Results

```text
tbl_gap_analysis_results.competency_id
    → tbl_competencies.competency_id
```

**Cardinality:** `1 : 0..*`

---

## 5.17 Employees → Historical Records

```text
tbl_historical_records.employee_id → tbl_employees.employee_id
```

**Cardinality:** `1 : 0..*`

---

# 6. Gap Analysis Workflow

The Phase 1 database supports the following workflow:

```text
Employee
   │
   ├── Position
   │      │
   │      └── Position Competencies
   │                 │
   │                 └── Required Level
   │
   └── Employee Competencies
                  │
                  └── Current Level
                           │
                           ▼
                     Gap Analysis
                           │
                           ▼
                  Gap Analysis Results
                           │
                           ▼
                       Reporting
```

The system compares the required competency level for an employee's position with the employee's current competency level.

```text
Gap Level = Required Level - Current Level
```

The generated result is stored in `tbl_gap_analysis_results`.

---

# 7. Competency Reference Structure

The competency reference data is structured as:

```text
tbl_competency_categories
          │
          ▼
   tbl_competencies
       /       \
      /         \
     ▼           ▼
tbl_position_   tbl_employee_
competencies   competencies


tbl_competencies
       │
       ▼
tbl_behavioral_indicators
       ▲
       │
tbl_proficiency_levels
```

The supplied SQL populates competency categories and proficiency levels and associates competencies with categories.

---

# 8. Historical Gap Analysis Storage

The gap-analysis design separates the analysis instance from its individual competency results.

### Analysis-level record

`tbl_gap_analyses` stores:

- Employee
- Position
- Analysis date
- Analysis status
- Remarks
- User who generated the analysis

### Competency-level result

`tbl_gap_analysis_results` stores:

- Competency
- Required level
- Current level
- Calculated gap level
- Result status
- Remarks

The required and current levels are stored in the result table so previously generated results remain traceable even if current employee competency profiles or position requirements later change.

---

# 9. Phase 1 Scope Exclusions

The following modules are excluded from the Phase 1 database:

- Training & Development
- Individual Development Plan (IDP)
- Talent & Succession Planning
- Separate assessment-session and assessment-result modules

---

# 10. Data Integrity Considerations

The database implementation should maintain referential integrity between related entities.

Recommended considerations:

- Primary keys uniquely identify records.
- Foreign keys reference valid parent records.
- Employee numbers should be unique where required by the application.
- Position codes should be unique where required by the application.
- Competency codes should be unique where required by the application.
- Usernames should be unique.
- Position-competency combinations should not be duplicated.
- Employee-competency combinations should not be duplicated where only one current profile record is intended.
- Required and current competency levels should follow the client's proficiency scale.
- Gap-analysis results retain the values used when the analysis was generated.
- Status values should remain consistent across the application.

> **Implementation note:** The supplied SQL does not define database-level `UNIQUE` constraints for the business identifiers above. These are application/data-integrity recommendations, not currently enforced schema constraints.

---

# 11. Summary of Phase 1 Tables

| No. | Table | Main Purpose |
|---:|---|---|
| 1 | `tbl_roles` | System roles and access categories |
| 2 | `tbl_users` | User accounts |
| 3 | `tbl_offices` | Organisational offices |
| 4 | `tbl_employees` | Employee profiles |
| 5 | `tbl_positions` | Organisational positions |
| 6 | `tbl_competency_categories` | Competency categories |
| 7 | `tbl_competencies` | Competency catalogue |
| 8 | `tbl_proficiency_levels` | Competency proficiency scale |
| 9 | `tbl_behavioral_indicators` | Behavioural indicators |
| 10 | `tbl_position_competencies` | Position competency requirements |
| 11 | `tbl_employee_competencies` | Employee competency profiles |
| 12 | `tbl_gap_analyses` | Gap-analysis instances |
| 13 | `tbl_gap_analysis_results` | Individual competency gap results |
| 14 | `tbl_historical_records` | Historical employee-related records |

---

# 12. Final Phase 1 Structure

```text
USER MANAGEMENT
├── tbl_roles
└── tbl_users

EMPLOYEE & ORGANISATION MANAGEMENT
├── tbl_employees
├── tbl_positions
└── tbl_offices

COMPETENCY MANAGEMENT
├── tbl_competency_categories
├── tbl_competencies
├── tbl_proficiency_levels
├── tbl_behavioral_indicators
├── tbl_position_competencies
└── tbl_employee_competencies

GAP ANALYSIS
├── tbl_gap_analyses
└── tbl_gap_analysis_results

HISTORICAL RECORDS
└── tbl_historical_records
```

---

# 13. ERD — Dictionary — SQL Synchronisation Notes

This document is synchronized to the supplied SQL script.

The final SQL structure includes the following important schema details:

1. `tbl_competency_categories` is present.
2. `tbl_proficiency_levels` is present.
3. `tbl_behavioral_indicators` is present.
4. `tbl_competencies.category_id` is added through an `ALTER TABLE` statement and references `tbl_competency_categories.category_id`.
5. `tbl_competencies.competency_name` is expanded to `VARCHAR(255)`.
6. `tbl_positions.salary_grade` is added through an `ALTER TABLE` statement.
7. `tbl_gap_analyses` is present and stores the analysis header.
8. `tbl_gap_analysis_results` stores competency-level results.
9. `tbl_gap_analyses.created_by` references `tbl_users.user_id`.
10. `tbl_behavioral_indicators` references both competencies and proficiency levels.
11. Separate assessment-session and assessment-result tables are not part of the supplied Phase 1 SQL schema.
12. The database therefore contains **14 tables**.

---

# 14. Reference for Laravel Implementation

This dictionary should be used together with the final ERD and the supplied MySQL script as the database reference for:

- Laravel migrations
- Eloquent models
- Model relationships
- API validation
- Backend services
- Reporting queries
- Gap-analysis implementation
- Frontend/backend integration

The Laravel implementation should follow the actual final MySQL schema rather than an earlier draft of the database design.
