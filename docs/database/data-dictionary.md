# Competency-Based Human Resource Management System (CB-HRMS)

**Project:** Competency-Based Human Resource Management System
(CB-HRMS)\
**Phase:** Phase 1 -- Fully Functional Prototype\
**Database:** MySQL\
**Status:** Revised -- Synchronized with the revised Phase 1 ERD\
**Owner:** Data & System Architecture Lead

------------------------------------------------------------------------

# 1. Purpose

This data dictionary defines the Phase 1 database structure for the
CB-HRMS prototype. It documents the database entities, fields, data
types, keys, relationships, and purpose of each field.

The Phase 1 database supports the client-confirmed scope represented in
the revised ERD:

-   User and role management
-   Office management
-   Employee management
-   Position management
-   Competency management
-   Position-to-competency mapping
-   Employee competency profiling
-   Competency gap analysis
-   Reporting
-   Historical records

Training & Development, Individual Development Plan (IDP), and Talent &
Succession Planning are excluded from Phase 1.

------------------------------------------------------------------------

# 2. Key Definitions

  -----------------------------------------------------------------------
  Term                                Meaning
  ----------------------------------- -----------------------------------
  **PK**                              Primary Key -- uniquely identifies
                                      a record

  **FK**                              Foreign Key -- references a record
                                      in another table

  **INT**                             Integer / whole number

  **VARCHAR**                         Variable-length character string

  **TEXT**                            Long text field

  **DATE**                            Calendar date

  **DATETIME**                        Date and time

  **1**                               One record

  **0..**\*                           Zero or many records

  **Required Level**                  Competency proficiency level
                                      required for a position

  **Current Level**                   Competency proficiency level
                                      currently recorded for an employee

  **Gap Level**                       Calculated difference between the
                                      required competency level and the
                                      employee's current competency level
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 3. Phase 1 Database Entities

The revised Phase 1 database contains the following 11 entities:

1.  `tbl_roles`
2.  `tbl_users`
3.  `tbl_offices`
4.  `tbl_employees`
5.  `tbl_positions`
6.  `tbl_competencies`
7.  `tbl_position_competencies`
8.  `tbl_employee_competencies`
9.  `tbl_gap_analyses`
10. `tbl_gap_analysis_results`
11. `tbl_historical_records`

> **Scope note:** Separate assessment-session and assessment-result
> tables are not included because they are not present in the revised
> Phase 1 ERD.

------------------------------------------------------------------------

# 4. Database Entity Definitions

## 4.1 `tbl_roles`

Stores the system roles used for access control.

### Fields

  Field           Data Type     Key   Description
  --------------- ------------- ----- -----------------------------------------
  `role_id`       INT(10)       PK    Unique identifier for the role
  `role_name`     VARCHAR(50)         Name of the system role
  `description`   TEXT                Description of the role
  `status`        VARCHAR(20)         Current status of the role
  `created_at`    DATETIME            Date and time the role was created
  `updated_at`    DATETIME            Date and time the role was last updated

### Purpose

Supports role-based access control for the system roles defined for
Phase 1.

------------------------------------------------------------------------

## 4.2 `tbl_users`

Stores system user accounts and their assigned roles.

### Fields

  -----------------------------------------------------------------------------------
  Field             Data Type         Key               Description
  ----------------- ----------------- ----------------- -----------------------------
  `user_id`         INT(10)           PK                Unique identifier for the
                                                        system user

  `role_id`         INT(10)           FK                References
                                                        `tbl_roles.role_id`

  `employee_id`     INT(10)           FK                References
                                                        `tbl_employees.employee_id`

  `username`        VARCHAR(50)                         Username used to access the
                                                        system

  `email`           VARCHAR(100)                        User email address

  `password_hash`   VARCHAR(255)                        Securely stored password hash

  `status`          VARCHAR(20)                         Current status of the user
                                                        account

  `last_login`      DATETIME                            Date and time of the user's
                                                        last login

  `created_at`      DATETIME                            Date and time the user
                                                        account was created

  `updated_at`      DATETIME                            Date and time the user
                                                        account was last updated
  -----------------------------------------------------------------------------------

### Purpose

Supports authentication, user management, and role-based access.

