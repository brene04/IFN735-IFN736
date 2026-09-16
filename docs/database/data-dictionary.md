Data Dictionary — CB-HRMS

Project: Competency-Based Human Resource Management System (CB-HRMS)
Client: Department of Science and Technology (DOST)
Phase: Phase 1 — Fully Functional Prototype
Database: MySQL
Status: Revised Draft — Aligned with Finalised Phase 1 System Architecture
Owner: Ram Prasath Rengasamy — Data & System Architecture Lead

⸻

1. Purpose

This data dictionary defines the database structure for the Phase 1 CB-HRMS prototype.

The database supports the core Phase 1 functions:

* User and role management
* Employee management
* Position management
* Office management
* Competency management
* Position-to-competency mapping
* Employee competency profiling
* Competency gap analysis
* Gap analysis reporting and historical records

The database is designed to support the finalised Phase 1 system architecture and the agreed user roles: Technical Administrator, Administrative Administrator, Executive, and Concerned Office.

Training and Development, Individual Development Plans (IDP), and Talent & Succession Planning are not included in the Phase 1 database scope and may be considered for future phases.

⸻

2. Key Definitions

Term	Meaning
PK	Primary Key — uniquely identifies a record
FK	Foreign Key — references a record in another table
INT	Integer / whole number
VARCHAR	Variable-length character string
TEXT	Long text field
DATE	Calendar date
DATETIME	Date and time
1	One record
0..*	Zero or many records
Required Level	Competency proficiency level required for a position
Current Level	Competency proficiency level currently recorded for an employee
Gap	Difference between the required competency level and the employee’s current competency level
Historical Record	Stored record of a previous system activity/result, including gap analysis results

⸻

3. Database Entities

The Phase 1 database contains the following core entities:

1. tbl_roles
2. tbl_users
3. tbl_offices
4. tbl_employees
5. tbl_positions
6. tbl_competencies
7. tbl_position_competencies
8. tbl_employee_competencies
9. tbl_historical_records

⸻

4. Table: tbl_roles

Purpose

Stores the roles available within the CB-HRMS and defines the access category assigned to each system user.

Fields

Field	Data Type	Key	Null	Description
role_id	INT	PK	No	Unique identifier for the role
role_name	VARCHAR(50)		No	Name of the system role
description	VARCHAR(255)		Yes	Description of the role and its responsibilities
status	VARCHAR(20)		No	Current status of the role
created_at	DATETIME		No	Date and time the role was created
updated_at	DATETIME		No	Date and time the role was last updated

Example Roles

* Executive
* Technical Administrator
* Administrative Administrator
* Concerned Office

⸻

5. Table: tbl_users

Purpose

Stores system login accounts and associates each account with a system role and, where applicable, an employee profile.

Fields

Field	Data Type	Key	Null	Description
user_id	INT	PK	No	Unique identifier for the user account
role_id	INT	FK	No	References tbl_roles.role_id
employee_id	INT	FK	Yes	References the employee associated with the account
username	VARCHAR(50)		No	Unique username used for authentication
email	VARCHAR(100)		No	User email address
password_hash	VARCHAR(255)		No	Hashed password used for authentication
status	VARCHAR(20)		No	Current status of the account
last_login	DATETIME		Yes	Date and time of the user’s most recent login
created_at	DATETIME		No	Date and time the account was created
updated_at	DATETIME		No	Date and time the account was last updated

Relationships

* One role can be assigned to many users.
* One employee can optionally be associated with a user account.

⸻

6. Table: tbl_offices

Purpose

Stores the organisational/office information used to associate employees with their concerned office.

Fields

Field	Data Type	Key	Null	Description
office_id	INT	PK	No	Unique identifier for the office
office_code	VARCHAR(50)		No	Unique office code
office_name	VARCHAR(150)		No	Official name of the office
description	TEXT		Yes	Description or additional information about the office
status	VARCHAR(20)		No	Current status of the office
created_at	DATETIME		No	Date and time the office was created
updated_at	DATETIME		No	Date and time the office was last updated

Relationships

* One office can have many employees.

⸻

7. Table: tbl_employees

Purpose

Stores employee profile information required for employee management and competency gap analysis.

Fields

