# CB-HRMS Data Dictionary

**Project:** Competency-Based Human Resource Management System (CB-HRMS)  
**Phase:** Phase 1 – Fully Functional Prototype  
**Database:** MySQL  
**Status:** Initial / Draft – Pending Client Validation  
**Owner:** Ram – Data & System Architecture Lead

---

## 1. Purpose

This data dictionary defines the initial database structure for the CB-HRMS prototype. It documents the entities, attributes, data types, keys and purpose of each field represented in the initial ERD.

The structure is designed to support the core system functions including employee management, position and competency mapping, competency assessment, competency gap identification, development planning, learning activities, talent/succession support and historical records.

This is an initial design and will be reviewed and refined following client feedback.

---

## 2. Key Definitions

| Term | Meaning |
|---|---|
| PK | Primary Key – uniquely identifies a record |
| FK | Foreign Key – references a record in another table |
| INT | Integer / whole number |
| VARCHAR | Variable-length text |
| TEXT | Longer text content |
| DATE | Date value |
| DATETIME | Date and time value |

---

# 3. Table: tbl_roles

**Purpose:** Stores the roles available within the system.

| Field | Data Type | Key | Null | Description | Status |
|---|---|---|---|---|---|
| role_id | INT | PK | No | Unique identifier for the role | Proposed |
| role_name | VARCHAR(50) | | No | Name of the system role | Client-aligned |
| description | TEXT | | Yes | Description of the role | Proposed |
| status | VARCHAR(20) | | No | Current status of the role | Proposed |
| created_at | DATETIME | | No | Date and time the record was created | Proposed |
| updated_at | DATETIME | | No | Date and time the record was last updated | Proposed |

---

# 4. Table: tbl_users

**Purpose:** Stores system user account information and links users to their roles and employee records.

| Field | Data Type | Key | Null | Description | Status |
|---|---|---|---|---|---|
| user_id | INT | PK | No | Unique identifier for the user account | Proposed |
| role_id | INT | FK | No | References tbl_roles.role_id | Proposed |
| employee_id | INT | FK | Yes | Links the account to an employee | Proposed |
| username | VARCHAR(50) | | No | Username used to access the system | Proposed |
| email | VARCHAR(100) | | No | User email address | Proposed |
| password_hash | VARCHAR(255) | | No | Securely stored password hash | Proposed |
| status | VARCHAR(20) | | No | Current account status | Proposed |
| last_login | DATETIME | | Yes | Date and time of the most recent login | Proposed |
| created_at | DATETIME | | No | Date and time the account was created | Proposed |
| updated_at | DATETIME | | No | Date and time the account was last updated | Proposed |

---

# 5. Table: tbl_employees

**Purpose:** Stores employee profile information required for competency profiling and related HR functions.

| Field | Data Type | Key | Null | Description | Status |
|---|---|---|---|---|---|
| employee_id | INT | PK | No | Unique identifier for the employee | Client-aligned |
| position_id | INT | FK | No | References tbl_positions.position_id | Client-aligned |
| employee_no | VARCHAR(50) | | No | Employee identification number | Client-aligned |
| first_name | VARCHAR(50) | | No | Employee first name | Proposed |
| middle_name | VARCHAR(50) | | Yes | Employee middle name | Proposed |
| last_name | VARCHAR(50) | | No | Employee last name | Proposed |
| email | VARCHAR(100) | | Yes | Employee email address | Proposed |
| phone | VARCHAR(20) | | Yes | Employee contact number | Proposed |
| date_hired | DATE | | Yes | Employee hiring date | Proposed |
| status | VARCHAR(20) | | No | Current employment status | Proposed |
| created_at | DATETIME | | No | Date and time the employee record was created | Proposed |
| updated_at | DATETIME | | No | Date and time the employee record was updated | Proposed |

---

# 6. Table: tbl_positions

**Purpose:** Stores organisational position information used for position-to-competency mapping.

| Field | Data Type | Key | Null | Description | Status |
|---|---|---|---|---|---|
| position_id | INT | PK | No | Unique identifier for the position | Client-aligned |
| position_code | VARCHAR(50) | | No | Code identifying the position | Proposed |
| position_title | VARCHAR(100) | | No | Title/name of the position | Client-aligned |
| description | TEXT | | Yes | Description of the position | Proposed |
| department | VARCHAR(100) | | Yes | Department associated with the position | Proposed |
| employment_type | VARCHAR(50) | | Yes | Employment classification | Proposed |
| status | VARCHAR(20) | | No | Current status of the position | Proposed |
| created_at | DATETIME | | No | Date and time the position was created | Proposed |
| updated_at | DATETIME | | No | Date and time the position was updated | Proposed |

---

# 7. Table: tbl_competencies

**Purpose:** Stores the competency framework used by the system.