------------------------------------------------------------------------

## 4.3 `tbl_offices`

Stores organisational offices represented in the system.

### Fields

  -----------------------------------------------------------------------
  Field             Data Type         Key               Description
  ----------------- ----------------- ----------------- -----------------
  `office_id`       INT(10)           PK                Unique identifier
                                                        for the office

  `office_name`     VARCHAR(100)                        Name of the
                                                        office

  `office_code`     VARCHAR(50)                         Code identifying
                                                        the office

  `description`     TEXT                                Description of
                                                        the office

  `status`          VARCHAR(20)                         Current status of
                                                        the office

  `created_at`      DATETIME                            Date and time the
                                                        office was
                                                        created

  `updated_at`      DATETIME                            Date and time the
                                                        office was last
                                                        updated
  -----------------------------------------------------------------------

### Purpose

Supports organisational structure and office-level employee information.

------------------------------------------------------------------------

## 4.4 `tbl_employees`

Stores employee profile and organisational information.

### Fields

  -----------------------------------------------------------------------------------
  Field             Data Type         Key               Description
  ----------------- ----------------- ----------------- -----------------------------
  `employee_id`     INT(10)           PK                Unique identifier for the
                                                        employee

  `position_id`     INT(10)           FK                References
                                                        `tbl_positions.position_id`

  `office_id`       INT(10)           FK                References
                                                        `tbl_offices.office_id`

  `employee_no`     VARCHAR(50)                         Employee identification
                                                        number

  `first_name`      VARCHAR(50)                         Employee first name

  `middle_name`     VARCHAR(50)                         Employee middle name

  `last_name`       VARCHAR(50)                         Employee last name

  `email`           VARCHAR(100)                        Employee email address

  `phone`           VARCHAR(20)                         Employee contact number

  `date_hired`      DATE                                Employee hiring/appointment
                                                        date

  `status`          VARCHAR(20)                         Current employment status

  `created_at`      DATETIME                            Date and time the employee
                                                        record was created

  `updated_at`      DATETIME                            Date and time the employee
                                                        record was last updated
  -----------------------------------------------------------------------------------

### Purpose

Provides employee information used for competency profiling, gap
analysis, and reporting.

------------------------------------------------------------------------

## 4.5 `tbl_positions`

Stores organisational positions.

### Fields

  -------------------------------------------------------------------------
  Field               Data Type         Key               Description
  ------------------- ----------------- ----------------- -----------------
  `position_id`       INT(10)           PK                Unique identifier
                                                          for the position

  `position_code`     VARCHAR(50)                         Code identifying
                                                          the position

  `position_title`    VARCHAR(100)                        Title/name of the
                                                          position

  `description`       TEXT                                Description of
                                                          the position

  `department`        VARCHAR(100)                        Department
                                                          associated with
                                                          the position

  `employment_type`   VARCHAR(50)                         Employment type
                                                          associated with
                                                          the position

  `status`            VARCHAR(20)                         Current status of
                                                          the position

  `created_at`        DATETIME                            Date and time the
                                                          position was
                                                          created

  `updated_at`        DATETIME                            Date and time the
                                                          position was last
                                                          updated
  -------------------------------------------------------------------------

### Purpose

Defines employee positions and provides the basis for determining
competency requirements.

------------------------------------------------------------------------

## 4.6 `tbl_competencies`

Stores the competency catalogue used by the system.

### Fields

  -----------------------------------------------------------------------------
  Field               Data Type         Key               Description
  ------------------- ----------------- ----------------- ---------------------
  `competency_id`     INT(10)           PK                Unique identifier for
                                                          the competency

  `competency_code`   VARCHAR(50)                         Code identifying the
                                                          competency

  `competency_name`   VARCHAR(100)                        Name of the
                                                          competency

  `description`       TEXT                                Description of the
                                                          competency

  `competency_type`   VARCHAR(50)                         Classification/type
                                                          of competency

  `status`            VARCHAR(20)                         Current status of the
                                                          competency

  `created_at`        DATETIME                            Date and time the
                                                          competency was
                                                          created

  `updated_at`        DATETIME                            Date and time the
                                                          competency was last
                                                          updated
  -----------------------------------------------------------------------------

