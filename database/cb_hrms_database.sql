-- Part 1 : tables
USE cb_hrms;

CREATE TABLE tbl_roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tbl_offices (
    office_id INT AUTO_INCREMENT PRIMARY KEY,
    office_name VARCHAR(100) NOT NULL,
    office_code VARCHAR(50),
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tbl_positions (
    position_id INT AUTO_INCREMENT PRIMARY KEY,
    position_code VARCHAR(50),
    position_title VARCHAR(100) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    employment_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tbl_competencies (
    competency_id INT AUTO_INCREMENT PRIMARY KEY,
    competency_code VARCHAR(50),
    competency_name VARCHAR(100) NOT NULL,
    description TEXT,
    competency_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

SHOW TABLES;

CREATE TABLE tbl_employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    position_id INT NOT NULL,
    office_id INT NOT NULL,
    employee_no VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    date_hired DATE,
    status VARCHAR(20) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_employee_position
        FOREIGN KEY (position_id)
        REFERENCES tbl_positions(position_id),

    CONSTRAINT fk_employee_office
        FOREIGN KEY (office_id)
        REFERENCES tbl_offices(office_id)
);

CREATE TABLE tbl_users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    employee_id INT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES tbl_roles(role_id),

    CONSTRAINT fk_user_employee
        FOREIGN KEY (employee_id)
        REFERENCES tbl_employees(employee_id)
);

SHOW TABLES;

CREATE TABLE tbl_position_competencies (
    position_competency_id INT AUTO_INCREMENT PRIMARY KEY,
    position_id INT NOT NULL,
    competency_id INT NOT NULL,
    required_level INT NOT NULL,
    priority INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_position_competency_position
        FOREIGN KEY (position_id)
        REFERENCES tbl_positions(position_id),

    CONSTRAINT fk_position_competency_competency
        FOREIGN KEY (competency_id)
        REFERENCES tbl_competencies(competency_id)
);

CREATE TABLE tbl_employee_competencies (
    employee_competency_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    competency_id INT NOT NULL,
    current_level INT NOT NULL,
    evidence TEXT,
    last_updated DATE,
    status VARCHAR(20) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_employee_competency_employee
        FOREIGN KEY (employee_id)
        REFERENCES tbl_employees(employee_id),

    CONSTRAINT fk_employee_competency_competency
        FOREIGN KEY (competency_id)
        REFERENCES tbl_competencies(competency_id)
);

SHOW TABLES;

CREATE TABLE tbl_gap_analyses (
    gap_analysis_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    position_id INT NOT NULL,
    analysis_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Completed',
    remarks TEXT,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_gap_analysis_employee
        FOREIGN KEY (employee_id)
        REFERENCES tbl_employees(employee_id),

    CONSTRAINT fk_gap_analysis_position
        FOREIGN KEY (position_id)
        REFERENCES tbl_positions(position_id),

    CONSTRAINT fk_gap_analysis_created_by
        FOREIGN KEY (created_by)
        REFERENCES tbl_users(user_id)
);

CREATE TABLE tbl_gap_analysis_results (
    gap_analysis_result_id INT AUTO_INCREMENT PRIMARY KEY,
    gap_analysis_id INT NOT NULL,
    competency_id INT NOT NULL,
    required_level INT NOT NULL,
    current_level INT NOT NULL,
    gap_level INT NOT NULL,
    status VARCHAR(20),
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_gap_result_analysis
        FOREIGN KEY (gap_analysis_id)
        REFERENCES tbl_gap_analyses(gap_analysis_id),

    CONSTRAINT fk_gap_result_competency
        FOREIGN KEY (competency_id)
        REFERENCES tbl_competencies(competency_id)
);

SHOW TABLES;

CREATE TABLE tbl_historical_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    description TEXT,
    effective_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_history_employee
        FOREIGN KEY (employee_id)
        REFERENCES tbl_employees(employee_id)
);
SHOW TABLES;

USE cb_hrms;

SHOW TABLES;

DESCRIBE tbl_roles;
DESCRIBE tbl_users;
DESCRIBE tbl_offices;
DESCRIBE tbl_employees;
DESCRIBE tbl_positions;
DESCRIBE tbl_competencies;
DESCRIBE tbl_position_competencies;
DESCRIBE tbl_employee_competencies;
DESCRIBE tbl_gap_analyses;
DESCRIBE tbl_gap_analysis_results;
DESCRIBE tbl_historical_records;

SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'cb_hrms'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;

DESCRIBE tbl_employee_competencies;
SHOW CREATE TABLE tbl_employee_competencies;

SHOW CREATE TABLE tbl_roles;
SHOW CREATE TABLE tbl_offices;
SHOW CREATE TABLE tbl_positions;
SHOW CREATE TABLE tbl_competencies;
SHOW CREATE TABLE tbl_position_competencies;
SHOW CREATE TABLE tbl_employees;
SHOW CREATE TABLE tbl_gap_analyses;
SHOW CREATE TABLE tbl_gap_analysis_results;
SHOW CREATE TABLE tbl_historical_records;