Field	Data Type	Key	Null	Description
employee_id	INT	PK	No	Unique identifier for the employee
office_id	INT	FK	Yes	References tbl_offices.office_id
position_id	INT	FK	Yes	References tbl_positions.position_id
employee_no	VARCHAR(50)		No	Official employee identification number
first_name	VARCHAR(50)		No	Employee first name
middle_name	VARCHAR(50)		Yes	Employee middle name
last_name	VARCHAR(50)		No	Employee last name
email	VARCHAR(100)		Yes	Employee email address
phone	VARCHAR(20)		Yes	Employee contact number
date_hired	DATE		Yes	Employee hiring date
status	VARCHAR(20)		No	Current employment status
created_at	DATETIME		No	Date and time the employee record was created
updated_at	DATETIME		No	Date and time the employee record was last updated

Relationships

* One office can have many employees.
* One position can be assigned to many employees.
* One employee can have many competency records.
* One employee can have many historical records.

⸻

8. Table: tbl_positions

Purpose

Stores organisational positions and their basic information. Positions are used as the basis for determining the competency requirements against which employee competency levels are compared.

Fields

Field	Data Type	Key	Null	Description
position_id	INT	PK	No	Unique identifier for the position
position_code	VARCHAR(50)		No	Unique code assigned to the position
position_title	VARCHAR(100)		No	Official position title
description	TEXT		Yes	Description of the position
department	VARCHAR(100)		Yes	Department or organisational unit associated with the position
employment_type	VARCHAR(50)		Yes	Employment classification/type
status	VARCHAR(20)		No	Current status of the position
created_at	DATETIME		No	Date and time the position was created
updated_at	DATETIME		No	Date and time the position was last updated

Relationships

* One position can have many employees.
* One position can require many competencies through tbl_position_competencies.

⸻

9. Table: tbl_competencies

Purpose

Stores the competencies used by DOST for competency profiling and gap analysis.

Competencies may represent the defined core competencies and leadership competencies contained in the client’s competency framework.

Fields

Field	Data Type	Key	Null	Description
competency_id	INT	PK	No	Unique identifier for the competency
competency_code	VARCHAR(50)		No	Unique code assigned to the competency
competency_name	VARCHAR(100)		No	Name of the competency
description	TEXT		Yes	Description of the competency
competency_type	VARCHAR(50)		No	Competency classification, e.g. Core or Leadership
status	VARCHAR(20)		No	Current status of the competency
created_at	DATETIME		No	Date and time the competency was created
updated_at	DATETIME		No	Date and time the competency was last updated

Examples of competency types

* Core Competency
* Leadership Competency

⸻

10. Table: tbl_position_competencies

Purpose

Defines the competency requirements for each position.

This table is particularly important because each position can have multiple required competencies, and each competency can be required by multiple positions.

The required_level represents the proficiency level expected for that competency for the selected position.

Fields

Field	Data Type	Key	Null	Description
position_competency_id	INT	PK	No	Unique identifier for the position-competency mapping
position_id	INT	FK	No	References tbl_positions.position_id
competency_id	INT	FK	No	References tbl_competencies.competency_id
required_level	INT		No	Required proficiency level for the competency
priority	INT		Yes	Priority of the competency for the position
created_at	DATETIME		No	Date and time the mapping was created
updated_at	DATETIME		No	Date and time the mapping was last updated

Relationships

* One position can have many competency requirements.
* One competency can be required by many positions.

Example

If Administrative Officer II requires:

Competency	Required Level
Accountability	2
Innovation	2
Personal Effectiveness	2
Planning and Organising	2

each requirement is stored as a separate record in tbl_position_competencies.

⸻

11. Table: tbl_employee_competencies

Purpose

Stores the competency profile of an employee, including their current competency level.

The current_level is the employee’s existing competency level that will be compared against the required level defined for their position.

Fields

Field	Data Type	Key	Null	Description
employee_competency_id	INT	PK	No	Unique identifier for the employee competency record
employee_id	INT	FK	No	References tbl_employees.employee_id
competency_id	INT	FK	No	References tbl_competencies.competency_id
current_level	INT		No	Current competency proficiency level recorded for the employee
evidence	TEXT		Yes	Supporting information or source for the recorded competency level
assessed_date	DATE		Yes	Date associated with the competency level record, if applicable
status	VARCHAR(20)		No	Current status of the competency record
created_at	DATETIME		No	Date and time the record was created
updated_at	DATETIME		No	Date and time the record was last updated

Important Phase 1 Note

The system does not require an employee assessment/training workflow for Phase 1.

The current_level represents the competency information provided/entered into the system and is used as the employee’s current competency profile for gap analysis.

⸻