### Purpose

Stores competency definitions and classifications used in position
requirements and employee competency profiles.

------------------------------------------------------------------------

## 4.7 `tbl_position_competencies`

Maps positions to their required competencies and proficiency levels.

### Fields

  -------------------------------------------------------------------------------------------------
  Field                      Data Type         Key               Description
  -------------------------- ----------------- ----------------- ----------------------------------
  `position_competency_id`   INT(10)           PK                Unique identifier for the
                                                                 position-competency mapping

  `position_id`              INT(10)           FK                References
                                                                 `tbl_positions.position_id`

  `competency_id`            INT(10)           FK                References
                                                                 `tbl_competencies.competency_id`

  `required_level`           INT(3)                              Required proficiency level for the
                                                                 position

  `priority`                 INT(3)                              Priority of the competency
                                                                 requirement

  `created_at`               DATETIME                            Date and time the mapping was
                                                                 created

  `updated_at`               DATETIME                            Date and time the mapping was last
                                                                 updated
  -------------------------------------------------------------------------------------------------

### Purpose

Defines which competencies are required for each position and the
required proficiency level.

------------------------------------------------------------------------

## 4.8 `tbl_employee_competencies`

Stores the current competency profile of each employee.

### Fields

  -------------------------------------------------------------------------------------------------
  Field                      Data Type         Key               Description
  -------------------------- ----------------- ----------------- ----------------------------------
  `employee_competency_id`   INT(10)           PK                Unique identifier for the employee
                                                                 competency record

  `employee_id`              INT(10)           FK                References
                                                                 `tbl_employees.employee_id`

  `competency_id`            INT(10)           FK                References
                                                                 `tbl_competencies.competency_id`

  `current_level`            INT(3)                              Current recorded competency
                                                                 proficiency level

  `evidence`                 TEXT                                Supporting evidence or notes for
                                                                 the recorded level

  `last_updated`             DATE                                Date the competency record was
                                                                 last updated

  `status`                   VARCHAR(20)                         Current status of the employee
                                                                 competency record

  `created_at`               DATETIME                            Date and time the record was
                                                                 created

  `updated_at`               DATETIME                            Date and time the record was last
                                                                 updated
  -------------------------------------------------------------------------------------------------

### Purpose

Stores the employee's current competency profile. These current
competency levels are used as inputs to gap analysis.

------------------------------------------------------------------------

## 4.9 `tbl_gap_analyses`

Stores each generated competency gap-analysis instance.

### Fields

  -------------------------------------------------------------------------------------
  Field               Data Type         Key               Description
  ------------------- ----------------- ----------------- -----------------------------
  `gap_analysis_id`   INT(10)           PK                Unique identifier for the
                                                          gap-analysis instance

  `employee_id`       INT(10)           FK                References
                                                          `tbl_employees.employee_id`

  `position_id`       INT(10)           FK                References
                                                          `tbl_positions.position_id`

  `analysis_date`     DATE                                Date the gap analysis was
                                                          generated

  `status`            VARCHAR(20)                         Current status of the gap
                                                          analysis

  `remarks`           TEXT                                Additional notes about the
                                                          analysis

  `created_by`        INT(10)                             Identifier of the user who
                                                          created/generated the
                                                          analysis

  `created_at`        DATETIME                            Date and time the gap
                                                          analysis was created

  `updated_at`        DATETIME                            Date and time the gap
                                                          analysis was last updated
  -------------------------------------------------------------------------------------

### Purpose

Represents a complete gap-analysis run for an employee and position.

One gap analysis can contain multiple competency-level results in
`tbl_gap_analysis_results`.

------------------------------------------------------------------------

## 4.10 `tbl_gap_analysis_results`

Stores the individual competency results produced by a gap analysis.