USE cb_hrms;
CREATE TABLE tbl_competency_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_code VARCHAR(50),
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tbl_proficiency_levels (
    proficiency_level_id INT AUTO_INCREMENT PRIMARY KEY,
    level_number INT NOT NULL,
    level_name VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tbl_behavioral_indicators (
    behavioral_indicator_id INT AUTO_INCREMENT PRIMARY KEY,
    competency_id INT NOT NULL,
    proficiency_level_id INT NOT NULL,
    indicator_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_behavioral_indicator_competency
        FOREIGN KEY (competency_id)
        REFERENCES tbl_competencies(competency_id),

    CONSTRAINT fk_behavioral_indicator_level
        FOREIGN KEY (proficiency_level_id)
        REFERENCES tbl_proficiency_levels(proficiency_level_id)
);

SHOW TABLES;

ALTER TABLE tbl_competencies
ADD COLUMN category_id INT NULL,
ADD CONSTRAINT fk_competency_category
    FOREIGN KEY (category_id)
    REFERENCES tbl_competency_categories(category_id);

SHOW TABLES;
DESCRIBE tbl_competency_categories;
DESCRIBE tbl_proficiency_levels;
DESCRIBE tbl_behavioral_indicators;

DESCRIBE tbl_competencies;

SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'cb_hrms'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;


USE cb_hrms;


-- Part 2 :  SYSTEM ROLES


INSERT INTO tbl_roles
    (role_name, description, status)
VALUES
    (
        'Executive',
        'System head with full authorisation and access to dashboards, reports, results, and role access control.',
        'Active'
    ),
    (
        'Technical Administrator',
        'Responsible for system configuration, technical maintenance, user and role management, and technical support.',
        'Active'
    ),
    (
        'Administrative Administrator',
        'Responsible for managing organisational data, employee information, positions, competencies, and gap analysis reports.',
        'Active'
    ),
    (
        'Concerned Office',
        'Provides office-level access to competency and employee information and can submit requests to administrators.',
        'Active'
    );

-- Verify inserted roles
SELECT * FROM tbl_roles;


-- 2.2  SAMPLE OFFICES


INSERT INTO tbl_offices
    (office_name, description, status)
VALUES
    (
        'Administration Office (Demo)',
        'Sample office used for prototype demonstration.',
        'Active'
    ),
    (
        'HR Management Office (Demo)',
        'Sample office used for prototype demonstration.',
        'Active'
    ),
    (
        'IT Office (Demo)',
        'Sample office used for prototype demonstration.',
        'Active'
    ),
    (
        'Finance Office (Demo)',
        'Sample office used for prototype demonstration.',
        'Active'
    ),
    (
        'Research Office (Demo)',
        'Sample office used for prototype demonstration.',
        'Active'
    );

-- Verify inserted offices
SELECT *
FROM tbl_offices
ORDER BY office_id;


-- 2.3  COMPETENCY CATEGORIES


INSERT INTO tbl_competency_categories
    (category_code, category_name, description, status)
VALUES
    (
        'CORE',
        'Core Competencies',
        'Competencies applicable across jobs in the DOST organisation and expected to be demonstrated by employees.',
        'Active'
    ),
    (
        'FUNC',
        'Functional Competencies',
        'Job-specific competencies involving the knowledge, skills, and behaviours required to perform a particular job or functional role.',
        'Active'
    ),
    (
        'LEAD',
        'Leadership Competencies',
        'Competencies involving the knowledge, skills, and behaviours needed to perform management and leadership functions.',
        'Active'
    );

-- Verify inserted competency categories
SELECT *
FROM tbl_competency_categories
ORDER BY category_id;


-- 2.4 INSERT PROFICIENCY LEVELS


INSERT INTO tbl_proficiency_levels
    (level_number, level_name, description, status)
VALUES
    (
        1,
        'Basic',
        'Demonstrates the fundamental knowledge, skills, and behaviours required for the competency.',
        'Active'
    ),
    (
        2,
        'Intermediate',
        'Demonstrates a developing and working level of knowledge, skills, and behaviours for the competency.',
        'Active'
    ),
    (
        3,
        'Advanced',
        'Demonstrates a strong and proficient level of knowledge, skills, and behaviours for the competency.',
        'Active'
    ),
    (
        4,
        'Superior',
        'Demonstrates an expert level of knowledge, skills, and behaviours and can perform or guide others at a high level.',
        'Active'
    );

-- Verify inserted proficiency levels
SELECT *
FROM tbl_proficiency_levels
ORDER BY level_number;


-- 2.5 FIX — EXPAND COMPETENCY NAME COLUMN


ALTER TABLE tbl_competencies
MODIFY COLUMN competency_name VARCHAR(255) NOT NULL;

DESCRIBE tbl_competencies;

-- 2.5 INSERT COMPETENCIES


INSERT INTO tbl_competencies
    (category_id, competency_code, competency_name, status)
VALUES


-- CORE COMPETENCIES
-- Category ID = 1


(1, 'C1',  'Complete Staff Work (CSW)', 'Active'),
(1, 'C2',  'Delivering Professional and Excellent Services', 'Active'),
(1, 'C3',  'Use of Technology', 'Active'),
(1, 'C4',  'Oral and Written Communication', 'Active'),
(1, 'C5',  'Exemplifying Integrity', 'Active'),
(1, 'C6',  'Innovation', 'Active'),
(1, 'C7',  'Personal Effectiveness', 'Active'),
(1, 'C8',  'Planning and Organizing', 'Active'),
(1, 'C9',  'Team Management (Team Work)', 'Active'),
(1, 'C10', 'Problem solving & Decision making', 'Active'),


-- FUNCTIONAL COMPETENCIES
-- Category ID = 2


(2, 'F1',  'Administrative Management', 'Active'),

(2, 'F2',  'Accounts Reconciliation (for Accounting adopted from the Generic Competency Dictionary for the Public Sector)', 'Active'),

(2, 'F3',  'Bills Review and Evaluation', 'Active'),

(2, 'F4',  'Budget Administration and Control', 'Active'),

(2, 'F5',  'Building and Organizing Management', 'Active'),

(2, 'F6',  'Cash Management', 'Active'),

(2, 'F7',  'Compensation, Benefits, and Employee Welfare', 'Active'),

(2, 'F8',  'Continuous Improvement of Audit Quality (adopted from the Generic Competency Dictionary for the Public Sector)', 'Active'),

(2, 'F9',  'Corporate Communication', 'Active'),

(2, 'F10', 'Critical Thinking', 'Active'),

(2, 'F11', 'Digital Media and Visualization', 'Active'),

(2, 'F12', 'Employee Engagement', 'Active'),

(2, 'F13', 'Financial Management', 'Active'),

(2, 'F14', 'Generating Reports and Documentation', 'Active'),

(2, 'F15', 'Information and Data Management and Dissemination', 'Active'),

(2, 'F16', 'Information Systems Management', 'Active'),

(2, 'F17', 'Internal Audit Planning and Management', 'Active'),

(2, 'F18', 'Knowledge Management', 'Active'),

(2, 'F19', 'Learning and Development Planning', 'Active'),

(2, 'F20', 'Legal Management', 'Active'),

(2, 'F21', 'Legislative Policy Management', 'Active'),

(2, 'F22', 'Media and Public Relations', 'Active'),

(2, 'F23', 'Monitoring and Evaluation', 'Active'),

(2, 'F24', 'Negotiation', 'Active'),

(2, 'F25', 'Networking and IT Security', 'Active'),

(2, 'F26', 'Organizational Development', 'Active'),

(2, 'F27', 'Organizational Planning', 'Active'),

(2, 'F28', 'Performance Management', 'Active'),

(2, 'F29', 'Policy Development, Formulation and Implementation', 'Active'),

(2, 'F30', 'Preparation and Interpretation of Financial Statements and Reports (for Accounting adopted from the Generic Competency Dictionary for the Public Sector)', 'Active'),

(2, 'F31', 'Procurement Management', 'Active'),

(2, 'F32', 'Program/Project Management', 'Active'),

(2, 'F33', 'Programming & Web Development', 'Active'),

(2, 'F34', 'Property Management', 'Active'),

(2, 'F35', 'Records and Documents Management', 'Active'),

(2, 'F36', 'Research Information Management/ Data Management', 'Active'),

(2, 'F37', 'Research/Resource Utilization', 'Active'),

(2, 'F38', 'Rewards and Recognition', 'Active'),

(2, 'F39', 'Risk Analysis, Assessment and Management', 'Active'),

(2, 'F40', 'Rule Enforcement', 'Active'),

(2, 'F41', 'Secretariat and Committee Services', 'Active'),

(2, 'F42', 'Software Support and Training', 'Active'),

(2, 'F43', 'Statistics and Data Analysis', 'Active'),

(2, 'F44', 'Strategic Planning', 'Active'),

(2, 'F45', 'Talent Planning, Sourcing, Selection, and Management', 'Active'),

(2, 'F46', 'Technical Training Administration', 'Active'),

(2, 'F47', 'Technical Writing', 'Active'),

(2, 'F48', 'Transaction Processing (for Accounting adopted from the Generic Competency Dictionary for the Public Sector)', 'Active'),


-- LEADERSHIP COMPETENCIES
-- Category ID = 3


(3, 'L1', 'STI Advocacy', 'Active'),

(3, 'L2', 'Leading and Championing S&T Innovation', 'Active'),

(3, 'L3', 'Building Collaborative, Inclusive Working Relationships', 'Active'),

(3, 'L4', 'Managing Performance and Coaching for Results', 'Active'),

(3, 'L5', 'Leading Change', 'Active'),

(3, 'L6', 'Thinking Strategically and Creatively', 'Active'),

(3, 'L7', 'Creating and Nurturing a High Performing Organization', 'Active');



-- VERIFY INSERTED COMPETENCIES


SELECT
    c.competency_id,
    cat.category_code,
    c.competency_code,
    c.competency_name,
    c.status
FROM tbl_competencies c
JOIN tbl_competency_categories cat
    ON c.category_id = cat.category_id
ORDER BY
    c.category_id,
    c.competency_id;


-- 2.6 CHECK DEMO OFFICES


SELECT *
FROM tbl_offices
ORDER BY office_id;

DESCRIBE tbl_positions;

-- 2.6 PREPARATION — ADD SALARY GRADE
ALTER TABLE tbl_positions

ADD COLUMN salary_grade INT NULL AFTER position_title;

DESCRIBE tbl_positions;


-- 2.6 INSERT DOST-CO POSITION PROFILES
-- Source: DOST CBHR Manual
-- DOST-CO Position Profile


INSERT INTO tbl_positions
    (
        position_code,
        position_title,
        salary_grade,
        description,
        department,
        employment_type,
        status
    )
VALUES

-- ============================================
-- SALARY GRADE 1–9
-- ============================================

('DOST-CO-P001', 'Administrative Aide I', 1,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P002', 'Administrative Aide IV', 4,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P003', 'Administrative Aide VI', 6,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P004', 'Communication Equipment Operator I', 6,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P005', 'Administrative Assistant I', 7,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P006', 'Administrative Assistant II', 8,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P007', 'Administrative Assistant III', 9,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P008', 'Metropol Supervisor I', 9,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

-- ============================================
-- SALARY GRADE 10–18
-- ============================================

('DOST-CO-P009', 'Administrative Officer I', 10,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P010', 'Administrative Assistant V', 11,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P011', 'Administrative Officer II', 11,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P012', 'Internal Auditor I', 11,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P013', 'Project Development Officer I', 11,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P014', 'Legal Assistant II', 12,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P015', 'Science Research Specialist I', 13,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P016', 'Administrative Officer III', 14,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P017', 'Administrative Officer IV', 15,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P018', 'Information Officer II', 15,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P019', 'Internal Auditor II', 15,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P020', 'Planning Officer I', 15,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P021', 'Project Development Officer II', 15,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P022', 'Security Officer I', 15,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P023', 'Senior Administrative Assistant III', 15,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P024', 'Science Research Specialist II', 16,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P025', 'Executive Assistant II', 17,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P026', 'Senior Administrative Assistant V', 18,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

-- ============================================
-- SALARY GRADE 18–22
-- ============================================

('DOST-CO-P027', 'Administrative Officer V', 18,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P028', 'Internal Auditor III', 18,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P029', 'International Science Relations Officer III', 18,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P030', 'Planning Officer III', 18,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P031', 'Project Development Officer III', 18,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P032', 'Engineer III', 19,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P033', 'Senior Science Research Specialist', 19,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P034', 'Executive Assistant III', 20,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P035', 'Attorney III', 21,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P036', 'Executive Assistant IV', 22,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P037', 'Internal Auditor IV', 22,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P038', 'International Science Relations Officer IV', 22,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P039', 'Planning Officer IV', 22,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P040', 'Project Development Officer IV', 22,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P041', 'Security Officer IV', 22,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P042', 'Supervising Administrative Officer', 22,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P043', 'Supervising Science Research Specialist', 22,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

-- ============================================
-- SALARY GRADE 23–25
-- ============================================

('DOST-CO-P044', 'Attorney IV', 23,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P045', 'Assistant Scientist', 24,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P046', 'Chief Accountant', 24,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P047', 'Chief Administrative Officer', 24,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P048', 'Chief Science Research Specialist', 24,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P049', 'Internal Auditor V', 24,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P050', 'Planning Officer V', 24,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P051', 'Project Development Officer V', 24,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P052', 'Associate Scientist', 25,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P053', 'Attorney V', 25,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

-- ============================================
-- SALARY GRADE 27–31
-- ============================================

('DOST-CO-P054', 'Head Executive Assistant', 27,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P055', 'Director II', 27,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P056', 'Director IV', 28,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P057', 'Department Asst. Secretary', 29,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P058', 'Department Undersecretary', 30,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active'),

('DOST-CO-P059', 'Department Secretary', 31,
 'DOST-CO position profile from the CBHR Manual.',
 NULL, NULL, 'Active');


-- ============================================
-- VERIFY INSERTED DOST POSITIONS
-- ============================================

SELECT
    position_id,
    position_code,
    position_title,
    salary_grade,
    department,
    employment_type,
    status
FROM tbl_positions
ORDER BY salary_grade, position_id;

DESCRIBE tbl_position_competencies;

SELECT *
FROM tbl_position_competencies
LIMIT 10;

-- ============================================
-- 2.7 INSERT POSITION-COMPETENCIES
-- Source: DOST-CO Position Profile
-- CBHR Manual - Table 1
-- ============================================

UPDATE tbl_positions
SET position_title = 'Motorpool Supervisor I'
WHERE position_code = 'DOST-CO-P008';
-- ============================================
-- 2.7A INSERT CORE COMPETENCY REQUIREMENTS
-- C1-C10
-- ============================================

INSERT INTO tbl_position_competencies
    (
        position_id,
        competency_id,
        required_level,
        priority
    )
SELECT
    p.position_id,
    c.competency_id,

    CASE
        -- Administrative Aide I through Administrative Assistant III
        WHEN p.position_code BETWEEN 'DOST-CO-P001' AND 'DOST-CO-P007'
            THEN 1

        -- Motorpool Supervisor I
        -- C1-C8 = Level 1
        -- C9-C10 = Level 2
        WHEN p.position_code = 'DOST-CO-P008'
            THEN
                CASE
                    WHEN c.competency_code IN ('C9', 'C10') THEN 2
                    ELSE 1
                END

        -- Administrative Officer I through
        -- Senior Administrative Assistant V
        WHEN p.position_code BETWEEN 'DOST-CO-P009' AND 'DOST-CO-P026'
            THEN 2

        -- Administrative Officer V through Attorney V
        WHEN p.position_code BETWEEN 'DOST-CO-P027' AND 'DOST-CO-P053'
            THEN 3

        -- Head Executive Assistant through
        -- Department Secretary
        WHEN p.position_code BETWEEN 'DOST-CO-P054' AND 'DOST-CO-P059'
            THEN 4
    END AS required_level,

    NULL AS priority

FROM tbl_positions p
CROSS JOIN tbl_competencies c
WHERE c.category_id = 1
  AND p.position_code BETWEEN 'DOST-CO-P001' AND 'DOST-CO-P059';


-- ============================================
-- 2.7B INSERT LEADERSHIP COMPETENCY REQUIREMENTS
-- L1-L7
-- ============================================

INSERT INTO tbl_position_competencies
    (
        position_id,
        competency_id,
        required_level,
        priority
    )
SELECT
    p.position_id,
    c.competency_id,

    CASE

        -- Administrative Officer V through
        -- Assistant Scientist
        -- L1-L7 = Level 1
        WHEN p.position_code BETWEEN 'DOST-CO-P027' AND 'DOST-CO-P045'
            THEN 1

        -- Chief Accountant through Attorney V
        --
        -- L1 = 1
        -- L2 = 2
        -- L3 = 2
        -- L4 = 2
        -- L5 = 1
        -- L6 = 2
        -- L7 = 2
        WHEN p.position_code BETWEEN 'DOST-CO-P046' AND 'DOST-CO-P053'
            THEN
                CASE
                    WHEN c.competency_code IN ('L1', 'L5') THEN 1
                    ELSE 2
                END

        -- Head Executive Assistant through Director IV
        --
        -- L1 = 2
        -- L2 = 3
        -- L3 = 3
        -- L4 = 3
        -- L5 = 2
        -- L6 = 3
        -- L7 = 3
        WHEN p.position_code BETWEEN 'DOST-CO-P054' AND 'DOST-CO-P056'
            THEN
                CASE
                    WHEN c.competency_code IN ('L1', 'L5') THEN 2
                    ELSE 3
                END

        -- Department Asst. Secretary
        -- L1-L7 = Level 3
        WHEN p.position_code = 'DOST-CO-P057'
            THEN 3

        -- Department Undersecretary
        -- Department Secretary
        -- L1-L7 = Level 4
        WHEN p.position_code BETWEEN 'DOST-CO-P058' AND 'DOST-CO-P059'
            THEN 4

    END AS required_level,

    NULL AS priority

FROM tbl_positions p
CROSS JOIN tbl_competencies c
WHERE c.category_id = 3
  AND p.position_code BETWEEN 'DOST-CO-P027' AND 'DOST-CO-P059';


-- ============================================
-- 2.7C VERIFY TOTAL POSITION-COMPETENCY RECORDS
-- ============================================

SELECT
    COUNT(*) AS total_position_competency_records
FROM tbl_position_competencies;


-- ============================================
-- 2.7D VERIFY BY COMPETENCY CATEGORY
-- ============================================

SELECT
    cat.category_code,
    COUNT(*) AS total_mappings
FROM tbl_position_competencies pc
JOIN tbl_competencies c
    ON pc.competency_id = c.competency_id
JOIN tbl_competency_categories cat
    ON c.category_id = cat.category_id
GROUP BY
    cat.category_code
ORDER BY
    cat.category_code;


-- ============================================
-- 2.7E VERIFY POSITION REQUIREMENTS
-- ============================================

SELECT
    p.position_code,
    p.position_title,
    p.salary_grade,
    cat.category_code,
    c.competency_code,
    c.competency_name,
    pc.required_level
FROM tbl_position_competencies pc
JOIN tbl_positions p
    ON pc.position_id = p.position_id
JOIN tbl_competencies c
    ON pc.competency_id = c.competency_id
JOIN tbl_competency_categories cat
    ON c.category_id = cat.category_id
ORDER BY
    p.position_id,
    cat.category_id,
    c.competency_id;

-- ============================================
-- 8.7 FIX — REMOVE DUPLICATE MAPPINGS
-- ============================================

DELETE FROM tbl_position_competencies;

-- Reset the auto-increment counter
ALTER TABLE tbl_position_competencies AUTO_INCREMENT = 1;

SELECT COUNT(*) AS total_records

FROM tbl_position_competencies;

-- ============================================
-- 2.7 INSERT POSITION-COMPETENCIES
-- Source: DOST-CO Position Profile
-- CBHR Manual - Table 1
-- ============================================


-- ============================================
-- 2.7A INSERT CORE COMPETENCY REQUIREMENTS
-- C1-C10
-- ============================================

INSERT INTO tbl_position_competencies
    (
        position_id,
        competency_id,
        required_level,
        priority
    )
SELECT
    p.position_id,
    c.competency_id,

    CASE
        -- Administrative Aide I through Administrative Assistant III
        WHEN p.position_code BETWEEN 'DOST-CO-P001' AND 'DOST-CO-P007'
            THEN 1

        -- Motorpool Supervisor I
        -- C1-C8 = Level 1
        -- C9-C10 = Level 2
        WHEN p.position_code = 'DOST-CO-P008'
            THEN
                CASE
                    WHEN c.competency_code IN ('C9', 'C10') THEN 2
                    ELSE 1
                END

        -- Administrative Officer I through
        -- Senior Administrative Assistant V
        WHEN p.position_code BETWEEN 'DOST-CO-P009' AND 'DOST-CO-P026'
            THEN 2

        -- Administrative Officer V through Attorney V
        WHEN p.position_code BETWEEN 'DOST-CO-P027' AND 'DOST-CO-P053'
            THEN 3

        -- Head Executive Assistant through
        -- Department Secretary
        WHEN p.position_code BETWEEN 'DOST-CO-P054' AND 'DOST-CO-P059'
            THEN 4
    END AS required_level,

    NULL AS priority

FROM tbl_positions p
CROSS JOIN tbl_competencies c
WHERE c.category_id = 1
  AND p.position_code BETWEEN 'DOST-CO-P001' AND 'DOST-CO-P059';


-- ============================================
-- 2.7B INSERT LEADERSHIP COMPETENCY REQUIREMENTS
-- L1-L7
-- ============================================

INSERT INTO tbl_position_competencies
    (
        position_id,
        competency_id,
        required_level,
        priority
    )
SELECT
    p.position_id,
    c.competency_id,

    CASE

        -- Administrative Officer V through
        -- Assistant Scientist
        -- L1-L7 = Level 1
        WHEN p.position_code BETWEEN 'DOST-CO-P027' AND 'DOST-CO-P045'
            THEN 1

        -- Chief Accountant through Attorney V
        --
        -- L1 = 1
        -- L2 = 2
        -- L3 = 2
        -- L4 = 2
        -- L5 = 1
        -- L6 = 2
        -- L7 = 2
        WHEN p.position_code BETWEEN 'DOST-CO-P046' AND 'DOST-CO-P053'
            THEN
                CASE
                    WHEN c.competency_code IN ('L1', 'L5') THEN 1
                    ELSE 2
                END

        -- Head Executive Assistant through Director IV
        --
        -- L1 = 2
        -- L2 = 3
        -- L3 = 3
        -- L4 = 3
        -- L5 = 2
        -- L6 = 3
        -- L7 = 3
        WHEN p.position_code BETWEEN 'DOST-CO-P054' AND 'DOST-CO-P056'
            THEN
                CASE
                    WHEN c.competency_code IN ('L1', 'L5') THEN 2
                    ELSE 3
                END

        -- Department Asst. Secretary
        -- L1-L7 = Level 3
        WHEN p.position_code = 'DOST-CO-P057'
            THEN 3

        -- Department Undersecretary
        -- Department Secretary
        -- L1-L7 = Level 4
        WHEN p.position_code BETWEEN 'DOST-CO-P058' AND 'DOST-CO-P059'
            THEN 4

    END AS required_level,

    NULL AS priority

FROM tbl_positions p
CROSS JOIN tbl_competencies c
WHERE c.category_id = 3
  AND p.position_code BETWEEN 'DOST-CO-P027' AND 'DOST-CO-P059';


-- ============================================
-- 2.7C VERIFY TOTAL POSITION-COMPETENCY RECORDS
-- ============================================

SELECT
    COUNT(*) AS total_position_competency_records
FROM tbl_position_competencies;


-- ============================================
-- 2.7D VERIFY BY COMPETENCY CATEGORY
-- ============================================

SELECT
    cat.category_code,
    COUNT(*) AS total_mappings
FROM tbl_position_competencies pc
JOIN tbl_competencies c
    ON pc.competency_id = c.competency_id
JOIN tbl_competency_categories cat
    ON c.category_id = cat.category_id
GROUP BY
    cat.category_code
ORDER BY
    cat.category_code;


-- ============================================
-- 2.7E VERIFY POSITION REQUIREMENTS
-- ============================================

SELECT
    p.position_code,
    p.position_title,
    p.salary_grade,
    cat.category_code,
    c.competency_code,
    c.competency_name,
    pc.required_level
FROM tbl_position_competencies pc
JOIN tbl_positions p
    ON pc.position_id = p.position_id
JOIN tbl_competencies c
    ON pc.competency_id = c.competency_id
JOIN tbl_competency_categories cat
    ON c.category_id = cat.category_id
ORDER BY
    p.position_id,
    cat.category_id,
    c.competency_id;



DESCRIBE tbl_employees;


SELECT *

FROM tbl_employees

LIMIT 10;

-- ============================================
-- 2.8 INSERT DEMO EMPLOYEES
-- ============================================

INSERT INTO tbl_employees
    (
        position_id,
        office_id,
        employee_no,
        first_name,
        middle_name,
        last_name,
        email,
        phone,
        date_hired,
        status
    )
VALUES
    (
        (SELECT position_id
         FROM tbl_positions
         WHERE position_code = 'DOST-CO-P001'),
        1,
        'DOST-EMP-001',
        'Juan',
        'Santos',
        'Dela Cruz',
        'juan.delacruz@dost.gov.ph',
        '09170000001',
        '2022-01-15',
        'Active'
    ),
    (
        (SELECT position_id
         FROM tbl_positions
         WHERE position_code = 'DOST-CO-P002'),
        2,
        'DOST-EMP-002',
        'Maria',
        'Lopez',
        'Santos',
        'maria.santos@dost.gov.ph',
        '09170000002',
        '2021-03-10',
        'Active'
    ),
    (
        (SELECT position_id
         FROM tbl_positions
         WHERE position_code = 'DOST-CO-P003'),
        3,
        'DOST-EMP-003',
        'Carlos',
        'Reyes',
        'Garcia',
        'carlos.garcia@dost.gov.ph',
        '09170000003',
        '2020-07-20',
        'Active'
    ),
    (
        (SELECT position_id
         FROM tbl_positions
         WHERE position_code = 'DOST-CO-P004'),
        4,
        'DOST-EMP-004',
        'Ana',
        'Mendoza',
        'Reyes',
        'ana.reyes@dost.gov.ph',
        '09170000004',
        '2019-11-05',
        'Active'
    ),
    (
        (SELECT position_id
         FROM tbl_positions
         WHERE position_code = 'DOST-CO-P005'),
        5,
        'DOST-EMP-005',
        'Jose',
        'Ramos',
        'Mendoza',
        'jose.mendoza@dost.gov.ph',
        '09170000005',
        '2018-06-18',
        'Active'
    ),
    (
        (SELECT position_id
         FROM tbl_positions
         WHERE position_code = 'DOST-CO-P006'),
        1,
        'DOST-EMP-006',
        'Elena',
        'Cruz',
        'Navarro',
        'elena.navarro@dost.gov.ph',
        '09170000006',
        '2023-02-01',
        'Active'
    ),
    (
        (SELECT position_id
         FROM tbl_positions
         WHERE position_code = 'DOST-CO-P007'),
        2,
        'DOST-EMP-007',
        'Robert',
        'Garcia',
        'Villanueva',
        'robert.villanueva@dost.gov.ph',
        '09170000007',
        '2022-08-15',
        'Active'
    ),
    (
        (SELECT position_id
         FROM tbl_positions
         WHERE position_code = 'DOST-CO-P008'),
        3,
        'DOST-EMP-008',
        'Liza',
        'Torres',
        'Aquino',
        'liza.aquino@dost.gov.ph',
        '09170000008',
        '2021-09-12',
        'Active'
    ),
    (
        (SELECT position_id
         FROM tbl_positions
         WHERE position_code = 'DOST-CO-P009'),
        4,
        'DOST-EMP-009',
        'Daniel',
        'Flores',
        'Castillo',
        'daniel.castillo@dost.gov.ph',
        '09170000009',
        '2020-04-27',
        'Active'
    ),
    (
        (SELECT position_id
         FROM tbl_positions
         WHERE position_code = 'DOST-CO-P010'),
        5,
        'DOST-EMP-010',
        'Sofia',
        'Bautista',
        'Fernandez',
        'sofia.fernandez@dost.gov.ph',
        '09170000010',
        '2023-05-08',
        'Active'
    );

-- ============================================
-- VERIFY INSERTED EMPLOYEES
-- ============================================

SELECT
    e.employee_id,
    e.employee_no,
    e.first_name,
    e.middle_name,
    e.last_name,
    e.email,
    o.office_name,
    p.position_code,
    p.position_title,
    p.salary_grade,
    e.status
FROM tbl_employees e
JOIN tbl_offices o
    ON e.office_id = o.office_id
JOIN tbl_positions p
    ON e.position_id = p.position_id
ORDER BY e.employee_id;

DESCRIBE tbl_employee_competencies;
SELECT *

FROM tbl_employee_competencies

LIMIT 10;

-- ============================================
-- 2.9 INSERT EMPLOYEE COMPETENCIES
-- ============================================

INSERT INTO tbl_employee_competencies
(
    employee_id,
    competency_id,
    current_level,
    evidence,
    last_updated,
    status
)
SELECT
    e.employee_id,
    pc.competency_id,

    /*
       Demo current proficiency level.

       The current level is intentionally varied
       around the required level so that the
       Gap Analysis can demonstrate:

       - Below required level
       - Meets required level
       - Above required level
    */
    CASE MOD(e.employee_id + c.competency_id, 3)

        WHEN 0 THEN
            pc.required_level

        WHEN 1 THEN
            GREATEST(pc.required_level - 1, 1)

        WHEN 2 THEN
            LEAST(pc.required_level + 1, 4)

    END AS current_level,

    CASE MOD(e.employee_id + c.competency_id, 3)

        WHEN 0 THEN
            'Demonstrates the required competency level.'

        WHEN 1 THEN
            'Development area identified below the required position level.'

        WHEN 2 THEN
            'Demonstrates competency above the required position level.'

    END AS evidence,

    CURDATE() AS last_updated,

    'Active' AS status

FROM tbl_employees e

JOIN tbl_position_competencies pc
    ON e.position_id = pc.position_id

JOIN tbl_competencies c
    ON pc.competency_id = c.competency_id

JOIN tbl_competency_categories cat
    ON c.category_id = cat.category_id

WHERE e.employee_id BETWEEN 1 AND 10
  AND cat.category_code = 'CORE';


-- ============================================
-- VERIFY TOTAL EMPLOYEE COMPETENCIES
-- ============================================

SELECT
    COUNT(*) AS total_employee_competency_records
FROM tbl_employee_competencies;


-- ============================================
-- VERIFY EMPLOYEE COMPETENCY PROFILE
-- ============================================

SELECT
    e.employee_no,
    CONCAT(
        e.first_name,
        ' ',
        e.last_name
    ) AS employee_name,

    p.position_title,

    c.competency_code,
    c.competency_name,

    pc.required_level,
    ec.current_level,

    CASE
        WHEN ec.current_level < pc.required_level
            THEN 'Gap'

        WHEN ec.current_level = pc.required_level
            THEN 'Meets Requirement'

        WHEN ec.current_level > pc.required_level
            THEN 'Exceeds Requirement'
    END AS competency_status,

    ec.evidence,
    ec.last_updated,
    ec.status

FROM tbl_employee_competencies ec

JOIN tbl_employees e
    ON ec.employee_id = e.employee_id

JOIN tbl_positions p
    ON e.position_id = p.position_id

JOIN tbl_competencies c
    ON ec.competency_id = c.competency_id

JOIN tbl_position_competencies pc
    ON pc.position_id = e.position_id
   AND pc.competency_id = ec.competency_id

ORDER BY
    e.employee_id,
    c.competency_id;

DESCRIBE tbl_gap_analyses;
DESCRIBE tbl_gap_analysis_results;
SELECT *

FROM tbl_gap_analyses

LIMIT 5;

SELECT *

FROM tbl_gap_analysis_results

LIMIT 5;

-- ============================================
-- 2.10A CREATE GAP ANALYSIS RECORDS
-- ============================================

INSERT INTO tbl_gap_analyses
(
    employee_id,
    position_id,
    analysis_date,
    status,
    remarks,
    created_by
)
SELECT
    e.employee_id,
    e.position_id,
    CURDATE(),
    'Completed',
    'Demo competency gap analysis for prototype testing.',
    NULL
FROM tbl_employees e
WHERE e.employee_id BETWEEN 1 AND 10;


-- VERIFY
SELECT
    gap_analysis_id,
    employee_id,
    position_id,
    analysis_date,
    status,
    remarks
FROM tbl_gap_analyses
ORDER BY gap_analysis_id;

-- ============================================
-- 2.10B CREATE GAP ANALYSIS RESULTS
-- ============================================

INSERT INTO tbl_gap_analysis_results
(
    gap_analysis_id,
    competency_id,
    required_level,
    current_level,
    gap_level,
    status,
    remarks
)
SELECT
    ga.gap_analysis_id,
    ec.competency_id,

    pc.required_level,

    ec.current_level,

    /*
       GAP CALCULATION

       Positive  = competency gap
       Zero      = meets requirement
       Negative  = exceeds requirement
    */
    (pc.required_level - ec.current_level) AS gap_level,

    CASE
        WHEN ec.current_level < pc.required_level
            THEN 'Gap'

        WHEN ec.current_level = pc.required_level
            THEN 'Meets Requirement'

        WHEN ec.current_level > pc.required_level
            THEN 'Exceeds Requirement'
    END AS status,

    CASE
        WHEN ec.current_level < pc.required_level
            THEN 'Current competency level is below the required position level.'

        WHEN ec.current_level = pc.required_level
            THEN 'Current competency level meets the required position level.'

        WHEN ec.current_level > pc.required_level
            THEN 'Current competency level exceeds the required position level.'
    END AS remarks

FROM tbl_gap_analyses ga

JOIN tbl_employee_competencies ec
    ON ga.employee_id = ec.employee_id

JOIN tbl_position_competencies pc
    ON ga.position_id = pc.position_id
   AND ec.competency_id = pc.competency_id

WHERE ga.employee_id BETWEEN 1 AND 10;


-- VERIFY TOTAL RESULTS
SELECT
    COUNT(*) AS total_gap_analysis_results
FROM tbl_gap_analysis_results;


-- ============================================
-- 2.10C VERIFY GAP ANALYSIS RESULTS
-- ============================================

SELECT
    ga.gap_analysis_id,

    e.employee_no,

    CONCAT(
        e.first_name,
        ' ',
        e.last_name
    ) AS employee_name,

    p.position_title,

    c.competency_code,

    c.competency_name,

    gar.required_level,

    gar.current_level,

    gar.gap_level,

    gar.status,

    gar.remarks

FROM tbl_gap_analysis_results gar

JOIN tbl_gap_analyses ga
    ON gar.gap_analysis_id = ga.gap_analysis_id

JOIN tbl_employees e
    ON ga.employee_id = e.employee_id

JOIN tbl_positions p
    ON ga.position_id = p.position_id

JOIN tbl_competencies c
    ON gar.competency_id = c.competency_id

ORDER BY
    e.employee_id,
    c.competency_id;

 -- ============================================
-- 2.10D GAP ANALYSIS SUMMARY
-- ============================================

SELECT
    e.employee_no,

    CONCAT(
        e.first_name,
        ' ',
        e.last_name
    ) AS employee_name,

    p.position_title,

    COUNT(*) AS total_competencies,

    SUM(
        CASE
            WHEN gar.status = 'Gap'
            THEN 1
            ELSE 0
        END
    ) AS competency_gaps,

    SUM(
        CASE
            WHEN gar.status = 'Meets Requirement'
            THEN 1
            ELSE 0
        END
    ) AS competencies_meeting_requirement,

    SUM(
        CASE
            WHEN gar.status = 'Exceeds Requirement'
            THEN 1
            ELSE 0
        END
    ) AS competencies_exceeding_requirement

FROM tbl_gap_analysis_results gar

JOIN tbl_gap_analyses ga
    ON gar.gap_analysis_id = ga.gap_analysis_id

JOIN tbl_employees e
    ON ga.employee_id = e.employee_id

JOIN tbl_positions p
    ON ga.position_id = p.position_id

GROUP BY
    e.employee_id,
    e.employee_no,
    e.first_name,
    e.last_name,
    p.position_title

ORDER BY
    e.employee_id;


-- ============================================
-- 2.11 TEST HISTORICAL GAP ANALYSIS
-- ============================================

-- Create a second gap analysis for demo employee 1
INSERT INTO tbl_gap_analyses
(
    employee_id,
    position_id,
    analysis_date,
    status,
    remarks,
    created_by
)
SELECT
    employee_id,
    position_id,
    DATE_ADD(analysis_date, INTERVAL 1 MONTH),
    'Completed',
    'Second demo gap analysis for historical record testing.',
    NULL
FROM tbl_gap_analyses
WHERE gap_analysis_id = 1;

-- Get the newly created analysis ID
SET @new_gap_analysis_id = LAST_INSERT_ID();

-- Create the competency results for the second analysis
INSERT INTO tbl_gap_analysis_results
(
    gap_analysis_id,
    competency_id,
    required_level,
    current_level,
    gap_level,
    status,
    remarks
)
SELECT
    @new_gap_analysis_id,
    ec.competency_id,
    pc.required_level,
    ec.current_level,
    pc.required_level - ec.current_level,

    CASE
        WHEN pc.required_level - ec.current_level > 0
            THEN 'Gap'
        WHEN pc.required_level - ec.current_level = 0
            THEN 'Meets Requirement'
        ELSE 'Exceeds Requirement'
    END,

    'Historical gap analysis test result.'
FROM tbl_employee_competencies ec
JOIN tbl_gap_analyses ga
    ON ga.employee_id = ec.employee_id
JOIN tbl_position_competencies pc
    ON pc.position_id = ga.position_id
    AND pc.competency_id = ec.competency_id
WHERE ga.gap_analysis_id = @new_gap_analysis_id;


-- ============================================
-- VERIFY HISTORICAL RECORDS
-- ============================================

SELECT
    ga.gap_analysis_id,
    e.employee_no,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    p.position_title,
    ga.analysis_date,
    ga.status,
    COUNT(gar.gap_analysis_result_id) AS total_results
FROM tbl_gap_analyses ga
JOIN tbl_employees e
    ON ga.employee_id = e.employee_id
JOIN tbl_positions p
    ON ga.position_id = p.position_id
LEFT JOIN tbl_gap_analysis_results gar
    ON ga.gap_analysis_id = gar.gap_analysis_id
WHERE ga.employee_id = 1
GROUP BY
    ga.gap_analysis_id,
    e.employee_no,
    e.first_name,
    e.last_name,
    p.position_title,
    ga.analysis_date,
    ga.status
ORDER BY ga.analysis_date;


-- ============================================
-- 2.12 DATABASE INTEGRITY CHECKS
-- ============================================

-- --------------------------------------------
-- 2.12.1 CHECK DUPLICATE POSITION-COMPETENCY MAPPINGS
-- --------------------------------------------

SELECT
    position_id,
    competency_id,
    COUNT(*) AS duplicate_count
FROM tbl_position_competencies
GROUP BY
    position_id,
    competency_id
HAVING COUNT(*) > 1;


-- --------------------------------------------
-- 2.12.2 CHECK DUPLICATE EMPLOYEE-COMPETENCY RECORDS
-- --------------------------------------------

SELECT
    employee_id,
    competency_id,
    COUNT(*) AS duplicate_count
FROM tbl_employee_competencies
GROUP BY
    employee_id,
    competency_id
HAVING COUNT(*) > 1;


-- --------------------------------------------
-- 2.12.3 CHECK INVALID CURRENT COMPETENCY LEVELS
-- Valid levels: 1–4
-- --------------------------------------------

SELECT *
FROM tbl_employee_competencies
WHERE current_level NOT BETWEEN 1 AND 4;


-- --------------------------------------------
-- 2.12.4 CHECK INVALID REQUIRED COMPETENCY LEVELS
-- Valid levels: 1–4
-- --------------------------------------------

SELECT *
FROM tbl_position_competencies
WHERE required_level NOT BETWEEN 1 AND 4;


-- --------------------------------------------
-- 8.12.5 CHECK EMPLOYEES WITH INVALID POSITION
-- --------------------------------------------

SELECT
    e.employee_id,
    e.employee_no,
    e.position_id
FROM tbl_employees e
LEFT JOIN tbl_positions p
    ON e.position_id = p.position_id
WHERE p.position_id IS NULL;


-- --------------------------------------------
-- 2.12.6 CHECK EMPLOYEES WITH INVALID OFFICE
-- --------------------------------------------

SELECT
    e.employee_id,
    e.employee_no,
    e.office_id
FROM tbl_employees e
LEFT JOIN tbl_offices o
    ON e.office_id = o.office_id
WHERE o.office_id IS NULL;


-- --------------------------------------------
-- 2.12.7 CHECK ORPHAN EMPLOYEE COMPETENCY RECORDS
-- --------------------------------------------

SELECT
    ec.employee_competency_id,
    ec.employee_id,
    ec.competency_id
FROM tbl_employee_competencies ec
LEFT JOIN tbl_employees e
    ON ec.employee_id = e.employee_id
LEFT JOIN tbl_competencies c
    ON ec.competency_id = c.competency_id
WHERE e.employee_id IS NULL
   OR c.competency_id IS NULL;


-- --------------------------------------------
-- 2.12.8 CHECK ORPHAN POSITION COMPETENCY RECORDS
-- --------------------------------------------

SELECT
    pc.position_competency_id,
    pc.position_id,
    pc.competency_id
FROM tbl_position_competencies pc
LEFT JOIN tbl_positions p
    ON pc.position_id = p.position_id
LEFT JOIN tbl_competencies c
    ON pc.competency_id = c.competency_id
WHERE p.position_id IS NULL
   OR c.competency_id IS NULL;


-- --------------------------------------------
-- 2.12.9 CHECK ORPHAN GAP ANALYSIS RECORDS
-- --------------------------------------------

SELECT
    ga.gap_analysis_id,
    ga.employee_id,
    ga.position_id
FROM tbl_gap_analyses ga
LEFT JOIN tbl_employees e
    ON ga.employee_id = e.employee_id
LEFT JOIN tbl_positions p
    ON ga.position_id = p.position_id
WHERE e.employee_id IS NULL
   OR p.position_id IS NULL;


-- --------------------------------------------
-- 2.12.10 CHECK ORPHAN GAP ANALYSIS RESULTS
-- --------------------------------------------

SELECT
    gar.gap_analysis_result_id,
    gar.gap_analysis_id,
    gar.competency_id
FROM tbl_gap_analysis_results gar
LEFT JOIN tbl_gap_analyses ga
    ON gar.gap_analysis_id = ga.gap_analysis_id
LEFT JOIN tbl_competencies c
    ON gar.competency_id = c.competency_id
WHERE ga.gap_analysis_id IS NULL
   OR c.competency_id IS NULL;

-- ============================================
-- 3 FINAL DATABASE SUMMARY
-- ============================================

SELECT 'tbl_roles' AS table_name, COUNT(*) AS total_records
FROM tbl_roles

UNION ALL

SELECT 'tbl_users', COUNT(*)
FROM tbl_users

UNION ALL

SELECT 'tbl_offices', COUNT(*)
FROM tbl_offices

UNION ALL

SELECT 'tbl_positions', COUNT(*)
FROM tbl_positions

UNION ALL

SELECT 'tbl_competency_categories', COUNT(*)
FROM tbl_competency_categories

UNION ALL

SELECT 'tbl_proficiency_levels', COUNT(*)
FROM tbl_proficiency_levels

UNION ALL

SELECT 'tbl_competencies', COUNT(*)
FROM tbl_competencies

UNION ALL

SELECT 'tbl_position_competencies', COUNT(*)
FROM tbl_position_competencies

UNION ALL

SELECT 'tbl_employees', COUNT(*)
FROM tbl_employees

UNION ALL

SELECT 'tbl_employee_competencies', COUNT(*)
FROM tbl_employee_competencies

UNION ALL

SELECT 'tbl_gap_analyses', COUNT(*)
FROM tbl_gap_analyses

UNION ALL

SELECT 'tbl_gap_analysis_results', COUNT(*)
FROM tbl_gap_analysis_results

UNION ALL

SELECT 'tbl_historical_records', COUNT(*)
FROM tbl_historical_records

UNION ALL

SELECT 'tbl_behavioral_indicators', COUNT(*)
FROM tbl_behavioral_indicators

ORDER BY table_name;



DESCRIBE tbl_behavioral_indicators;

SELECT *

FROM tbl_behavioral_indicators

LIMIT 5;