| Field | Data Type | Key | Null | Description | Status |
|---|---|---|---|---|---|
| competency_id | INT | PK | No | Unique identifier for the competency | Client-aligned |
| competency_code | VARCHAR(50) | | No | Code identifying the competency | Proposed |
| competency_name | VARCHAR(100) | | No | Name of the competency | Client-aligned |
| description | TEXT | | Yes | Description of the competency | Client-aligned |
| competency_type | VARCHAR(50) | | Yes | Category/type of competency | Proposed |
| status | VARCHAR(20) | | No | Current status of the competency | Proposed |
| created_at | DATETIME | | No | Date and time the competency was created | Proposed |
| updated_at | DATETIME | | No | Date and time the competency was updated | Proposed |

---

# 8. Table: tbl_position_competencies

**Purpose:** Links positions with the competencies required for those positions.

This table resolves the many-to-many relationship between positions and competencies.

| Field | Data Type | Key | Null | Description | Status |
|---|---|---|---|---|---|
| position_competency_id | INT | PK | No | Unique identifier for the mapping | Proposed |
| position_id | INT | FK | No | References tbl_positions.position_id | Client-aligned |
| competency_id | INT | FK | No | References tbl_competencies.competency_id | Client-aligned |
| required_level | INT | | No | Competency level required for the position | Client-aligned |
| priority | INT | | Yes | Priority of the competency for the position | Proposed |
| created_at | DATETIME | | No | Date and time the mapping was created | Proposed |
| updated_at | DATETIME | | No | Date and time the mapping was updated | Proposed |

---

# 9. Table: tbl_employee_competencies

**Purpose:** Stores the competency level and related information associated with an employee.

| Field | Data Type | Key | Null | Description | Status |
|---|---|---|---|---|---|
| employee_competency_id | INT | PK | No | Unique identifier for the employee competency record | Proposed |
| employee_id | INT | FK | No | References tbl_employees.employee_id | Client-aligned |
| competency_id | INT | FK | No | References tbl_competencies.competency_id | Client-aligned |
| current_level | INT | | No | Employee's current competency level | Client-aligned |
| evidence | TEXT | | Yes | Evidence supporting the competency level | Proposed |
| assessed_date | DATE | | Yes | Date the competency level was assessed | Proposed |
| status | VARCHAR(20) | | No | Current status of the record | Proposed |
| created_at | DATETIME | | No | Date and time the record was created | Proposed |
| updated_at | DATETIME | | No | Date and time the record was updated | Proposed |

---

# 10. Table: tbl_assessments

**Purpose:** Stores employee competency assessment records.

| Field | Data Type | Key | Null | Description | Status |
|---|---|---|---|---|---|
| assessment_id | INT | PK | No | Unique identifier for the assessment | Client-aligned |
| employee_id | INT | FK | No | References tbl_employees.employee_id | Client-aligned |
| assessment_date | DATE | | No | Date the assessment was conducted | Client-aligned |
| assessment_type | VARCHAR(50) | | Yes | Type of assessment | Proposed |
| assessor | VARCHAR(100) | | Yes | Person responsible for the assessment | Proposed |
| status | VARCHAR(20) | | No | Current assessment status | Proposed |
| remarks | TEXT | | Yes | Additional assessment comments | Proposed |
| created_at | DATETIME | | No | Date and time the assessment was created | Proposed |
| updated_at | DATETIME | | No | Date and time the assessment was updated | Proposed |

---

# 11. Table: tbl_assessment_results

**Purpose:** Stores individual competency results produced by an assessment.

| Field | Data Type | Key | Null | Description | Status |
|---|---|---|---|---|---|
| assessment_result_id | INT | PK | No | Unique identifier for the assessment result | Proposed |
| assessment_id | INT | FK | No | References tbl_assessments.assessment_id | Client-aligned |
| competency_id | INT | FK | No | References tbl_competencies.competency_id | Client-aligned |
| assessed_level | INT | | No | Competency level achieved in the assessment | Client-aligned |
| remarks | TEXT | | Yes | Additional comments about the result | Proposed |
| created_at | DATETIME | | No | Date and time the result was created | Proposed |
| updated_at | DATETIME | | No | Date and time the result was updated | Proposed |

---

# 12. Table: tbl_development_plans

**Purpose:** Stores individual employee development plans (IDPs).

| Field | Data Type | Key | Null | Description | Status |
|---|---|---|---|---|---|
| development_plan_id | INT | PK | No | Unique identifier for the development plan | Client-aligned |
| employee_id | INT | FK | No | References tbl_employees.employee_id | Client-aligned |
| plan_date | DATE | | No | Date the development plan was created | Proposed |
| target_date | DATE | | Yes | Target date for development objectives | Proposed |
| objectives | TEXT | | Yes | Development objectives | Client-aligned |
| status | VARCHAR(20) | | No | Current status of the plan | Proposed |
| created_at | DATETIME | | No | Date and time the plan was created | Proposed |
| updated_at | DATETIME | | No | Date and time the plan was updated | Proposed |

---

# 13. Table: tbl_training_activities

**Purpose:** Stores training and learning activities that can support employee development.