### Fields

  ---------------------------------------------------------------------------------------------------
  Field                      Data Type         Key               Description
  -------------------------- ----------------- ----------------- ------------------------------------
  `gap_analysis_result_id`   INT(10)           PK                Unique identifier for the
                                                                 gap-analysis result

  `gap_analysis_id`          INT(10)           FK                References
                                                                 `tbl_gap_analyses.gap_analysis_id`

  `competency_id`            INT(10)           FK                References
                                                                 `tbl_competencies.competency_id`

  `required_level`           INT(3)                              Required competency level used in
                                                                 the analysis

  `current_level`            INT(3)                              Employee current competency level
                                                                 used in the analysis

  `gap_level`                INT(3)                              Calculated gap between required and
                                                                 current level

  `status`                   VARCHAR(20)                         Result status/classification

  `remarks`                  TEXT                                Additional notes about the
                                                                 competency gap result

  `created_at`               DATETIME                            Date and time the result was created

  `updated_at`               DATETIME                            Date and time the result was last
                                                                 updated
  ---------------------------------------------------------------------------------------------------

### Purpose

Stores the detailed competency-level results of each gap-analysis run.

The table preserves the required and current levels used at the time of
analysis, allowing previously generated results to remain available for
reporting and historical tracking.

### Gap Calculation

The basic calculation represented by the database is:

``` text
Gap Level = Required Level - Current Level
```

For example:

``` text
Required Level = 4
Current Level  = 2
Gap Level      = 2
```

The exact interpretation of the `status` value should follow the
application's confirmed business rules.

------------------------------------------------------------------------

## 4.11 `tbl_historical_records`

Stores historical employee-related records.

### Fields

  ------------------------------------------------------------------------------------
  Field              Data Type         Key               Description
  ------------------ ----------------- ----------------- -----------------------------
  `record_id`        INT(10)           PK                Unique identifier for the
                                                         historical record

  `employee_id`      INT(10)           FK                References
                                                         `tbl_employees.employee_id`

  `record_type`      VARCHAR(50)                         Type/category of historical
                                                         record

  `description`      TEXT                                Description of the historical
                                                         record

  `effective_date`   DATE                                Date the historical record
                                                         became effective

  `created_at`       DATETIME                            Date and time the historical
                                                         record was created

  `updated_at`       DATETIME                            Date and time the historical
                                                         record was last updated
  ------------------------------------------------------------------------------------

### Purpose

Provides historical storage for significant employee-related records and
activities represented by the system.

Detailed gap-analysis results are stored directly in `tbl_gap_analyses`
and `tbl_gap_analysis_results`.

------------------------------------------------------------------------

# 5. Entity Relationships

The following relationships correspond to the revised ERD.

## 5.1 Roles and Users

### `tbl_roles` → `tbl_users`

-   One role can be associated with zero or many users.
-   Each user references one role.

**Foreign key:**

``` text
tbl_users.role_id → tbl_roles.role_id
```

**Cardinality:** `1 : 0..*`

------------------------------------------------------------------------

## 5.2 Employees and Users

### `tbl_employees` → `tbl_users`

The revised ERD associates users with employees through `employee_id`.

**Foreign key:**

``` text
tbl_users.employee_id → tbl_employees.employee_id
```

The cardinality should follow the revised ERD.

------------------------------------------------------------------------

## 5.3 Offices and Employees

### `tbl_offices` → `tbl_employees`

-   One office can have zero or many employees.
-   Each employee references an office.

**Foreign key:**

``` text
tbl_employees.office_id → tbl_offices.office_id
```

**Cardinality:** `1 : 0..*`

------------------------------------------------------------------------

## 5.4 Positions and Employees

### `tbl_positions` → `tbl_employees`

-   One position can be associated with zero or many employees.
-   Each employee references a position.

**Foreign key:**

``` text
tbl_employees.position_id → tbl_positions.position_id
```

**Cardinality:** `1 : 0..*`

------------------------------------------------------------------------

## 5.5 Positions and Position Competencies

### `tbl_positions` → `tbl_position_competencies`

-   One position can have zero or many competency requirements.
-   Each position-competency record references one position.

**Foreign key:**

``` text
tbl_position_competencies.position_id → tbl_positions.position_id
```

**Cardinality:** `1 : 0..*`

------------------------------------------------------------------------

## 5.6 Competencies and Position Competencies

### `tbl_competencies` → `tbl_position_competencies`

-   One competency can be associated with zero or many position
    requirements.
-   Each position-competency record references one competency.

**Foreign key:**

``` text
tbl_position_competencies.competency_id → tbl_competencies.competency_id
```