12. Table: tbl_historical_records

Purpose

Stores historical system information and previous gap analysis results so that reports and historical comparisons can be retained.

This table is important because the system should not only calculate a gap temporarily; the resulting gap analysis information should be retained as historical data.

Fields

Field	Data Type	Key	Null	Description
record_id	INT	PK	No	Unique identifier for the historical record
employee_id	INT	FK	No	References tbl_employees.employee_id
position_id	INT	FK	Yes	References tbl_positions.position_id
competency_id	INT	FK	Yes	References tbl_competencies.competency_id
record_type	VARCHAR(50)		No	Type of historical record, e.g. Gap Analysis
required_level	INT		Yes	Required competency level at the time the result was generated
current_level	INT		Yes	Employee competency level at the time the result was generated
gap_value	INT		Yes	Calculated difference between required level and current level
description	TEXT		Yes	Additional details or explanation of the historical record
effective_date	DATE		Yes	Date on which the historical result applies
created_at	DATETIME		No	Date and time the historical record was created
updated_at	DATETIME		No	Date and time the historical record was last updated

Example Gap Analysis Record

If:

Required Level = 3
Current Level = 1

then:

Gap Value = 2

The system can store this result as a historical record.

Example

Employee	Competency	Required	Current	Gap	Record Type
Employee 001	Innovation	3	1	2	Gap Analysis
Employee 001	Accountability	3	3	0	Gap Analysis
Employee 001	Planning	3	2	1	Gap Analysis

This allows the system to retain previous gap-analysis results rather than recalculating everything without historical reference.

⸻

13. Entity Relationships

The main relationships in the Phase 1 database are:

tbl_roles
    │
    │ 1
    │
    └────────── 0..* tbl_users
tbl_offices
    │
    │ 1
    │
    └────────── 0..* tbl_employees
tbl_positions
    │
    │ 1
    │
    ├────────── 0..* tbl_employees
    │
    └────────── 0..* tbl_position_competencies
                       │
                       │ *..1
                       ▼
                tbl_competencies
tbl_employees
    │
    │ 1
    │
    ├────────── 0..* tbl_employee_competencies
    │                         │
    │                         │ *..1
    │                         ▼
    │                  tbl_competencies
    │
    └────────── 0..* tbl_historical_records

⸻

14. Gap Analysis Data Flow

The database supports the following Phase 1 process:

Employee
   │
   ▼
Employee Position
   │
   ▼
Position Competency Requirements
   │
   ├── Competency A → Required Level 3
   ├── Competency B → Required Level 2
   └── Competency C → Required Level 4
              │
              ▼
Employee Competency Profile
   │
   ├── Competency A → Current Level 2
   ├── Competency B → Current Level 2
   └── Competency C → Current Level 1
              │
              ▼
        GAP ANALYSIS
              │
              ├── A → Gap 1
              ├── B → Gap 0
              └── C → Gap 3
              │
              ▼
     Historical Records
              │
              ▼
       Reports / Dashboard

⸻

15. Gap Calculation

The system can calculate the competency gap using:

Gap = Required Level - Current Level

Interpretation

Gap Value	Meaning
0	Current level meets the required level
> 0	Employee is below the required level
< 0	Current level exceeds the required level

The exact presentation/interpretation of the gap in the UI can be determined by the application/business logic.

⸻

16. Phase 1 Scope Exclusions

The following entities from the earlier database design have been removed from the Phase 1 database because they are not part of the finalised Phase 1 system scope:

tbl_assessments
tbl_assessment_results
tbl_development_plans
tbl_development_plan_activities
tbl_training_activities
tbl_talent_succession

Phase 1 focuses on:

User Management
        ↓
Employee Management
        ↓
Competency Management
        ↓
Employee Competency Profiling
        ↓
Gap Analysis
        ↓
Reports / Decision Support
        ↓
Historical Gap Analysis Records

Training & Development, IDP, and Talent & Succession may be considered as future enhancements.

⸻

17. Summary of Phase 1 Tables

Table	Main Purpose
tbl_roles	Defines system roles
tbl_users	Stores system accounts and access information
tbl_offices	Stores concerned office information
tbl_employees	Stores employee profiles
tbl_positions	Stores organisational positions
tbl_competencies	Stores competency definitions
tbl_position_competencies	Defines required competencies and proficiency levels for positions
tbl_employee_competencies	Stores employees’ current competency levels
tbl_historical_records	Stores historical gap analysis results and other relevant historical information