| Field | Data Type | Key | Null | Description | Status |
|---|---|---|---|---|---|
| training_activity_id | INT | PK | No | Unique identifier for the training activity | Client-aligned |
| activity_code | VARCHAR(50) | | Yes | Code identifying the activity | Proposed |
| activity_name | VARCHAR(100) | | No | Name of the training or learning activity | Client-aligned |
| description | TEXT | | Yes | Description of the activity | Client-aligned |
| provider | VARCHAR(100) | | Yes | Training/activity provider | Proposed |
| activity_type | VARCHAR(50) | | Yes | Type of learning activity | Proposed |
| start_date | DATE | | Yes | Activity start date | Proposed |
| end_date | DATE | | Yes | Activity end date | Proposed |
| status | VARCHAR(20) | | No | Current status of the activity | Proposed |
| created_at | DATETIME | | No | Date and time the activity was created | Proposed |
| updated_at | DATETIME | | No | Date and time the activity was updated | Proposed |

---

# 14. Table: tbl_development_plan_activities

**Purpose:** Links development plans with relevant training/learning activities and competencies.

| Field | Data Type | Key | Null | Description | Status |
|---|---|---|---|---|---|
| development_plan_activity_id | INT | PK | No | Unique identifier for the development activity record | Proposed |
| development_plan_id | INT | FK | No | References tbl_development_plans.development_plan_id | Client-aligned |
| training_activity_id | INT | FK | No | References tbl_training_activities.training_activity_id | Client-aligned |
| competency_id | INT | FK | Yes | References the competency being developed | Proposed |
| target_level | INT | | Yes | Target competency level after development | Proposed |
| status | VARCHAR(20) | | No | Current status of the activity | Proposed |
| completion_date | DATE | | Yes | Date the activity was completed | Proposed |
| remarks | TEXT | | Yes | Additional comments | Proposed |
| created_at | DATETIME | | No | Date and time the record was created | Proposed |
| updated_at | DATETIME | | No | Date and time the record was updated | Proposed |

---

# 15. Table: tbl_historical_records

**Purpose:** Stores historical records associated with employee competency and development activities.

| Field | Data Type | Key | Null | Description | Status |
|---|---|---|---|---|---|
| record_id | INT | PK | No | Unique identifier for the historical record | Proposed |
| employee_id | INT | FK | No | References tbl_employees.employee_id | Proposed |
| record_type | VARCHAR(50) | | No | Type/category of historical record | Proposed |
| description | TEXT | | Yes | Description of the historical record | Proposed |
| effective_date | DATE | | Yes | Date the historical record became effective | Proposed |
| created_at | DATETIME | | No | Date and time the record was created | Proposed |
| updated_at | DATETIME | | No | Date and time the record was updated | Proposed |

---

# 16. Relationships

| Parent Table | Child Table | Relationship | Foreign Key |
|---|---|---|---|
| tbl_roles | tbl_users | 1 : Many | users.role_id |
| tbl_employees | tbl_users | 1 : 0..1 | users.employee_id |
| tbl_positions | tbl_employees | 1 : Many | employees.position_id |
| tbl_positions | tbl_position_competencies | 1 : Many | position_competencies.position_id |
| tbl_competencies | tbl_position_competencies | 1 : Many | position_competencies.competency_id |
| tbl_employees | tbl_employee_competencies | 1 : Many | employee_competencies.employee_id |
| tbl_competencies | tbl_employee_competencies | 1 : Many | employee_competencies.competency_id |
| tbl_employees | tbl_assessments | 1 : Many | assessments.employee_id |
| tbl_assessments | tbl_assessment_results | 1 : Many | assessment_results.assessment_id |
| tbl_competencies | tbl_assessment_results | 1 : Many | assessment_results.competency_id |
| tbl_employees | tbl_development_plans | 1 : Many | development_plans.employee_id |
| tbl_development_plans | tbl_development_plan_activities | 1 : Many | development_plan_activities.development_plan_id |
| tbl_training_activities | tbl_development_plan_activities | 1 : Many | development_plan_activities.training_activity_id |
| tbl_competencies | tbl_development_plan_activities | 1 : Many | development_plan_activities.competency_id |
| tbl_employees | tbl_historical_records | 1 : Many | historical_records.employee_id |

---

# 17. Design Notes

### Competency Mapping

`tbl_position_competencies` represents the relationship between positions and the competencies required for those positions.

A position can require multiple competencies, and a competency can be required by multiple positions.

### Employee Competency

`tbl_employee_competencies` records the competencies associated with an employee and their current competency level.

This structure supports comparison between:

- Required competency level for a position
- Current competency level of an employee

This comparison can support competency gap analysis.

### Assessment

`tbl_assessments` stores the overall assessment record, while `tbl_assessment_results` stores the individual competency results within that assessment.

### Development and Learning

`tbl_development_plans` stores employee development plans, while `tbl_development_plan_activities` links development plans to relevant learning/training activities.

### Client Validation

The database structure is currently an initial design. Fields marked **Proposed** represent design decisions made for the prototype and should be validated against the client's supplied forms, data requirements and workflow before the schema is considered final.

---

# 18. Status

**Current status:** Initial database design / Draft

**Next validation point:** Client meeting

**After client validation:**

1. Review client feedback
2. Update ERD
3. Update this data dictionary
4. Confirm PK/FK relationships
5. Confirm data types and constraints
6. Create the final MySQL schema
7. Implement the database
8. Coordinate database integration with the Laravel backend