**Cardinality:** `1 : 0..*`

This creates a many-to-many relationship between positions and
competencies through `tbl_position_competencies`.

------------------------------------------------------------------------

## 5.7 Employees and Employee Competencies

### `tbl_employees` → `tbl_employee_competencies`

-   One employee can have zero or many competency records.
-   Each employee competency record references one employee.

**Foreign key:**

``` text
tbl_employee_competencies.employee_id → tbl_employees.employee_id
```

**Cardinality:** `1 : 0..*`

------------------------------------------------------------------------

## 5.8 Competencies and Employee Competencies

### `tbl_competencies` → `tbl_employee_competencies`

-   One competency can be associated with zero or many employee
    competency records.
-   Each employee competency record references one competency.

**Foreign key:**

``` text
tbl_employee_competencies.competency_id → tbl_competencies.competency_id
```

**Cardinality:** `1 : 0..*`

This creates a many-to-many relationship between employees and
competencies through `tbl_employee_competencies`.

------------------------------------------------------------------------

## 5.9 Employees and Gap Analyses

### `tbl_employees` → `tbl_gap_analyses`

-   One employee can have zero or many gap analyses.
-   Each gap analysis references one employee.

**Foreign key:**

``` text
tbl_gap_analyses.employee_id → tbl_employees.employee_id
```

**Cardinality:** `1 : 0..*`

------------------------------------------------------------------------

## 5.10 Positions and Gap Analyses

### `tbl_positions` → `tbl_gap_analyses`

-   One position can be associated with zero or many gap analyses.
-   Each gap analysis references one position.

**Foreign key:**

``` text
tbl_gap_analyses.position_id → tbl_positions.position_id
```

**Cardinality:** `1 : 0..*`

------------------------------------------------------------------------

## 5.11 Gap Analyses and Gap Analysis Results

### `tbl_gap_analyses` → `tbl_gap_analysis_results`

-   One gap analysis can contain zero or many competency-level results.
-   Each gap-analysis result belongs to one gap analysis.

**Foreign key:**

``` text
tbl_gap_analysis_results.gap_analysis_id → tbl_gap_analyses.gap_analysis_id
```

**Cardinality:** `1 : 0..*`

------------------------------------------------------------------------

## 5.12 Competencies and Gap Analysis Results

### `tbl_competencies` → `tbl_gap_analysis_results`

-   One competency can appear in zero or many gap-analysis results.
-   Each gap-analysis result references one competency.

**Foreign key:**

``` text
tbl_gap_analysis_results.competency_id → tbl_competencies.competency_id
```

**Cardinality:** `1 : 0..*`

------------------------------------------------------------------------

## 5.13 Employees and Historical Records

### `tbl_employees` → `tbl_historical_records`

-   One employee can have zero or many historical records.
-   Each historical record references an employee.

**Foreign key:**

``` text
tbl_historical_records.employee_id → tbl_employees.employee_id
```

**Cardinality:** `1 : 0..*`

------------------------------------------------------------------------

# 6. Gap Analysis Workflow

The Phase 1 database supports the following workflow:

``` text
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
                  Reporting /
                Historical Tracking
```

The system compares the required competency level for an employee's
position with the employee's current competency level.

``` text
Gap Level = Required Level - Current Level
```

The generated result is stored in `tbl_gap_analysis_results`.

------------------------------------------------------------------------

# 7. Historical Gap Analysis Storage

The gap-analysis design separates the **analysis instance** from its
**individual competency results**.

### Analysis-level record

`tbl_gap_analyses`

Stores:

-   Employee
-   Position
-   Analysis date
-   Analysis status
-   Remarks
-   User who generated the analysis

### Competency-level result

`tbl_gap_analysis_results`

Stores:

-   Competency
-   Required level
-   Current level
-   Calculated gap level
-   Result status
-   Remarks

This structure allows one gap analysis to contain multiple competency
results.

The required and current levels used in the analysis are stored in the
result table so that historical results can remain traceable even if
current employee competency profiles or position requirements are
changed later.

------------------------------------------------------------------------

# 8. Phase 1 Scope Exclusions

The following modules are excluded from the Phase 1 database:

-   Training & Development
-   Individual Development Plan (IDP)
-   Talent & Succession Planning

Separate assessment-session and assessment-result entities are also
excluded from this revised database design because they are not
represented in the revised Phase 1 ERD.

------------------------------------------------------------------------

# 9. Data Integrity Considerations

The database implementation should maintain referential integrity
between related entities.

Recommended considerations:

-   Primary keys must uniquely identify records.
-   Foreign keys must reference valid parent records.
-   Employee numbers should be unique where required by the application.
-   Position codes should be unique where required by the application.
-   Competency codes should be unique where required by the application.
-   Usernames should be unique.
-   Position-competency combinations should not be duplicated.
-   Employee-competency combinations should not be duplicated where only
    one current profile record is intended.
-   Required and current competency levels should follow the competency
    proficiency scale supplied by the client.
-   Gap-analysis results should retain the values used when the analysis
    was generated.
-   Status values should be kept consistent across the application.

------------------------------------------------------------------------

# 10. Summary of Phase 1 Tables

    No. Table                         Main Purpose
  ----- ----------------------------- -------------------------------------
      1 `tbl_roles`                   System roles and access categories
      2 `tbl_users`                   User accounts
      3 `tbl_offices`                 Organisational offices
      4 `tbl_employees`               Employee profiles
      5 `tbl_positions`               Organisational positions
      6 `tbl_competencies`            Competency catalogue
      7 `tbl_position_competencies`   Position competency requirements
      8 `tbl_employee_competencies`   Employee competency profiles
      9 `tbl_gap_analyses`            Gap-analysis instances
     10 `tbl_gap_analysis_results`    Individual competency gap results
     11 `tbl_historical_records`      Historical employee-related records

------------------------------------------------------------------------

# 11. Phase 1 Database Relationship Summary

``` text
tbl_roles
    │
    └── tbl_users
             │
             └── tbl_employees
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
   tbl_offices  tbl_positions  tbl_employee_competencies
                     │                  │
                     ▼                  ▼
             tbl_position_competencies tbl_competencies
                     │
                     └──────────┐
                                │
                                ▼
                        tbl_gap_analyses
                                │
                                ▼
                     tbl_gap_analysis_results
                                │
                                ▼
                         tbl_competencies

tbl_employees
      │
      ▼
tbl_historical_records
```

------------------------------------------------------------------------

# 12. ERD--Dictionary Synchronisation Notes

This document is intended to remain synchronized with the revised Phase
1 ERD.

The following corrections were made compared with the previous
dictionary:

1.  Added `tbl_gap_analyses`, which is present in the revised ERD.
2.  Removed `tbl_assessments`, which is not present in the revised ERD.
3.  Removed `tbl_assessment_results`, which is not present in the
    revised ERD.
4.  Changed the gap result relationship from `assessment_id` to
    `gap_analysis_id`.
5.  Changed the gap result field from `gap_value` to `gap_level` to
    match the ERD.
6.  Changed the gap result field from `gap_status` to `status` to match
    the ERD.
7.  Changed `tbl_employee_competencies.assessed_date` to `last_updated`
    to match the ERD.
8.  Kept `tbl_historical_records` aligned with the fields shown in the
    revised ERD.
9.  Kept the gap-analysis structure as an analysis header
    (`tbl_gap_analyses`) plus detailed results
    (`tbl_gap_analysis_results`).
10. Phase 1 excludes Training & Development, IDP, and Talent &
    Succession Planning.

------------------------------------------------------------------------

# 13. Final Phase 1 Structure

The final database structure represented by this dictionary is:

``` text
USER MANAGEMENT
├── tbl_roles
└── tbl_users

EMPLOYEE MANAGEMENT
├── tbl_employees
├── tbl_positions
└── tbl_offices

COMPETENCY MANAGEMENT
├── tbl_competencies
├── tbl_position_competencies
└── tbl_employee_competencies

GAP ANALYSIS
├── tbl_gap_analyses
└── tbl_gap_analysis_results

HISTORICAL RECORDS
└── tbl_historical_records
```

This dictionary should be used together with the revised ERD as the
reference for creating the MySQL database and, subsequently, the Laravel
migrations and Eloquent models.
