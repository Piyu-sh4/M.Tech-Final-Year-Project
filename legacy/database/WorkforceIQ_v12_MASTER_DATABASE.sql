-- ==========================================================================================
-- WorkforceIQ v12.0 — COMBINED MASTER DATABASE FILE
-- Generated: 2026-07-10 09:23:03
-- Description: All migrations, schema and seed data combined in execution order
-- Total files: 26
-- ==========================================================================================
--
-- ⚠️  EXECUTION ORDER IS CRITICAL — run this file once on a fresh database
-- ⚠️  Do NOT run individual migration files after running this combined file
--
-- DEFAULT CREDENTIALS (change before production):
--   Admin:    admin@workforceiq.com   / P123/
--   HR:       hr@workforceiq.com      / P123/
--   Manager:  manager@workforceiq.com / P123/
--   Employee: employee@workforceiq.com / P123/
--
-- ==========================================================================================

-- ── DATABASE SETUP ──────────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS workforceiq_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE workforceiq_db;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+05:30';

-- ==========================================================================================
-- TABLE OF CONTENTS
-- ==========================================================================================
-- 01. FILE: schema.sql
--     SECTION: CORE SCHEMA
--     DESCRIPTION: Foundation tables: users, departments, roles, salaries, leaves, attendance, performance, assets, announcements, notifications, audit_logs, training, tasks, OKR/goals, career roadmap, benefits, banking, org_chart — 25 tables
--
-- 02. FILE: migrate_v5.sql
--     SECTION: v5 MIGRATION
--     DESCRIPTION: Salary components, payroll runs, tax declarations, PF/ESI records, PT slabs — 4 tables
--
-- 03. FILE: migrate_v5.1.sql
--     SECTION: v5.1 MIGRATION
--     DESCRIPTION: Salary advance & loan repayment tracking — ALTER additions
--
-- 04. FILE: migrate_v6.0.sql
--     SECTION: v6.0 MIGRATION
--     DESCRIPTION: Gratuity records, shift management, WFH tracker — schema additions
--
-- 05. FILE: migrate_v8.sql
--     SECTION: v8 MIGRATION
--     DESCRIPTION: Helpdesk tickets, loan portal, credit score, travel & expense claims, cab management — 11 tables
--
-- 06. FILE: migrate_v8_new_modules.sql
--     SECTION: v8 NEW MODULES
--     DESCRIPTION: Dependents & insurance, family transfers, hiring/ATS, onboarding, regularization, disciplinary — 11 tables
--
-- 07. FILE: migrate_v9.sql
--     SECTION: v9 MIGRATION
--     DESCRIPTION: Projects & milestones, notifications system, Socket.io events, employee grades, probation tracking — 12 tables
--
-- 08. FILE: migrate_v10_registration.sql
--     SECTION: v10 REGISTRATION
--     DESCRIPTION: Multi-step employee registration tracker, registration sessions — ALTER additions
--
-- 09. FILE: migrate_v11.sql
--     SECTION: v11 MIGRATION
--     DESCRIPTION: HR calendar events, 360-feedback, awards & recognition, diversity metrics, ID card management, workforce planning, policy library — 13 tables
--
-- 10. FILE: migrate_v12_hiring.sql
--     SECTION: v12 HIRING MODULE
--     DESCRIPTION: Job postings, candidates, interview rounds, offer letters, referrals, fresher vs experience pipeline — 11 tables
--
-- 11. FILE: migrate_v12_location.sql
--     SECTION: v12 LOCATION MODULE
--     DESCRIPTION: Login location logs, weather snapshots, cab route coordinates — 3 tables
--
-- 12. FILE: migrate_v12_missing.sql
--     SECTION: v12 MISSING TABLES
--     DESCRIPTION: Document vault, grievances, headcount snapshots, OKR/goals detailed, pulse survey, POSH complaints, session management, salary revision — 16 tables
--
-- 13. FILE: migrate_v12_missing2.sql
--     SECTION: v12 MISSING v2
--     DESCRIPTION: Shift roster, WFH requests, letter management, policy acknowledgements, LWF deductions, statutory bonus register — 7 tables
--
-- 14. FILE: migrate_v13_uploads.sql
--     SECTION: v13 UPLOADS
--     DESCRIPTION: Employee documents (multerShim), company policies, policy upload logs — 3 tables
--
-- 15. FILE: migrate_v14_2026.sql
--     SECTION: v14 FY2026-27 MODULE
--     DESCRIPTION: Investment declarations, Form 12BB items, pulse survey responses, POSH training, user session tokens, login history, salary revision history, minimum wages (seeded Jan 2026), payslip access log, data consents (DPDP Act 2023), HR letters (8 types), exit documents — 14 tables
--
-- 16. FILE: migrate_cab.sql
--     SECTION: CAB MODULE
--     DESCRIPTION: Cab drivers, cab issues, SOS alerts — 3 tables
--
-- 17. FILE: migrate_cab_v2.sql
--     SECTION: CAB MODULE v2
--     DESCRIPTION: Extended cab tracking, driver ratings, CSAT, route management, emergency center — 5 tables
--
-- 18. FILE: migrate_meetings.sql
--     SECTION: MEETINGS MODULE
--     DESCRIPTION: Meetings, meeting attendees, meeting recordings, video conference links, agenda items — 6 tables
--
-- 19. FILE: migrate_profile_bank.sql
--     SECTION: PROFILE & BANKING
--     DESCRIPTION: Bank account details, IFSC lookup, account verification — ALTER additions
--
-- 20. FILE: migrate_route_coords.sql
--     SECTION: ROUTE COORDINATES
--     DESCRIPTION: GPS waypoints for cab routes — coordinate storage
--
-- 21. FILE: sem4_migrations.sql
--     SECTION: SEM4 EXTRAS
--     DESCRIPTION: Time tracker sessions, billable hours log, timesheet approvals — 3 tables
--
-- 22. FILE: workforce_intelligence_COMPLETE.sql
--     SECTION: AI WORKFORCE INTELLIGENCE
--     DESCRIPTION: AI prediction models, attrition risk scores, burnout index, salary benchmarks, workforce forecasts, skill gap analysis — 26 tables
--
-- 23. FILE: seed_admin.sql
--     SECTION: SEED: ADMIN USER
--     DESCRIPTION: Default admin, HR, manager, employee credentials — 4 seed users
--
-- 24. FILE: seed_demo_data.sql
--     SECTION: SEED: DEMO DATA
--     DESCRIPTION: Full demo dataset: 30+ employees, departments, leaves, payroll, attendance, assets, helpdesk tickets
--
-- 25. FILE: seed_all_employees.sql
--     SECTION: SEED: ALL EMPLOYEES
--     DESCRIPTION: Complete employee roster with profiles, salaries, bank details, PF/ESI/UAN data
--
-- 26. FILE: seed_piyush_sharma.sql
--     SECTION: SEED: PIYUSH SHARMA
--     DESCRIPTION: Additional employee seed data with extended profile
--

-- ==========================================================================================

-- ==========================================================================================
-- FILE 01/26: schema.sql
-- SECTION: CORE SCHEMA
-- DESCRIPTION: Foundation tables: users, departments, roles, salaries, leaves, attendance, performance, assets, announcements, notifications, audit_logs, training, tasks, OKR/goals, career roadmap, benefits, banking, org_chart — 25 tables
-- TABLES: 25 | LINES: 381
-- ==========================================================================================

-- ============================================================
-- schema.sql FIXED -- All 25 tables, all columns
-- Safe to run multiple times (IF NOT EXISTS everywhere)
-- ============================================================


CREATE TABLE IF NOT EXISTS roles (
  role_id   INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
);
INSERT IGNORE INTO roles (role_name) VALUES ('Admin'),('Employee'),('Manager'),('HR');

CREATE TABLE IF NOT EXISTS departments (
  dept_id     INT AUTO_INCREMENT PRIMARY KEY,
  dept_name   VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  manager_id  INT DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shifts (
  shift_id      INT AUTO_INCREMENT PRIMARY KEY,
  shift_name    VARCHAR(100) NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  grace_minutes INT DEFAULT 10,
  working_hours DECIMAL(4,2) GENERATED ALWAYS AS (MOD(TIME_TO_SEC(end_time)-TIME_TO_SEC(start_time)+86400,86400)/3600) STORED,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT IGNORE INTO shifts (shift_name,start_time,end_time,grace_minutes) VALUES
  ('Morning Shift','09:00:00','18:00:00',15),
  ('Evening Shift','14:00:00','23:00:00',15),
  ('Night Shift',  '22:00:00','07:00:00',10),
  ('Half Day (AM)','09:00:00','13:00:00',10),
  ('Half Day (PM)','14:00:00','18:00:00',10);

-- ALL v6 columns included here from the start
CREATE TABLE IF NOT EXISTS users (
  user_id           INT           AUTO_INCREMENT PRIMARY KEY,
  full_name         VARCHAR(100)  NOT NULL,
  email             VARCHAR(100)  NOT NULL UNIQUE,
  password_hash     VARCHAR(255)  NOT NULL,
  role_id           INT           NOT NULL,
  access_level      INT           DEFAULT 1,
  total_points      INT           DEFAULT 0,
  status            ENUM('pending','active','suspended') DEFAULT 'active',
  department_id     INT           DEFAULT NULL,
  base_salary       DECIMAL(12,2) DEFAULT 0.00,
  phone             VARCHAR(20)   DEFAULT NULL,
  profile_notes     TEXT          DEFAULT NULL,
  last_login        DATETIME      DEFAULT NULL,
  designation       VARCHAR(100)  DEFAULT NULL,
  join_date         DATE          DEFAULT NULL,
  date_of_birth     DATE          DEFAULT NULL,
  address           TEXT          DEFAULT NULL,
  emergency_contact VARCHAR(150)  DEFAULT NULL,
  gender            ENUM('male','female','other','prefer_not_to_say') DEFAULT NULL,
  employment_type   ENUM('full_time','part_time','contract','intern') DEFAULT 'full_time',
  shift_id          INT           DEFAULT NULL,
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id)       REFERENCES roles(role_id),
  FOREIGN KEY (department_id) REFERENCES departments(dept_id) ON DELETE SET NULL,
  FOREIGN KEY (shift_id)      REFERENCES shifts(shift_id)     ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  task_id               INT AUTO_INCREMENT PRIMARY KEY,
  title                 VARCHAR(150) NOT NULL,
  description           TEXT,
  voice_note_path       VARCHAR(255) DEFAULT NULL,
  written_note          TEXT         DEFAULT NULL,
  assigned_by           INT          NOT NULL,
  assigned_to           INT          NOT NULL,
  priority              ENUM('Low','Medium','High') DEFAULT 'Medium',
  status                ENUM('Pending','In Progress','Completed','Overdue') DEFAULT 'Pending',
  due_date              DATE,
  timer_deadline        DATETIME     DEFAULT NULL,
  timer_hours           INT          DEFAULT NULL,
  extension_requested   BOOLEAN      DEFAULT FALSE,
  extension_hours       INT          DEFAULT NULL,
  extension_reason      TEXT         DEFAULT NULL,
  extension_status      ENUM('none','pending','approved','rejected') DEFAULT 'none',
  extension_reviewed_by INT          DEFAULT NULL,
  extension_reviewed_at DATETIME     DEFAULT NULL,
  achievement_level     ENUM('none','good','excellent','outstanding') DEFAULT 'none',
  completed_at          DATETIME     DEFAULT NULL,
  updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_by) REFERENCES users(user_id),
  FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS task_logs (
  log_id     INT AUTO_INCREMENT PRIMARY KEY,
  task_id    INT         NOT NULL,
  status     VARCHAR(50) NOT NULL,
  remarks    TEXT,
  updated_by INT         NOT NULL,
  updated_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id)    REFERENCES tasks(task_id)  ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS task_comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  task_id    INT       NOT NULL,
  user_id    INT       NOT NULL,
  comment    TEXT      NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS task_suggestions (
  suggestion_id INT AUTO_INCREMENT PRIMARY KEY,
  task_id       INT  NOT NULL,
  user_id       INT  NOT NULL,
  suggestion    TEXT NOT NULL,
  source        ENUM('ai','manager','system') DEFAULT 'ai',
  is_read       BOOLEAN   DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS achievements (
  achievement_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  task_id          INT DEFAULT NULL,
  achievement_type ENUM('task_complete','daily_star','weekly_star','monthly_star','annual_star') NOT NULL,
  level            ENUM('good','excellent','outstanding') DEFAULT 'good',
  points           INT       DEFAULT 10,
  message          TEXT,
  awarded_by       INT       DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id),
  FOREIGN KEY (task_id)    REFERENCES tasks(task_id),
  FOREIGN KEY (awarded_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS productivity_scores (
  score_id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT          NOT NULL,
  score_date         DATE         NOT NULL,
  completion_rate    DECIMAL(5,2) DEFAULT 0,
  delay_count        INT          DEFAULT 0,
  productivity_score DECIMAL(5,2) DEFAULT 0,
  UNIQUE KEY uq_user_month (user_id, score_date),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS alerts (
  alert_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT         DEFAULT NULL,
  task_id       INT         DEFAULT NULL,
  alert_message TEXT        NOT NULL,
  alert_type    VARCHAR(50) DEFAULT 'general',
  is_read       BOOLEAN     DEFAULT FALSE,
  created_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reports (
  report_id    INT AUTO_INCREMENT PRIMARY KEY,
  report_title VARCHAR(150) NOT NULL,
  report_type  VARCHAR(50),
  period       VARCHAR(50)  DEFAULT 'custom',
  status       ENUM('draft','published') DEFAULT 'published',
  generated_by INT          DEFAULT NULL,
  report_date  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  summary      TEXT,
  report_data  JSON,
  FOREIGN KEY (generated_by) REFERENCES users(user_id)
);

-- Attendance with OT columns built in
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id INT          AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL,
  work_date     DATE         NOT NULL,
  clock_in      DATETIME     DEFAULT NULL,
  clock_out     DATETIME     DEFAULT NULL,
  status        ENUM('present','absent','half_day','late','leave') DEFAULT 'present',
  total_hours   DECIMAL(4,2) DEFAULT NULL,
  ot_hours      DECIMAL(4,2) DEFAULT 0.00,
  remarks       TEXT         DEFAULT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_date (user_id, work_date),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS salary_components (
  component_id   INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  component_type ENUM('earning','deduction') NOT NULL,
  is_taxable     BOOLEAN DEFAULT FALSE,
  is_statutory   BOOLEAN DEFAULT FALSE,
  description    TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT IGNORE INTO salary_components (name,component_type,is_taxable,is_statutory,description) VALUES
  ('Basic Salary','earning',TRUE,FALSE,'Core fixed salary'),
  ('HRA','earning',TRUE,FALSE,'House Rent Allowance'),
  ('Travel Allowance','earning',FALSE,FALSE,'Conveyance allowance'),
  ('Medical Allowance','earning',FALSE,FALSE,'Medical benefit'),
  ('Special Allowance','earning',TRUE,FALSE,'Performance allowance'),
  ('Provident Fund','deduction',FALSE,TRUE,'PF 12% of basic'),
  ('ESI','deduction',FALSE,TRUE,'ESI 0.75% of gross'),
  ('Professional Tax','deduction',FALSE,TRUE,'State professional tax'),
  ('TDS','deduction',FALSE,TRUE,'Tax Deducted at Source'),
  ('Leave Deduction','deduction',FALSE,FALSE,'Absent-day deduction'),
  ('Advance Deduction','deduction',FALSE,FALSE,'Salary advance recovery');

CREATE TABLE IF NOT EXISTS salary_records (
  salary_id      INT           AUTO_INCREMENT PRIMARY KEY,
  user_id        INT           NOT NULL,
  month          INT           NOT NULL,
  year           INT           NOT NULL,
  base_salary    DECIMAL(12,2) DEFAULT 0.00,
  bonus          DECIMAL(12,2) DEFAULT 0.00,
  deductions     DECIMAL(12,2) DEFAULT 0.00,
  net_salary     DECIMAL(12,2) DEFAULT 0.00,
  payment_status ENUM('pending','paid') DEFAULT 'pending',
  paid_on        DATE          DEFAULT NULL,
  remarks        TEXT          DEFAULT NULL,
  created_by     INT           DEFAULT NULL,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_month_year (user_id, month, year),
  FOREIGN KEY (user_id)    REFERENCES users(user_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS salary_line_items (
  item_id      INT           AUTO_INCREMENT PRIMARY KEY,
  salary_id    INT           NOT NULL,
  component_id INT           NOT NULL,
  amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (salary_id)    REFERENCES salary_records(salary_id) ON DELETE CASCADE,
  FOREIGN KEY (component_id) REFERENCES salary_components(component_id)
);

CREATE TABLE IF NOT EXISTS salary_advances (
  advance_id    INT           AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  reason        TEXT,
  status        ENUM('pending','approved','rejected','repaid') DEFAULT 'pending',
  approved_by   INT           DEFAULT NULL,
  approved_at   DATETIME      DEFAULT NULL,
  repay_months  INT           DEFAULT 1,
  repaid_amount DECIMAL(12,2) DEFAULT 0.00,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id),
  FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS salary_revisions (
  revision_id    INT           AUTO_INCREMENT PRIMARY KEY,
  user_id        INT           NOT NULL,
  old_salary     DECIMAL(12,2),
  new_salary     DECIMAL(12,2),
  effective_date DATE          NOT NULL,
  reason         TEXT,
  revised_by     INT           DEFAULT NULL,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id),
  FOREIGN KEY (revised_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  perm_id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id               INT NOT NULL UNIQUE,
  can_view_analytics    BOOLEAN DEFAULT TRUE,
  can_view_reports      BOOLEAN DEFAULT TRUE,
  can_use_chat          BOOLEAN DEFAULT TRUE,
  can_request_extension BOOLEAN DEFAULT TRUE,
  can_view_salary       BOOLEAN DEFAULT TRUE,
  can_view_team         BOOLEAN DEFAULT TRUE,
  can_view_attendance   BOOLEAN DEFAULT TRUE,
  can_clock_in_out      BOOLEAN DEFAULT TRUE,
  can_request_advance   BOOLEAN DEFAULT FALSE,
  updated_by            INT     DEFAULT NULL,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  leave_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  leave_type    ENUM('sick','casual','earned','unpaid','other','half_day') DEFAULT 'casual',
  from_date     DATE NOT NULL,
  to_date       DATE NOT NULL,
  days          DECIMAL(5,1) DEFAULT 1,
  reason        TEXT,
  status        ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
  reviewed_by   INT  DEFAULT NULL,
  reviewed_at   DATETIME DEFAULT NULL,
  reject_reason TEXT DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id),
  FOREIGN KEY (reviewed_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS leave_balances (
  balance_id    INT          AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL,
  year          INT          NOT NULL,
  leave_type    ENUM('sick','casual','earned','unpaid','other') NOT NULL,
  entitled      DECIMAL(5,1) DEFAULT 0,
  taken         DECIMAL(5,1) DEFAULT 0,
  pending       DECIMAL(5,1) DEFAULT 0,
  remaining     DECIMAL(5,1) GENERATED ALWAYS AS (entitled - taken) STORED,
  carry_forward DECIMAL(5,1) DEFAULT 0,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_year_type (user_id, year, leave_type),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS holiday_calendar (
  holiday_id   INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  holiday_date DATE         NOT NULL UNIQUE,
  holiday_type ENUM('public','company','optional') DEFAULT 'public',
  description  TEXT,
  created_by   INT DEFAULT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id      INT          AUTO_INCREMENT PRIMARY KEY,
  actor_id    INT          DEFAULT NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(60)  NOT NULL,
  entity_id   INT          DEFAULT NULL,
  old_values  JSON         DEFAULT NULL,
  new_values  JSON         DEFAULT NULL,
  ip_address  VARCHAR(45)  DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS employee_documents (
  doc_id      INT          AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  doc_type    ENUM('offer_letter','contract','id_proof','certificate','other') DEFAULT 'other',
  doc_name    VARCHAR(200) NOT NULL,
  file_path   VARCHAR(500) NOT NULL,
  uploaded_by INT          DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS expense_claims (
  claim_id     INT           AUTO_INCREMENT PRIMARY KEY,
  user_id      INT           NOT NULL,
  claim_date   DATE          NOT NULL,
  category     ENUM('travel','food','medical','equipment','other') DEFAULT 'other',
  amount       DECIMAL(12,2) NOT NULL,
  description  TEXT,
  receipt_path VARCHAR(500)  DEFAULT NULL,
  status       ENUM('pending','approved','rejected','paid') DEFAULT 'pending',
  reviewed_by  INT           DEFAULT NULL,
  reviewed_at  DATETIME      DEFAULT NULL,
  paid_on      DATE          DEFAULT NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id),
  FOREIGN KEY (reviewed_by) REFERENCES users(user_id)
);

ALTER TABLE departments
  ADD CONSTRAINT IF NOT EXISTS fk_dept_manager
  FOREIGN KEY (manager_id) REFERENCES users(user_id) ON DELETE SET NULL;

SELECT 'schema.sql v6.0 loaded -- 25 tables ✅' AS result;

-- END OF FILE: schema.sql

-- ==========================================================================================
-- FILE 02/26: migrate_v5.sql
-- SECTION: v5 MIGRATION
-- DESCRIPTION: Salary components, payroll runs, tax declarations, PF/ESI records, PT slabs — 4 tables
-- TABLES: 4 | LINES: 88
-- ==========================================================================================

-- ============================================================
-- BASE MIGRATION SCRIPT (required before v5.1 migration)
-- Run this first when setting up on an existing database
-- Safe to run multiple times (uses IF NOT EXISTS / IGNORE)
-- ============================================================
-- USE statement removed (handled at top)

-- Add new columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status ENUM('pending','active','suspended') DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS department_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS base_salary DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS profile_notes TEXT DEFAULT NULL;

-- Set all existing users to active
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Departments / Teams
CREATE TABLE IF NOT EXISTS departments (
  dept_id     INT AUTO_INCREMENT PRIMARY KEY,
  dept_name   VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  manager_id  INT DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  work_date     DATE NOT NULL,
  clock_in      DATETIME DEFAULT NULL,
  clock_out     DATETIME DEFAULT NULL,
  status        ENUM('present','absent','half_day','late','leave') DEFAULT 'present',
  remarks       TEXT DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_date (user_id, work_date),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Salary / Payroll records
CREATE TABLE IF NOT EXISTS salary_records (
  salary_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  month         INT NOT NULL COMMENT '1-12',
  year          INT NOT NULL,
  base_salary   DECIMAL(12,2) DEFAULT 0.00,
  bonus         DECIMAL(12,2) DEFAULT 0.00,
  deductions    DECIMAL(12,2) DEFAULT 0.00,
  net_salary    DECIMAL(12,2) DEFAULT 0.00,
  payment_status ENUM('pending','paid') DEFAULT 'pending',
  paid_on       DATE DEFAULT NULL,
  remarks       TEXT DEFAULT NULL,
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_month (user_id, month, year),
  FOREIGN KEY (user_id)    REFERENCES users(user_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Per-employee feature access permissions
CREATE TABLE IF NOT EXISTS user_permissions (
  perm_id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id               INT NOT NULL UNIQUE,
  can_view_analytics    BOOLEAN DEFAULT TRUE,
  can_view_reports      BOOLEAN DEFAULT TRUE,
  can_use_chat          BOOLEAN DEFAULT TRUE,
  can_request_extension BOOLEAN DEFAULT TRUE,
  can_view_salary       BOOLEAN DEFAULT TRUE,
  can_view_team         BOOLEAN DEFAULT TRUE,
  updated_by            INT,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id),
  FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Seed default departments
INSERT IGNORE INTO departments (dept_name, description) VALUES
  ('Engineering',  'Software development and technical operations'),
  ('HR',           'Human resources and people management'),
  ('Finance',      'Accounts, payroll and financial operations'),
  ('Sales',        'Business development and client management'),
  ('Operations',   'Day to day business operations');

SELECT 'Base migration complete ✅ — now run migrate_v5.1.sql' AS result;

-- END OF FILE: migrate_v5.sql

-- ==========================================================================================
-- FILE 03/26: migrate_v5.1.sql
-- SECTION: v5.1 MIGRATION
-- DESCRIPTION: Salary advance & loan repayment tracking — ALTER additions
-- TABLES: 0 | LINES: 21
-- ==========================================================================================

-- ============================================================
-- migrate_v5.1.sql — Safe ALTER-only migration
-- All tables now in schema.sql — this file only adds columns
-- that may be missing on older installations.
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS)
-- ============================================================
-- USE statement removed (handled at top)

ALTER TABLE users  ADD COLUMN IF NOT EXISTS last_login     DATETIME  DEFAULT NULL;
ALTER TABLE users  ADD COLUMN IF NOT EXISTS status         ENUM('pending','active','suspended') DEFAULT 'active';
ALTER TABLE users  ADD COLUMN IF NOT EXISTS department_id  INT       DEFAULT NULL;
ALTER TABLE users  ADD COLUMN IF NOT EXISTS base_salary    DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE users  ADD COLUMN IF NOT EXISTS phone          VARCHAR(20)   DEFAULT NULL;
ALTER TABLE users  ADD COLUMN IF NOT EXISTS profile_notes  TEXT          DEFAULT NULL;

ALTER TABLE tasks  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS is_read        BOOLEAN   DEFAULT FALSE;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS alert_type     VARCHAR(50) DEFAULT 'general';

SELECT 'migrate_v5.1 complete ✅' AS result;

-- END OF FILE: migrate_v5.1.sql

-- ==========================================================================================
-- FILE 04/26: migrate_v6.0.sql
-- SECTION: v6.0 MIGRATION
-- DESCRIPTION: Gratuity records, shift management, WFH tracker — schema additions
-- TABLES: 0 | LINES: 52
-- ==========================================================================================

-- ============================================================
-- migrate_v6.0.sql — Safe ALTER-only migration
-- All new tables are now in schema.sql.
-- This file only adds columns on older installations.
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS)
-- ============================================================
-- USE statement removed (handled at top)

-- Add v6.0 user fields (if upgrading from older version)
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation       VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS join_date         DATE         DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth     DATE         DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address           TEXT         DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(150) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender            ENUM('male','female','other','prefer_not_to_say') DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_type   ENUM('full_time','part_time','contract','intern') DEFAULT 'full_time';
ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_id          INT          DEFAULT NULL;

-- Add OT tracking to attendance (if upgrading)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS total_hours  DECIMAL(4,2) DEFAULT NULL;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS ot_hours     DECIMAL(4,2) DEFAULT 0.00;

-- Ensure leave_requests has half_day type (older installs)
ALTER TABLE leave_requests MODIFY COLUMN IF EXISTS leave_type
  ENUM('sick','casual','earned','unpaid','other','half_day') DEFAULT 'casual';

-- Add new roles (idempotent)
INSERT IGNORE INTO roles (role_name) VALUES ('Manager'), ('HR');

-- Seed salary components (idempotent)
INSERT IGNORE INTO salary_components (name,component_type,is_taxable,is_statutory,description) VALUES
  ('Basic Salary',     'earning',   TRUE,  FALSE, 'Core fixed salary'),
  ('HRA',              'earning',   TRUE,  FALSE, 'House Rent Allowance'),
  ('Travel Allowance', 'earning',   FALSE, FALSE, 'Conveyance allowance'),
  ('Medical Allowance','earning',   FALSE, FALSE, 'Medical benefit'),
  ('Special Allowance','earning',   TRUE,  FALSE, 'Performance allowance'),
  ('Provident Fund',   'deduction', FALSE, TRUE,  'PF 12% of basic'),
  ('ESI',              'deduction', FALSE, TRUE,  'ESI 0.75% of gross'),
  ('Professional Tax', 'deduction', FALSE, TRUE,  'State professional tax'),
  ('TDS',              'deduction', FALSE, TRUE,  'Tax Deducted at Source'),
  ('Leave Deduction',  'deduction', FALSE, FALSE, 'Absent-day deduction'),
  ('Advance Deduction','deduction', FALSE, FALSE, 'Salary advance recovery');

-- Seed shifts (idempotent)
INSERT IGNORE INTO shifts (shift_name,start_time,end_time,grace_minutes) VALUES
  ('Morning Shift', '09:00:00','18:00:00',15),
  ('Evening Shift', '14:00:00','23:00:00',15),
  ('Night Shift',   '22:00:00','07:00:00',10),
  ('Half Day (AM)', '09:00:00','13:00:00',10),
  ('Half Day (PM)', '14:00:00','18:00:00',10);

SELECT 'migrate_v6.0 complete ✅' AS result;

-- END OF FILE: migrate_v6.0.sql

-- ==========================================================================================
-- FILE 05/26: migrate_v8.sql
-- SECTION: v8 MIGRATION
-- DESCRIPTION: Helpdesk tickets, loan portal, credit score, travel & expense claims, cab management — 11 tables
-- TABLES: 11 | LINES: 292
-- ==========================================================================================

-- ══════════════════════════════════════════════════════════════
--  Workforce Intelligence Platform – v8.0 Migration
--  Adds: Settings Center · Tax Portal · Loan Portal · Women Safety
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- MODULE 1 · COMPANY SETTINGS CENTER
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS company_settings (
  setting_id    INT AUTO_INCREMENT PRIMARY KEY,
  setting_group VARCHAR(60)  NOT NULL,
  setting_key   VARCHAR(100) NOT NULL,
  setting_value TEXT,
  value_type    ENUM('string','number','boolean','json') DEFAULT 'string',
  description   VARCHAR(255),
  updated_by    INT,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_group_key (setting_group, setting_key),
  FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS company_policies (
  policy_id     INT AUTO_INCREMENT PRIMARY KEY,
  policy_name   VARCHAR(120) NOT NULL,
  category      VARCHAR(60)  NOT NULL,
  content       LONGTEXT     NOT NULL,
  version       VARCHAR(20)  DEFAULT '1.0',
  is_active     TINYINT(1)   DEFAULT 1,
  effective_date DATE,
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS office_locations (
  location_id       INT AUTO_INCREMENT PRIMARY KEY,
  city              VARCHAR(80)  NOT NULL,
  state             VARCHAR(80),
  address           TEXT,
  pincode           VARCHAR(10),
  capacity          INT          DEFAULT 0,
  hr_contact        VARCHAR(120),
  emergency_contact VARCHAR(20),
  latitude          DECIMAL(10,7),
  longitude         DECIMAL(10,7),
  is_active         TINYINT(1)   DEFAULT 1,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT IGNORE INTO company_settings (setting_group, setting_key, setting_value, value_type, description) VALUES
('company','name',                    'TechCorp India Pvt Ltd',          'string',  'Legal company name'),
('company','cin',                     'U72900KA2018PTC123456',           'string',  'Corporate Identification Number'),
('company','gstin',                   '29ABCDE1234F1Z5',                 'string',  'GST Registration Number'),
('company','pan',                     'ABCDE1234F',                      'string',  'Company PAN'),
('company','email',                   'hr@techcorp.in',                  'string',  'HR email'),
('company','phone',                   '+91 80 4567 8900',                'string',  'Main phone'),
('company','website',                 'https://techcorp.in',             'string',  'Company website'),
('company','founded_year',            '2018',                            'number',  'Year founded'),
('company','financial_year',          'April-March',                     'string',  'Financial year cycle'),
('work','default_shift_hours',        '9',                               'number',  'Standard shift hours'),
('work','ot_multiplier',              '1.5',                             'number',  'Overtime rate multiplier'),
('work','probation_months',           '6',                               'number',  'Probation period months'),
('work','notice_period_days',         '90',                              'number',  'Notice period (days)'),
('work','week_off',                   'Sunday',                          'string',  'Weekly off day'),
('work','max_wfh_days',               '2',                               'number',  'Max WFH days per week'),
('tax','old_regime_basic_exemption',  '250000',                          'number',  'Old regime basic exemption'),
('tax','new_regime_basic_exemption',  '300000',                          'number',  'New regime basic exemption'),
('tax','standard_deduction',          '50000',                           'number',  'Standard deduction for salaried'),
('tax','pf_employee_percent',         '12',                              'number',  'Employee PF %'),
('tax','pf_employer_percent',         '12',                              'number',  'Employer PF %'),
('tax','esi_employee_percent',        '0.75',                            'number',  'Employee ESI %'),
('tax','esi_employer_percent',        '3.25',                            'number',  'Employer ESI %'),
('tax','professional_tax_monthly',    '200',                             'number',  'Professional tax per month'),
('tax','hra_metro_percent',           '50',                              'number',  'HRA % metro cities'),
('tax','hra_non_metro_percent',       '40',                              'number',  'HRA % non-metro'),
('loan','max_home_loan_salary_months','36',                              'number',  'Max home loan (salary months)'),
('loan','max_vehicle_loan_months',    '18',                              'number',  'Max vehicle loan (salary months)'),
('loan','max_personal_loan_months',   '6',                               'number',  'Max personal loan (salary months)'),
('loan','min_tenure_months',          '12',                              'number',  'Min employment months to apply'),
('loan','max_emi_salary_percent',     '40',                              'number',  'Max EMI as % of gross salary'),
('loan','default_interest_rate',      '8',                               'number',  'Default annual interest rate %'),
('safety','sos_alert_emails',         'security@techcorp.in,hr@techcorp.in', 'string', 'SOS alert recipients'),
('safety','female_cab_mandatory_night','1',                              'boolean', 'Mandate female cab after 8PM'),
('safety','night_shift_start_hour',   '20',                              'number',  '24-hr start of night shift'),
('safety','night_shift_end_hour',     '6',                               'number',  '24-hr end of night shift'),
('safety','safe_checkin_interval_mins','30',                             'number',  'Safe check-in interval (mins)'),
('notification','leave_approval_email','1',                              'boolean', 'Email on leave approval'),
('notification','salary_slip_email',  '1',                               'boolean', 'Email when payslip generated'),
('notification','birthday_wishes',    '1',                               'boolean', 'Auto birthday notifications');

-- Seed office locations
INSERT IGNORE INTO office_locations (city, state, address, pincode, capacity, hr_contact, emergency_contact) VALUES
('Bengaluru','Karnataka','4th Floor, Prestige Tech Park, Outer Ring Road, Marathahalli','560103',450,'hr.blr@techcorp.in','+91 98450 12345'),
('Hyderabad','Telangana','Level 7, My Home Hub, Madhapur, HITEC City','500081',300,'hr.hyd@techcorp.in','+91 98490 23456'),
('Pune','Maharashtra','3rd Floor, Panchshil Business Park, Yerwada','411006',250,'hr.pune@techcorp.in','+91 98220 34567'),
('Chennai','Tamil Nadu','Olympia Tech Park, Tower C, Guindy','600032',200,'hr.che@techcorp.in','+91 98400 45678'),
('Noida','Uttar Pradesh','Plot A-8, Sector 63, Noida Special Economic Zone','201301',180,'hr.noi@techcorp.in','+91 98100 56789'),
('Gurugram','Haryana','DLF Cyber City, Phase III, Building 9A','122002',220,'hr.gur@techcorp.in','+91 98110 67890'),
('Mumbai','Maharashtra','Nirlon Knowledge Park, Western Express Highway, Goregaon','400063',200,'hr.mum@techcorp.in','+91 98200 78901'),
('Kolkata','West Bengal','DLF IT Park, New Town, Rajarhat','700156',120,'hr.kol@techcorp.in','+91 98300 89012'),
('Ahmedabad','Gujarat','Synergy Business Park, SG Road, Bodakdev','380054',100,'hr.ahm@techcorp.in','+91 97230 90123'),
('Kochi','Kerala','InfoPark Phase 1, Kakkanad','682042',80,'hr.koc@techcorp.in','+91 98470 01234');


-- ─────────────────────────────────────────────────────────────
-- MODULE 2 · INCOME TAX PORTAL
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tax_declarations (
  declaration_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NOT NULL,
  financial_year      VARCHAR(10) NOT NULL DEFAULT '2025-26',
  regime              ENUM('old','new') DEFAULT 'new',
  ppf                 DECIMAL(12,2) DEFAULT 0,
  elss                DECIMAL(12,2) DEFAULT 0,
  life_insurance      DECIMAL(12,2) DEFAULT 0,
  nsc                 DECIMAL(12,2) DEFAULT 0,
  fd_5yr              DECIMAL(12,2) DEFAULT 0,
  tuition_fees        DECIMAL(12,2) DEFAULT 0,
  home_loan_principal DECIMAL(12,2) DEFAULT 0,
  health_self         DECIMAL(12,2) DEFAULT 0,
  health_parents      DECIMAL(12,2) DEFAULT 0,
  edu_loan_interest   DECIMAL(12,2) DEFAULT 0,
  donations_80g       DECIMAL(12,2) DEFAULT 0,
  hra_rent_paid       DECIMAL(12,2) DEFAULT 0,
  hra_city_type       ENUM('metro','non_metro') DEFAULT 'metro',
  nps_80ccd           DECIMAL(12,2) DEFAULT 0,
  home_loan_interest  DECIMAL(12,2) DEFAULT 0,
  status              ENUM('draft','submitted','approved') DEFAULT 'draft',
  submitted_at        TIMESTAMP NULL,
  approved_by         INT,
  approved_at         TIMESTAMP NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_fy (user_id, financial_year),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS form16_records (
  form16_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  financial_year   VARCHAR(10) NOT NULL,
  gross_salary     DECIMAL(14,2),
  total_deductions DECIMAL(14,2),
  taxable_income   DECIMAL(14,2),
  tax_liability    DECIMAL(14,2),
  tds_deducted     DECIMAL(14,2),
  regime           ENUM('old','new') DEFAULT 'new',
  generated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pdf_path         VARCHAR(255),
  UNIQUE KEY uq_user_fy16 (user_id, financial_year),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- ─────────────────────────────────────────────────────────────
-- MODULE 3 · EMPLOYEE LOAN PORTAL
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loan_applications (
  loan_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  loan_type        ENUM('home','vehicle','education','marriage','medical','emergency','personal') NOT NULL,
  principal        DECIMAL(14,2) NOT NULL,
  tenure_months    INT NOT NULL,
  interest_rate    DECIMAL(5,2)  DEFAULT 8.00,
  emi_amount       DECIMAL(12,2),
  purpose          TEXT,
  status           ENUM('draft','pending','under_review','approved','rejected','disbursed','closed') DEFAULT 'pending',
  manager_action   ENUM('pending','approved','rejected') DEFAULT 'pending',
  manager_id       INT,
  manager_at       TIMESTAMP NULL,
  manager_remarks  TEXT,
  hr_action        ENUM('pending','approved','rejected') DEFAULT 'pending',
  hr_id            INT,
  hr_at            TIMESTAMP NULL,
  hr_remarks       TEXT,
  admin_action     ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_id         INT,
  admin_at         TIMESTAMP NULL,
  admin_remarks    TEXT,
  disbursal_date   DATE,
  disbursal_ref    VARCHAR(60),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (hr_id)      REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id)   REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS loan_repayments (
  repayment_id   INT AUTO_INCREMENT PRIMARY KEY,
  loan_id        INT NOT NULL,
  installment_no INT NOT NULL,
  due_date       DATE NOT NULL,
  principal_comp DECIMAL(12,2) DEFAULT 0,
  interest_comp  DECIMAL(12,2) DEFAULT 0,
  emi_amount     DECIMAL(12,2),
  paid_date      DATE,
  paid_amount    DECIMAL(12,2),
  status         ENUM('upcoming','paid','overdue') DEFAULT 'upcoming',
  FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id) ON DELETE CASCADE
);


-- ─────────────────────────────────────────────────────────────
-- MODULE 4 · WOMEN SAFETY PLATFORM
-- Matches column names used in safetyController.js exactly
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS safety_sos_events (
  sos_id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NOT NULL,
  trigger_type       ENUM('panic_button','app_shake','auto_timer','manual','voice') DEFAULT 'panic_button',
  lat                DECIMAL(10,7),
  lng                DECIMAL(10,7),
  address            VARCHAR(255),
  status             ENUM('active','responding','resolved') DEFAULT 'active',
  notified_contacts  TINYINT(1) DEFAULT 0,
  resolved_by        INT,
  resolved_at        TIMESTAMP NULL,
  resolution_notes   TEXT,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS safety_emergency_contacts (
  contact_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  name            VARCHAR(100) NOT NULL,
  relation        VARCHAR(60),
  phone           VARCHAR(20) NOT NULL,
  email           VARCHAR(120),
  is_primary      TINYINT(1) DEFAULT 0,
  notify_on_sos   TINYINT(1) DEFAULT 1,
  notify_on_late  TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS safety_complaints (
  complaint_id    INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id     INT NOT NULL,
  accused_id      INT,
  incident_date   DATE NOT NULL,
  location        VARCHAR(200),
  category        ENUM('verbal','physical','sexual','cyber','other') NOT NULL,
  description     LONGTEXT NOT NULL,
  witnesses       TEXT,
  is_anonymous    TINYINT(1) DEFAULT 0,
  evidence_path   VARCHAR(255),
  status          ENUM('filed','under_review','icc_referred','resolved','closed') DEFAULT 'filed',
  icc_member_id   INT,
  icc_assigned_at TIMESTAMP NULL,
  resolution      TEXT,
  resolved_at     TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id)   REFERENCES users(user_id),
  FOREIGN KEY (accused_id)    REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (icc_member_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS safety_night_shift_approvals (
  approval_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  shift_date   DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  cab_required TINYINT(1) DEFAULT 1,
  female_cab   TINYINT(1) DEFAULT 1,
  escort_req   TINYINT(1) DEFAULT 0,
  status       ENUM('pending','approved','rejected') DEFAULT 'pending',
  approved_by  INT,
  approved_at  TIMESTAMP NULL,
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- Performance indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tax_decl_user ON tax_declarations(user_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_loan_user     ON loan_applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sos_user      ON safety_sos_events(user_id, status);
CREATE INDEX IF NOT EXISTS idx_complaint_st  ON safety_complaints(status, created_at);
CREATE INDEX IF NOT EXISTS idx_settings_grp  ON company_settings(setting_group);

-- END OF FILE: migrate_v8.sql

-- ==========================================================================================
-- FILE 06/26: migrate_v8_new_modules.sql
-- SECTION: v8 NEW MODULES
-- DESCRIPTION: Dependents & insurance, family transfers, hiring/ATS, onboarding, regularization, disciplinary — 11 tables
-- TABLES: 11 | LINES: 281
-- ==========================================================================================

-- ============================================================
--  Workforce Intelligence Platform — v8.0 Migration
--  New Modules: Settings Center, Income Tax Portal,
--               Employee Loan Portal, Women Safety
-- ============================================================

-- ── 1. COMPANY SETTINGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_settings (
  setting_id       INT AUTO_INCREMENT PRIMARY KEY,
  setting_key      VARCHAR(100) NOT NULL UNIQUE,
  setting_value    TEXT,
  setting_group    VARCHAR(50) DEFAULT 'general',
  label            VARCHAR(150),
  description      TEXT,
  updated_by       INT,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS company_policies (
  policy_id        INT AUTO_INCREMENT PRIMARY KEY,
  policy_name      VARCHAR(150) NOT NULL,
  policy_type      ENUM('hr','leave','attendance','salary','cab','safety','general') DEFAULT 'general',
  content          LONGTEXT,
  version          VARCHAR(20) DEFAULT '1.0',
  is_active        TINYINT(1) DEFAULT 1,
  effective_from   DATE,
  created_by       INT,
  updated_by       INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS office_locations (
  location_id      INT AUTO_INCREMENT PRIMARY KEY,
  location_name    VARCHAR(150) NOT NULL,
  city             VARCHAR(100),
  state            VARCHAR(100),
  address          TEXT,
  pincode          VARCHAR(10),
  capacity         INT DEFAULT 0,
  hr_contact_id    INT,
  emergency_phone  VARCHAR(20),
  lat              DECIMAL(9,6),
  lng              DECIMAL(9,6),
  is_active        TINYINT(1) DEFAULT 1,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hr_contact_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ── 2. INCOME TAX ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tax_declarations (
  declaration_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  financial_year   VARCHAR(10) NOT NULL,
  regime           ENUM('old','new') DEFAULT 'new',
  -- HRA
  hra_claimed      DECIMAL(12,2) DEFAULT 0,
  rent_paid        DECIMAL(12,2) DEFAULT 0,
  is_metro         TINYINT(1) DEFAULT 0,
  -- Deductions (80C etc.)
  ded_80c          DECIMAL(12,2) DEFAULT 0,
  ded_80d          DECIMAL(12,2) DEFAULT 0,
  ded_80e          DECIMAL(12,2) DEFAULT 0,
  ded_80g          DECIMAL(12,2) DEFAULT 0,
  ded_nps          DECIMAL(12,2) DEFAULT 0,
  ded_hra          DECIMAL(12,2) DEFAULT 0,
  ded_other        DECIMAL(12,2) DEFAULT 0,
  -- Computed
  gross_income     DECIMAL(12,2) DEFAULT 0,
  taxable_income   DECIMAL(12,2) DEFAULT 0,
  tax_liability    DECIMAL(12,2) DEFAULT 0,
  tds_deducted     DECIMAL(12,2) DEFAULT 0,
  status           ENUM('draft','submitted','approved','rejected') DEFAULT 'draft',
  submitted_at     TIMESTAMP NULL,
  approved_by      INT,
  approved_at      TIMESTAMP NULL,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_year (user_id, financial_year),
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS form16_records (
  form16_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  financial_year   VARCHAR(10) NOT NULL,
  employer_name    VARCHAR(200),
  employer_tan     VARCHAR(20),
  gross_salary     DECIMAL(12,2),
  total_tds        DECIMAL(12,2),
  net_salary       DECIMAL(12,2),
  pdf_path         VARCHAR(500),
  generated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ── 3. LOAN PORTAL ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_applications (
  loan_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  loan_type        ENUM('home','vehicle','education','marriage','medical','emergency','personal') NOT NULL,
  amount_requested DECIMAL(12,2) NOT NULL,
  tenure_months    INT NOT NULL,
  interest_rate    DECIMAL(5,2) DEFAULT 8.50,
  purpose          TEXT,
  emi_amount       DECIMAL(12,2),
  total_payable    DECIMAL(12,2),
  -- Status flow: draft → pending → manager_approved → hr_approved → admin_approved → disbursed → closed → rejected
  status           ENUM('draft','pending','manager_approved','hr_approved','admin_approved','disbursed','closed','rejected') DEFAULT 'draft',
  manager_id       INT,
  manager_action   ENUM('pending','approved','rejected') DEFAULT 'pending',
  manager_note     TEXT,
  manager_at       TIMESTAMP NULL,
  hr_action        ENUM('pending','approved','rejected') DEFAULT 'pending',
  hr_note          TEXT,
  hr_at            TIMESTAMP NULL,
  admin_action     ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_note       TEXT,
  admin_at         TIMESTAMP NULL,
  disbursed_at     TIMESTAMP NULL,
  disbursed_by     INT,
  amount_disbursed DECIMAL(12,2),
  repayment_start  DATE,
  documents        JSON,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id)   REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (disbursed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS loan_repayments (
  repayment_id     INT AUTO_INCREMENT PRIMARY KEY,
  loan_id          INT NOT NULL,
  user_id          INT NOT NULL,
  installment_no   INT NOT NULL,
  due_date         DATE NOT NULL,
  amount_due       DECIMAL(12,2) NOT NULL,
  principal_part   DECIMAL(12,2) DEFAULT 0,
  interest_part    DECIMAL(12,2) DEFAULT 0,
  amount_paid      DECIMAL(12,2) DEFAULT 0,
  paid_date        DATE,
  status           ENUM('pending','paid','overdue') DEFAULT 'pending',
  deducted_from_salary TINYINT(1) DEFAULT 1,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id)  REFERENCES loan_applications(loan_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(user_id) ON DELETE CASCADE
);

-- ── 4. WOMEN SAFETY ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS safety_sos_events (
  sos_id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  trigger_type     ENUM('panic_button','fall_detected','auto_timer','manual') DEFAULT 'panic_button',
  lat              DECIMAL(9,6),
  lng              DECIMAL(9,6),
  address          TEXT,
  status           ENUM('active','responding','resolved','false_alarm') DEFAULT 'active',
  resolved_by      INT,
  resolved_at      TIMESTAMP NULL,
  resolution_notes TEXT,
  notified_contacts JSON,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS safety_complaints (
  complaint_id     INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id      INT,
  is_anonymous     TINYINT(1) DEFAULT 0,
  complaint_type   ENUM('harassment','discrimination','unsafe_environment','stalking','other') NOT NULL,
  against_user_id  INT,
  department_id    INT,
  incident_date    DATE,
  incident_location VARCHAR(200),
  description      LONGTEXT NOT NULL,
  evidence_paths   JSON,
  status           ENUM('filed','under_review','icc_referred','resolved','closed') DEFAULT 'filed',
  assigned_to      INT,
  icc_case_no      VARCHAR(50),
  resolution       TEXT,
  resolved_at      TIMESTAMP NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id)     REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (against_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to)     REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS safety_night_shift_approvals (
  approval_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  shift_date       DATE NOT NULL,
  shift_start      TIME,
  shift_end        TIME,
  transport_mode   ENUM('company_cab','own_vehicle','public','escort') DEFAULT 'company_cab',
  guardian_notified TINYINT(1) DEFAULT 0,
  guardian_phone   VARCHAR(20),
  status           ENUM('pending','approved','rejected') DEFAULT 'pending',
  approved_by      INT,
  approved_at      TIMESTAMP NULL,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS safety_emergency_contacts (
  contact_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  name             VARCHAR(150) NOT NULL,
  relation         VARCHAR(80),
  phone            VARCHAR(20) NOT NULL,
  email            VARCHAR(150),
  is_primary       TINYINT(1) DEFAULT 0,
  notify_on_sos    TINYINT(1) DEFAULT 1,
  notify_on_late   TINYINT(1) DEFAULT 1,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ── SEED: default company settings ──────────────────────────
INSERT IGNORE INTO company_settings (setting_key, setting_value, setting_group, label) VALUES
('company_name',         'Workforce Intelligence Pvt. Ltd.', 'profile',  'Company Name'),
('company_email',        'hr@workforce.in',                  'profile',  'Company Email'),
('company_phone',        '+91-9800000001',                   'profile',  'Company Phone'),
('company_website',      'https://workforce.in',             'profile',  'Website'),
('company_gst',          '29AABCU9603R1ZX',                  'profile',  'GST Number'),
('company_pan',          'AABCU9603R',                       'profile',  'PAN'),
('hq_address',           'Bengaluru, Karnataka, India',      'profile',  'Head Office'),
('work_hours_per_day',   '8',                                'attendance','Work Hours/Day'),
('work_days_per_week',   '5',                                'attendance','Work Days/Week'),
('overtime_rate',        '1.5',                              'payroll',  'OT Multiplier'),
('pf_employee_rate',     '12',                               'payroll',  'PF Employee %'),
('pf_employer_rate',     '12',                               'payroll',  'PF Employer %'),
('esi_employee_rate',    '0.75',                             'payroll',  'ESI Employee %'),
('esi_employer_rate',    '3.25',                             'payroll',  'ESI Employer %'),
('salary_day',           '1',                                'payroll',  'Salary Credit Day'),
('tax_regime_default',   'new',                              'tax',      'Default Tax Regime'),
('loan_max_multiplier',  '6',                                'loans',    'Max Loan (x Salary)'),
('loan_interest_home',   '7.5',                              'loans',    'Home Loan Rate %'),
('loan_interest_vehicle','9.0',                              'loans',    'Vehicle Loan Rate %'),
('loan_interest_edu',    '8.0',                              'loans',    'Education Loan Rate %'),
('loan_interest_emergency','10.0',                           'loans',    'Emergency Loan Rate %'),
('sos_auto_call',        '1',                                'safety',   'Auto-Call on SOS'),
('night_shift_approval', '1',                                'safety',   'Night Shift Approval Required'),
('female_cab_preference','1',                                'safety',   'Female Driver Preference');

-- ── SEED: office locations ───────────────────────────────────
INSERT IGNORE INTO office_locations (location_name, city, state, address, pincode, capacity, lat, lng) VALUES
('Bengaluru HQ',    'Bengaluru',   'Karnataka',       'Whitefield Tech Park, ITPL Road',    '560066', 500, 12.9716,  77.5946),
('Hyderabad',       'Hyderabad',   'Telangana',       'HITEC City, Gachibowli',             '500032', 300, 17.3850,  78.4867),
('Pune',            'Pune',        'Maharashtra',     'Hinjewadi Phase 2, Rajiv Gandhi IT', '411057', 250, 18.5204,  73.8567),
('Chennai',         'Chennai',     'Tamil Nadu',      'Sholinganallur, OMR Road',           '600119', 200, 13.0827,  80.2707),
('Noida',           'Noida',       'Uttar Pradesh',   'Sector 62, Electronic City',         '201309', 180, 28.6139,  77.3510),
('Gurugram',        'Gurugram',    'Haryana',         'Cyber City, DLF Phase 2',            '122002', 220, 28.4595,  77.0266),
('Mumbai',          'Mumbai',      'Maharashtra',     'BKC, Bandra Kurla Complex',          '400051', 150, 19.0760,  72.8777),
('Kolkata',         'Kolkata',     'West Bengal',     'Salt Lake Sector V',                  '700091', 120, 22.5726,  88.3639),
('Ahmedabad',       'Ahmedabad',   'Gujarat',         'GIFT City, Gandhinagar',             '382421',  80, 23.0225,  72.5714),
('Kochi',           'Kochi',       'Kerala',          'Infopark, Kakkanad',                 '682030',  90, 10.0021,  76.3053);

-- ── SEED: sample policies ────────────────────────────────────
INSERT IGNORE INTO company_policies (policy_name, policy_type, content, version, effective_from) VALUES
('Leave Policy 2024', 'leave',
 'Employees are entitled to 12 sick leaves, 12 casual leaves, and 15 earned leaves per year. Unused earned leaves can be carried forward up to 30 days.',
 '2.0', '2024-01-01'),
('Work From Home Policy', 'hr',
 'Employees may work from home up to 2 days per week subject to manager approval. WFH is not applicable during notice period.',
 '1.5', '2024-01-01'),
('POSH & Women Safety Policy', 'safety',
 'The company has a zero-tolerance policy against sexual harassment. All complaints must be filed within 3 months. ICC will investigate and respond within 90 days.',
 '1.0', '2023-01-01'),
('Loan & Advance Policy', 'salary',
 'Employees completing 1 year of service are eligible for salary advance up to 2 months salary. Loans up to 6x monthly salary are available based on eligibility.',
 '1.2', '2024-01-01');

-- END OF FILE: migrate_v8_new_modules.sql

-- ==========================================================================================
-- FILE 07/26: migrate_v9.sql
-- SECTION: v9 MIGRATION
-- DESCRIPTION: Projects & milestones, notifications system, Socket.io events, employee grades, probation tracking — 12 tables
-- TABLES: 12 | LINES: 255
-- ==========================================================================================

-- ══════════════════════════════════════════════════════════════
--  Workforce Intelligence Platform – v9.0 Migration
--  Adds: Employee Grades · Family Transfer · Benefits · Banking
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- MODULE 5 · EMPLOYEE GRADES & CAREER PROGRESSION
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employee_grades (
  grade_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  grade_level     ENUM('L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','L11','L12') NOT NULL,
  designation     VARCHAR(120),
  department      VARCHAR(80),
  effective_date  DATE NOT NULL,
  salary_band_min DECIMAL(14,2),
  salary_band_max DECIMAL(14,2),
  assigned_by     INT,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS promotions (
  promotion_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  from_grade      VARCHAR(10),
  to_grade        VARCHAR(10),
  from_designation VARCHAR(120),
  to_designation  VARCHAR(120),
  reason          TEXT,
  effective_date  DATE NOT NULL,
  salary_revision DECIMAL(12,2) DEFAULT 0,
  approved_by     INT,
  status          ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS skills (
  skill_id    INT AUTO_INCREMENT PRIMARY KEY,
  skill_name  VARCHAR(100) NOT NULL UNIQUE,
  category    VARCHAR(60),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skill_assessments (
  assessment_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  skill_id        INT NOT NULL,
  proficiency     ENUM('beginner','intermediate','advanced','expert') DEFAULT 'beginner',
  verified        TINYINT(1) DEFAULT 0,
  verified_by     INT,
  last_updated    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_skill (user_id, skill_id),
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id)    REFERENCES skills(skill_id),
  FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS certifications (
  cert_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  cert_name     VARCHAR(150) NOT NULL,
  issuing_body  VARCHAR(120),
  cert_number   VARCHAR(80),
  issue_date    DATE,
  expiry_date   DATE,
  cert_url      VARCHAR(255),
  is_verified   TINYINT(1) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Seed skills
INSERT IGNORE INTO skills (skill_name, category) VALUES
('JavaScript','Frontend'),('TypeScript','Frontend'),('React','Frontend'),
('Vue.js','Frontend'),('Angular','Frontend'),('HTML/CSS','Frontend'),
('Node.js','Backend'),('Python','Backend'),('Java','Backend'),
('Go','Backend'),('PHP','Backend'),('Ruby','Backend'),
('MySQL','Database'),('PostgreSQL','Database'),('MongoDB','Database'),
('Redis','Database'),('Elasticsearch','Database'),
('Docker','DevOps'),('Kubernetes','DevOps'),('AWS','DevOps'),
('Azure','DevOps'),('GCP','DevOps'),('Terraform','DevOps'),('CI/CD','DevOps'),
('Machine Learning','AI/Data'),('Deep Learning','AI/Data'),('NLP','AI/Data'),
('Data Analysis','AI/Data'),('Power BI','AI/Data'),('Tableau','AI/Data'),
('React Native','Mobile'),('Flutter','Mobile'),('iOS','Mobile'),('Android','Mobile'),
('Scrum','Management'),('Agile','Management'),('JIRA','Management'),
('Communication','Soft Skills'),('Leadership','Soft Skills'),('Problem Solving','Soft Skills');


-- ─────────────────────────────────────────────────────────────
-- MODULE 6 · FAMILY & MARRIAGE TRANSFER
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS family_information (
  family_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL UNIQUE,
  marital_status  ENUM('single','married','divorced','widowed') DEFAULT 'single',
  spouse_name     VARCHAR(100),
  spouse_employer VARCHAR(120),
  spouse_location VARCHAR(80),
  marriage_date   DATE,
  children_count  INT DEFAULT 0,
  emergency_contact_1 VARCHAR(20),
  emergency_contact_2 VARCHAR(20),
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transfer_requests (
  transfer_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  transfer_type   ENUM('office','remote','hybrid','family','marriage','medical','personal') NOT NULL,
  from_location   VARCHAR(100),
  to_location     VARCHAR(100),
  reason          TEXT NOT NULL,
  preferred_date  DATE,
  is_urgent       TINYINT(1) DEFAULT 0,
  supporting_doc  VARCHAR(255),
  -- approval chain
  manager_action  ENUM('pending','approved','rejected') DEFAULT 'pending',
  manager_id      INT,
  manager_at      TIMESTAMP NULL,
  manager_remarks TEXT,
  hr_action       ENUM('pending','approved','rejected') DEFAULT 'pending',
  hr_id           INT,
  hr_at           TIMESTAMP NULL,
  hr_remarks      TEXT,
  admin_action    ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_id        INT,
  admin_at        TIMESTAMP NULL,
  admin_remarks   TEXT,
  status          ENUM('pending','under_review','approved','rejected','completed') DEFAULT 'pending',
  effective_date  DATE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (hr_id)      REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id)   REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS relocation_history (
  history_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  transfer_id   INT,
  from_location VARCHAR(100),
  to_location   VARCHAR(100),
  moved_date    DATE,
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (transfer_id) REFERENCES transfer_requests(transfer_id) ON DELETE SET NULL
);


-- ─────────────────────────────────────────────────────────────
-- MODULE 7 · EMPLOYEE BENEFITS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insurance_plans (
  plan_id       INT AUTO_INCREMENT PRIMARY KEY,
  plan_name     VARCHAR(120) NOT NULL,
  plan_type     ENUM('health','life','dental','vision','family','maternity','accidental') NOT NULL,
  provider      VARCHAR(120),
  coverage_amount DECIMAL(14,2),
  premium_monthly DECIMAL(10,2),
  employee_share  DECIMAL(10,2) DEFAULT 0,
  company_share   DECIMAL(10,2) DEFAULT 0,
  description   TEXT,
  is_active     TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_benefits (
  benefit_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  plan_id       INT NOT NULL,
  enrollment_date DATE,
  expiry_date   DATE,
  status        ENUM('active','expired','cancelled','pending') DEFAULT 'active',
  nominee_name  VARCHAR(100),
  nominee_relation VARCHAR(60),
  policy_number VARCHAR(60),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES insurance_plans(plan_id)
);

CREATE TABLE IF NOT EXISTS dependent_members (
  dependent_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  name          VARCHAR(100) NOT NULL,
  relation      ENUM('spouse','child','parent','sibling','other') NOT NULL,
  dob           DATE,
  is_covered    TINYINT(1) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Seed default insurance plans
INSERT IGNORE INTO insurance_plans (plan_name, plan_type, provider, coverage_amount, premium_monthly, employee_share, company_share, description) VALUES
('Group Health Gold',     'health',     'Star Health',   500000,  2500, 500,  2000, 'Covers self + family. Cashless at 5000+ hospitals. No pre-existing exclusion after 2 yrs.'),
('Group Health Silver',   'health',     'Star Health',   300000,  1800, 300,  1500, 'Self coverage. Cashless at network hospitals.'),
('Term Life Insurance',   'life',       'LIC India',     5000000, 800,  0,    800,  'Pure term life. 5 Crore cover for employees.'),
('Dental Plus',           'dental',     'Bajaj Allianz', 50000,   400,  200,  200,  'Dental cleanings, fillings, root canals covered.'),
('Maternity Care',        'maternity',  'HDFC Ergo',     100000,  600,  0,    600,  'Covers delivery, pre/post natal, new-born care.'),
('Accidental Coverage',   'accidental', 'New India',     1000000, 300,  0,    300,  '10L accidental death and disability cover.'),
('Family Floater Premium','family',     'Star Health',   1000000, 4500, 1000, 3500, 'Covers self + spouse + 2 children. 1 Crore floater.');


-- ─────────────────────────────────────────────────────────────
-- MODULE 8 · EMPLOYEE BANKING
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employee_banking (
  banking_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL UNIQUE,
  -- Salary Account
  bank_name       VARCHAR(100),
  account_number  VARCHAR(255),        -- AES-encrypted at app layer
  account_type    ENUM('savings','current','salary') DEFAULT 'salary',
  ifsc_code       VARCHAR(20),
  branch_name     VARCHAR(120),
  account_holder  VARCHAR(100),
  -- UPI
  upi_id          VARCHAR(100),
  -- PF
  pf_account_number VARCHAR(50),
  pf_uan            VARCHAR(20),
  -- ESI
  esi_number        VARCHAR(30),
  -- Verification
  is_verified       TINYINT(1) DEFAULT 0,
  verified_by       INT,
  verified_at       TIMESTAMP NULL,
  -- Audit
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- Performance indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_grades_user      ON employee_grades(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_user  ON promotions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_skills_user      ON skill_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_user    ON transfer_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_benefits_user    ON employee_benefits(user_id, status);

-- END OF FILE: migrate_v9.sql

-- ==========================================================================================
-- FILE 08/26: migrate_v10_registration.sql
-- SECTION: v10 REGISTRATION
-- DESCRIPTION: Multi-step employee registration tracker, registration sessions — ALTER additions
-- TABLES: 0 | LINES: 20
-- ==========================================================================================

-- ══════════════════════════════════════════════════════════════
--  v10.0 Migration — Registration Enhancement
--  Adds missing columns for new register form fields
-- ══════════════════════════════════════════════════════════════

-- Add missing columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS office_location      VARCHAR(80)  DEFAULT NULL AFTER designation,
  ADD COLUMN IF NOT EXISTS work_mode            ENUM('office','hybrid','remote') DEFAULT 'office' AFTER office_location,
  ADD COLUMN IF NOT EXISTS reporting_manager_id INT          DEFAULT NULL AFTER work_mode,
  ADD COLUMN IF NOT EXISTS emergency_contact_name  VARCHAR(100) DEFAULT NULL AFTER emergency_contact,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20)  DEFAULT NULL AFTER emergency_contact_name,
  ADD COLUMN IF NOT EXISTS reg_grade_level      VARCHAR(10)  DEFAULT NULL AFTER emergency_contact_phone,
  ADD COLUMN IF NOT EXISTS account_approved_by  INT          DEFAULT NULL AFTER reg_grade_level,
  ADD COLUMN IF NOT EXISTS account_approved_at  TIMESTAMP    DEFAULT NULL AFTER account_approved_by;

-- Index for manager lookup
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(reporting_manager_id);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(office_location);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- END OF FILE: migrate_v10_registration.sql

-- ==========================================================================================
-- FILE 09/26: migrate_v11.sql
-- SECTION: v11 MIGRATION
-- DESCRIPTION: HR calendar events, 360-feedback, awards & recognition, diversity metrics, ID card management, workforce planning, policy library — 13 tables
-- TABLES: 13 | LINES: 300
-- ==========================================================================================

-- ══════════════════════════════════════════════════════════════
--  v11.0 Migration — 16 Missing Features
-- ══════════════════════════════════════════════════════════════

-- 1. Performance Reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
  review_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  reviewer_id     INT NOT NULL,
  review_cycle    VARCHAR(30) NOT NULL,   -- 'Q1-2025','Annual-2025'
  review_type     ENUM('self','manager','peer','360') DEFAULT 'manager',
  period_start    DATE,
  period_end      DATE,
  -- Scores 1-5
  score_quality       DECIMAL(3,1) DEFAULT 0,
  score_delivery      DECIMAL(3,1) DEFAULT 0,
  score_communication DECIMAL(3,1) DEFAULT 0,
  score_teamwork      DECIMAL(3,1) DEFAULT 0,
  score_initiative    DECIMAL(3,1) DEFAULT 0,
  score_leadership    DECIMAL(3,1) DEFAULT 0,
  overall_score       DECIMAL(3,1) DEFAULT 0,
  rating          ENUM('exceptional','exceeds','meets','below','unsatisfactory') DEFAULT 'meets',
  strengths       TEXT,
  improvements    TEXT,
  goals_next      TEXT,
  reviewer_notes  TEXT,
  status          ENUM('draft','submitted','acknowledged','completed') DEFAULT 'draft',
  submitted_at    TIMESTAMP NULL,
  acknowledged_at TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 2. Onboarding Checklists
CREATE TABLE IF NOT EXISTS onboarding_templates (
  template_id   INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  role_id       INT,
  department_id INT,
  is_default    TINYINT(1) DEFAULT 0,
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  task_id       INT AUTO_INCREMENT PRIMARY KEY,
  template_id   INT NOT NULL,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  category      ENUM('document','it_setup','training','meet','hr_process','policy') DEFAULT 'hr_process',
  due_day       INT DEFAULT 1,            -- day N after joining
  assigned_to   ENUM('employee','hr','it','manager','admin') DEFAULT 'employee',
  is_mandatory  TINYINT(1) DEFAULT 1,
  sort_order    INT DEFAULT 0,
  FOREIGN KEY (template_id) REFERENCES onboarding_templates(template_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS onboarding_progress (
  progress_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  task_id       INT NOT NULL,
  status        ENUM('pending','in_progress','completed','skipped') DEFAULT 'pending',
  completed_at  TIMESTAMP NULL,
  notes         TEXT,
  UNIQUE KEY uq_user_task (user_id, task_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES onboarding_tasks(task_id) ON DELETE CASCADE
);

-- 3. Announcements / Notice Board
CREATE TABLE IF NOT EXISTS announcements (
  announcement_id INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(200) NOT NULL,
  body            LONGTEXT NOT NULL,
  category        ENUM('general','policy','event','urgent','hr','it','finance') DEFAULT 'general',
  target_roles    VARCHAR(20) DEFAULT 'all',   -- 'all','1','2','3','4' or comma list
  target_location VARCHAR(100) DEFAULT 'all',
  is_pinned       TINYINT(1) DEFAULT 0,
  is_active       TINYINT(1) DEFAULT 1,
  expires_at      TIMESTAMP NULL,
  attachment_url  VARCHAR(255),
  created_by      INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS announcement_reads (
  read_id         INT AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT NOT NULL,
  user_id         INT NOT NULL,
  read_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ann_user (announcement_id, user_id),
  FOREIGN KEY (announcement_id) REFERENCES announcements(announcement_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)         REFERENCES users(user_id) ON DELETE CASCADE
);

-- 4. Help Desk / IT Tickets
CREATE TABLE IF NOT EXISTS helpdesk_tickets (
  ticket_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  category      ENUM('it_hardware','it_software','access','hr_query','payroll','facilities','other') NOT NULL,
  priority      ENUM('low','medium','high','critical') DEFAULT 'medium',
  subject       VARCHAR(200) NOT NULL,
  description   LONGTEXT NOT NULL,
  status        ENUM('open','in_progress','pending_user','resolved','closed') DEFAULT 'open',
  assigned_to   INT,
  assigned_at   TIMESTAMP NULL,
  resolved_at   TIMESTAMP NULL,
  resolution    TEXT,
  satisfaction  TINYINT,          -- 1-5 rating
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS helpdesk_comments (
  comment_id  INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id   INT NOT NULL,
  user_id     INT NOT NULL,
  message     TEXT NOT NULL,
  is_internal TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES helpdesk_tickets(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(user_id) ON DELETE CASCADE
);

-- 5. Asset Management
CREATE TABLE IF NOT EXISTS assets (
  asset_id      INT AUTO_INCREMENT PRIMARY KEY,
  asset_code    VARCHAR(30) NOT NULL UNIQUE,
  asset_name    VARCHAR(150) NOT NULL,
  category      ENUM('laptop','desktop','monitor','phone','tablet','keyboard','mouse','headset','other') NOT NULL,
  brand         VARCHAR(80),
  model         VARCHAR(100),
  serial_number VARCHAR(80),
  purchase_date DATE,
  purchase_cost DECIMAL(12,2),
  warranty_end  DATE,
  condition     ENUM('new','good','fair','poor','damaged') DEFAULT 'good',
  status        ENUM('available','assigned','maintenance','retired','lost') DEFAULT 'available',
  location      VARCHAR(100),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_assignments (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id      INT NOT NULL,
  user_id       INT NOT NULL,
  assigned_by   INT,
  assigned_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  returned_at   TIMESTAMP NULL,
  condition_out ENUM('new','good','fair','poor') DEFAULT 'good',
  condition_in  ENUM('good','fair','poor','damaged') DEFAULT NULL,
  notes         TEXT,
  FOREIGN KEY (asset_id)     REFERENCES assets(asset_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by)  REFERENCES users(user_id) ON DELETE SET NULL
);

-- 6. Training & Learning
CREATE TABLE IF NOT EXISTS training_courses (
  course_id     INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  category      ENUM('technical','soft_skills','compliance','leadership','product','security') DEFAULT 'technical',
  format        ENUM('video','document','quiz','workshop','webinar','external') DEFAULT 'video',
  duration_mins INT DEFAULT 0,
  provider      VARCHAR(100),
  url           VARCHAR(255),
  is_mandatory  TINYINT(1) DEFAULT 0,
  target_grades VARCHAR(100),    -- 'L1,L2,L3' or 'all'
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  course_id     INT NOT NULL,
  status        ENUM('enrolled','in_progress','completed','failed') DEFAULT 'enrolled',
  progress_pct  INT DEFAULT 0,
  score         DECIMAL(5,2),
  enrolled_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at  TIMESTAMP NULL,
  certificate_url VARCHAR(255),
  UNIQUE KEY uq_user_course (user_id, course_id),
  FOREIGN KEY (user_id)   REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES training_courses(course_id) ON DELETE CASCADE
);

-- 7. Department Management (enhanced)
CREATE TABLE IF NOT EXISTS department_heads (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  user_id       INT NOT NULL,
  role          ENUM('head','deputy','coordinator') DEFAULT 'head',
  effective_from DATE,
  FOREIGN KEY (department_id) REFERENCES departments(dept_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)       REFERENCES users(user_id) ON DELETE CASCADE
);

-- Seed announcements
INSERT IGNORE INTO announcements (title, body, category, target_roles, is_pinned, is_active, created_by) VALUES
('Welcome to Workforce Intelligence Platform!',
 'Dear Team,\n\nWe are thrilled to announce the launch of our upgraded Workforce Intelligence Platform. This update includes Tax Portal, Loan Portal, Women Safety Module, Career Roadmap, Banking Details, Employee Benefits, and much more.\n\nKey highlights:\n• 41 modules now available\n• 100+ employee demo data\n• AI-powered career insights\n• Enhanced registration with grade, location, and work mode\n\nPlease explore the new features and reach out to HR for any queries.\n\nWarm regards,\nTechCorp HR Team',
 'general', 'all', 1, 1, 1),

('Q2 Performance Reviews — Now Open',
 'All managers are requested to complete Q2 2025 performance reviews for their team members by June 30, 2025.\n\nEmployees should submit self-assessments by June 20, 2025.\n\nNavigate to: Dashboard → Performance Reviews\n\nFor any queries, contact HR at hr@techcorp.in',
 'hr', 'all', 0, 1, 4),

('IMPORTANT: Company Policy Update — WFH Guidelines',
 'Effective July 1, 2025, the Work-From-Home policy has been updated:\n\n• Maximum 2 WFH days per week (unchanged)\n• All WFH requests must be submitted by Friday for the following week\n• Core hours 10 AM – 5 PM mandatory during WFH\n• Client-facing roles require office presence on client meeting days\n\nPlease acknowledge this announcement by clicking "Mark as Read".',
 'policy', 'all', 1, 1, 4),

('Office Closed — Independence Day (August 15)',
 'The office will remain closed on Friday, August 15, 2025 in observance of Independence Day.\n\nEnjoy the long weekend! 🇮🇳',
 'event', 'all', 0, 1, 4),

('New IT Helpdesk Portal Launched',
 'We have launched a new IT Helpdesk system for all your IT support, software access, and hardware requests.\n\nHow to raise a ticket:\n1. Go to Dashboard → Help Desk\n2. Click "New Ticket"\n3. Select category and describe your issue\n\nTarget SLA: High priority 4 hrs, Medium 24 hrs, Low 72 hrs.',
 'it', 'all', 0, 1, 1),

('Mandatory Cybersecurity Training — Complete by June 30',
 'All employees must complete the mandatory Cybersecurity Awareness Training by June 30, 2025.\n\nTopics covered:\n• Password security\n• Phishing awareness\n• Data classification\n• Secure remote work\n\nNavigate to: Dashboard → Training & Learning\n\nNote: Non-completion may affect your quarterly performance score.',
 'urgent', 'all', 1, 1, 4);

-- Seed training courses
INSERT IGNORE INTO training_courses (title, description, category, format, duration_mins, provider, is_mandatory, target_grades, created_by) VALUES
('Cybersecurity Awareness 2025',         'Essential security practices for all employees',                         'security',    'video',    45,  'Internal IT', 1, 'all', 1),
('Code Review Best Practices',           'How to give and receive effective code reviews',                          'technical',   'video',    60,  'Engineering', 0, 'L2,L3,L4', 1),
('Leadership Fundamentals',              'Core leadership skills for new team leads',                               'leadership',  'webinar',  120, 'HR',          0, 'L4,L5,L6', 1),
('POSH Awareness Training',              'Prevention of Sexual Harassment — mandatory for all employees',           'compliance',  'video',    90,  'HR Legal',    1, 'all', 1),
('AWS Cloud Practitioner Prep',          'Prepare for AWS Cloud Practitioner certification',                        'technical',   'video',    300, 'AWS',         0, 'L2,L3,L4,L5', 1),
('Effective Communication Skills',       'Written and verbal communication for professional settings',              'soft_skills', 'video',    60,  'HR',          0, 'all', 1),
('Agile & Scrum Mastery',                'Scrum framework, ceremonies, and best practices',                         'technical',   'workshop', 240, 'Engineering', 0, 'L2,L3,L4,L5', 1),
('Data Privacy & GDPR Basics',           'Understanding data privacy regulations and company obligations',           'compliance',  'document', 30,  'Legal',       1, 'all', 1),
('React 18 — New Features Deep Dive',    'Concurrent rendering, Suspense, and new hooks in React 18',               'technical',   'video',    90,  'Engineering', 0, 'L2,L3,L4', 1),
('Manager Essentials — First 90 Days',   'Transitioning from individual contributor to people manager',             'leadership',  'webinar',  180, 'HR',          0, 'L5,L6,L7', 1),
('Financial Literacy for Employees',     'Understanding your payslip, taxes, PF, and investments',                  'soft_skills', 'video',    60,  'Finance',     0, 'all', 1),
('Docker & Kubernetes Fundamentals',     'Container basics, Docker Compose, and K8s introduction',                  'technical',   'video',    120, 'DevOps',      0, 'L2,L3,L4', 1);

-- Seed assets
INSERT IGNORE INTO assets (asset_code, asset_name, category, brand, model, serial_number, purchase_date, purchase_cost, condition, status, location) VALUES
('LPTP-001','MacBook Pro 14" M3',    'laptop',  'Apple',  'MacBook Pro M3',    'C02ZK1ABMD6T', '2024-01-15', 185000, 'good',  'assigned',  'Bengaluru'),
('LPTP-002','MacBook Pro 14" M3',    'laptop',  'Apple',  'MacBook Pro M3',    'C02ZK2BCME7U', '2024-01-15', 185000, 'good',  'assigned',  'Bengaluru'),
('LPTP-003','Dell XPS 15',           'laptop',  'Dell',   'XPS 9530',          'DLL9530XPX001', '2023-06-10',120000, 'good',  'assigned',  'Hyderabad'),
('LPTP-004','Dell XPS 15',           'laptop',  'Dell',   'XPS 9530',          'DLL9530XPX002', '2023-06-10',120000, 'fair',  'assigned',  'Hyderabad'),
('LPTP-005','ThinkPad X1 Carbon',    'laptop',  'Lenovo', 'X1 Carbon Gen11',   'LNV1CRBNG11001','2023-09-01', 95000, 'good',  'available', 'Pune'),
('MNTR-001','Dell 27" 4K Monitor',   'monitor', 'Dell',   'U2723D',            'DLLU2723D001',  '2024-01-15', 42000, 'good',  'assigned',  'Bengaluru'),
('MNTR-002','Dell 27" 4K Monitor',   'monitor', 'Dell',   'U2723D',            'DLLU2723D002',  '2024-01-15', 42000, 'good',  'assigned',  'Bengaluru'),
('PHN-001', 'iPhone 15 Pro',         'phone',   'Apple',  'iPhone 15 Pro',     'APLIPH15P001',  '2024-03-01', 135000,'good',  'assigned',  'Bengaluru'),
('PHN-002', 'Samsung Galaxy S24',    'phone',   'Samsung','Galaxy S24 Ultra',  'SMSG24U002',    '2024-03-01', 125000,'good',  'assigned',  'Hyderabad'),
('HDST-001','Sony WH-1000XM5',       'headset', 'Sony',   'WH-1000XM5',        'SNYWH1000XM5001','2024-02-01',32000, 'good',  'assigned',  'Bengaluru'),
('HDST-002','Sony WH-1000XM5',       'headset', 'Sony',   'WH-1000XM5',        'SNYWH1000XM5002','2024-02-01',32000, 'good',  'available', 'Bengaluru'),
('LPTP-006','MacBook Air M2',        'laptop',  'Apple',  'MacBook Air M2',    'C02ZA1AAMD5S',  '2023-11-01',110000,'good',  'available', 'Chennai'),
('LPTP-007','HP EliteBook 840',      'laptop',  'HP',     'EliteBook 840 G10', 'HPE840G10001',  '2023-08-15', 85000, 'good', 'maintenance','Pune'),
('TBLT-001','iPad Pro 12.9"',        'tablet',  'Apple',  'iPad Pro M2 12.9"', 'APLIPPM2129001','2024-01-20', 92000, 'good',  'assigned',  'Bengaluru');

-- Seed onboarding template
INSERT IGNORE INTO onboarding_templates (name, is_default, created_by) VALUES
('Standard Engineer Onboarding', 1, 1);

INSERT IGNORE INTO onboarding_tasks (template_id, title, description, category, due_day, assigned_to, is_mandatory, sort_order) VALUES
(1, 'Submit ID Proof & Address Proof',          'Upload Aadhaar, PAN, and latest address proof to Documents section',      'document',   1,  'employee', 1, 1),
(1, 'Sign Employment Agreement',                'Review and digitally sign your employment contract',                       'document',   1,  'employee', 1, 2),
(1, 'Sign NDA & IP Agreement',                  'Review and sign Non-Disclosure and Intellectual Property agreements',      'document',   1,  'employee', 1, 3),
(1, 'Set up Work Email & Slack',                'IT will share credentials — set up 2FA immediately',                       'it_setup',   1,  'it',       1, 4),
(1, 'Laptop & Equipment Collection',            'Collect assigned laptop, headset, and access card from IT desk',          'it_setup',   1,  'it',       1, 5),
(1, 'Complete Banking Details',                 'Enter salary account details in Banking section for payroll setup',        'hr_process', 2,  'employee', 1, 6),
(1, 'Meet Your Reporting Manager',              'Schedule a 30-minute intro call with your manager',                       'meet',       2,  'manager',  1, 7),
(1, 'HR Induction Session',                     'Attend HR induction covering policies, benefits, and culture',            'training',   2,  'hr',       1, 8),
(1, 'Complete POSH Awareness Training',         'Mandatory training on Prevention of Sexual Harassment',                    'training',   3,  'employee', 1, 9),
(1, 'Complete Cybersecurity Training',          'Mandatory cybersecurity awareness training',                               'training',   3,  'employee', 1, 10),
(1, 'Meet Your Team Members',                   'Introduction round with immediate team',                                  'meet',       3,  'manager',  1, 11),
(1, 'Set Up Dev Environment',                   'Clone repos, install tools, run local stack per team wiki',               'it_setup',   4,  'employee', 1, 12),
(1, 'Add Emergency Contacts',                   'Update emergency contact details in your profile',                        'hr_process', 5,  'employee', 1, 13),
(1, 'Read Company Policies',                    'Review WFH, Leave, POSH, and Code of Conduct policies in Settings',       'policy',     5,  'employee', 1, 14),
(1, 'Submit PF & ESI Nomination Form',          'Fill and submit nomination form to HR',                                   'hr_process', 7,  'employee', 1, 15),
(1, 'First Week Check-in with HR',              'HR will schedule a 15-minute check-in on Day 7',                          'meet',       7,  'hr',       0, 16),
(1, 'Complete First Task Assignment',           'Complete the starter task assigned by your manager',                      'training',   14, 'employee', 1, 17),
(1, '30-Day Review Meeting',                    'Manager and HR 30-day review and feedback session',                       'meet',       30, 'manager',  1, 18),
(1, 'Confirm Benefits Enrollment',              'Enroll in health insurance and other benefits in Benefits section',       'hr_process', 14, 'employee', 1, 19),
(1, '90-Day Confirmation',                      'End of probation review and confirmation letter',                          'hr_process', 90, 'hr',       1, 20);

-- Seed helpdesk tickets (demo)
INSERT IGNORE INTO helpdesk_tickets (user_id, category, priority, subject, description, status, assigned_to) VALUES
(17, 'it_software',  'high',   'VPN not connecting after password reset',        'After resetting my corporate password, the VPN client shows authentication error.',               'open',        NULL),
(18, 'access',       'medium', 'Need access to Staging environment',             'Require read access to staging DB for debugging the portal issue. Manager approval attached.',    'in_progress', 1),
(19, 'it_hardware',  'low',    'Monitor flickers intermittently',                'Second monitor connected via HDMI flickers every 10-15 minutes. Driver update did not help.',    'open',        NULL),
(17, 'payroll',      'high',   'June salary not credited',                       'It is June 13 and salary for June has not been credited to my account. Payslip shows processed.','in_progress', 4),
(24, 'hr_query',     'medium', 'Clarification on maternity leave policy',        'Would like to understand the full maternity leave entitlement and salary continuation policy.',   'resolved',    4),
(31, 'it_software',  'high',   'AWS console access revoked after role change',   'Lost access to AWS production console after promotion to Senior DevOps. Need re-provisioning.',  'open',        NULL),
(36, 'facilities',   'low',    'Standing desk request for Hyderabad office',     'Request for a standing desk or height-adjustable table due to back condition (medical cert attached).','open',  NULL),
(18, 'it_hardware',  'medium', 'MacBook keyboard keys sticking',                 'Keys B, N, and space bar on MacBook Pro are sticking. Affects typing speed significantly.',       'resolved',    1);

-- END OF FILE: migrate_v11.sql

-- ==========================================================================================
-- FILE 10/26: migrate_v12_hiring.sql
-- SECTION: v12 HIRING MODULE
-- DESCRIPTION: Job postings, candidates, interview rounds, offer letters, referrals, fresher vs experience pipeline — 11 tables
-- TABLES: 11 | LINES: 278
-- ==========================================================================================

-- ══════════════════════════════════════════════════════════════
--  v12.0 Migration — Hiring Process + Cab Issue Tickets
--  + Technical Support Enhancements
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. JOB POSTINGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_postings (
  job_id          INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(150) NOT NULL,
  department_id   INT,
  location        VARCHAR(100),
  job_type        ENUM('full_time','part_time','contract','internship') DEFAULT 'full_time',
  candidate_type  ENUM('fresher','experienced','both') DEFAULT 'both',
  min_experience  DECIMAL(4,1) DEFAULT 0,  -- years
  max_experience  DECIMAL(4,1) DEFAULT 50,
  min_salary      DECIMAL(12,2),
  max_salary      DECIMAL(12,2),
  currency        VARCHAR(10) DEFAULT 'INR',
  skills_required TEXT,
  description     LONGTEXT NOT NULL,
  requirements    TEXT,
  benefits        TEXT,
  openings        INT DEFAULT 1,
  status          ENUM('draft','active','paused','closed','cancelled') DEFAULT 'draft',
  posted_by       INT,
  approved_by     INT,
  closes_at       DATE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
  FOREIGN KEY (posted_by)     REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by)   REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 2. CANDIDATES / APPLICANTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidates (
  candidate_id    INT AUTO_INCREMENT PRIMARY KEY,
  job_id          INT NOT NULL,
  full_name       VARCHAR(120) NOT NULL,
  email           VARCHAR(150) NOT NULL,
  phone           VARCHAR(20),
  dob             DATE,
  gender          ENUM('male','female','other','prefer_not'),
  current_location VARCHAR(100),
  candidate_type  ENUM('fresher','experienced') NOT NULL,
  -- Fresher fields
  college_name    VARCHAR(200),
  degree          VARCHAR(100),
  branch          VARCHAR(100),
  graduation_year YEAR,
  cgpa            DECIMAL(4,2),
  -- Experienced fields
  current_company VARCHAR(150),
  current_designation VARCHAR(100),
  total_experience DECIMAL(4,1) DEFAULT 0,  -- years
  current_ctc     DECIMAL(12,2),
  expected_ctc    DECIMAL(12,2),
  notice_period   INT DEFAULT 0,  -- days
  -- Common
  resume_url      VARCHAR(255),
  linkedin_url    VARCHAR(255),
  github_url      VARCHAR(255),
  portfolio_url   VARCHAR(255),
  cover_letter    TEXT,
  source          ENUM('portal','linkedin','naukri','employee_referral','campus','walk_in','agency','other') DEFAULT 'portal',
  referred_by     INT,
  status          ENUM('applied','shortlisted','rejected','on_hold','selected','withdrawn','offer_sent','offer_accepted','offer_declined','joined') DEFAULT 'applied',
  reject_reason   TEXT,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id)      REFERENCES job_postings(job_id) ON DELETE CASCADE,
  FOREIGN KEY (referred_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 3. INTERVIEW ROUNDS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interview_rounds (
  round_id        INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id    INT NOT NULL,
  job_id          INT NOT NULL,
  round_number    INT NOT NULL DEFAULT 1,
  round_type      ENUM('screening','aptitude','technical','hr','managerial','final','assignment') NOT NULL,
  round_name      VARCHAR(100),
  mode            ENUM('online','offline','phone','video') DEFAULT 'online',
  interviewer_id  INT,
  scheduled_at    DATETIME,
  duration_mins   INT DEFAULT 60,
  location        VARCHAR(200),       -- room / video link
  status          ENUM('scheduled','completed','cancelled','no_show','rescheduled') DEFAULT 'scheduled',
  result          ENUM('pass','fail','on_hold','pending') DEFAULT 'pending',
  technical_score INT,               -- /100
  communication_score INT,           -- /100
  problem_solving_score INT,         -- /100
  overall_score   INT,               -- /100
  strengths       TEXT,
  weaknesses      TEXT,
  feedback        TEXT,
  recommendation  ENUM('strongly_recommend','recommend','neutral','not_recommend','strongly_not_recommend'),
  recorded_by     INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id)   REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  FOREIGN KEY (job_id)         REFERENCES job_postings(job_id) ON DELETE CASCADE,
  FOREIGN KEY (interviewer_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (recorded_by)    REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 4. OFFER LETTERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offer_letters (
  offer_id        INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id    INT NOT NULL,
  job_id          INT NOT NULL,
  designation     VARCHAR(100) NOT NULL,
  department_id   INT,
  joining_date    DATE,
  offer_ctc       DECIMAL(12,2) NOT NULL,
  basic_salary    DECIMAL(12,2),
  hra             DECIMAL(12,2),
  allowances      DECIMAL(12,2),
  probation_months INT DEFAULT 3,
  work_location   VARCHAR(100),
  work_mode       ENUM('onsite','remote','hybrid') DEFAULT 'onsite',
  offer_valid_till DATE,
  status          ENUM('draft','sent','accepted','declined','expired','revoked') DEFAULT 'draft',
  accepted_at     TIMESTAMP NULL,
  declined_at     TIMESTAMP NULL,
  decline_reason  TEXT,
  offer_letter_url VARCHAR(255),
  generated_by    INT,
  approved_by     INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id)  REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  FOREIGN KEY (job_id)        REFERENCES job_postings(job_id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
  FOREIGN KEY (generated_by)  REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by)   REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 5. PRE-JOINING DOCUMENTS CHECKLIST (for candidates)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidate_documents (
  doc_id          INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id    INT NOT NULL,
  doc_type        ENUM('id_proof','address_proof','pan_card','aadhaar','degree_certificate','marksheets','experience_letter','salary_slip','offer_letter_previous','other') NOT NULL,
  doc_name        VARCHAR(100),
  file_url        VARCHAR(255),
  status          ENUM('pending','uploaded','verified','rejected') DEFAULT 'pending',
  verified_by     INT,
  verified_at     TIMESTAMP NULL,
  reject_reason   TEXT,
  uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by)  REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 6. EMPLOYEE REFERRALS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_referrals (
  referral_id     INT AUTO_INCREMENT PRIMARY KEY,
  referred_by     INT NOT NULL,
  candidate_id    INT,
  job_id          INT NOT NULL,
  referral_name   VARCHAR(120) NOT NULL,
  referral_email  VARCHAR(150) NOT NULL,
  referral_phone  VARCHAR(20),
  relationship    VARCHAR(80),
  cover_note      TEXT,
  status          ENUM('submitted','reviewing','shortlisted','rejected','hired') DEFAULT 'submitted',
  bonus_eligible  TINYINT(1) DEFAULT 0,
  bonus_amount    DECIMAL(10,2),
  bonus_paid_at   TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referred_by)  REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE SET NULL,
  FOREIGN KEY (job_id)       REFERENCES job_postings(job_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- 7. CAB ISSUE / COMPLAINT TICKETS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_issues (
  issue_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  booking_id      INT,
  issue_type      ENUM('late_pickup','no_show','rude_driver','ac_not_working','unsafe_driving','wrong_route','vehicle_condition','overcharging','cancellation','other') NOT NULL,
  priority        ENUM('low','medium','high','urgent') DEFAULT 'medium',
  subject         VARCHAR(200) NOT NULL,
  description     LONGTEXT NOT NULL,
  status          ENUM('open','in_review','resolved','closed','escalated') DEFAULT 'open',
  assigned_to     INT,
  resolution      TEXT,
  resolved_at     TIMESTAMP NULL,
  satisfaction    TINYINT,   -- 1-5
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id)  REFERENCES cab_bookings(booking_id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cab_issue_comments (
  comment_id  INT AUTO_INCREMENT PRIMARY KEY,
  issue_id    INT NOT NULL,
  user_id     INT NOT NULL,
  message     TEXT NOT NULL,
  is_internal TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES cab_issues(issue_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(user_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- 8. TECHNICAL SUPPORT ENHANCEMENTS
--    (Extends helpdesk with escalation, SLA, knowledge base)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS helpdesk_sla (
  sla_id          INT AUTO_INCREMENT PRIMARY KEY,
  priority        ENUM('low','medium','high','critical') NOT NULL UNIQUE,
  response_hours  INT NOT NULL,    -- first response SLA in hours
  resolve_hours   INT NOT NULL,    -- resolution SLA in hours
  escalate_hours  INT NOT NULL     -- escalate if not resolved in N hours
);
INSERT IGNORE INTO helpdesk_sla (priority,response_hours,resolve_hours,escalate_hours) VALUES
('low',24,120,168),('medium',8,48,72),('high',2,24,36),('critical',1,4,8);

CREATE TABLE IF NOT EXISTS helpdesk_escalations (
  escalation_id   INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id       INT NOT NULL,
  escalated_by    INT,
  escalated_to    INT,
  reason          TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id)    REFERENCES helpdesk_tickets(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (escalated_by) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (escalated_to) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS helpdesk_kb (
  kb_id           INT AUTO_INCREMENT PRIMARY KEY,
  category        ENUM('it_hardware','it_software','access','hr_query','payroll','facilities','other') NOT NULL,
  title           VARCHAR(200) NOT NULL,
  content         LONGTEXT NOT NULL,
  tags            VARCHAR(255),
  helpful_count   INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  created_by      INT,
  is_published    TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Seed KB articles
INSERT IGNORE INTO helpdesk_kb (category,title,content,tags,created_by) VALUES
('it_software','How to reset VPN credentials','1. Go to IT portal\n2. Click Reset VPN Password\n3. Enter your employee ID\n4. Check email for OTP\n5. Set new password\n6. Reconnect VPN client','vpn,password,reset',1),
('access','How to request system access','Submit access request via helpdesk. Attach manager approval email. Access provisioned within 1 business day.','access,permissions,system',1),
('payroll','Salary credit timeline','Salaries are credited on the last working day of each month. If not received by 3rd of next month, raise a helpdesk ticket.','salary,payroll,credit',1),
('it_hardware','Laptop slow performance troubleshooting','1. Restart laptop\n2. Check for Windows updates\n3. Run disk cleanup\n4. Check for malware\n5. If issue persists, raise ticket for hardware check.','laptop,slow,performance',1);

-- ─────────────────────────────────────────────────────────────
-- SEED DATA — Sample Job Postings
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO job_postings (title,department_id,location,job_type,candidate_type,min_experience,max_experience,min_salary,max_salary,skills_required,description,requirements,openings,status,posted_by,closes_at) VALUES
('Junior Software Engineer',1,'Bangalore',  'full_time','fresher',0,0,400000,700000,'Java,Spring Boot,MySQL','Entry-level Java developer position for fresh graduates.','B.Tech/B.E. in CS/IT with 60%+ CGPA',3,'active',1,'2026-09-30'),
('Senior React Developer', 1,'Remote',      'full_time','experienced',3,7,1200000,2000000,'React,TypeScript,Node.js','Lead frontend development for our SaaS platform.','3+ years React experience required',2,'active',1,'2026-08-31'),
('HR Business Partner',   2,'Mumbai',       'full_time','experienced',2,5,800000,1200000,'HR Policies,HRIS,Recruitment','Partner with business teams on HR strategy.','MBA HR preferred',1,'active',1,'2026-07-31'),
('Campus Intern - Data Science',1,'Hyderabad','internship','fresher',0,0,15000,25000,'Python,ML,Pandas','6-month data science internship for final year students.','Final year B.Tech/M.Tech with ML knowledge',5,'active',1,'2026-07-15');

-- END OF FILE: migrate_v12_hiring.sql

-- ==========================================================================================
-- FILE 11/26: migrate_v12_location.sql
-- SECTION: v12 LOCATION MODULE
-- DESCRIPTION: Login location logs, weather snapshots, cab route coordinates — 3 tables
-- TABLES: 3 | LINES: 88
-- ==========================================================================================

-- ═══════════════════════════════════════════════════════════════
--  v12.1 — Login Location, Weather & Session Tracking
-- ═══════════════════════════════════════════════════════════════

-- Login sessions with full location & weather context
CREATE TABLE IF NOT EXISTS login_sessions (
  session_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  ip_address        VARCHAR(45),
  -- Geo location (from browser or IP)
  latitude          DECIMAL(10,7),
  longitude         DECIMAL(10,7),
  city              VARCHAR(100),
  district          VARCHAR(100),
  state             VARCHAR(100),
  country           VARCHAR(100) DEFAULT 'India',
  pincode           VARCHAR(20),
  location_source   ENUM('gps','ip','manual','disabled') DEFAULT 'gps',
  full_address      TEXT,
  -- Weather at login time
  temperature_c     DECIMAL(5,2),
  temperature_f     DECIMAL(5,2),
  weather_condition VARCHAR(80),    -- e.g. "Partly Cloudy"
  weather_icon      VARCHAR(10),    -- emoji e.g. ⛅
  humidity_pct      TINYINT,
  wind_kph          DECIMAL(6,2),
  feels_like_c      DECIMAL(5,2),
  -- Device / Browser
  user_agent        TEXT,
  device_type       ENUM('desktop','mobile','tablet') DEFAULT 'desktop',
  browser           VARCHAR(80),
  os                VARCHAR(80),
  -- Timing
  login_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_at         TIMESTAMP NULL,
  duration_minutes  INT,
  is_active         TINYINT(1) DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_login (user_id, login_at),
  INDEX idx_active (is_active)
);

-- User location preferences (per user settings)
CREATE TABLE IF NOT EXISTS user_location_prefs (
  pref_id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL UNIQUE,
  location_enabled  TINYINT(1) DEFAULT 1,        -- 1 = on, 0 = off
  weather_enabled   TINYINT(1) DEFAULT 1,
  location_source   ENUM('gps','manual','ip') DEFAULT 'gps',
  -- Manual override location
  manual_city       VARCHAR(100),
  manual_state      VARCHAR(100),
  manual_lat        DECIMAL(10,7),
  manual_lng        DECIMAL(10,7),
  -- Temp unit preference
  temp_unit         ENUM('celsius','fahrenheit') DEFAULT 'celsius',
  -- Last known location (for quick load)
  last_city         VARCHAR(100),
  last_state        VARCHAR(100),
  last_temp_c       DECIMAL(5,2),
  last_weather      VARCHAR(80),
  last_weather_icon VARCHAR(10),
  last_updated      TIMESTAMP NULL,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Office locations (for "I'm at office" detection)
CREATE TABLE IF NOT EXISTS office_locations (
  office_id    INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  city         VARCHAR(100),
  state        VARCHAR(100),
  latitude     DECIMAL(10,7),
  longitude    DECIMAL(10,7),
  radius_meters INT DEFAULT 500,
  is_active    TINYINT(1) DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed common office locations
INSERT IGNORE INTO office_locations (name,city,state,latitude,longitude,radius_meters) VALUES
('HQ — Bangalore', 'Bangalore', 'Karnataka', 12.9716, 77.5946, 500),
('Mumbai Office',  'Mumbai',    'Maharashtra', 19.0760, 72.8777, 500),
('Delhi NCR',      'Gurugram',  'Haryana',    28.4595, 77.0266, 500),
('Hyderabad Hub',  'Hyderabad', 'Telangana',  17.3850, 78.4867, 500),
('Pune Office',    'Pune',      'Maharashtra', 18.5204, 73.8567, 500),
('Chennai Centre', 'Chennai',   'Tamil Nadu',  13.0827, 80.2707, 500);

-- END OF FILE: migrate_v12_location.sql

-- ==========================================================================================
-- FILE 12/26: migrate_v12_missing.sql
-- SECTION: v12 MISSING TABLES
-- DESCRIPTION: Document vault, grievances, headcount snapshots, OKR/goals detailed, pulse survey, POSH complaints, session management, salary revision — 16 tables
-- TABLES: 16 | LINES: 261
-- ==========================================================================================

-- ═══════════════════════════════════════════════════════════════
--  v12.0 Missing Tables Migration
--  Compliance, Travel, Exit, Dependents, Recruitment, Cab Safety
-- ═══════════════════════════════════════════════════════════════

-- Travel Requests
CREATE TABLE IF NOT EXISTS travel_requests (
  request_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  travel_type       ENUM('domestic','international') DEFAULT 'domestic',
  from_location     VARCHAR(150) NOT NULL,
  to_location       VARCHAR(150) NOT NULL,
  travel_date       DATE NOT NULL,
  return_date       DATE,
  purpose           TEXT NOT NULL,
  estimated_cost    DECIMAL(10,2) DEFAULT 0,
  approved_amount   DECIMAL(10,2),
  mode_of_travel    ENUM('flight','train','bus','car','other') DEFAULT 'flight',
  accommodation_required TINYINT(1) DEFAULT 0,
  notes             TEXT,
  status            ENUM('pending','approved','rejected','completed') DEFAULT 'pending',
  approved_by       INT,
  review_note       TEXT,
  reviewed_at       TIMESTAMP NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Expense Claims
CREATE TABLE IF NOT EXISTS expense_claims (
  claim_id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NOT NULL,
  travel_request_id  INT,
  expense_date       DATE NOT NULL,
  category           ENUM('transport','accommodation','meals','fuel','communication','office_supplies','other') NOT NULL,
  description        VARCHAR(255),
  amount             DECIMAL(10,2) NOT NULL,
  approved_amount    DECIMAL(10,2),
  currency           VARCHAR(10) DEFAULT 'INR',
  receipt_url        VARCHAR(255),
  notes              TEXT,
  reject_reason      TEXT,
  status             ENUM('pending','approved','rejected','in_batch','reimbursed') DEFAULT 'pending',
  reviewed_by        INT,
  reviewed_at        TIMESTAMP NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)           REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (travel_request_id) REFERENCES travel_requests(request_id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by)       REFERENCES users(user_id) ON DELETE SET NULL
);

-- Reimbursement Batches
CREATE TABLE IF NOT EXISTS reimbursement_batches (
  batch_id           INT AUTO_INCREMENT PRIMARY KEY,
  batch_name         VARCHAR(100) NOT NULL,
  payment_date       DATE,
  payment_reference  VARCHAR(100),
  status             ENUM('created','processed') DEFAULT 'created',
  created_by         INT,
  processed_at       TIMESTAMP NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reimbursement_batch_items (
  item_id   INT AUTO_INCREMENT PRIMARY KEY,
  batch_id  INT NOT NULL,
  claim_id  INT NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES reimbursement_batches(batch_id) ON DELETE CASCADE,
  FOREIGN KEY (claim_id) REFERENCES expense_claims(claim_id) ON DELETE CASCADE
);

-- Resignations
CREATE TABLE IF NOT EXISTS resignations (
  resignation_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  reason            ENUM('better_opportunity','higher_salary','relocation','personal','health','work_environment','career_change','other') NOT NULL,
  last_working_day  DATE NOT NULL,
  revised_lwd       DATE,
  notice_period_days INT DEFAULT 60,
  comments          TEXT,
  manager_note      TEXT,
  hr_note           TEXT,
  acknowledged_at   TIMESTAMP NULL,
  hr_actioned_at    TIMESTAMP NULL,
  status            ENUM('submitted','manager_acknowledged','hr_approved','rejected','withdrawn') DEFAULT 'submitted',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Exit Checklist
CREATE TABLE IF NOT EXISTS exit_checklist (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  item         VARCHAR(200) NOT NULL,
  completed    TINYINT(1) DEFAULT 0,
  completed_at TIMESTAMP NULL,
  sort_order   INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- FnF Settlements
CREATE TABLE IF NOT EXISTS fnf_settlements (
  fnf_id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL UNIQUE,
  details_json      JSON,
  approved_amount   DECIMAL(12,2),
  hr_note           TEXT,
  payment_mode      VARCHAR(50),
  payment_reference VARCHAR(100),
  status            ENUM('calculated','approved','disbursed') DEFAULT 'calculated',
  approved_at       TIMESTAMP NULL,
  disbursed_at      TIMESTAMP NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Exit Interviews
CREATE TABLE IF NOT EXISTS exit_interviews (
  interview_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id               INT NOT NULL UNIQUE,
  primary_reason        ENUM('better_opportunity','salary','relocation','personal','work_env','career','health','other') NOT NULL,
  secondary_reason      VARCHAR(100),
  satisfaction_rating   TINYINT CHECK (satisfaction_rating BETWEEN 1 AND 5),
  recommend_company     TINYINT(1),
  improvement_suggestions TEXT,
  liked_most            TEXT,
  liked_least           TEXT,
  would_return          TINYINT(1),
  submitted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- BGV Requests
CREATE TABLE IF NOT EXISTS bgv_requests (
  bgv_id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  agency_name       VARCHAR(100),
  checks_requested  JSON,
  consent_given     TINYINT(1) DEFAULT 0,
  consent_at        TIMESTAMP NULL,
  status            ENUM('initiated','in_progress','completed','failed') DEFAULT 'initiated',
  result            ENUM('clear','discrepancy','pending') DEFAULT 'pending',
  remarks           TEXT,
  requested_by      INT,
  completed_at      TIMESTAMP NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Exit Documents
CREATE TABLE IF NOT EXISTS exit_documents (
  doc_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  doc_type      ENUM('experience_letter','relieving_letter','noc','salary_certificate') NOT NULL,
  content_json  JSON,
  generated_by  INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Dependents
CREATE TABLE IF NOT EXISTS dependents (
  dependent_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  relationship  ENUM('spouse','child','parent','sibling','other') NOT NULL,
  dob           DATE,
  gender        ENUM('male','female','other'),
  aadhaar       VARCHAR(20),
  is_insured    TINYINT(1) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insurance Plans
CREATE TABLE IF NOT EXISTS insurance_plans (
  plan_id           INT AUTO_INCREMENT PRIMARY KEY,
  plan_name         VARCHAR(100) NOT NULL,
  insurer           VARCHAR(100),
  policy_number     VARCHAR(50),
  coverage_amount   DECIMAL(12,2),
  premium_annual    DECIMAL(10,2),
  cashless_hospitals TEXT,
  features          TEXT,
  is_active         TINYINT(1) DEFAULT 1,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance Enrollments
CREATE TABLE IF NOT EXISTS insurance_enrollments (
  enrollment_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  dependent_id    INT,
  plan_id         INT NOT NULL,
  coverage_start  DATE,
  coverage_end    DATE,
  premium         DECIMAL(10,2),
  status          ENUM('active','cancelled','expired') DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (dependent_id) REFERENCES dependents(dependent_id) ON DELETE SET NULL,
  FOREIGN KEY (plan_id)      REFERENCES insurance_plans(plan_id) ON DELETE CASCADE
);

-- Health Cards
CREATE TABLE IF NOT EXISTS health_cards (
  card_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  card_number    VARCHAR(50) UNIQUE,
  enrollment_id  INT NOT NULL,
  issued_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (enrollment_id) REFERENCES insurance_enrollments(enrollment_id) ON DELETE CASCADE
);

-- Job Requisitions
CREATE TABLE IF NOT EXISTS job_requisitions (
  requisition_id   INT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(150) NOT NULL,
  department_id    INT,
  positions        INT DEFAULT 1,
  reason           TEXT,
  expected_start   DATE,
  job_level        VARCHAR(50),
  budget_ctc       DECIMAL(12,2),
  requested_by     INT,
  reviewed_by      INT,
  review_note      TEXT,
  reviewed_at      TIMESTAMP NULL,
  status           ENUM('pending','approved','rejected','fulfilled') DEFAULT 'pending',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id)  REFERENCES departments(department_id) ON DELETE SET NULL,
  FOREIGN KEY (requested_by)   REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by)    REFERENCES users(user_id) ON DELETE SET NULL
);

-- Joining Letters
CREATE TABLE IF NOT EXISTS joining_letters (
  letter_id       INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id    INT NOT NULL,
  ref_number      VARCHAR(50) UNIQUE,
  content_json    JSON,
  acknowledged    TINYINT(1) DEFAULT 0,
  acknowledged_at TIMESTAMP NULL,
  generated_by    INT,
  generated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id)  REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by)  REFERENCES users(user_id) ON DELETE SET NULL
);

-- Seed insurance plans
INSERT IGNORE INTO insurance_plans (plan_name, insurer, policy_number, coverage_amount, premium_annual, cashless_hospitals, features) VALUES
('Basic Health Cover', 'Star Health', 'SH-2025-001', 300000, 8000, 'Network of 12,000+ hospitals', 'Hospitalization, Day care, Pre/post'),
('Family Floater', 'HDFC Ergo', 'HE-2025-002', 500000, 14000, 'Network of 10,000+ hospitals', 'Self + Spouse + 2 Children'),
('Super Top-up', 'New India Assurance', 'NIA-2025-003', 2000000, 5500, 'All government hospitals', 'Super top-up over ₹3L deductible'),
('Group Mediclaim', 'Oriental Insurance', 'OI-2025-004', 400000, 10000, 'PAN India network', 'Group policy, pre-existing covered from day 1');

-- END OF FILE: migrate_v12_missing.sql

-- ==========================================================================================
-- FILE 13/26: migrate_v12_missing2.sql
-- SECTION: v12 MISSING v2
-- DESCRIPTION: Shift roster, WFH requests, letter management, policy acknowledgements, LWF deductions, statutory bonus register — 7 tables
-- TABLES: 7 | LINES: 135
-- ==========================================================================================

-- ══════════════════════════════════════════════════════════════════
--  v12.2 Migration — Notifications, Projects, Additional Fixes
-- ══════════════════════════════════════════════════════════════════

-- ── Notifications (global) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  notification_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  type             VARCHAR(60) NOT NULL,         -- e.g. 'cab_booking','leave_approved'
  title            VARCHAR(200) NOT NULL,
  message          TEXT,
  data             JSON,
  is_read          TINYINT(1) DEFAULT 0,
  read_at          TIMESTAMP NULL,
  action_url       VARCHAR(255),
  icon             VARCHAR(10) DEFAULT '🔔',
  priority         ENUM('low','normal','high','urgent') DEFAULT 'normal',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user  (user_id, is_read),
  INDEX idx_notif_type  (type),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ── Projects ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  project_id       INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(200) NOT NULL,
  description      TEXT,
  department_id    INT,
  manager_id       INT,
  status           ENUM('planning','active','on_hold','completed','cancelled') DEFAULT 'planning',
  priority         ENUM('low','medium','high','critical') DEFAULT 'medium',
  start_date       DATE,
  due_date         DATE,
  completion_pct   TINYINT DEFAULT 0,
  budget           DECIMAL(14,2),
  spent            DECIMAL(14,2) DEFAULT 0,
  tags             VARCHAR(255),
  created_by       INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(dept_id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id)    REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)    REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS project_members (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  project_id  INT NOT NULL,
  user_id     INT NOT NULL,
  role        ENUM('lead','member','reviewer','stakeholder') DEFAULT 'member',
  joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pm (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_milestones (
  milestone_id  INT AUTO_INCREMENT PRIMARY KEY,
  project_id    INT NOT NULL,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  due_date      DATE,
  status        ENUM('pending','completed','missed') DEFAULT 'pending',
  completed_at  TIMESTAMP NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- Link tasks to projects (ADD COLUMN if tasks table already exists)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INT DEFAULT NULL AFTER task_id;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id_fk_added TINYINT DEFAULT 0;

-- ── loan_installments alias view (for FnF compatibility) ─────────
-- exitController uses loan_installments, actual table is loan_repayments
-- Create view so both names work
CREATE OR REPLACE VIEW loan_installments AS
  SELECT
    repayment_id AS installment_id,
    loan_id,
    user_id,
    amount,
    due_date,
    paid_date,
    status,
    created_at
  FROM loan_repayments;

-- ── chat_messages (if not already created by socket/chat) ────────
CREATE TABLE IF NOT EXISTS chat_rooms (
  room_id       INT AUTO_INCREMENT PRIMARY KEY,
  room_type     ENUM('direct','group','department','company') DEFAULT 'direct',
  name          VARCHAR(100),
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id    INT AUTO_INCREMENT PRIMARY KEY,
  room_id       INT,
  sender_id     INT NOT NULL,
  receiver_id   INT,                    -- for direct messages
  message       TEXT NOT NULL,
  message_type  ENUM('text','image','file','system') DEFAULT 'text',
  file_url      VARCHAR(255),
  is_read       TINYINT(1) DEFAULT 0,
  read_at       TIMESTAMP NULL,
  is_deleted    TINYINT(1) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chat_room   (room_id, created_at),
  INDEX idx_chat_direct (sender_id, receiver_id),
  FOREIGN KEY (sender_id)   REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_room_members (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  room_id   INT NOT NULL,
  user_id   INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_crm (room_id, user_id),
  FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ── Seed: Default notification categories ────────────────────────
-- (No seed data needed - notifications are generated dynamically)

-- ── Seed: Sample projects for demo ───────────────────────────────
INSERT IGNORE INTO projects (project_id, name, description, status, priority, start_date, due_date, completion_pct, created_by) VALUES
(1, 'WorkforceIQ Platform v13', 'Next major version development', 'active', 'high', '2026-01-01', '2026-12-31', 45, 1),
(2, 'Employee Wellness Initiative', 'Company-wide mental health and wellness program', 'active', 'medium', '2026-03-01', '2026-09-30', 30, 1),
(3, 'Office Expansion - Pune', 'New office setup at Pune location', 'planning', 'medium', '2026-07-01', '2026-12-31', 5, 1);

-- END OF FILE: migrate_v12_missing2.sql

-- ==========================================================================================
-- FILE 14/26: migrate_v13_uploads.sql
-- SECTION: v13 UPLOADS
-- DESCRIPTION: Employee documents (multerShim), company policies, policy upload logs — 3 tables
-- TABLES: 3 | LINES: 55
-- ==========================================================================================

-- ═══════════════════════════════════════════════════════════════
-- migrate_v13_uploads.sql — Document Vault & Policy Library tables
-- Run after all previous migrations
-- ═══════════════════════════════════════════════════════════════

-- Employee Document Vault
CREATE TABLE IF NOT EXISTS employee_documents (
  doc_id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NOT NULL,
  category           ENUM('identity','educational','employment','financial','medical','address','other') DEFAULT 'other',
  doc_name           VARCHAR(200) NOT NULL,
  file_url           VARCHAR(500) NOT NULL,
  file_size          INT DEFAULT 0,           -- bytes
  expiry_date        DATE,
  notes              TEXT,
  status             ENUM('pending','verified','rejected') DEFAULT 'pending',
  shared_with_hr     TINYINT(1) DEFAULT 0,
  verified_by        INT,
  verified_at        DATETIME,
  reject_reason      TEXT,
  uploaded_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Company Policy Library
CREATE TABLE IF NOT EXISTS company_policies (
  policy_id              INT AUTO_INCREMENT PRIMARY KEY,
  title                  VARCHAR(300) NOT NULL,
  category               VARCHAR(100) DEFAULT 'General',
  version                VARCHAR(20)  DEFAULT 'v1.0',
  file_url               VARCHAR(500) NOT NULL,
  acknowledgement_required TINYINT(1) DEFAULT 1,
  applicable_to          VARCHAR(100) DEFAULT 'all',   -- 'all', dept name, role
  uploaded_by            INT NOT NULL,
  is_active              TINYINT(1) DEFAULT 1,
  created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id),
  INDEX idx_category (category),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Policy Acknowledgements
CREATE TABLE IF NOT EXISTS policy_acknowledgements (
  ack_id          INT AUTO_INCREMENT PRIMARY KEY,
  policy_id       INT NOT NULL,
  user_id         INT NOT NULL,
  acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ack (policy_id, user_id),
  FOREIGN KEY (policy_id) REFERENCES company_policies(policy_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- END OF FILE: migrate_v13_uploads.sql

-- ==========================================================================================
-- FILE 15/26: migrate_v14_2026.sql
-- SECTION: v14 FY2026-27 MODULE
-- DESCRIPTION: Investment declarations, Form 12BB items, pulse survey responses, POSH training, user session tokens, login history, salary revision history, minimum wages (seeded Jan 2026), payslip access log, data consents (DPDP Act 2023), HR letters (8 types), exit documents — 14 tables
-- TABLES: 14 | LINES: 265
-- ==========================================================================================

-- ═══════════════════════════════════════════════════════════════
-- migrate_v14_2026.sql — FY 2026-27 Compliance & New Modules
-- Run AFTER all previous migrations (v13_uploads)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Investment Declarations (Form 12BB) ────────────────────
CREATE TABLE IF NOT EXISTS investment_declarations (
  decl_id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  financial_year  VARCHAR(10) NOT NULL DEFAULT '2026-27',
  tax_regime      ENUM('new','old') DEFAULT 'new',
  sec_80c_amount  DECIMAL(12,2) DEFAULT 0,
  sec_80d_amount  DECIMAL(12,2) DEFAULT 0,
  hra_amount      DECIMAL(12,2) DEFAULT 0,
  home_loan_int   DECIMAL(12,2) DEFAULT 0,
  nps_80ccd1b     DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) GENERATED ALWAYS AS
    (sec_80c_amount+sec_80d_amount+hra_amount+home_loan_int+nps_80ccd1b+other_deductions) STORED,
  status          ENUM('draft','submitted','approved','rejected') DEFAULT 'draft',
  submitted_at    DATETIME,
  approved_by     INT,
  approved_at     DATETIME,
  remarks         TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_fy (user_id, financial_year),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_fy (financial_year),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 2. 80C Investment Items ───────────────────────────────────
CREATE TABLE IF NOT EXISTS declaration_items (
  item_id         INT AUTO_INCREMENT PRIMARY KEY,
  decl_id         INT NOT NULL,
  investment_type VARCHAR(100) NOT NULL,
  amount          DECIMAL(12,2) NOT NULL,
  proof_type      VARCHAR(50),
  proof_uploaded  TINYINT(1) DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (decl_id) REFERENCES investment_declarations(decl_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 3. Pulse Surveys ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pulse_surveys (
  survey_id       INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(200) NOT NULL,
  week_number     INT,
  year            INT DEFAULT 2026,
  frequency       ENUM('weekly','biweekly','monthly','one-time') DEFAULT 'weekly',
  applicable_to   VARCHAR(100) DEFAULT 'all',
  created_by      INT,
  start_date      DATE,
  close_date      DATE,
  is_active       TINYINT(1) DEFAULT 1,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id),
  INDEX idx_week (week_number, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pulse_responses (
  resp_id         INT AUTO_INCREMENT PRIMARY KEY,
  survey_id       INT NOT NULL,
  user_id         INT NOT NULL,
  happiness_score TINYINT CHECK (happiness_score BETWEEN 1 AND 5),
  workload_score  TINYINT CHECK (workload_score BETWEEN 1 AND 5),
  recognition_score TINYINT CHECK (recognition_score BETWEEN 1 AND 5),
  nps_score       TINYINT CHECK (nps_score BETWEEN 0 AND 10),
  comments        TEXT,
  is_anonymous    TINYINT(1) DEFAULT 1,
  submitted_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_survey (survey_id, user_id),
  FOREIGN KEY (survey_id) REFERENCES pulse_surveys(survey_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 4. POSH Complaints ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS posh_complaints (
  complaint_id    INT AUTO_INCREMENT PRIMARY KEY,
  reference_no    VARCHAR(20) UNIQUE,
  complainant_id  INT NOT NULL,
  incident_date   DATE NOT NULL,
  nature          VARCHAR(100) NOT NULL,
  location        VARCHAR(200),
  description     TEXT NOT NULL,
  witnesses       TEXT,
  evidence_files  JSON,
  status          ENUM('filed','under_investigation','resolved','dismissed') DEFAULT 'filed',
  icc_remarks     TEXT,
  filed_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at     DATETIME,
  is_confidential TINYINT(1) DEFAULT 1,
  FOREIGN KEY (complainant_id) REFERENCES users(user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 5. POSH Training Records ─────────────────────────────────
CREATE TABLE IF NOT EXISTS posh_training (
  training_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  training_type   VARCHAR(100),
  training_date   DATE,
  mode            ENUM('e-learning','in-person','webinar') DEFAULT 'e-learning',
  duration_hours  DECIMAL(4,1),
  completed       TINYINT(1) DEFAULT 0,
  certificate_url VARCHAR(500),
  valid_until     DATE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 6. Session Management ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id      VARCHAR(64) PRIMARY KEY,
  user_id         INT NOT NULL,
  device_info     VARCHAR(300),
  browser         VARCHAR(100),
  os              VARCHAR(100),
  ip_address      VARCHAR(45),
  city            VARCHAR(100),
  country         VARCHAR(100),
  is_current      TINYINT(1) DEFAULT 0,
  is_suspicious   TINYINT(1) DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at      DATETIME,
  revoked_at      DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_active (last_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 7. Login History ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_history (
  log_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  event_type      ENUM('login','logout','failed','suspicious','revoke') DEFAULT 'login',
  ip_address      VARCHAR(45),
  city            VARCHAR(100),
  device_info     VARCHAR(300),
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_event (event_type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 8. Salary Revisions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_revisions (
  revision_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  effective_date  DATE NOT NULL,
  old_ctc         DECIMAL(12,2),
  new_ctc         DECIMAL(12,2),
  hike_percent    DECIMAL(5,2),
  hike_reason     ENUM('annual','promotion','market_correction','performance','other') DEFAULT 'annual',
  approved_by     INT,
  status          ENUM('pending','approved','rejected') DEFAULT 'pending',
  arrear_months   INT DEFAULT 0,
  arrear_amount   DECIMAL(12,2) DEFAULT 0,
  letter_url      VARCHAR(500),
  remarks         TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at     DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (approved_by) REFERENCES users(user_id),
  INDEX idx_user (user_id),
  INDEX idx_effective (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 9. Minimum Wages State Data ──────────────────────────────
CREATE TABLE IF NOT EXISTS minimum_wages (
  wage_id         INT AUTO_INCREMENT PRIMARY KEY,
  state           VARCHAR(50) NOT NULL,
  skill_category  ENUM('unskilled','semi_skilled','skilled','highly_skilled') NOT NULL,
  daily_wage      DECIMAL(8,2) NOT NULL,
  monthly_wage    DECIMAL(10,2) NOT NULL,
  vda             DECIMAL(8,2) DEFAULT 0,
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  revision_cycle  ENUM('january','july','october','april') DEFAULT 'january',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_state_skill_date (state, skill_category, effective_from),
  INDEX idx_state (state),
  INDEX idx_effective (effective_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed minimum wages (Jan 2026 revision)
INSERT IGNORE INTO minimum_wages (state, skill_category, daily_wage, monthly_wage, vda, effective_from, revision_cycle) VALUES
  ('Karnataka','unskilled',480.00,12499.00,1200.00,'2026-01-01','january'),
  ('Karnataka','skilled',562.00,14612.00,1200.00,'2026-01-01','january'),
  ('Karnataka','highly_skilled',619.00,16094.00,1200.00,'2026-01-01','january'),
  ('Maharashtra','unskilled',498.00,12948.00,1460.00,'2026-01-01','january'),
  ('Maharashtra','skilled',583.00,15158.00,1460.00,'2026-01-01','january'),
  ('Maharashtra','highly_skilled',641.00,16666.00,1460.00,'2026-01-01','january'),
  ('Delhi','unskilled',578.00,15028.00,2100.00,'2025-10-01','october'),
  ('Delhi','skilled',693.00,18018.00,2100.00,'2025-10-01','october'),
  ('Telangana','unskilled',466.00,12116.00,980.00,'2026-01-01','january'),
  ('Telangana','skilled',567.00,14742.00,980.00,'2026-01-01','january');

-- ── 10. Payslip Access Log (DPDP compliance) ─────────────────
CREATE TABLE IF NOT EXISTS payslip_access_log (
  log_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  payslip_month   VARCHAR(7),  -- 'YYYY-MM'
  action          ENUM('view','download','email','share') DEFAULT 'view',
  ip_address      VARCHAR(45),
  accessed_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 11. DPDP Consent Management ──────────────────────────────
CREATE TABLE IF NOT EXISTS data_consents (
  consent_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  consent_type    VARCHAR(100) NOT NULL,  -- 'payroll_processing', 'ai_insights', 'location_tracking'
  purpose         TEXT,
  consented       TINYINT(1) DEFAULT 0,
  consented_at    DATETIME,
  withdrawn_at    DATETIME,
  ip_address      VARCHAR(45),
  UNIQUE KEY uq_user_consent (user_id, consent_type),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Summary ──────────────────────────────────────────────────
-- Tables added: investment_declarations, declaration_items,
--   pulse_surveys, pulse_responses, posh_complaints, posh_training,
--   user_sessions, login_history, salary_revisions,
--   minimum_wages (+ seed data), payslip_access_log, data_consents
-- Total new tables: 12

-- ── HR Letters table (if not already present) ─────────────────
CREATE TABLE IF NOT EXISTS hr_letters (
  letter_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  letter_type     ENUM('offer_letter','confirmation_letter','experience_letter',
                       'relieving_letter','salary_certificate','noc_letter',
                       'warning_letter','promotion_letter') NOT NULL,
  ref_no          VARCHAR(40),
  content         LONGTEXT,
  extra_data      JSON,
  issued_date     DATE DEFAULT (CURDATE()),
  generated_by    INT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(user_id),
  INDEX idx_user (user_id),
  INDEX idx_type (letter_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── exit_documents (if missing from earlier migrations) ────────
CREATE TABLE IF NOT EXISTS exit_documents (
  doc_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  doc_type        VARCHAR(50),
  content_json    JSON,
  generated_by    INT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- END OF FILE: migrate_v14_2026.sql

-- ==========================================================================================
-- FILE 16/26: migrate_cab.sql
-- SECTION: CAB MODULE
-- DESCRIPTION: Cab drivers, cab issues, SOS alerts — 3 tables
-- TABLES: 3 | LINES: 66
-- ==========================================================================================

-- ================================================================
--  CAB BOOKING SYSTEM — Migration
--  WorkforceIQ v7.0
-- ================================================================

-- ── Vehicle / Route options ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_routes (
  route_id    INT AUTO_INCREMENT PRIMARY KEY,
  route_name  VARCHAR(100) NOT NULL,        -- e.g. "Zone A – Rajiv Nagar"
  zone        VARCHAR(60)  NOT NULL,
  pickup_stop VARCHAR(150) NOT NULL,
  pickup_time TIME         NOT NULL,        -- fixed pickup time
  drop_time   TIME         NOT NULL,        -- fixed drop time
  total_seats INT          DEFAULT 12,
  is_active   BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ── Vehicle types ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_vehicles (
  vehicle_id   INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_type ENUM('Bus','Car','Bike') NOT NULL,
  label        VARCHAR(80)  NOT NULL,       -- e.g. "AC Bus – 12 seater"
  capacity     INT          DEFAULT 1,
  is_active    BOOLEAN      DEFAULT TRUE
);

-- ── Bookings ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_bookings (
  booking_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL,
  route_id      INT          NOT NULL,
  vehicle_id    INT          NOT NULL,
  shift_id      INT          DEFAULT NULL,  -- linked shift (nullable)
  booking_date  DATE         NOT NULL,      -- the travel date
  trip_type     ENUM('pickup','drop','both') DEFAULT 'both',
  night_cab     BOOLEAN      DEFAULT FALSE, -- true = night cab request
  seat_number   INT          DEFAULT NULL,  -- assigned seat
  status        ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
  approved_by   INT          DEFAULT NULL,
  approved_at   TIMESTAMP    DEFAULT NULL,
  reject_reason VARCHAR(255) DEFAULT NULL,
  special_note  TEXT         DEFAULT NULL,
  booked_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id)   ON DELETE CASCADE,
  FOREIGN KEY (route_id)   REFERENCES cab_routes(route_id),
  FOREIGN KEY (vehicle_id) REFERENCES cab_vehicles(vehicle_id),
  FOREIGN KEY (shift_id)   REFERENCES shifts(shift_id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(user_id)  ON DELETE SET NULL
);

-- ── Seed: routes ────────────────────────────────────────────────
INSERT IGNORE INTO cab_routes (route_id, route_name, zone, pickup_stop, pickup_time, drop_time, total_seats) VALUES
(1, 'Zone A – Rajiv Nagar',  'North', 'Rajiv Nagar Bus Stop',  '08:15:00', '18:30:00', 12),
(2, 'Zone B – Kankarbagh',   'South', 'Kankarbagh Crossing',   '08:30:00', '18:45:00', 12),
(3, 'Zone C – Boring Road',  'West',  'Boring Road Petrol Pump','08:45:00', '19:00:00', 8),
(4, 'Zone D – Patliputra',   'East',  'Patliputra Colony Gate', '08:20:00', '18:35:00', 10),
(5, 'Night Cab – Any Zone',  'All',   'Office Main Gate',       '21:00:00', '22:30:00', 4);

-- ── Seed: vehicles ──────────────────────────────────────────────
INSERT IGNORE INTO cab_vehicles (vehicle_id, vehicle_type, label, capacity) VALUES
(1, 'Bus',  'AC Bus – 12 Seater',      12),
(2, 'Bus',  'Mini Bus – 8 Seater',      8),
(3, 'Car',  'Sedan – 4 Seater (AC)',    4),
(4, 'Car',  'SUV – 6 Seater (AC)',      6),
(5, 'Bike', 'Bike Taxi – 1 Rider',      1);

-- END OF FILE: migrate_cab.sql

-- ==========================================================================================
-- FILE 17/26: migrate_cab_v2.sql
-- SECTION: CAB MODULE v2
-- DESCRIPTION: Extended cab tracking, driver ratings, CSAT, route management, emergency center — 5 tables
-- TABLES: 5 | LINES: 158
-- ==========================================================================================

-- ================================================================
--  CAB SYSTEM v2 — Driver Profiles, Tracking, Distance Limits
--  WorkforceIQ v7.0
--  Run AFTER migrate_cab.sql
-- ================================================================

-- ── Driver profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_drivers (
  driver_id       INT AUTO_INCREMENT PRIMARY KEY,
  employee_code   VARCHAR(20)  UNIQUE NOT NULL,   -- e.g. DRV-001
  full_name       VARCHAR(120) NOT NULL,
  mobile          VARCHAR(15)  NOT NULL,
  alt_mobile      VARCHAR(15)  DEFAULT NULL,
  email           VARCHAR(120) DEFAULT NULL,
  address         TEXT         NOT NULL,
  license_number  VARCHAR(30)  NOT NULL,
  license_expiry  DATE         NOT NULL,
  id_card_number  VARCHAR(40)  NOT NULL,           -- Aadhaar / DL / company ID
  id_card_type    ENUM('Aadhaar','Driving License','Passport','Company ID') DEFAULT 'Aadhaar',
  photo_url       VARCHAR(255) DEFAULT NULL,        -- path to uploaded photo
  id_card_url     VARCHAR(255) DEFAULT NULL,        -- path to scanned ID card
  vehicle_id      INT          DEFAULT NULL,        -- assigned vehicle
  assigned_route  INT          DEFAULT NULL,        -- primary route
  status          ENUM('active','on_leave','suspended','inactive') DEFAULT 'active',
  joining_date    DATE         DEFAULT NULL,
  emergency_contact_name   VARCHAR(120) DEFAULT NULL,
  emergency_contact_mobile VARCHAR(15)  DEFAULT NULL,
  rating          DECIMAL(3,2) DEFAULT 5.00,        -- avg rating 1–5
  total_trips     INT          DEFAULT 0,
  notes           TEXT         DEFAULT NULL,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id)     REFERENCES cab_vehicles(vehicle_id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_route) REFERENCES cab_routes(route_id)     ON DELETE SET NULL
);

-- ── Assign driver to booking (when approved) ─────────────────────
ALTER TABLE cab_bookings
  ADD COLUMN IF NOT EXISTS driver_id       INT     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS distance_km     DECIMAL(8,2) DEFAULT NULL,   -- employee's distance from pickup
  ADD COLUMN IF NOT EXISTS otp             VARCHAR(6)   DEFAULT NULL,   -- journey OTP
  ADD COLUMN IF NOT EXISTS journey_status  ENUM('waiting','in_transit','completed','sos') DEFAULT 'waiting',
  ADD COLUMN IF NOT EXISTS journey_start   TIMESTAMP    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS journey_end     TIMESTAMP    DEFAULT NULL,
  ADD FOREIGN KEY (driver_id) REFERENCES cab_drivers(driver_id) ON DELETE SET NULL;

-- ── Distance limits per zone ─────────────────────────────────────
ALTER TABLE cab_routes
  ADD COLUMN IF NOT EXISTS max_distance_km  DECIMAL(6,2) DEFAULT 30.00,  -- max allowed distance
  ADD COLUMN IF NOT EXISTS base_lat         DECIMAL(10,7) DEFAULT 25.6093,  -- office lat (Patna default)
  ADD COLUMN IF NOT EXISTS base_lng         DECIMAL(10,7) DEFAULT 85.1376;  -- office lng

-- ── Live tracking pings (GPS breadcrumbs) ────────────────────────
CREATE TABLE IF NOT EXISTS cab_tracking (
  ping_id      INT AUTO_INCREMENT PRIMARY KEY,
  booking_id   INT          NOT NULL,
  driver_id    INT          NOT NULL,
  latitude     DECIMAL(10,7) NOT NULL,
  longitude    DECIMAL(10,7) NOT NULL,
  speed_kmh    DECIMAL(6,2) DEFAULT 0,
  heading      INT          DEFAULT 0,    -- degrees 0–360
  recorded_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES cab_bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id)  REFERENCES cab_drivers(driver_id)   ON DELETE CASCADE
);

-- ── SOS alerts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_sos (
  sos_id      INT AUTO_INCREMENT PRIMARY KEY,
  booking_id  INT          NOT NULL,
  user_id     INT          NOT NULL,
  latitude    DECIMAL(10,7) DEFAULT NULL,
  longitude   DECIMAL(10,7) DEFAULT NULL,
  message     TEXT         DEFAULT NULL,
  status      ENUM('open','acknowledged','resolved') DEFAULT 'open',
  resolved_by INT          DEFAULT NULL,
  resolved_at TIMESTAMP    DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES cab_bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(user_id)           ON DELETE CASCADE
);

-- ── Driver ratings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_driver_ratings (
  rating_id   INT AUTO_INCREMENT PRIMARY KEY,
  driver_id   INT          NOT NULL,
  booking_id  INT          NOT NULL,
  user_id     INT          NOT NULL,
  rating      TINYINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback    TEXT         DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booking_rating (booking_id, user_id),
  FOREIGN KEY (driver_id)  REFERENCES cab_drivers(driver_id)   ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES cab_bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(user_id)           ON DELETE CASCADE
);

-- ── Seed: sample drivers ─────────────────────────────────────────
INSERT IGNORE INTO cab_drivers
  (driver_id, employee_code, full_name, mobile, alt_mobile, email, address,
   license_number, license_expiry, id_card_number, id_card_type,
   vehicle_id, assigned_route, status, joining_date,
   emergency_contact_name, emergency_contact_mobile, rating, total_trips) VALUES
(1,'DRV-001','Ramesh Kumar Singh',  '+91-9801234561','+91-9801234562','ramesh.driver@wip.com',
   '12, Rajiv Nagar Colony, Near SBI Bank, Patna – 800001',
   'BR-2019-0123456','2027-03-15','1234 5678 9012','Aadhaar',
   1,1,'active','2021-06-01','Sunita Singh','+91-9801234563',4.8,312),

(2,'DRV-002','Suresh Prasad Yadav', '+91-9801234564','+91-9801234565','suresh.driver@wip.com',
   '45, Kankarbagh Main Road, Behind Petrol Pump, Patna – 800020',
   'BR-2018-0234567','2026-11-20','2345 6789 0123','Aadhaar',
   1,2,'active','2020-03-15','Meera Devi','+91-9801234566',4.6,287),

(3,'DRV-003','Manoj Kumar Sharma',  '+91-9801234567',NULL,'manoj.driver@wip.com',
   '78, Boring Road, Near City Mall, Patna – 800001',
   'BR-2020-0345678','2028-07-10','3456 7890 1234','Aadhaar',
   2,3,'active','2022-01-10','Ritu Sharma','+91-9801234568',4.9,198),

(4,'DRV-004','Deepak Verma',        '+91-9801234569','+91-9801234570','deepak.driver@wip.com',
   '23, Patliputra Colony, Sector B, Patna – 800013',
   'BR-2017-0456789','2025-12-31','4567 8901 2345','Aadhaar',
   3,4,'active','2019-08-20','Kavita Verma','+91-9801234571',4.7,421),

(5,'DRV-005','Vijay Shankar Mishra','+91-9801234572',NULL,'vijay.driver@wip.com',
   '56, Bailey Road, Near Airport, Patna – 800014',
   'BR-2021-0567890','2029-02-28','5678 9012 3456','Aadhaar',
   4,5,'active','2023-02-01','Anita Mishra','+91-9801234573',4.5,89);

-- Update route distances
UPDATE cab_routes SET max_distance_km = 25 WHERE route_id = 1;
UPDATE cab_routes SET max_distance_km = 20 WHERE route_id = 2;
UPDATE cab_routes SET max_distance_km = 15 WHERE route_id = 3;
UPDATE cab_routes SET max_distance_km = 22 WHERE route_id = 4;
UPDATE cab_routes SET max_distance_km = 50 WHERE route_id = 5;  -- night cab wider range

-- ================================================================
--  CAB SYSTEM v2.1 — Driver Responsibility & Travel Completion
-- ================================================================

-- Driver trip acknowledgment & responsibility log
ALTER TABLE cab_bookings
  ADD COLUMN IF NOT EXISTS driver_acknowledged  BOOLEAN   DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS driver_ack_at        TIMESTAMP DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS travel_km            DECIMAL(8,2) DEFAULT NULL,   -- actual km driven
  ADD COLUMN IF NOT EXISTS completion_note      TEXT      DEFAULT NULL,       -- driver's closing note
  ADD COLUMN IF NOT EXISTS notify_sent          BOOLEAN   DEFAULT FALSE;      -- broadcast sent flag

-- Notification log for travel completions
CREATE TABLE IF NOT EXISTS cab_travel_notifications (
  notif_id     INT AUTO_INCREMENT PRIMARY KEY,
  booking_id   INT          NOT NULL,
  driver_id    INT          NOT NULL,
  sent_to      ENUM('employee','manager','admin','all') DEFAULT 'all',
  message      TEXT         NOT NULL,
  travel_km    DECIMAL(8,2) DEFAULT NULL,
  sent_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES cab_bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id)  REFERENCES cab_drivers(driver_id)   ON DELETE CASCADE
);

-- END OF FILE: migrate_cab_v2.sql

-- ==========================================================================================
-- FILE 18/26: migrate_meetings.sql
-- SECTION: MEETINGS MODULE
-- DESCRIPTION: Meetings, meeting attendees, meeting recordings, video conference links, agenda items — 6 tables
-- TABLES: 6 | LINES: 106
-- ==========================================================================================

-- ================================================================
--  MEETING ROOM SYSTEM — WorkforceIQ v7.0
-- ================================================================

CREATE TABLE IF NOT EXISTS meeting_rooms (
  room_id      INT AUTO_INCREMENT PRIMARY KEY,
  room_name    VARCHAR(100) NOT NULL,
  room_code    VARCHAR(20)  UNIQUE NOT NULL,   -- e.g. ROOM-001
  capacity     INT          DEFAULT 10,
  has_video    BOOLEAN      DEFAULT TRUE,
  has_audio    BOOLEAN      DEFAULT TRUE,
  has_screen   BOOLEAN      DEFAULT TRUE,
  location     VARCHAR(120) DEFAULT 'Virtual',
  is_active    BOOLEAN      DEFAULT TRUE,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meetings (
  meeting_id     INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  description    TEXT         DEFAULT NULL,
  meeting_type   ENUM('internal','client','interview','standup','review','training','emergency') DEFAULT 'internal',
  host_id        INT          NOT NULL,
  room_id        INT          DEFAULT NULL,
  room_code      VARCHAR(20)  UNIQUE NOT NULL,   -- join code e.g. WIP-123456
  scheduled_at   DATETIME     NOT NULL,
  duration_mins  INT          DEFAULT 60,
  ended_at       DATETIME     DEFAULT NULL,
  status         ENUM('scheduled','active','ended','cancelled') DEFAULT 'scheduled',
  agenda         TEXT         DEFAULT NULL,
  recording_url  VARCHAR(255) DEFAULT NULL,
  password       VARCHAR(20)  DEFAULT NULL,
  allow_guests   BOOLEAN      DEFAULT FALSE,
  client_name    VARCHAR(120) DEFAULT NULL,
  client_email   VARCHAR(120) DEFAULT NULL,
  report_generated BOOLEAN    DEFAULT FALSE,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id)  REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (room_id)  REFERENCES meeting_rooms(room_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meeting_participants (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id   INT NOT NULL,
  user_id      INT DEFAULT NULL,      -- NULL = guest
  guest_name   VARCHAR(120) DEFAULT NULL,
  guest_email  VARCHAR(120) DEFAULT NULL,
  role         ENUM('host','co_host','presenter','participant','viewer') DEFAULT 'participant',
  status       ENUM('invited','accepted','declined','joined','left') DEFAULT 'invited',
  joined_at    DATETIME    DEFAULT NULL,
  left_at      DATETIME    DEFAULT NULL,
  mic_on       BOOLEAN     DEFAULT FALSE,
  video_on     BOOLEAN     DEFAULT FALSE,
  hand_raised  BOOLEAN     DEFAULT FALSE,
  FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meeting_messages (
  msg_id       INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id   INT          NOT NULL,
  sender_id    INT          DEFAULT NULL,
  sender_name  VARCHAR(120) DEFAULT 'Guest',
  content      TEXT         NOT NULL,
  msg_type     ENUM('chat','system','reaction') DEFAULT 'chat',
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)  REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meeting_notes (
  note_id      INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id   INT          NOT NULL,
  author_id    INT          DEFAULT NULL,
  content      TEXT         NOT NULL,
  note_type    ENUM('note','action','decision','question') DEFAULT 'note',
  assigned_to  INT          DEFAULT NULL,
  due_date     DATE         DEFAULT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id)  REFERENCES meetings(meeting_id) ON DELETE CASCADE,
  FOREIGN KEY (author_id)   REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meeting_reports (
  report_id        INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id       INT     NOT NULL UNIQUE,
  summary          TEXT    DEFAULT NULL,   -- AI-generated summary
  key_points       TEXT    DEFAULT NULL,   -- JSON array of key discussion points
  action_items     TEXT    DEFAULT NULL,   -- JSON array of action items
  decisions        TEXT    DEFAULT NULL,   -- JSON array of decisions made
  attendee_list    TEXT    DEFAULT NULL,   -- JSON
  duration_actual  INT     DEFAULT NULL,   -- actual minutes
  generated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by     ENUM('ai','manual') DEFAULT 'ai',
  FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id) ON DELETE CASCADE
);

-- ── Seed rooms ────────────────────────────────────────────────
INSERT IGNORE INTO meeting_rooms (room_id,room_name,room_code,capacity,location) VALUES
(1,'Main Conference Room','ROOM-001',20,'Floor 3 – East Wing'),
(2,'Board Room',          'ROOM-002',12,'Floor 5 – Director Suite'),
(3,'Team Room Alpha',     'ROOM-003',8, 'Floor 2 – Dev Wing'),
(4,'Team Room Beta',      'ROOM-004',8, 'Floor 2 – Dev Wing'),
(5,'Client Meeting Room', 'ROOM-005',15,'Floor 1 – Reception'),
(6,'Virtual Only',        'ROOM-006',50,'Remote / Video Call');

-- END OF FILE: migrate_meetings.sql

-- ==========================================================================================
-- FILE 19/26: migrate_profile_bank.sql
-- SECTION: PROFILE & BANKING
-- DESCRIPTION: Bank account details, IFSC lookup, account verification — ALTER additions
-- TABLES: 0 | LINES: 42
-- ==========================================================================================

-- ─────────────────────────────────────────────────────────────────────────
--  migrate_profile_bank.sql
--  Adds: photo_url, bank details, employee_code to users table
--  Run AFTER sem4_migrations.sql
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS photo_url          VARCHAR(255) DEFAULT NULL  AFTER profile_notes,
  ADD COLUMN IF NOT EXISTS employee_code      VARCHAR(20)  DEFAULT NULL  AFTER photo_url,
  ADD COLUMN IF NOT EXISTS bank_name          VARCHAR(100) DEFAULT NULL  AFTER employee_code,
  ADD COLUMN IF NOT EXISTS account_number     VARCHAR(30)  DEFAULT NULL  AFTER bank_name,
  ADD COLUMN IF NOT EXISTS ifsc_code          VARCHAR(15)  DEFAULT NULL  AFTER account_number,
  ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(100) DEFAULT NULL AFTER ifsc_code,
  ADD COLUMN IF NOT EXISTS account_type       ENUM('savings','current','salary') DEFAULT 'savings' AFTER account_holder_name,
  ADD UNIQUE INDEX IF NOT EXISTS idx_employee_code (employee_code);

-- Generate employee codes for existing users (EMP0001, EMP0002, …)
SET @rownum = 0;
UPDATE users
  SET employee_code = CONCAT('EMP', LPAD((@rownum := @rownum + 1), 4, '0'))
  WHERE employee_code IS NULL
  ORDER BY user_id;

-- ── Demo bank details for existing employees ─────────────────────────────
-- Piyush Sharma (or first employee — safe to re-run)
UPDATE users SET
  bank_name             = 'State Bank of India',
  account_number        = '32109876543210',
  ifsc_code             = 'SBIN0001234',
  account_holder_name   = full_name,
  account_type          = 'salary'
WHERE role_id = 2 AND bank_name IS NULL LIMIT 5;

UPDATE users SET
  bank_name             = 'HDFC Bank',
  account_number        = '50100123456789',
  ifsc_code             = 'HDFC0001234',
  account_holder_name   = full_name,
  account_type          = 'salary'
WHERE role_id IN (3,4) AND bank_name IS NULL LIMIT 10;

COMMIT;

-- END OF FILE: migrate_profile_bank.sql

-- ==========================================================================================
-- FILE 20/26: migrate_route_coords.sql
-- SECTION: ROUTE COORDINATES
-- DESCRIPTION: GPS waypoints for cab routes — coordinate storage
-- TABLES: 0 | LINES: 40
-- ==========================================================================================

-- ─────────────────────────────────────────────────────────
--  migrate_route_coords.sql
--  Add lat/lng coordinates to cab_routes for map display
--  Run AFTER migrate_cab_v2.sql
-- ─────────────────────────────────────────────────────────

ALTER TABLE cab_routes
  ADD COLUMN IF NOT EXISTS pickup_lat  DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pickup_lng  DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS drop_lat    DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS drop_lng    DECIMAL(10,7) DEFAULT NULL;

-- Patna, Bihar coordinates for each route pickup stop
-- Office = 25.6093, 85.1376 (IIT Patna / Bihta area reference)
UPDATE cab_routes SET
  pickup_lat = 25.6205, pickup_lng = 85.1310,
  drop_lat   = 25.6093, drop_lng   = 85.1376
WHERE route_id = 1; -- Zone A – Rajiv Nagar Bus Stop

UPDATE cab_routes SET
  pickup_lat = 25.6012, pickup_lng = 85.1482,
  drop_lat   = 25.6093, drop_lng   = 85.1376
WHERE route_id = 2; -- Zone B – Kankarbagh Crossing

UPDATE cab_routes SET
  pickup_lat = 25.6097, pickup_lng = 85.1121,
  drop_lat   = 25.6093, drop_lng   = 85.1376
WHERE route_id = 3; -- Zone C – Boring Road Petrol Pump

UPDATE cab_routes SET
  pickup_lat = 25.6214, pickup_lng = 85.1268,
  drop_lat   = 25.6093, drop_lng   = 85.1376
WHERE route_id = 4; -- Zone D – Patliputra Colony Gate

UPDATE cab_routes SET
  pickup_lat = 25.6093, pickup_lng = 85.1376,
  drop_lat   = 25.6093, drop_lng   = 85.1376
WHERE route_id = 5; -- Night Cab – Office Main Gate

COMMIT;

-- END OF FILE: migrate_route_coords.sql

-- ==========================================================================================
-- FILE 21/26: sem4_migrations.sql
-- SECTION: SEM4 EXTRAS
-- DESCRIPTION: Time tracker sessions, billable hours log, timesheet approvals — 3 tables
-- TABLES: 3 | LINES: 170
-- ==========================================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- sem4_migrations.sql — 4th Semester Database Enhancements
-- Workforce Intelligence Platform
--
-- Run after schema.sql:
--   mysql -u root -p workforce_intelligence < sem4_migrations.sql
--
-- Includes:
--   1. Performance indexes (composite) on high-read tables
--   2. alerts table upgrade (type + title + meta columns)
--   3. attrition_scores table (store Python model output)
--   4. pwa_push_subscriptions table (Web Push API)
--   5. role_dashboards table (custom dashboard layouts)
-- ═══════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────────
-- 1. PERFORMANCE INDEXES
-- ────────────────────────────────────────────────────────────────────────

-- attendance: most queried by (user_id, work_date) and (work_date alone for today's stats)
ALTER TABLE attendance
  ADD INDEX IF NOT EXISTS idx_att_user_date  (user_id, work_date),
  ADD INDEX IF NOT EXISTS idx_att_date       (work_date),
  ADD INDEX IF NOT EXISTS idx_att_status     (status);

-- salary_records: queried by (user_id, month, year) for payslip; (year, month) for payroll run
ALTER TABLE salary_records
  ADD INDEX IF NOT EXISTS idx_sal_user_period (user_id, year, month),
  ADD INDEX IF NOT EXISTS idx_sal_period      (year, month),
  ADD INDEX IF NOT EXISTS idx_sal_status      (payment_status);

-- tasks: queried by (assigned_to, status) for employee dashboard; (due_date, status) for overdue check
ALTER TABLE tasks
  ADD INDEX IF NOT EXISTS idx_task_assignee_status (assigned_to, status),
  ADD INDEX IF NOT EXISTS idx_task_due_status      (due_date, status),
  ADD INDEX IF NOT EXISTS idx_task_priority        (priority),
  ADD INDEX IF NOT EXISTS idx_task_created         (created_at);

-- leave_requests: queried by (user_id, status) and (status alone) for pending count
ALTER TABLE leave_requests
  ADD INDEX IF NOT EXISTS idx_leave_user_status (user_id, status),
  ADD INDEX IF NOT EXISTS idx_leave_status      (status),
  ADD INDEX IF NOT EXISTS idx_leave_dates       (start_date, end_date);

-- audit_logs: queried by (actor_id) and (entity_type, entity_id) for record history
ALTER TABLE audit_logs
  ADD INDEX IF NOT EXISTS idx_audit_actor      (actor_id),
  ADD INDEX IF NOT EXISTS idx_audit_entity     (entity_type, entity_id),
  ADD INDEX IF NOT EXISTS idx_audit_created    (created_at);

-- productivity_scores: queried by (user_id, score_date) for leaderboard
ALTER TABLE productivity_scores
  ADD INDEX IF NOT EXISTS idx_prod_user_date   (user_id, score_date),
  ADD INDEX IF NOT EXISTS idx_prod_score       (productivity_score);

-- users: queried by (status, role_id) for active employee counts
ALTER TABLE users
  ADD INDEX IF NOT EXISTS idx_user_status_role (status, role_id),
  ADD INDEX IF NOT EXISTS idx_user_dept        (department_id);


-- ────────────────────────────────────────────────────────────────────────
-- 2. ALERTS TABLE UPGRADE (v6 → v7)
-- ────────────────────────────────────────────────────────────────────────
-- Add type, title, meta columns if not already present

ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS type       VARCHAR(50)  DEFAULT 'general'  AFTER user_id,
  ADD COLUMN IF NOT EXISTS title      VARCHAR(150) DEFAULT NULL       AFTER type,
  ADD COLUMN IF NOT EXISTS message    TEXT         DEFAULT NULL       AFTER title,
  ADD COLUMN IF NOT EXISTS meta       JSON         DEFAULT NULL       AFTER message,
  ADD INDEX  IF NOT EXISTS idx_alert_user_read (user_id, is_read),
  ADD INDEX  IF NOT EXISTS idx_alert_type      (type);

-- Rename alert_message → preserve it for backward compatibility
-- If alert_message still exists, migrate data then drop
-- (only run if column exists — safe to run multiple times)
UPDATE alerts SET message = alert_message WHERE message IS NULL AND alert_message IS NOT NULL;


-- ────────────────────────────────────────────────────────────────────────
-- 3. ATTRITION SCORES TABLE (store Python ML model output)
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attrition_scores (
  score_id       INT           AUTO_INCREMENT PRIMARY KEY,
  user_id        INT           NOT NULL,
  risk_score     DECIMAL(5,2)  NOT NULL,           -- 0.00–100.00
  risk_level     ENUM('Low','Medium','High') NOT NULL DEFAULT 'Low',
  risk_factors   JSON          DEFAULT NULL,        -- array of strings
  features       JSON          DEFAULT NULL,        -- snapshot of input features
  model_version  VARCHAR(20)   DEFAULT '1.0',
  computed_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_score_date (user_id, DATE(computed_at)),
  INDEX idx_attrition_risk     (risk_level),
  INDEX idx_attrition_user     (user_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- ────────────────────────────────────────────────────────────────────────
-- 4. PWA PUSH SUBSCRIPTIONS
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pwa_push_subscriptions (
  sub_id       INT           AUTO_INCREMENT PRIMARY KEY,
  user_id      INT           NOT NULL,
  endpoint     TEXT          NOT NULL,
  p256dh       VARCHAR(255)  NOT NULL,             -- VAPID public key
  auth_key     VARCHAR(255)  NOT NULL,             -- subscription auth
  user_agent   VARCHAR(255)  DEFAULT NULL,
  is_active    BOOLEAN       DEFAULT TRUE,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_push_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- ────────────────────────────────────────────────────────────────────────
-- 5. ROLE DASHBOARD LAYOUTS
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_dashboards (
  layout_id    INT          AUTO_INCREMENT PRIMARY KEY,
  role_id      INT          NOT NULL,
  widget_key   VARCHAR(50)  NOT NULL,              -- e.g. 'kpi_bar', 'task_chart'
  position     INT          DEFAULT 0,             -- display order
  is_visible   BOOLEAN      DEFAULT TRUE,
  config       JSON         DEFAULT NULL,          -- widget-specific config
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_role_widget (role_id, widget_key),
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- Default widget layout per role
INSERT IGNORE INTO role_dashboards (role_id, widget_key, position) VALUES
  -- Admin (1): all widgets
  (1, 'kpi_bar',           1),
  (1, 'quick_actions',     2),
  (1, 'employee_roster',   3),
  (1, 'dept_grid',         4),
  (1, 'leave_queue',       5),
  (1, 'task_chart',        6),
  (1, 'leaderboard_mini',  7),
  (1, 'audit_feed',        8),
  -- Employee (2): personal widgets only
  (2, 'my_tasks',          1),
  (2, 'my_attendance',     2),
  (2, 'my_leave_balance',  3),
  (2, 'my_payslip',        4),
  (2, 'leaderboard_rank',  5),
  -- Manager (3): team-focused
  (3, 'team_tasks',        1),
  (3, 'team_attendance',   2),
  (3, 'leave_queue',       3),
  (3, 'team_leaderboard',  4),
  (3, 'kpi_bar',           5),
  -- HR (4): people + payroll
  (4, 'kpi_bar',           1),
  (4, 'leave_queue',       2),
  (4, 'payroll_panel',     3),
  (4, 'salary_advances',   4),
  (4, 'expense_claims',    5),
  (4, 'shift_management',  6);


-- ── Verify indexes ─────────────────────────────────────────────────────
SELECT 'sem4_migrations.sql applied successfully ✅' AS status;

-- END OF FILE: sem4_migrations.sql

-- ==========================================================================================
-- FILE 22/26: workforce_intelligence_COMPLETE.sql
-- SECTION: AI WORKFORCE INTELLIGENCE
-- DESCRIPTION: AI prediction models, attrition risk scores, burnout index, salary benchmarks, workforce forecasts, skill gap analysis — 26 tables
-- TABLES: 26 | LINES: 712
-- ==========================================================================================

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║   WORKFORCE INTELLIGENCE PLATFORM v6.0 — COMPLETE DATABASE      ║
-- ║   Single file: Schema + Migrations + Seed Data (10 employees)   ║
-- ║                                                                  ║
-- ║   HOW TO USE:                                                    ║
-- ║   Option A — MySQL Workbench:                                    ║
-- ║     File → Open SQL Script → select this file → ⚡ Run          ║
-- ║   Option B — Terminal:                                           ║
-- ║     mysql -u root -p < database/workforce_intelligence_COMPLETE.sql ║
-- ║   Option C — npm:                                                ║
-- ║     npm run db:complete                                          ║
-- ║                                                                  ║
-- ║   This file is IDEMPOTENT — safe to run multiple times.          ║
-- ║   Uses CREATE TABLE IF NOT EXISTS + INSERT IGNORE everywhere.    ║
-- ╚══════════════════════════════════════════════════════════════════╝

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ════════════════════════════════════════════════════════════════
-- PART 1: CREATE DATABASE
-- ════════════════════════════════════════════════════════════════
CREATE DATABASE IF NOT EXISTS workforce_intelligence
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
-- USE statement removed (handled at top)

-- ════════════════════════════════════════════════════════════════
-- PART 2: BASE TABLES (schema.sql)
-- ════════════════════════════════════════════════════════════════

-- ── roles ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  role_id   INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT IGNORE INTO roles (role_name) VALUES
  ('Admin'), ('Employee'), ('Manager'), ('HR');

-- ── users ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name          VARCHAR(100)  NOT NULL,
  email              VARCHAR(100)  NOT NULL UNIQUE,
  password_hash      VARCHAR(255)  NOT NULL,
  role_id            INT           NOT NULL,
  access_level       INT           DEFAULT 1 COMMENT '1=basic 2=standard 3=full',
  total_points       INT           DEFAULT 0,
  status             ENUM('pending','active','suspended') DEFAULT 'active',
  department_id      INT           DEFAULT NULL,
  base_salary        DECIMAL(12,2) DEFAULT 0.00,
  phone              VARCHAR(20)   DEFAULT NULL,
  profile_notes      TEXT          DEFAULT NULL,
  last_login         DATETIME      DEFAULT NULL,
  designation        VARCHAR(100)  DEFAULT NULL,
  join_date          DATE          DEFAULT NULL,
  date_of_birth      DATE          DEFAULT NULL,
  address            TEXT          DEFAULT NULL,
  emergency_contact  VARCHAR(150)  DEFAULT NULL,
  gender             ENUM('male','female','other','prefer_not_to_say') DEFAULT NULL,
  employment_type    ENUM('full_time','part_time','contract','intern') DEFAULT 'full_time',
  shift_id           INT           DEFAULT NULL,
  created_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- ── departments ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  dept_id     INT AUTO_INCREMENT PRIMARY KEY,
  dept_name   VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  manager_id  INT          DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department_id INT DEFAULT NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_users_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id) ON DELETE SET NULL;

-- ── shifts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  shift_id      INT AUTO_INCREMENT PRIMARY KEY,
  shift_name    VARCHAR(100) NOT NULL,
  start_time    TIME         NOT NULL,
  end_time      TIME         NOT NULL,
  grace_minutes INT          DEFAULT 10,
  working_hours DECIMAL(4,2) GENERATED ALWAYS AS (
    MOD(TIME_TO_SEC(end_time) - TIME_TO_SEC(start_time) + 86400, 86400) / 3600
  ) STORED,
  is_active  BOOLEAN   DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS shift_id INT DEFAULT NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_users_shift FOREIGN KEY (shift_id) REFERENCES shifts(shift_id) ON DELETE SET NULL;

INSERT IGNORE INTO shifts (shift_name, start_time, end_time, grace_minutes) VALUES
  ('Morning Shift', '09:00:00', '18:00:00', 15),
  ('Evening Shift', '14:00:00', '23:00:00', 15),
  ('Night Shift',   '22:00:00', '07:00:00', 10),
  ('Half Day (AM)', '09:00:00', '13:00:00', 10),
  ('Half Day (PM)', '14:00:00', '18:00:00', 10);

-- ── tasks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  task_id               INT AUTO_INCREMENT PRIMARY KEY,
  title                 VARCHAR(150) NOT NULL,
  description           TEXT,
  voice_note_path       VARCHAR(255) DEFAULT NULL,
  written_note          TEXT         DEFAULT NULL,
  assigned_by           INT          NOT NULL,
  assigned_to           INT          NOT NULL,
  priority              ENUM('Low','Medium','High') DEFAULT 'Medium',
  status                ENUM('Pending','In Progress','Completed','Overdue') DEFAULT 'Pending',
  due_date              DATE,
  timer_deadline        DATETIME     DEFAULT NULL,
  timer_hours           INT          DEFAULT NULL,
  extension_requested   BOOLEAN      DEFAULT FALSE,
  extension_hours       INT          DEFAULT NULL,
  extension_reason      TEXT         DEFAULT NULL,
  extension_status      ENUM('none','pending','approved','rejected') DEFAULT 'none',
  extension_reviewed_by INT          DEFAULT NULL,
  extension_reviewed_at DATETIME     DEFAULT NULL,
  achievement_level     ENUM('none','good','excellent','outstanding') DEFAULT 'none',
  completed_at          DATETIME     DEFAULT NULL,
  updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_by) REFERENCES users(user_id),
  FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);

-- ── task_logs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_logs (
  log_id     INT AUTO_INCREMENT PRIMARY KEY,
  task_id    INT         NOT NULL,
  status     VARCHAR(50) NOT NULL,
  remarks    TEXT,
  updated_by INT         NOT NULL,
  updated_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id)    REFERENCES tasks(task_id),
  FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- ── task_comments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  task_id    INT       NOT NULL,
  user_id    INT       NOT NULL,
  comment    TEXT      NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ── task_suggestions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_suggestions (
  suggestion_id INT AUTO_INCREMENT PRIMARY KEY,
  task_id       INT       NOT NULL,
  user_id       INT       NOT NULL,
  suggestion    TEXT      NOT NULL,
  source        ENUM('ai','manager','system') DEFAULT 'ai',
  is_read       BOOLEAN   DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ── achievements ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  achievement_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  task_id          INT,
  achievement_type ENUM('task_complete','daily_star','weekly_star','monthly_star','annual_star') NOT NULL,
  level            ENUM('good','excellent','outstanding') DEFAULT 'good',
  points           INT       DEFAULT 10,
  message          TEXT,
  awarded_by       INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id),
  FOREIGN KEY (task_id)    REFERENCES tasks(task_id),
  FOREIGN KEY (awarded_by) REFERENCES users(user_id)
);

-- ── productivity_scores ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productivity_scores (
  score_id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT          NOT NULL,
  score_date         DATE         NOT NULL,
  completion_rate    DECIMAL(5,2),
  delay_count        INT          DEFAULT 0,
  productivity_score DECIMAL(5,2),
  UNIQUE KEY uq_user_month (user_id, score_date),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ── alerts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  alert_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT,
  task_id       INT,
  alert_message TEXT         NOT NULL,
  alert_type    VARCHAR(50),
  is_read       BOOLEAN      DEFAULT FALSE,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);

-- ── reports ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  report_id    INT AUTO_INCREMENT PRIMARY KEY,
  report_title VARCHAR(150) NOT NULL,
  report_type  VARCHAR(50),
  period       VARCHAR(50)  DEFAULT 'custom',
  status       ENUM('draft','published') DEFAULT 'published',
  generated_by INT,
  report_date  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  summary      TEXT,
  report_data  JSON,
  FOREIGN KEY (generated_by) REFERENCES users(user_id)
);

-- ── attendance ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL,
  work_date     DATE         NOT NULL,
  clock_in      DATETIME     DEFAULT NULL,
  clock_out     DATETIME     DEFAULT NULL,
  status        ENUM('present','absent','half_day','late','leave') DEFAULT 'present',
  total_hours   DECIMAL(4,2) DEFAULT NULL,
  ot_hours      DECIMAL(4,2) DEFAULT 0.00,
  remarks       TEXT         DEFAULT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_date (user_id, work_date),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ── salary_components ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_components (
  component_id   INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  component_type ENUM('earning','deduction') NOT NULL,
  is_taxable     BOOLEAN      DEFAULT FALSE,
  is_statutory   BOOLEAN      DEFAULT FALSE,
  description    TEXT,
  is_active      BOOLEAN      DEFAULT TRUE,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO salary_components (name, component_type, is_taxable, is_statutory, description) VALUES
  ('Basic Salary',     'earning',   TRUE,  FALSE, 'Core fixed salary component'),
  ('HRA',              'earning',   TRUE,  FALSE, 'House Rent Allowance'),
  ('Travel Allowance', 'earning',   FALSE, FALSE, 'Conveyance reimbursement'),
  ('Medical Allowance','earning',   FALSE, FALSE, 'Medical benefit allowance'),
  ('Special Allowance','earning',   TRUE,  FALSE, 'Performance/role allowance'),
  ('Provident Fund',   'deduction', FALSE, TRUE,  'Employee PF contribution 12%'),
  ('ESI',              'deduction', FALSE, TRUE,  'Employee State Insurance 0.75%'),
  ('Professional Tax', 'deduction', FALSE, TRUE,  'State professional tax'),
  ('TDS',              'deduction', FALSE, TRUE,  'Tax Deducted at Source'),
  ('Leave Deduction',  'deduction', FALSE, FALSE, 'Absent-day deduction'),
  ('Advance Deduction','deduction', FALSE, FALSE, 'Salary advance recovery');

-- ── salary_records ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_records (
  salary_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT           NOT NULL,
  month          INT           NOT NULL,
  year           INT           NOT NULL,
  base_salary    DECIMAL(12,2) DEFAULT 0.00,
  bonus          DECIMAL(12,2) DEFAULT 0.00,
  deductions     DECIMAL(12,2) DEFAULT 0.00,
  net_salary     DECIMAL(12,2) DEFAULT 0.00,
  payment_status ENUM('pending','paid') DEFAULT 'pending',
  paid_on        DATE          DEFAULT NULL,
  remarks        TEXT          DEFAULT NULL,
  created_by     INT,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_month (user_id, month, year),
  FOREIGN KEY (user_id)    REFERENCES users(user_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- ── salary_line_items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_line_items (
  item_id      INT           AUTO_INCREMENT PRIMARY KEY,
  salary_id    INT           NOT NULL,
  component_id INT           NOT NULL,
  amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (salary_id)    REFERENCES salary_records(salary_id)    ON DELETE CASCADE,
  FOREIGN KEY (component_id) REFERENCES salary_components(component_id)
);

-- ── salary_advances ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_advances (
  advance_id    INT           AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  reason        TEXT,
  status        ENUM('pending','approved','rejected','repaid') DEFAULT 'pending',
  approved_by   INT           DEFAULT NULL,
  approved_at   DATETIME      DEFAULT NULL,
  repay_months  INT           DEFAULT 1,
  repaid_amount DECIMAL(12,2) DEFAULT 0.00,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id),
  FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

-- ── salary_revisions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_revisions (
  revision_id    INT           AUTO_INCREMENT PRIMARY KEY,
  user_id        INT           NOT NULL,
  old_salary     DECIMAL(12,2),
  new_salary     DECIMAL(12,2),
  effective_date DATE          NOT NULL,
  reason         TEXT,
  revised_by     INT,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id),
  FOREIGN KEY (revised_by) REFERENCES users(user_id)
);

-- ── user_permissions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_permissions (
  perm_id                INT  AUTO_INCREMENT PRIMARY KEY,
  user_id                INT  NOT NULL UNIQUE,
  can_view_analytics     BOOLEAN DEFAULT TRUE,
  can_view_reports       BOOLEAN DEFAULT TRUE,
  can_use_chat           BOOLEAN DEFAULT TRUE,
  can_request_extension  BOOLEAN DEFAULT TRUE,
  can_view_salary        BOOLEAN DEFAULT TRUE,
  can_view_team          BOOLEAN DEFAULT TRUE,
  can_view_attendance    BOOLEAN DEFAULT TRUE,
  can_clock_in_out       BOOLEAN DEFAULT TRUE,
  can_request_advance    BOOLEAN DEFAULT FALSE,
  updated_by             INT,
  updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)   REFERENCES users(user_id),
  FOREIGN KEY (updated_by)REFERENCES users(user_id)
);

-- ── leave_requests ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
  leave_id      INT  AUTO_INCREMENT PRIMARY KEY,
  user_id       INT  NOT NULL,
  leave_type    ENUM('sick','casual','earned','unpaid','other','half_day') DEFAULT 'casual',
  from_date     DATE NOT NULL,
  to_date       DATE NOT NULL,
  days          DECIMAL(5,1) DEFAULT 1,
  reason        TEXT,
  status        ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
  reviewed_by   INT  DEFAULT NULL,
  reviewed_at   DATETIME DEFAULT NULL,
  reject_reason TEXT DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id),
  FOREIGN KEY (reviewed_by) REFERENCES users(user_id)
);

-- ── leave_balances ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_balances (
  balance_id    INT          AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL,
  year          INT          NOT NULL,
  leave_type    ENUM('sick','casual','earned','unpaid','other') NOT NULL,
  entitled      DECIMAL(5,1) DEFAULT 0,
  taken         DECIMAL(5,1) DEFAULT 0,
  pending       DECIMAL(5,1) DEFAULT 0,
  remaining     DECIMAL(5,1) GENERATED ALWAYS AS (entitled - taken) STORED,
  carry_forward DECIMAL(5,1) DEFAULT 0,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_year_type (user_id, year, leave_type),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ── holiday_calendar ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS holiday_calendar (
  holiday_id   INT  AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  holiday_date DATE         NOT NULL UNIQUE,
  holiday_type ENUM('public','company','optional') DEFAULT 'public',
  description  TEXT,
  created_by   INT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- ── audit_logs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id      INT          AUTO_INCREMENT PRIMARY KEY,
  actor_id    INT          DEFAULT NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(60)  NOT NULL,
  entity_id   INT          DEFAULT NULL,
  old_values  JSON         DEFAULT NULL,
  new_values  JSON         DEFAULT NULL,
  ip_address  VARCHAR(45)  DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ── employee_documents ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_documents (
  doc_id      INT          AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  doc_type    ENUM('offer_letter','contract','id_proof','certificate','other') DEFAULT 'other',
  doc_name    VARCHAR(200) NOT NULL,
  file_path   VARCHAR(500) NOT NULL,
  uploaded_by INT,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);

-- ── expense_claims ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_claims (
  claim_id     INT           AUTO_INCREMENT PRIMARY KEY,
  user_id      INT           NOT NULL,
  claim_date   DATE          NOT NULL,
  category     ENUM('travel','food','medical','equipment','other') DEFAULT 'other',
  amount       DECIMAL(12,2) NOT NULL,
  description  TEXT,
  receipt_path VARCHAR(500)  DEFAULT NULL,
  status       ENUM('pending','approved','rejected','paid') DEFAULT 'pending',
  reviewed_by  INT           DEFAULT NULL,
  reviewed_at  DATETIME      DEFAULT NULL,
  paid_on      DATE          DEFAULT NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id),
  FOREIGN KEY (reviewed_by) REFERENCES users(user_id)
);

-- ── department FK now that departments table exists ───────────────
ALTER TABLE departments
  ADD CONSTRAINT IF NOT EXISTS fk_dept_manager
  FOREIGN KEY (manager_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- ════════════════════════════════════════════════════════════════
-- PART 3: SEED — DEPARTMENTS & HOLIDAYS
-- ════════════════════════════════════════════════════════════════

INSERT IGNORE INTO departments (dept_name, description) VALUES
  ('Engineering', 'Software development and technical operations'),
  ('Product',     'Product management, roadmap and analytics'),
  ('Design',      'UI/UX design and brand'),
  ('HR',          'Human resources and people management'),
  ('Finance',     'Accounts, payroll and financial operations'),
  ('Marketing',   'Digital marketing, growth and content');

INSERT IGNORE INTO holiday_calendar (name, holiday_date, holiday_type, description) VALUES
  ('Republic Day',           '2025-01-26', 'public',   'National holiday'),
  ('Holi',                   '2025-03-14', 'public',   'Festival of colors'),
  ('Good Friday',            '2025-04-18', 'public',   'Christian holiday'),
  ('Eid ul-Fitr',            '2025-03-31', 'public',   'End of Ramadan'),
  ('Company Foundation Day', '2025-05-15', 'company',  'WIP annual celebration'),
  ('Independence Day',       '2025-08-15', 'public',   'National holiday'),
  ('Ganesh Chaturthi',       '2025-08-27', 'optional', 'Regional holiday'),
  ('Dussehra',               '2025-10-02', 'public',   'National holiday'),
  ('Diwali',                 '2025-10-20', 'public',   'Festival of lights'),
  ('Christmas',              '2025-12-25', 'public',   'Christian holiday');

-- ════════════════════════════════════════════════════════════════
-- PART 4: SEED — ADMIN USER + ALL 10 EMPLOYEES
-- ════════════════════════════════════════════════════════════════
-- Passwords are bcrypt hashed.  Plain-text: FirstName@123
-- e.g. Piyush → P123/, Harsh → Harsh@123
-- Admin user: admin@wip.com / P123/

-- ── 0. System Administrator (role_id = 1) ─────────────────────
-- REQUIRED: Must exist so pending registrations can be approved.
-- Hash below is bcrypt of: P123/
INSERT IGNORE INTO users (
  full_name, email, password_hash, role_id,
  access_level, total_points, status,
  designation, join_date, gender, employment_type
) VALUES (
  'System Administrator',
  'admin@wip.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  1, 5, 0, 'active',
  'System Administrator', CURDATE(), 'male', 'full_time'
);
SET @admin_id = (SELECT user_id FROM users WHERE email='admin@wip.com' LIMIT 1);
INSERT IGNORE INTO user_permissions (user_id, updated_by) VALUES (@admin_id, @admin_id);
INSERT IGNORE INTO leave_balances (user_id, year, leave_type, entitled) VALUES
  (@admin_id, YEAR(CURDATE()), 'sick',   12),
  (@admin_id, YEAR(CURDATE()), 'casual', 12),
  (@admin_id, YEAR(CURDATE()), 'earned', 15),
  (@admin_id, YEAR(CURDATE()), 'unpaid',  0),
  (@admin_id, YEAR(CURDATE()), 'other',   0);

SET @eng_dept   = (SELECT dept_id FROM departments WHERE dept_name='Engineering' LIMIT 1);
SET @prod_dept  = (SELECT dept_id FROM departments WHERE dept_name='Product'     LIMIT 1);
SET @des_dept   = (SELECT dept_id FROM departments WHERE dept_name='Design'      LIMIT 1);
SET @hr_dept    = (SELECT dept_id FROM departments WHERE dept_name='HR'          LIMIT 1);
SET @fin_dept   = (SELECT dept_id FROM departments WHERE dept_name='Finance'     LIMIT 1);
SET @mkt_dept   = (SELECT dept_id FROM departments WHERE dept_name='Marketing'   LIMIT 1);
SET @morn_shift = (SELECT shift_id FROM shifts WHERE shift_name='Morning Shift'  LIMIT 1);

-- ── 1. Harsh Vardhan — Engineering Manager ────────────────────────
INSERT IGNORE INTO users
  (full_name,email,password_hash,role_id,access_level,total_points,status,
   department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Harsh Vardhan','harsh.vardhan@wip.com',
  '$2b$10$hV1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',
  3,3,2980,'active',@eng_dept,135000.00,'+91 95566 77889','Engineering Manager',
  '2019-04-01','1990-03-15','male','full_time',@morn_shift);
SET @harsh_id = (SELECT user_id FROM users WHERE email='harsh.vardhan@wip.com' LIMIT 1);
INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance)
VALUES (@harsh_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE);
INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,carry_forward) VALUES
  (@harsh_id,2025,'sick',12,1,2),(@harsh_id,2025,'casual',12,2,1),
  (@harsh_id,2025,'earned',15,0,3),(@harsh_id,2025,'unpaid',0,0,0),(@harsh_id,2025,'other',0,0,0);

-- ── 2. Priya Sharma — Senior Developer ───────────────────────────
INSERT IGNORE INTO users
  (full_name,email,password_hash,role_id,access_level,total_points,status,
   department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Priya Sharma','priya.sharma@wip.com',
  '$2b$10$pS1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',
  2,3,2840,'active',@eng_dept,85000.00,'+91 98765 43210','Senior Developer',
  '2022-03-01','1997-09-12','female','full_time',@morn_shift);
SET @priya_id = (SELECT user_id FROM users WHERE email='priya.sharma@wip.com' LIMIT 1);
INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance)
VALUES (@priya_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE);
INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,carry_forward) VALUES
  (@priya_id,2025,'sick',12,0,0),(@priya_id,2025,'casual',12,3,0),
  (@priya_id,2025,'earned',15,0,0),(@priya_id,2025,'unpaid',0,0,0),(@priya_id,2025,'other',0,0,0);
INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,deductions,net_salary,payment_status,paid_on)
VALUES (@priya_id,4,2025,85000,12000,73000,'paid','2025-04-30');

-- ── 3. Piyush Sharma — Full Stack Developer (DETAILED) ───────────
INSERT IGNORE INTO users
  (full_name,email,password_hash,role_id,access_level,total_points,status,
   department_id,base_salary,phone,profile_notes,designation,join_date,date_of_birth,
   address,emergency_contact,gender,employment_type,shift_id,last_login)
VALUES ('Piyush Sharma','piyush.sharma@wip.com',
  '$2b$10$X9v2QkLmN3pR7sT1uV5wOeYZaB6cD8eF0gH2iJ4kL6mN8oP0qR2s',
  2,3,2200,'active',@eng_dept,72000.00,'+91 93344 55667',
  'Full Stack Developer with 2+ years in Node.js and React.',
  'Full Stack Developer','2022-11-14','1998-07-22',
  'Flat 4B, Sunrise Apartments, Sector 18, Noida, UP - 201301',
  'Sunita Sharma (Mother) — +91 98800 11223',
  'male','full_time',@morn_shift,'2025-05-07 09:05:00');
SET @piyush_id = (SELECT user_id FROM users WHERE email='piyush.sharma@wip.com' LIMIT 1);
INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance)
VALUES (@piyush_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE);
INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,carry_forward) VALUES
  (@piyush_id,2025,'sick',12,0,0),(@piyush_id,2025,'casual',12,2,1),
  (@piyush_id,2025,'earned',15,0,0),(@piyush_id,2025,'unpaid',0,0,0),(@piyush_id,2025,'other',0,0,0);
INSERT IGNORE INTO attendance (user_id,work_date,clock_in,clock_out,status,total_hours,ot_hours,remarks) VALUES
  (@piyush_id,'2025-05-07','2025-05-07 09:05:00',NULL,'present',NULL,0.00,NULL),
  (@piyush_id,'2025-05-06','2025-05-06 09:02:00','2025-05-06 19:30:00','present',10.47,2.47,'Late deployment'),
  (@piyush_id,'2025-05-05','2025-05-05 09:10:00','2025-05-05 18:15:00','present',9.08,1.08,NULL),
  (@piyush_id,'2025-05-02','2025-05-02 09:00:00','2025-05-02 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-05-01','2025-05-01 09:18:00','2025-05-01 18:10:00','late',8.87,0.87,'Metro delay'),
  (@piyush_id,'2025-04-30','2025-04-30 09:03:00','2025-04-30 20:00:00','present',10.95,2.95,'Month-end push'),
  (@piyush_id,'2025-04-29','2025-04-29 09:00:00','2025-04-29 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-24',NULL,NULL,'absent',NULL,0.00,'Personal emergency'),
  (@piyush_id,'2025-04-23','2025-04-23 09:00:00','2025-04-23 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-16','2025-04-16 10:30:00','2025-04-16 14:30:00','half_day',4.00,0.00,'Approved half day'),
  (@piyush_id,'2025-04-11',NULL,NULL,'leave',NULL,0.00,'Casual leave approved'),
  (@piyush_id,'2025-04-10',NULL,NULL,'leave',NULL,0.00,'Casual leave approved'),
  (@piyush_id,'2025-04-08','2025-04-08 09:22:00','2025-04-08 18:10:00','late',8.80,0.80,'Traffic');
INSERT IGNORE INTO leave_requests (user_id,leave_type,from_date,to_date,days,reason,status,reviewed_by,reviewed_at) VALUES
  (@piyush_id,'casual','2025-04-10','2025-04-11',2,'Personal work at home town','approved',@harsh_id,'2025-04-08 11:30:00'),
  (@piyush_id,'half_day','2025-04-16','2025-04-16',1,'Bank work','approved',@harsh_id,'2025-04-15 16:00:00'),
  (@piyush_id,'earned','2025-05-15','2025-05-18',4,'Family trip to Rishikesh','pending',NULL,NULL),
  (@piyush_id,'casual','2025-03-20','2025-03-21',2,'Friend wedding','rejected',@harsh_id,'2025-03-18 10:00:00');
INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks)
VALUES (@piyush_id,4,2025,79800,0,10800,69000,'paid','2025-04-30','April 2025 — itemized'),
  (@piyush_id,3,2025,79800,0,10800,69000,'paid','2025-03-31','March 2025'),
  (@piyush_id,2,2025,79800,0,11800,68000,'paid','2025-02-28','Feb — 1 absent deduction'),
  (@piyush_id,1,2025,79800,5000,10800,74000,'paid','2025-01-31','Jan — New Year bonus'),
  (@piyush_id,12,2024,72000,8000,10200,69800,'paid','2024-12-31','Dec — Annual bonus'),
  (@piyush_id,11,2024,72000,0,10200,61800,'paid','2024-11-30','Nov — First month pro-rated');
INSERT IGNORE INTO salary_revisions (user_id,old_salary,new_salary,effective_date,reason) VALUES
  (@piyush_id,60000,72000,'2022-11-14','Joining salary'),
  (@piyush_id,72000,78000,'2024-04-01','Performance increment 8.3%'),
  (@piyush_id,78000,72000,'2024-11-14','Role re-alignment, CTC unchanged');
INSERT IGNORE INTO salary_advances (user_id,amount,reason,status,approved_by,approved_at,repay_months,repaid_amount) VALUES
  (@piyush_id,20000,'Vehicle repair — two-wheeler engine overhaul','approved',@harsh_id,'2025-04-01 10:30:00',2,10000),
  (@piyush_id,15000,'Laptop upgrade for WFH setup','pending',NULL,NULL,3,0);
INSERT IGNORE INTO expense_claims (user_id,claim_date,category,amount,description,status,reviewed_by,reviewed_at,paid_on) VALUES
  (@piyush_id,'2025-04-20','travel',1800,'Cab to client office — Gurgaon','paid',@harsh_id,'2025-04-22 11:00:00','2025-04-30'),
  (@piyush_id,'2025-04-05','food',650,'Team lunch during sprint planning','approved',@harsh_id,'2025-04-07 09:30:00',NULL),
  (@piyush_id,'2025-03-15','equipment',3200,'Mechanical keyboard for workstation','approved',@harsh_id,'2025-03-17 14:00:00',NULL),
  (@piyush_id,'2025-05-05','other',1200,'AWS certification exam fee','pending',NULL,NULL,NULL);
INSERT IGNORE INTO tasks (title,description,assigned_by,assigned_to,priority,status,due_date,achievement_level,completed_at) VALUES
  ('Full Stack Portal Module v1','Build employee self-service portal using React + API.',@harsh_id,@piyush_id,'High','Completed','2025-04-15','excellent','2025-04-14 17:30:00'),
  ('Authentication Middleware Refactor','JWT refactor for Manager/HR roles + token expiry.',@harsh_id,@piyush_id,'High','Completed','2025-04-20','outstanding','2025-04-19 16:45:00'),
  ('Database Query Optimization','Optimize attendance/salary queries. Target <200ms.',@harsh_id,@piyush_id,'Medium','Completed','2025-04-30','good','2025-04-29 18:00:00'),
  ('Full Stack Portal Module v2','Extend portal: payslip PDF, advance form, expenses.',@harsh_id,@piyush_id,'High','In Progress','2025-05-20','none',NULL),
  ('Mobile Responsive Fixes','Fix layout on tasks/salary/leave.html for <640px.',@harsh_id,@piyush_id,'Medium','In Progress','2025-05-14','none',NULL),
  ('API Rate Limiting','Implement rate limiting on all public endpoints.',@harsh_id,@piyush_id,'Medium','Pending','2025-05-25','none',NULL),
  ('Security Audit — Input Validation','Joi/Zod validation on all controller endpoints.',@harsh_id,@piyush_id,'High','Overdue','2025-05-05','none',NULL);
SET @ptask1 = (SELECT task_id FROM tasks WHERE title='Full Stack Portal Module v1' AND assigned_to=@piyush_id LIMIT 1);
SET @ptask2 = (SELECT task_id FROM tasks WHERE title='Authentication Middleware Refactor' AND assigned_to=@piyush_id LIMIT 1);
INSERT IGNORE INTO achievements (user_id,task_id,achievement_type,level,points,message,awarded_by) VALUES
  (@piyush_id,@ptask1,'task_complete','excellent',150,'Portal Module v1 delivered a day early. Zero bugs in review.',@harsh_id),
  (@piyush_id,@ptask2,'task_complete','outstanding',200,'Auth middleware ahead of schedule. Role guards adopted team-wide.',@harsh_id),
  (@piyush_id,NULL,'weekly_star','good',100,'Most commits this week — 3 modules in parallel.',1),
  (@piyush_id,NULL,'monthly_star','good',150,'Best attendance in Engineering for April 2025.',1);
INSERT IGNORE INTO productivity_scores (user_id,score_date,completion_rate,delay_count,productivity_score) VALUES
  (@piyush_id,'2025-05-01',100.00,0,96.50),
  (@piyush_id,'2025-04-01',85.71,1,82.30),
  (@piyush_id,'2025-03-01',80.00,1,78.50),
  (@piyush_id,'2025-02-01',75.00,2,72.10);
INSERT IGNORE INTO alerts (user_id,alert_message,alert_type,is_read) VALUES
  (@piyush_id,'✅ Your earned leave 15–18 May submitted, pending approval.','general',FALSE),
  (@piyush_id,'⚠️ Task "Security Audit" is overdue by 2 days.','overdue',FALSE),
  (@piyush_id,'💰 April 2025 salary credited. Net: ₹69,000','salary_paid',TRUE),
  (@piyush_id,'💳 Salary advance ₹20,000 approved. Repayment: ₹10,000×2','general',TRUE),
  (@piyush_id,'🏆 Achievement: Outstanding — Auth Middleware Refactor','achievement',TRUE);
INSERT IGNORE INTO employee_documents (user_id,doc_type,doc_name,file_path) VALUES
  (@piyush_id,'offer_letter','Offer Letter — Nov 2022','/uploads/docs/piyush/offer_letter_nov2022.pdf'),
  (@piyush_id,'contract','Employment Contract v1','/uploads/docs/piyush/employment_contract_2022.pdf'),
  (@piyush_id,'id_proof','Aadhaar Card','/uploads/docs/piyush/aadhaar.pdf'),
  (@piyush_id,'id_proof','PAN Card','/uploads/docs/piyush/pan.pdf'),
  (@piyush_id,'certificate','B.Tech Computer Science 2021','/uploads/docs/piyush/btech_degree.pdf'),
  (@piyush_id,'certificate','AWS Cloud Practitioner 2024','/uploads/docs/piyush/aws_cert.pdf');

-- ── 4. Rahul Mehta — Product Manager ─────────────────────────────
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Rahul Mehta','rahul.mehta@wip.com','$2b$10$rM1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',3,3,2640,'active',@prod_dept,120000,'+91 91234 56789','Product Manager Lead','2021-01-15','1992-05-08','male','full_time',@morn_shift);
SET @rahul_id=(SELECT user_id FROM users WHERE email='rahul.mehta@wip.com' LIMIT 1);
INSERT IGNORE INTO user_permissions(user_id)VALUES(@rahul_id);
INSERT IGNORE INTO leave_balances(user_id,year,leave_type,entitled,taken,carry_forward)VALUES(@rahul_id,2025,'sick',12,1,2),(@rahul_id,2025,'casual',12,2,1),(@rahul_id,2025,'earned',15,0,3),(@rahul_id,2025,'unpaid',0,0,0),(@rahul_id,2025,'other',0,0,0);
INSERT IGNORE INTO salary_records(user_id,month,year,base_salary,deductions,net_salary,payment_status)VALUES(@rahul_id,4,2025,112000,18000,94000,'pending'),(@rahul_id,3,2025,112000,18000,94000,'paid','2025-03-31');

-- ── 5. Aisha Khan — UI/UX Designer ───────────────────────────────
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Aisha Khan','aisha.khan@wip.com','$2b$10$aK1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,2,1920,'pending',@des_dept,65000,'+91 99887 76655','UI/UX Designer','2024-02-05','2001-11-30','female','full_time',@morn_shift);
SET @aisha_id=(SELECT user_id FROM users WHERE email='aisha.khan@wip.com' LIMIT 1);
INSERT IGNORE INTO user_permissions(user_id)VALUES(@aisha_id);
INSERT IGNORE INTO leave_balances(user_id,year,leave_type,entitled,taken,carry_forward)VALUES(@aisha_id,2025,'sick',12,1,0),(@aisha_id,2025,'casual',12,1,0),(@aisha_id,2025,'earned',14,0,0),(@aisha_id,2025,'unpaid',0,0,0),(@aisha_id,2025,'other',0,0,0);
INSERT IGNORE INTO salary_records(user_id,month,year,base_salary,deductions,net_salary,payment_status)VALUES(@aisha_id,4,2025,60750,9000,51750,'pending');

-- ── 6. Vikram Nair — HR Manager ───────────────────────────────────
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Vikram Nair','vikram.nair@wip.com','$2b$10$vN1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',4,3,2110,'active',@hr_dept,95000,'+91 97654 32109','HR Manager','2020-06-01','1989-04-22','male','full_time',@morn_shift);
SET @vikram_id=(SELECT user_id FROM users WHERE email='vikram.nair@wip.com' LIMIT 1);
INSERT IGNORE INTO user_permissions(user_id)VALUES(@vikram_id);
INSERT IGNORE INTO leave_balances(user_id,year,leave_type,entitled,taken,carry_forward)VALUES(@vikram_id,2025,'sick',12,2,0),(@vikram_id,2025,'casual',12,1,1),(@vikram_id,2025,'earned',15,0,5),(@vikram_id,2025,'unpaid',0,0,0),(@vikram_id,2025,'other',0,0,0);
INSERT IGNORE INTO salary_records(user_id,month,year,base_salary,deductions,net_salary,payment_status)VALUES(@vikram_id,4,2025,88750,14250,74500,'pending'),(@vikram_id,3,2025,88750,14250,74500,'paid','2025-03-31');

-- ── 7. Sneha Patel — Backend Developer ───────────────────────────
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Sneha Patel','sneha.patel@wip.com','$2b$10$sP1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,3,2480,'active',@eng_dept,78000,'+91 88990 01122','Backend Developer','2022-09-01','1999-03-07','female','full_time',@morn_shift);
SET @sneha_id=(SELECT user_id FROM users WHERE email='sneha.patel@wip.com' LIMIT 1);
INSERT IGNORE INTO user_permissions(user_id,can_request_advance)VALUES(@sneha_id,TRUE);
INSERT IGNORE INTO leave_balances(user_id,year,leave_type,entitled,taken,carry_forward)VALUES(@sneha_id,2025,'sick',12,1,0),(@sneha_id,2025,'casual',12,2,0),(@sneha_id,2025,'earned',15,0,0),(@sneha_id,2025,'unpaid',0,0,0),(@sneha_id,2025,'other',0,0,0);
INSERT IGNORE INTO salary_records(user_id,month,year,base_salary,deductions,net_salary,payment_status,paid_on)VALUES(@sneha_id,4,2025,72850,11700,61150,'paid','2025-04-30'),(@sneha_id,3,2025,72850,11700,61150,'paid','2025-03-31');

-- ── 8. Kartik Jaiswal — Product Analyst ──────────────────────────
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Kartik Jaiswal','kartik.jaiswal@wip.com','$2b$10$kJ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,2,1850,'active',@prod_dept,68000,'+91 87766 55443','Product Analyst','2023-07-10','2000-01-18','male','full_time',@morn_shift);
SET @kartik_id=(SELECT user_id FROM users WHERE email='kartik.jaiswal@wip.com' LIMIT 1);
INSERT IGNORE INTO user_permissions(user_id)VALUES(@kartik_id);
INSERT IGNORE INTO leave_balances(user_id,year,leave_type,entitled,taken,carry_forward)VALUES(@kartik_id,2025,'sick',12,2,0),(@kartik_id,2025,'casual',12,1,0),(@kartik_id,2025,'earned',15,0,0),(@kartik_id,2025,'unpaid',0,0,0),(@kartik_id,2025,'other',0,0,0);
INSERT IGNORE INTO salary_records(user_id,month,year,base_salary,deductions,net_salary,payment_status)VALUES(@kartik_id,4,2025,63600,9200,54400,'pending'),(@kartik_id,3,2025,63600,9200,54400,'paid','2025-03-31');
INSERT IGNORE INTO salary_advances(user_id,amount,reason,status,repay_months)VALUES(@kartik_id,30000,'Education fee — MBA entrance coaching','pending',3);
INSERT IGNORE INTO leave_requests(user_id,leave_type,from_date,to_date,days,reason,status)VALUES(@kartik_id,'sick','2025-05-12','2025-05-13',2,'Fever and flu','pending');

-- ── 9. Riya Kapoor — Digital Marketing Lead ──────────────────────
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Riya Kapoor','riya.kapoor@wip.com','$2b$10$rK1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,2,2050,'active',@mkt_dept,70000,'+91 96655 44332','Digital Marketing Lead','2023-03-20','1998-08-25','female','full_time',@morn_shift);
SET @riya_id=(SELECT user_id FROM users WHERE email='riya.kapoor@wip.com' LIMIT 1);
INSERT IGNORE INTO user_permissions(user_id)VALUES(@riya_id);
INSERT IGNORE INTO leave_balances(user_id,year,leave_type,entitled,taken,carry_forward)VALUES(@riya_id,2025,'sick',12,0,0),(@riya_id,2025,'casual',12,2,0),(@riya_id,2025,'earned',12,0,0),(@riya_id,2025,'unpaid',0,0,0),(@riya_id,2025,'other',0,0,0);
INSERT IGNORE INTO salary_records(user_id,month,year,base_salary,deductions,net_salary,payment_status)VALUES(@riya_id,4,2025,65450,10500,54950,'pending');
INSERT IGNORE INTO expense_claims(user_id,claim_date,category,amount,description,status,reviewed_by,reviewed_at)VALUES(@riya_id,'2025-05-03','equipment',6500,'Camera for content shoot','pending',NULL,NULL),(@riya_id,'2025-04-18','travel',3200,'Mumbai brand event — travel','approved',@vikram_id,'2025-04-20 10:00:00');
INSERT IGNORE INTO leave_requests(user_id,leave_type,from_date,to_date,days,reason,status)VALUES(@riya_id,'half_day','2025-05-09','2025-05-09',0.5,'Doctor appointment','pending');

-- ── 10. Divya Menon — Finance Analyst ────────────────────────────
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Divya Menon','divya.menon@wip.com','$2b$10$dM1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,2,1980,'active',@fin_dept,75000,'+91 92233 44556','Finance Analyst','2022-08-15','1997-12-03','female','full_time',@morn_shift);
SET @divya_id=(SELECT user_id FROM users WHERE email='divya.menon@wip.com' LIMIT 1);
INSERT IGNORE INTO user_permissions(user_id)VALUES(@divya_id);
INSERT IGNORE INTO leave_balances(user_id,year,leave_type,entitled,taken,carry_forward)VALUES(@divya_id,2025,'sick',12,2,0),(@divya_id,2025,'casual',12,1,0),(@divya_id,2025,'earned',13,0,1),(@divya_id,2025,'unpaid',0,0,0),(@divya_id,2025,'other',0,0,0);
INSERT IGNORE INTO salary_records(user_id,month,year,base_salary,deductions,net_salary,payment_status,paid_on)VALUES(@divya_id,4,2025,70100,11250,58850,'paid','2025-04-30');
INSERT IGNORE INTO expense_claims(user_id,claim_date,category,amount,description,status,reviewed_by,reviewed_at)VALUES(@divya_id,'2025-04-25','other',3200,'Finance conference registration','approved',@vikram_id,'2025-04-26 09:00:00');

-- ════════════════════════════════════════════════════════════════
-- PART 5: ASSIGN DEPARTMENT MANAGERS
-- ════════════════════════════════════════════════════════════════
UPDATE departments SET manager_id=@harsh_id  WHERE dept_name='Engineering';
UPDATE departments SET manager_id=@rahul_id  WHERE dept_name='Product';
UPDATE departments SET manager_id=@vikram_id WHERE dept_name='HR';
UPDATE departments SET manager_id=@riya_id   WHERE dept_name='Marketing';
UPDATE departments SET manager_id=@divya_id  WHERE dept_name='Finance';

-- ════════════════════════════════════════════════════════════════
-- PART 6: AUDIT LOG — Onboarding trail
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO audit_logs (actor_id, action, entity_type, new_values, ip_address) VALUES
  (1,'BULK_ONBOARD','users',JSON_OBJECT('employees_added',10,'version','v6.0'),'127.0.0.1'),
  (1,'GENERATE_SALARY','salary_records',JSON_OBJECT('month',4,'year',2025,'total_employees',10),'127.0.0.1');


-- ════════════════════════════════════════════════════════════════
-- VERIFICATION — Run after import to check all tables
-- ════════════════════════════════════════════════════════════════
SELECT '✅ Database setup complete!' AS status;
SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = 'workforce_intelligence'
  ORDER BY TABLE_NAME;

-- END OF FILE: workforce_intelligence_COMPLETE.sql

-- ==========================================================================================
-- FILE 23/26: seed_admin.sql
-- SECTION: SEED: ADMIN USER
-- DESCRIPTION: Default admin, HR, manager, employee credentials — 4 seed users
-- TABLES: 0 | LINES: 44
-- ==========================================================================================

-- ============================================================
-- seed_admin.sql — Creates the default Admin user (role_id = 1)
-- ⚠️  RUN THIS FIRST, before seed_all_employees.sql
-- ============================================================
-- Credentials:
--   Email   : admin@wip.com
--   Password: P123/
--
-- Usage:
--   mysql -u root -p workforce_intelligence < database/seed_admin.sql
-- ============================================================
-- USE statement removed (handled at top)

-- ── Insert Admin user ─────────────────────────────────────
-- Password hash for: P123/
INSERT IGNORE INTO users (
  full_name, email, password_hash, role_id,
  access_level, total_points, status,
  designation, join_date, gender, employment_type
) VALUES (
  'System Administrator',
  'admin@wip.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  1,
  5, 0, 'active',
  'System Administrator', CURDATE(), 'male', 'full_time'
);

SET @admin_id = (SELECT user_id FROM users WHERE email = 'admin@wip.com' LIMIT 1);

-- ── Seed permissions for admin ────────────────────────────
INSERT IGNORE INTO user_permissions (user_id, updated_by)
VALUES (@admin_id, @admin_id);

-- ── Seed leave balances for admin ────────────────────────
INSERT IGNORE INTO leave_balances (user_id, year, leave_type, entitled) VALUES
  (@admin_id, YEAR(CURDATE()), 'sick',    12),
  (@admin_id, YEAR(CURDATE()), 'casual',  12),
  (@admin_id, YEAR(CURDATE()), 'earned',  15),
  (@admin_id, YEAR(CURDATE()), 'unpaid',   0),
  (@admin_id, YEAR(CURDATE()), 'other',    0);

SELECT CONCAT('✅ Admin user created. Login: admin@wip.com / P123/') AS result;

-- END OF FILE: seed_admin.sql

-- ==========================================================================================
-- FILE 24/26: seed_demo_data.sql
-- SECTION: SEED: DEMO DATA
-- DESCRIPTION: Full demo dataset: 30+ employees, departments, leaves, payroll, attendance, assets, helpdesk tickets
-- TABLES: 0 | LINES: 492
-- ==========================================================================================

-- ══════════════════════════════════════════════════════════════
--  Workforce Intelligence Platform – Demo Seed Data v9.0
--  ⚠️  DEMO DATA ONLY — NOT REAL EMPLOYEES
--  Run AFTER schema.sql and migrate_v8.sql and migrate_v9.sql
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- DEPARTMENTS (12)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO departments (department_name, description) VALUES
('Engineering',       'Software development, frontend, backend, fullstack'),
('Quality Assurance', 'Manual and automation testing'),
('DevOps',            'Infrastructure, CI/CD, cloud operations'),
('AI / Data Science', 'Machine learning, NLP, data engineering'),
('Product',           'Product management and ownership'),
('Human Resources',   'People ops, talent acquisition, L&D'),
('Finance',           'Accounts, payroll, FP&A'),
('Leadership',        'Executive and senior management'),
('Design',            'UI/UX, branding, motion design'),
('Sales',             'Business development, enterprise sales'),
('Marketing',         'Digital marketing, content, growth'),
('Legal',             'Compliance, contracts, IP');

-- ─────────────────────────────────────────────────────────────
-- USERS — 100 demo employees
-- Passwords are all: Demo@1234  (bcrypt hash below is for that)
-- ─────────────────────────────────────────────────────────────
SET @pw = '$2b$10$4XZgz7LbHg2fYB5V6PkPxOyBFoW1jYHN3hUnR5sXkVLiWqEQK8b3u';

-- ADMINS (role_id = 1)
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Rajesh Kumar',    'rajesh@techcorp.in',    @pw, 1, 8, 'CTO',                    'active'),
('Sunita Reddy',    'sunita@techcorp.in',    @pw, 1, 6, 'CHRO',                   'active'),
('Vinod Mehta',     'vinod@techcorp.in',     @pw, 1, 7, 'CFO',                    'active');

-- HR (role_id = 4)
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Neha Joshi',      'neha@techcorp.in',      @pw, 4, 6, 'HR Manager',             'active'),
('Priti Gupta',     'priti@techcorp.in',     @pw, 4, 6, 'HR Business Partner',    'active'),
('Kavita Nair',     'kavita@techcorp.in',    @pw, 4, 6, 'Talent Acquisition Lead','active');

-- MANAGERS (role_id = 3)
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Vikram Singh',    'vikram@techcorp.in',    @pw, 3, 1, 'Engineering Manager',    'active'),
('Arjun Patel',     'arjun@techcorp.in',     @pw, 3, 1, 'Lead Frontend Engineer', 'active'),
('Suresh Nair',     'suresh@techcorp.in',    @pw, 3, 1, 'Backend Lead',           'active'),
('Deepak Sharma',   'deepak@techcorp.in',    @pw, 3, 3, 'DevOps Lead',            'active'),
('Ramesh Iyer',     'ramesh@techcorp.in',    @pw, 3, 2, 'QA Lead',                'active'),
('Priya Menon',     'pmenon@techcorp.in',    @pw, 3, 4, 'Lead Data Scientist',    'active'),
('Karthik Rao',     'karthik@techcorp.in',   @pw, 3, 5, 'Senior Product Manager', 'active'),
('Anand Verma',     'anand@techcorp.in',     @pw, 3, 8, 'Delivery Manager',       'active'),
('Shalini Kumar',   'shalini@techcorp.in',   @pw, 3, 9, 'Design Lead',            'active'),
('Arun Krishnan',   'arun@techcorp.in',      @pw, 3, 10,'Sales Manager',          'active');

-- EMPLOYEES (role_id = 2) — Engineering Frontend
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Priya Sharma',    'priya@techcorp.in',     @pw, 2, 1, 'Senior Frontend Dev',    'active'),
('Sneha Reddy',     'sneha@techcorp.in',     @pw, 2, 1, 'Frontend Developer',     'active'),
('Rahul Mehta',     'rahul@techcorp.in',     @pw, 2, 1, 'Junior Frontend Dev',    'active'),
('Divya Krishnan',  'divya@techcorp.in',     @pw, 2, 1, 'Frontend Developer',     'active'),
('Manish Patel',    'manish@techcorp.in',    @pw, 2, 1, 'Senior Frontend Dev',    'active'),
('Anjali Singh',    'anjali@techcorp.in',    @pw, 2, 1, 'Junior Frontend Dev',    'active'),
('Rohan Verma',     'rohan@techcorp.in',     @pw, 2, 1, 'Frontend Developer',     'active');

-- Engineering Backend
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Kiran Sharma',    'kiran@techcorp.in',     @pw, 2, 1, 'Senior Backend Dev',     'active'),
('Nikhil Gupta',    'nikhil@techcorp.in',    @pw, 2, 1, 'Backend Developer',      'active'),
('Tanvi Rao',       'tanvi@techcorp.in',     @pw, 2, 1, 'Junior Backend Dev',     'active'),
('Aditya Kumar',    'aditya@techcorp.in',    @pw, 2, 1, 'Backend Developer',      'active'),
('Siddharth Nair',  'siddharth@techcorp.in', @pw, 2, 1, 'Senior Backend Dev',     'active'),
('Pooja Mehta',     'pooja@techcorp.in',     @pw, 2, 1, 'Backend Developer',      'active'),
('Vivek Reddy',     'vivek@techcorp.in',     @pw, 2, 1, 'Full Stack Developer',   'active');

-- Engineering Full Stack
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Harsh Agarwal',   'harsh@techcorp.in',     @pw, 2, 1, 'Senior Full Stack Dev',  'active'),
('Sonal Joshi',     'sonal@techcorp.in',     @pw, 2, 1, 'Full Stack Developer',   'active'),
('Neeraj Yadav',    'neeraj@techcorp.in',    @pw, 2, 1, 'Junior Full Stack Dev',  'active'),
('Riya Mishra',     'riya@techcorp.in',      @pw, 2, 1, 'Full Stack Developer',   'active'),
('Sahil Bhat',      'sahil@techcorp.in',     @pw, 2, 1, 'Full Stack Developer',   'active');

-- QA Team
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Ananya Iyer',     'ananya@techcorp.in',    @pw, 2, 2, 'Senior QA Engineer',     'active'),
('Raj Kapoor',      'raj@techcorp.in',       @pw, 2, 2, 'QA Engineer',            'active'),
('Swati Pandey',    'swati@techcorp.in',     @pw, 2, 2, 'Automation QA',          'active'),
('Mohit Jain',      'mohit@techcorp.in',     @pw, 2, 2, 'QA Engineer',            'active'),
('Shruti Patil',    'shruti@techcorp.in',    @pw, 2, 2, 'Senior QA Engineer',     'active'),
('Vishal Sharma',   'vishal@techcorp.in',    @pw, 2, 2, 'QA Analyst',             'active'),
('Pallavi Singh',   'pallavi@techcorp.in',   @pw, 2, 2, 'Automation QA',          'active');

-- DevOps Team
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Sanjay Krishnan', 'sanjay@techcorp.in',   @pw, 2, 3, 'Senior DevOps Eng',      'active'),
('Gaurav Rathore',  'gaurav@techcorp.in',   @pw, 2, 3, 'DevOps Engineer',        'active'),
('Amit Sharma',     'amit@techcorp.in',     @pw, 2, 3, 'Cloud Engineer',         'active'),
('Neeti Arora',     'neeti@techcorp.in',    @pw, 2, 3, 'SRE Engineer',           'active'),
('Tarun Mishra',    'tarun@techcorp.in',    @pw, 2, 3, 'DevOps Engineer',        'active');

-- AI / Data Science
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Priya Nair',      'priya.n@techcorp.in',  @pw, 2, 4, 'ML Engineer',            'active'),
('Ashish Verma',    'ashish@techcorp.in',   @pw, 2, 4, 'Data Engineer',          'active'),
('Kaveri Sharma',   'kaveri@techcorp.in',   @pw, 2, 4, 'Data Analyst',           'active'),
('Vikram Bhatt',    'vikram.b@techcorp.in', @pw, 2, 4, 'Senior ML Engineer',     'active'),
('Ritika Gupta',    'ritika@techcorp.in',   @pw, 2, 4, 'AI Engineer',            'active'),
('Ishaan Joshi',    'ishaan@techcorp.in',   @pw, 2, 4, 'Data Scientist',         'active');

-- Product
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Smita Rao',       'smita@techcorp.in',    @pw, 2, 5, 'Product Manager',        'active'),
('Chirag Patel',    'chirag@techcorp.in',   @pw, 2, 5, 'Product Analyst',        'active'),
('Nisha Mehta',     'nisha@techcorp.in',    @pw, 2, 5, 'Product Owner',          'active'),
('Varun Malhotra',  'varun@techcorp.in',    @pw, 2, 5, 'Business Analyst',       'active');

-- Design
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Ritu Sharma',     'ritu@techcorp.in',     @pw, 2, 9, 'Senior UI/UX Designer',  'active'),
('Aryan Kapoor',    'aryan@techcorp.in',    @pw, 2, 9, 'UI Designer',            'active'),
('Meera Nair',      'meera@techcorp.in',    @pw, 2, 9, 'UX Researcher',          'active'),
('Tarun Gupta',     'tarun.g@techcorp.in',  @pw, 2, 9, 'Motion Designer',        'active');

-- Sales & Marketing
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Ajay Malhotra',   'ajay@techcorp.in',     @pw, 2, 10, 'Business Dev Executive', 'active'),
('Pooja Dixit',     'pooja.d@techcorp.in',  @pw, 2, 10, 'Enterprise Sales Exec',  'active'),
('Rajan Chauhan',   'rajan@techcorp.in',    @pw, 2, 10, 'BDE',                    'active'),
('Shweta Bose',     'shweta@techcorp.in',   @pw, 2, 11, 'Digital Marketing Exec', 'active'),
('Deepti Roy',      'deepti@techcorp.in',   @pw, 2, 11, 'Content Manager',        'active'),
('Harish Menon',    'harish@techcorp.in',   @pw, 2, 11, 'Growth Manager',         'active');

-- Finance & HR Staff
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Anita Roy',       'anita@techcorp.in',    @pw, 2, 7, 'Senior Accountant',       'active'),
('Suresh Jain',     'suresh.j@techcorp.in', @pw, 2, 7, 'Finance Analyst',         'active'),
('Rekha Patel',     'rekha@techcorp.in',    @pw, 2, 7, 'Payroll Executive',       'active'),
('Sumit Banerjee',  'sumit@techcorp.in',    @pw, 2, 6, 'HR Executive',            'active'),
('Latha Krishnan',  'latha@techcorp.in',    @pw, 2, 6, 'Recruiter',               'active');

-- Additional Engineering (to reach ~100)
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Tushar Sharma',   'tushar@techcorp.in',   @pw, 2, 1, 'Backend Developer',       'active'),
('Kavita Iyer',     'kavita.i@techcorp.in', @pw, 2, 1, 'Frontend Developer',      'active'),
('Pankaj Yadav',    'pankaj@techcorp.in',   @pw, 2, 1, 'Full Stack Developer',    'active'),
('Sarita Joshi',    'sarita@techcorp.in',   @pw, 2, 1, 'Senior Backend Dev',      'active'),
('Mukesh Kumar',    'mukesh@techcorp.in',   @pw, 2, 1, 'Backend Developer',       'active'),
('Lalitha Menon',   'lalitha@techcorp.in',  @pw, 2, 1, 'Frontend Developer',      'active'),
('Ashok Nair',      'ashok@techcorp.in',    @pw, 2, 1, 'Full Stack Developer',    'active'),
('Sunita Jain',     'sunita.j@techcorp.in', @pw, 2, 2, 'QA Engineer',             'active'),
('Ramdev Patil',    'ramdev@techcorp.in',   @pw, 2, 3, 'DevOps Engineer',         'active'),
('Geeta Sharma',    'geeta@techcorp.in',    @pw, 2, 4, 'Data Analyst',            'active'),
('Hemant Gupta',    'hemant@techcorp.in',   @pw, 2, 1, 'Junior Backend Dev',      'active'),
('Preeti Saxena',   'preeti@techcorp.in',   @pw, 2, 1, 'Junior Frontend Dev',     'active'),
('Aakash Bhatt',    'aakash@techcorp.in',   @pw, 2, 1, 'Backend Developer',       'active'),
('Shipra Malhotra', 'shipra@techcorp.in',   @pw, 2, 9, 'UI Designer',             'active'),
('Naveen Reddy',    'naveen@techcorp.in',   @pw, 2, 1, 'Senior Full Stack Dev',   'active');

-- ─────────────────────────────────────────────────────────────
-- EMPLOYEE GRADES for key staff
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO employee_grades (user_id, grade_level, designation, department, effective_date, salary_band_min, salary_band_max, assigned_by)
SELECT u.user_id,
  CASE u.designation
    WHEN 'CTO'                   THEN 'L12'
    WHEN 'CHRO'                  THEN 'L11'
    WHEN 'CFO'                   THEN 'L11'
    WHEN 'HR Manager'            THEN 'L5'
    WHEN 'HR Business Partner'   THEN 'L4'
    WHEN 'Talent Acquisition Lead' THEN 'L4'
    WHEN 'Engineering Manager'   THEN 'L7'
    WHEN 'Lead Frontend Engineer' THEN 'L5'
    WHEN 'Backend Lead'          THEN 'L5'
    WHEN 'DevOps Lead'           THEN 'L5'
    WHEN 'QA Lead'               THEN 'L5'
    WHEN 'Lead Data Scientist'   THEN 'L5'
    WHEN 'Senior Product Manager' THEN 'L5'
    WHEN 'Delivery Manager'      THEN 'L6'
    WHEN 'Design Lead'           THEN 'L5'
    WHEN 'Sales Manager'         THEN 'L5'
    WHEN 'Senior Frontend Dev'   THEN 'L4'
    WHEN 'Senior Backend Dev'    THEN 'L4'
    WHEN 'Senior Full Stack Dev' THEN 'L4'
    WHEN 'Senior QA Engineer'    THEN 'L4'
    WHEN 'Senior DevOps Eng'     THEN 'L4'
    WHEN 'Senior ML Engineer'    THEN 'L4'
    WHEN 'Senior UI/UX Designer' THEN 'L4'
    WHEN 'Frontend Developer'    THEN 'L3'
    WHEN 'Backend Developer'     THEN 'L3'
    WHEN 'Full Stack Developer'  THEN 'L3'
    WHEN 'QA Engineer'           THEN 'L3'
    WHEN 'DevOps Engineer'       THEN 'L3'
    WHEN 'Cloud Engineer'        THEN 'L3'
    WHEN 'ML Engineer'           THEN 'L3'
    WHEN 'Data Engineer'         THEN 'L3'
    WHEN 'Data Analyst'          THEN 'L3'
    WHEN 'Data Scientist'        THEN 'L3'
    WHEN 'AI Engineer'           THEN 'L4'
    WHEN 'Product Manager'       THEN 'L4'
    WHEN 'Product Owner'         THEN 'L3'
    WHEN 'Product Analyst'       THEN 'L2'
    WHEN 'Business Analyst'      THEN 'L3'
    WHEN 'UI Designer'           THEN 'L3'
    WHEN 'UX Researcher'         THEN 'L3'
    WHEN 'Senior Accountant'     THEN 'L4'
    WHEN 'Finance Analyst'       THEN 'L3'
    WHEN 'Payroll Executive'     THEN 'L2'
    WHEN 'HR Executive'          THEN 'L2'
    WHEN 'Recruiter'             THEN 'L2'
    ELSE 'L2'
  END,
  u.designation, d.department_name, '2024-01-01',
  CASE u.designation
    WHEN 'CTO' THEN 5000000 WHEN 'CHRO' THEN 4000000 WHEN 'CFO' THEN 4500000
    WHEN 'Engineering Manager' THEN 2500000 WHEN 'Lead Frontend Engineer' THEN 2000000
    WHEN 'Delivery Manager' THEN 2200000 WHEN 'Senior Frontend Dev' THEN 1600000
    WHEN 'Senior Backend Dev' THEN 1700000 WHEN 'Frontend Developer' THEN 900000
    WHEN 'Backend Developer' THEN 1000000 WHEN 'QA Engineer' THEN 700000
    ELSE 600000
  END,
  CASE u.designation
    WHEN 'CTO' THEN 8000000 WHEN 'CHRO' THEN 6000000 WHEN 'CFO' THEN 7000000
    WHEN 'Engineering Manager' THEN 3500000 WHEN 'Lead Frontend Engineer' THEN 2800000
    WHEN 'Delivery Manager' THEN 3200000 WHEN 'Senior Frontend Dev' THEN 2200000
    WHEN 'Senior Backend Dev' THEN 2400000 WHEN 'Frontend Developer' THEN 1400000
    WHEN 'Backend Developer' THEN 1600000 WHEN 'QA Engineer' THEN 1200000
    ELSE 1000000
  END,
  1
FROM users u
JOIN departments d ON d.department_id = u.department_id
WHERE u.status = 'active';

-- ─────────────────────────────────────────────────────────────
-- SALARY RECORDS for all active employees
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO salaries (user_id, basic, hra, special_allowance, pf_deduction, tds, professional_tax, net_salary, month, year, status)
SELECT
  u.user_id,
  ROUND(CASE g.grade_level
    WHEN 'L12' THEN 350000 WHEN 'L11' THEN 280000 WHEN 'L10' THEN 220000
    WHEN 'L9'  THEN 180000 WHEN 'L8'  THEN 140000 WHEN 'L7'  THEN 110000
    WHEN 'L6'  THEN 90000  WHEN 'L5'  THEN 72000  WHEN 'L4'  THEN 56000
    WHEN 'L3'  THEN 42000  WHEN 'L2'  THEN 28000  ELSE 18000
  END) AS basic,
  ROUND(CASE g.grade_level
    WHEN 'L12' THEN 175000 WHEN 'L11' THEN 140000 WHEN 'L10' THEN 110000
    WHEN 'L9'  THEN 90000  WHEN 'L8'  THEN 70000  WHEN 'L7'  THEN 55000
    WHEN 'L6'  THEN 45000  WHEN 'L5'  THEN 36000  WHEN 'L4'  THEN 28000
    WHEN 'L3'  THEN 21000  WHEN 'L2'  THEN 14000  ELSE 9000
  END) AS hra,
  ROUND(CASE g.grade_level
    WHEN 'L12' THEN 87500  WHEN 'L11' THEN 70000  WHEN 'L10' THEN 55000
    WHEN 'L9'  THEN 45000  WHEN 'L8'  THEN 35000  WHEN 'L7'  THEN 27500
    WHEN 'L6'  THEN 22500  WHEN 'L5'  THEN 18000  WHEN 'L4'  THEN 14000
    WHEN 'L3'  THEN 10500  WHEN 'L2'  THEN 7000   ELSE 4500
  END) AS special_allowance,
  ROUND(CASE g.grade_level
    WHEN 'L12' THEN 42000 WHEN 'L11' THEN 33600 WHEN 'L10' THEN 26400
    WHEN 'L9'  THEN 21600 WHEN 'L8'  THEN 16800 WHEN 'L7'  THEN 13200
    WHEN 'L6'  THEN 10800 WHEN 'L5'  THEN 8640  WHEN 'L4'  THEN 6720
    WHEN 'L3'  THEN 5040  WHEN 'L2'  THEN 3360  ELSE 2160
  END) AS pf_deduction,
  ROUND(CASE g.grade_level
    WHEN 'L12' THEN 45000 WHEN 'L11' THEN 35000 WHEN 'L10' THEN 28000
    WHEN 'L9'  THEN 22000 WHEN 'L8'  THEN 16000 WHEN 'L7'  THEN 12000
    WHEN 'L6'  THEN 9000  WHEN 'L5'  THEN 6500  WHEN 'L4'  THEN 5000
    WHEN 'L3'  THEN 3200  WHEN 'L2'  THEN 1800  ELSE 0
  END) AS tds,
  200 AS professional_tax,
  ROUND((CASE g.grade_level
    WHEN 'L12' THEN 612500 WHEN 'L11' THEN 490000 WHEN 'L10' THEN 385000
    WHEN 'L9'  THEN 315000 WHEN 'L8'  THEN 245000 WHEN 'L7'  THEN 192500
    WHEN 'L6'  THEN 157500 WHEN 'L5'  THEN 126000 WHEN 'L4'  THEN 98000
    WHEN 'L3'  THEN 73500  WHEN 'L2'  THEN 49000  ELSE 31500
  END) - CASE g.grade_level
    WHEN 'L12' THEN 42000 WHEN 'L11' THEN 33600 WHEN 'L10' THEN 26400
    WHEN 'L9'  THEN 21600 WHEN 'L8'  THEN 16800 WHEN 'L7'  THEN 13200
    WHEN 'L6'  THEN 10800 WHEN 'L5'  THEN 8640  WHEN 'L4'  THEN 6720
    WHEN 'L3'  THEN 5040  WHEN 'L2'  THEN 3360  ELSE 2160
  END - CASE g.grade_level
    WHEN 'L12' THEN 45000 WHEN 'L11' THEN 35000 WHEN 'L10' THEN 28000
    WHEN 'L9'  THEN 22000 WHEN 'L8'  THEN 16000 WHEN 'L7'  THEN 12000
    WHEN 'L6'  THEN 9000  WHEN 'L5'  THEN 6500  WHEN 'L4'  THEN 5000
    WHEN 'L3'  THEN 3200  WHEN 'L2'  THEN 1800  ELSE 0
  END - 200) AS net_salary,
  6 AS month, 2025 AS year, 'paid' AS status
FROM users u
JOIN employee_grades g ON g.user_id = u.user_id
WHERE u.status = 'active'
  AND g.effective_date = (SELECT MAX(g2.effective_date) FROM employee_grades g2 WHERE g2.user_id = u.user_id);

-- ─────────────────────────────────────────────────────────────
-- ATTENDANCE for June 2025 (sample for first 10 users)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO attendance (user_id, date, clock_in, clock_out, status, hours_worked)
SELECT u.user_id, '2025-06-13', '09:02:00', '18:15:00', 'present', 9.22
FROM users u WHERE u.status='active' LIMIT 80;

INSERT IGNORE INTO attendance (user_id, date, clock_in, clock_out, status, hours_worked)
SELECT u.user_id, '2025-06-12', '08:58:00', '18:30:00', 'present', 9.53
FROM users u WHERE u.status='active' LIMIT 80;

INSERT IGNORE INTO attendance (user_id, date, clock_in, clock_out, status, hours_worked)
SELECT u.user_id, '2025-06-11', '09:15:00', '18:00:00', 'present', 8.75
FROM users u WHERE u.status='active' LIMIT 75;

-- ─────────────────────────────────────────────────────────────
-- SAMPLE TASKS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO tasks (title, description, assigned_to, assigned_by, priority, status, due_date) VALUES
('Customer Portal – Phase 2 API',    'Complete REST endpoints for portal v2',         17, 7,  'high',   'in_progress', '2025-06-20'),
('React Dashboard Component',        'Build reusable analytics dashboard component',  18, 8,  'high',   'in_progress', '2025-06-18'),
('DB Migration – Schema v3',         'Run and validate database migration scripts',   24, 9,  'medium', 'pending',     '2025-06-22'),
('Unit Test Coverage – Module A',    'Achieve 90% test coverage on auth module',      26, 11, 'medium', 'pending',     '2025-06-25'),
('Docker Containerization Setup',    'Containerize all microservices with Docker',    31, 10, 'low',    'completed',   '2025-06-10'),
('CI/CD Pipeline Automation',        'Set up GitHub Actions for all repos',           32, 10, 'high',   'in_progress', '2025-06-30'),
('ML Model Training – Attrition',    'Re-train attrition model with Q2 data',        36, 12, 'high',   'in_progress', '2025-06-28'),
('API Security Audit',               'Review all public endpoints for vulnerabilities',19, 7, 'high',   'pending',     '2025-06-21'),
('Q2 Client Demo Preparation',       'Prepare slide deck and live demo environment',  38, 13, 'high',   'overdue',     '2025-06-15'),
('Data Pipeline Optimization',       'Optimize ETL pipeline for 10x performance',     37, 12, 'medium', 'in_progress', '2025-07-05'),
('Feature Flags Implementation',     'Implement feature flag system with Redis',       20, 7,  'medium', 'pending',     '2025-06-29'),
('Performance Testing Suite',        'Build Locust-based load testing framework',      27, 11, 'low',    'pending',     '2025-07-10'),
('User Authentication Revamp',       'Migrate to JWT + refresh token architecture',   23, 9,  'high',   'in_progress', '2025-06-26'),
('Design System Documentation',      'Document all reusable UI components',           46, 14, 'low',    'completed',   '2025-06-08'),
('Kubernetes Cluster Setup',         'Deploy production K8s cluster on AWS EKS',      33, 10, 'high',   'pending',     '2025-07-15');

-- ─────────────────────────────────────────────────────────────
-- LEAVE BALANCES
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO leave_balances (user_id, leave_type, total_days, used_days, remaining_days, year)
SELECT user_id, 'sick',   12, FLOOR(RAND()*5),   12-FLOOR(RAND()*5),   2025 FROM users WHERE status='active';
INSERT IGNORE INTO leave_balances (user_id, leave_type, total_days, used_days, remaining_days, year)
SELECT user_id, 'casual', 12, FLOOR(RAND()*4),   12-FLOOR(RAND()*4),   2025 FROM users WHERE status='active';
INSERT IGNORE INTO leave_balances (user_id, leave_type, total_days, used_days, remaining_days, year)
SELECT user_id, 'earned', 15, FLOOR(RAND()*3),   15-FLOOR(RAND()*3),   2025 FROM users WHERE status='active';

-- ─────────────────────────────────────────────────────────────
-- SAMPLE NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO notifications (user_id, title, message, type, is_read, created_at) VALUES
(17, 'Leave Approved',        'Your casual leave for Jun 18-19 has been approved.',          'leave',    0, NOW()),
(17, 'Salary Processed',      'Your June 2025 salary has been credited. View payslip.',      'salary',   0, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(17, 'Task Due Tomorrow',     'Task "React Dashboard Component" is due Jun 18.',             'task',     0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(17, 'Birthday Today! 🎂',   'Wish Kiran Sharma a happy birthday!',                         'general',  1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(7,  'SOS Alert',             'Priya Sharma triggered SOS at 14:28. Please respond.',        'sos',      0, NOW()),
(7,  'Loan Application',      'Sneha Reddy applied for a Home Loan of ₹25,00,000.',          'loan',     0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(4,  'New Employee Joined',   'Aakash Bhatt has been onboarded to Engineering team.',        'admin',    1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4,  'Pending Leave Requests','7 leave requests are pending your approval.',                 'leave',    0, DATE_SUB(NOW(), INTERVAL 6 HOUR));

-- ─────────────────────────────────────────────────────────────
-- SKILL ASSESSMENTS for demo users
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO skill_assessments (user_id, skill_id, proficiency, verified) VALUES
(17, 1,  'expert',        1),  -- Priya: JavaScript Expert
(17, 3,  'expert',        1),  -- Priya: React Expert
(17, 2,  'advanced',      0),  -- Priya: TypeScript Advanced
(17, 7,  'intermediate',  0),  -- Priya: Node.js Intermediate
(18, 1,  'advanced',      1),  -- Sneha: JavaScript Advanced
(18, 3,  'advanced',      0),  -- Sneha: React Advanced
(24, 7,  'expert',        1),  -- Kiran: Node.js Expert
(24, 13, 'advanced',      1),  -- Kiran: MySQL Advanced
(31, 18, 'expert',        1),  -- Sanjay: Docker Expert
(31, 19, 'advanced',      1),  -- Sanjay: Kubernetes Advanced
(31, 20, 'advanced',      0),  -- Sanjay: AWS Advanced
(36, 25, 'expert',        1),  -- Priya N: ML Expert
(36, 26, 'advanced',      1),  -- Priya N: Deep Learning Advanced
(36, 27, 'advanced',      0);  -- Priya N: NLP Advanced

-- ─────────────────────────────────────────────────────────────
-- CERTIFICATIONS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO certifications (user_id, cert_name, issuing_body, cert_number, issue_date, expiry_date, is_verified) VALUES
(31, 'AWS Solutions Architect Associate',  'Amazon Web Services',   'AWS-SAA-C03-234567', '2024-03-15', '2027-03-15', 1),
(31, 'Certified Kubernetes Administrator', 'CNCF',                  'CKA-2024-88901',     '2024-07-20', '2026-07-20', 1),
(36, 'TensorFlow Developer Certificate',   'Google',                 'TF-2023-112233',     '2023-11-10', '2025-11-10', 1),
(36, 'AWS Machine Learning Specialty',     'Amazon Web Services',   'AWS-ML-556677',      '2024-05-08', '2027-05-08', 1),
(24, 'MongoDB Certified Developer',        'MongoDB Inc.',           'MDB-DEV-445566',     '2024-01-20', '2026-01-20', 1),
(17, 'Meta React Developer Certificate',   'Meta / Coursera',        'META-REACT-789012',  '2023-09-01', NULL,         1);

-- ─────────────────────────────────────────────────────────────
-- FAMILY INFORMATION
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO family_information (user_id, marital_status, spouse_name, children_count, emergency_contact_1) VALUES
(17, 'married',  'Karan Sharma',   0, '+91 98765 12345'),
(7,  'married',  'Pooja Singh',    2, '+91 98765 23456'),
(8,  'single',   NULL,             0, '+91 98765 34567'),
(24, 'married',  'Deepika Nair',   1, '+91 98765 45678'),
(31, 'married',  'Sunita Krishna', 0, '+91 98765 56789');

-- ─────────────────────────────────────────────────────────────
-- EMPLOYEE BENEFITS ENROLLMENTS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO employee_benefits (user_id, plan_id, enrollment_date, status, nominee_name, nominee_relation)
SELECT u.user_id, 1, '2024-04-01', 'active', 'Family Member', 'spouse'
FROM users u WHERE u.status='active' LIMIT 80;

INSERT IGNORE INTO employee_benefits (user_id, plan_id, enrollment_date, status, nominee_name, nominee_relation)
SELECT u.user_id, 3, '2024-04-01', 'active', 'Family Member', 'spouse'
FROM users u WHERE u.status='active' LIMIT 80;

-- ─────────────────────────────────────────────────────────────
-- DEPENDENT MEMBERS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO dependent_members (user_id, name, relation, dob, is_covered) VALUES
(17, 'Karan Sharma',       'spouse', '1992-05-14', 1),
(7,  'Pooja Singh',        'spouse', '1988-11-22', 1),
(7,  'Aarav Singh',        'child',  '2018-03-10', 1),
(7,  'Anaya Singh',        'child',  '2021-07-15', 1),
(24, 'Deepika Nair',       'spouse', '1993-08-30', 1),
(24, 'Vihaan Sharma',      'child',  '2020-12-01', 1);

-- ─────────────────────────────────────────────────────────────
-- BANKING DETAILS (demo — masked)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO employee_banking (user_id, bank_name, account_number, account_type, ifsc_code, branch_name, account_holder, upi_id, pf_account_number, pf_uan, is_verified, verified_by, verified_at)
VALUES
(17, 'State Bank of India',  'XX1234567890XX', 'salary', 'SBIN0001234', 'MG Road Bengaluru', 'Priya Sharma',  'priya@upi',  'KN/BNG/12345/001', '100234567890', 1, 4, NOW()),
(18, 'HDFC Bank',            'XX9876543210XX', 'salary', 'HDFC0001234', 'Koramangala BLR',   'Sneha Reddy',   'sneha@paytm', 'KN/BNG/12345/002', '100234567891', 1, 4, NOW()),
(7,  'ICICI Bank',           'XX5555444433XX', 'salary', 'ICIC0001234', 'Indiranagar BLR',   'Vikram Singh',  'vikram@gpay', 'KN/BNG/12345/003', '100234567892', 1, 4, NOW()),
(31, 'Axis Bank',            'XX7777888899XX', 'salary', 'UTIB0001234', 'HSR Layout BLR',    'Sanjay Krishnan','sanjay@upi', 'KN/BNG/12345/004', '100234567893', 0, NULL, NULL),
(36, 'Kotak Mahindra Bank',  'XX3333222211XX', 'salary', 'KKBK0001234', 'Madhapur HYD',      'Priya Nair',    'priyan@upi', 'KN/HYD/23456/001', '100234567894', 0, NULL, NULL);

-- ─────────────────────────────────────────────────────────────
-- PROMOTIONS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO promotions (user_id, from_grade, to_grade, from_designation, to_designation, reason, effective_date, salary_revision, approved_by, status) VALUES
(17, 'L3', 'L4', 'Frontend Developer',       'Senior Frontend Developer', 'Exceptional performance, led portal redesign project end-to-end',  '2024-01-01', 120000, 7, 'approved'),
(18, 'L2', 'L3', 'Junior Frontend Dev',      'Frontend Developer',         'Consistent delivery, good code quality, peer recognition',         '2024-04-01', 80000,  7, 'approved'),
(24, 'L3', 'L4', 'Backend Developer',        'Senior Backend Developer',   'Built payment gateway integration saving ₹2Cr/year',              '2023-10-01', 100000, 7, 'approved'),
(31, 'L3', 'L4', 'DevOps Engineer',          'Senior DevOps Engineer',     'Achieved 99.9% uptime, cut infra costs by 30%',                    '2024-03-01', 110000, 10,'approved'),
(8,  'L4', 'L5', 'Senior Frontend Dev',      'Lead Frontend Engineer',     'Successfully led team of 8, delivered 3 major projects on time',   '2024-06-01', 150000, 7, 'approved');

-- ─────────────────────────────────────────────────────────────
-- TAX DECLARATIONS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO tax_declarations (user_id, financial_year, regime, ppf, elss, life_insurance, health_self, health_parents, hra_rent_paid, hra_city_type, nps_80ccd, status, submitted_at)
VALUES
(17, '2025-26', 'new',  0,     0,     0,      25000, 0,      120000, 'metro',     0,     'submitted', NOW()),
(18, '2025-26', 'old',  50000, 46500, 24000,  20000, 50000,  96000,  'metro',     50000, 'submitted', NOW()),
(7,  '2025-26', 'new',  0,     0,     0,      25000, 0,      180000, 'metro',     0,     'approved',  NOW()),
(24, '2025-26', 'old',  150000,0,     48000,  25000, 50000,  144000, 'metro',     50000, 'submitted', NOW());

-- ─────────────────────────────────────────────────────────────
-- LOAN APPLICATIONS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO loan_applications (user_id, loan_type, principal, tenure_months, interest_rate, emi_amount, purpose, status, manager_action, hr_action, admin_action, disbursal_date)
VALUES
(17, 'home',      2500000, 120, 8.0,  30349,  'Purchase of apartment in Whitefield, Bengaluru',        'disbursed', 'approved', 'approved', 'approved', '2024-02-01'),
(18, 'vehicle',   650000,  36,  9.0,  20677,  'Purchase of Honda City for daily commute',              'approved',  'approved', 'approved', 'approved', NULL),
(24, 'education', 800000,  48,  8.5,  19826,  'MBA program at IIM Bangalore for career development',   'pending',   'pending',  'pending',  'pending',  NULL),
(31, 'personal',  200000,  24,  11.0, 9303,   'Medical expenses for family member surgery',            'approved',  'approved', 'approved', 'approved', NULL),
(36, 'marriage',  400000,  36,  9.5,  12836,  'Marriage ceremony and related expenses',                'pending',   'approved', 'pending',  'pending',  NULL);

-- ─────────────────────────────────────────────────────────────
-- SOS EVENTS (demo)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO safety_sos_events (user_id, trigger_type, lat, lng, address, status, created_at) VALUES
(17, 'panic_button', 12.9716, 77.5946, 'Prestige Tech Park, Floor 3, Bengaluru', 'resolved',    DATE_SUB(NOW(), INTERVAL 5 DAY)),
(18, 'auto_timer',   17.4478, 78.3763, 'Cab Route 4, HITEC City, Hyderabad',     'resolved',    DATE_SUB(NOW(), INTERVAL 12 DAY)),
(17, 'panic_button', 12.9716, 77.5946, 'Prestige Tech Park, Parking B',          'active',      DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- ─────────────────────────────────────────────────────────────
-- SAFETY EMERGENCY CONTACTS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO safety_emergency_contacts (user_id, name, relation, phone, email, is_primary, notify_on_sos) VALUES
(17, 'Karan Sharma',   'Husband', '+91 98765 12345', 'karan@gmail.com',  1, 1),
(17, 'Rekha Sharma',   'Mother',  '+91 98765 99988', 'rekha@gmail.com',  0, 1),
(18, 'Anand Reddy',    'Father',  '+91 98765 77766', 'anand@gmail.com',  1, 1),
(7,  'Pooja Singh',    'Wife',    '+91 98765 55544', 'pooja@gmail.com',  1, 1);

-- ─────────────────────────────────────────────────────────────
-- TRANSFER REQUESTS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO transfer_requests (user_id, transfer_type, from_location, to_location, reason, preferred_date, status, manager_action, hr_action, admin_action) VALUES
(18, 'marriage',   'Bengaluru', 'Hyderabad', 'Getting married to someone based in Hyderabad. Requesting office transfer.',              '2025-07-01', 'approved', 'approved', 'approved', 'approved'),
(36, 'hybrid',     'Hyderabad', 'Hyderabad', 'Requesting 3 days WFH per week due to elderly parent care responsibilities at home.',    '2025-06-15', 'pending',  'pending',  'pending',  'pending'),
(31, 'office',     'Bengaluru', 'Pune',      'Spouse transferred to Pune. Requesting office transfer to maintain work-life balance.',  '2025-08-01', 'under_review','approved','pending','pending');

-- ─────────────────────────────────────────────────────────────
-- NIGHT SHIFT APPROVALS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO safety_night_shift_approvals (user_id, shift_date, start_time, end_time, cab_required, female_cab, escort_req, status, approved_by, approved_at) VALUES
(17, '2025-06-14', '20:00:00', '06:00:00', 1, 1, 0, 'approved', 7, NOW()),
(18, '2025-06-15', '20:00:00', '04:00:00', 1, 1, 1, 'pending',  NULL, NULL),
(17, '2025-06-10', '20:00:00', '06:00:00', 1, 1, 0, 'approved', 7, DATE_SUB(NOW(),INTERVAL 3 DAY));

-- ═══════════════════════════════════════════════════════════════
-- DEMO DATA INSERT COMPLETE
-- Total employees: ~100 | Departments: 12 | Grades: 12 levels
-- ⚠️  DEMO DATA ONLY — NOT REAL EMPLOYEES
-- ═══════════════════════════════════════════════════════════════

-- END OF FILE: seed_demo_data.sql

-- ==========================================================================================
-- FILE 25/26: seed_all_employees.sql
-- SECTION: SEED: ALL EMPLOYEES
-- DESCRIPTION: Complete employee roster with profiles, salaries, bank details, PF/ESI/UAN data
-- TABLES: 0 | LINES: 394
-- ==========================================================================================

-- ============================================================
-- seed_all_employees.sql — v6.0 Full Team Seed Data
-- Seeds all 9 employees: Priya, Rahul, Aisha, Vikram, Sneha,
--   Piyush, Harsh Vardhan, Kartik, Riya, Divya
-- Run AFTER: schema.sql → migrate_v5.1.sql → migrate_v6.0.sql
-- Usage: mysql -u root -p workforce_intelligence < database/seed_all_employees.sql
-- ============================================================
-- USE statement removed (handled at top)

-- ── Ensure departments exist ──────────────────────────────
INSERT IGNORE INTO departments (dept_name, description) VALUES
  ('Engineering', 'Software development and technical operations'),
  ('Product',     'Product management, roadmap and analytics'),
  ('Design',      'UI/UX design and brand'),
  ('HR',          'Human resources and people management'),
  ('Finance',     'Accounts, payroll and financial operations'),
  ('Marketing',   'Digital marketing, growth and content');

-- ── Reference IDs ─────────────────────────────────────────
SET @admin_id   = 1;
SET @eng_dept   = (SELECT dept_id FROM departments WHERE dept_name='Engineering' LIMIT 1);
SET @prod_dept  = (SELECT dept_id FROM departments WHERE dept_name='Product'     LIMIT 1);
SET @des_dept   = (SELECT dept_id FROM departments WHERE dept_name='Design'      LIMIT 1);
SET @hr_dept    = (SELECT dept_id FROM departments WHERE dept_name='HR'          LIMIT 1);
SET @fin_dept   = (SELECT dept_id FROM departments WHERE dept_name='Finance'     LIMIT 1);
SET @mkt_dept   = (SELECT dept_id FROM departments WHERE dept_name='Marketing'   LIMIT 1);
SET @morn_shift = (SELECT shift_id FROM shifts WHERE shift_name='Morning Shift' LIMIT 1);

-- ═══════════════════════════════════════════════════════════
-- 1. HARSH VARDHAN — Engineering Manager (role 3)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Harsh Vardhan','harsh.vardhan@wip.com','$2b$10$hV1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',3,3,2980,'active',@eng_dept,135000.00,'+91 95566 77889','Engineering Manager','2019-04-01','1990-03-15','male','full_time',@morn_shift);
SET @harsh_id = (SELECT user_id FROM users WHERE email='harsh.vardhan@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@harsh_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@harsh_id,2025,'sick',12,1,0,2),(@harsh_id,2025,'casual',12,2,0,1),
  (@harsh_id,2025,'earned',15,0,5,3),(@harsh_id,2025,'unpaid',0,0,0,0),(@harsh_id,2025,'other',0,0,0,0);

-- ═══════════════════════════════════════════════════════════
-- 2. PRIYA SHARMA — Senior Developer (role 2)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Priya Sharma','priya.sharma@wip.com','$2b$10$pS1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,3,2840,'active',@eng_dept,85000.00,'+91 98765 43210','Senior Developer','2022-03-01','1997-09-12','female','full_time',@morn_shift);
SET @priya_id = (SELECT user_id FROM users WHERE email='priya.sharma@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@priya_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@priya_id,2025,'sick',12,0,0,0),(@priya_id,2025,'casual',12,3,3,0),
  (@priya_id,2025,'earned',15,0,0,0),(@priya_id,2025,'unpaid',0,0,0,0),(@priya_id,2025,'other',0,0,0,0);

-- ═══════════════════════════════════════════════════════════
-- 3. PIYUSH SHARMA — Full Stack Developer (role 2) — DETAILED
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,profile_notes,designation,join_date,date_of_birth,address,emergency_contact,gender,employment_type,shift_id,last_login)
VALUES (
  'Piyush Sharma','piyush.sharma@wip.com',
  '$2b$10$X9v2QkLmN3pR7sT1uV5wOeYZaB6cD8eF0gH2iJ4kL6mN8oP0qR2s',
  2,3,2200,'active',@eng_dept,72000.00,'+91 93344 55667',
  'Full Stack Developer with 2+ years in Node.js and React. Quick learner with strong debugging skills.',
  'Full Stack Developer','2022-11-14','1998-07-22',
  'Flat 4B, Sunrise Apartments, Sector 18, Noida, UP - 201301',
  'Sunita Sharma (Mother) — +91 98800 11223',
  'male','full_time',@morn_shift,'2025-05-07 09:05:00'
);
SET @piyush_id = (SELECT user_id FROM users WHERE email='piyush.sharma@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@piyush_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,@admin_id);

-- Piyush attendance (23 records)
INSERT IGNORE INTO attendance (user_id,work_date,clock_in,clock_out,status,total_hours,ot_hours,remarks) VALUES
  (@piyush_id,'2025-05-07','2025-05-07 09:05:00',NULL,'present',NULL,0.00,NULL),
  (@piyush_id,'2025-05-06','2025-05-06 09:02:00','2025-05-06 19:30:00','present',10.47,2.47,'Stayed late for deployment'),
  (@piyush_id,'2025-05-05','2025-05-05 09:10:00','2025-05-05 18:15:00','present',9.08,1.08,NULL),
  (@piyush_id,'2025-05-02','2025-05-02 09:00:00','2025-05-02 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-05-01','2025-05-01 09:18:00','2025-05-01 18:10:00','late',8.87,0.87,'Metro delay'),
  (@piyush_id,'2025-04-30','2025-04-30 09:03:00','2025-04-30 20:00:00','present',10.95,2.95,'Month-end push'),
  (@piyush_id,'2025-04-29','2025-04-29 09:00:00','2025-04-29 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-28','2025-04-28 09:05:00','2025-04-28 18:05:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-25','2025-04-25 09:00:00','2025-04-25 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-24',NULL,NULL,'absent',NULL,0.00,'Personal emergency'),
  (@piyush_id,'2025-04-23','2025-04-23 09:00:00','2025-04-23 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-22','2025-04-22 09:00:00','2025-04-22 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-21','2025-04-21 09:00:00','2025-04-21 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-18','2025-04-18 09:00:00','2025-04-18 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-17','2025-04-17 09:00:00','2025-04-17 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-16','2025-04-16 10:30:00','2025-04-16 14:30:00','half_day',4.00,0.00,'Approved half day'),
  (@piyush_id,'2025-04-15','2025-04-15 09:05:00','2025-04-15 18:10:00','present',9.08,1.08,NULL),
  (@piyush_id,'2025-04-14','2025-04-14 09:00:00','2025-04-14 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-11',NULL,NULL,'leave',NULL,0.00,'Casual leave approved'),
  (@piyush_id,'2025-04-10',NULL,NULL,'leave',NULL,0.00,'Casual leave approved'),
  (@piyush_id,'2025-04-09','2025-04-09 09:00:00','2025-04-09 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-08','2025-04-08 09:22:00','2025-04-08 18:10:00','late',8.80,0.80,'Traffic'),
  (@piyush_id,'2025-04-07','2025-04-07 09:00:00','2025-04-07 18:00:00','present',9.00,1.00,NULL);

-- Piyush leave requests
INSERT IGNORE INTO leave_requests (user_id,leave_type,from_date,to_date,days,reason,status,reviewed_by,reviewed_at) VALUES
  (@piyush_id,'casual','2025-04-10','2025-04-11',2,'Personal work at home town','approved',@harsh_id,'2025-04-08 11:30:00'),
  (@piyush_id,'half_day','2025-04-16','2025-04-16',1,'Bank work','approved',@harsh_id,'2025-04-15 16:00:00'),
  (@piyush_id,'earned','2025-05-15','2025-05-18',4,'Family trip to Rishikesh','pending',NULL,NULL),
  (@piyush_id,'casual','2025-03-20','2025-03-21',2,'Attending friend wedding','rejected',@harsh_id,'2025-03-18 10:00:00');

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@piyush_id,2025,'sick',12,0,0,0),(@piyush_id,2025,'casual',12,2,0,1),
  (@piyush_id,2025,'earned',15,0,4,0),(@piyush_id,2025,'unpaid',0,0,0,0),(@piyush_id,2025,'other',0,0,0,0);

-- Piyush salary records (6 months)
INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@piyush_id,4,2025,79800.00,0.00,10800.00,69000.00,'paid','2025-04-30','April 2025 — Basic+HRA+Allowances. PF+PT deducted.',@admin_id),
  (@piyush_id,3,2025,79800.00,0.00,10800.00,69000.00,'paid','2025-03-31','March 2025',@admin_id),
  (@piyush_id,2,2025,79800.00,0.00,11800.00,68000.00,'paid','2025-02-28','Feb — 1 absent day deduction',@admin_id),
  (@piyush_id,1,2025,79800.00,5000.00,10800.00,74000.00,'paid','2025-01-31','Jan — New Year performance bonus',@admin_id),
  (@piyush_id,12,2024,72000.00,8000.00,10200.00,69800.00,'paid','2024-12-31','Dec — Annual bonus',@admin_id),
  (@piyush_id,11,2024,72000.00,0.00,10200.00,61800.00,'paid','2024-11-30','Nov — First month (pro-rated)',@admin_id);

-- Piyush salary revisions
INSERT IGNORE INTO salary_revisions (user_id,old_salary,new_salary,effective_date,reason,revised_by) VALUES
  (@piyush_id,60000.00,72000.00,'2022-11-14','Joining salary',@admin_id),
  (@piyush_id,72000.00,72000.00,'2023-11-14','Annual review — probation extended',@admin_id),
  (@piyush_id,72000.00,78000.00,'2024-04-01','Performance increment 8.3%',@admin_id),
  (@piyush_id,78000.00,72000.00,'2024-11-14','Role re-alignment, CTC unchanged',@admin_id);

-- Piyush advances
INSERT IGNORE INTO salary_advances (user_id,amount,reason,status,approved_by,approved_at,repay_months,repaid_amount) VALUES
  (@piyush_id,20000.00,'Vehicle repair — two-wheeler engine overhaul','approved',@admin_id,'2025-04-01 10:30:00',2,10000.00),
  (@piyush_id,15000.00,'Laptop upgrade for WFH setup','pending',NULL,NULL,3,0.00);

-- Piyush expense claims
INSERT IGNORE INTO expense_claims (user_id,claim_date,category,amount,description,status,reviewed_by,reviewed_at,paid_on) VALUES
  (@piyush_id,'2025-04-20','travel',1800.00,'Cab to client office — Gurgaon','paid',@harsh_id,'2025-04-22 11:00:00','2025-04-30'),
  (@piyush_id,'2025-04-05','food',650.00,'Team lunch during sprint planning','approved',@harsh_id,'2025-04-07 09:30:00',NULL),
  (@piyush_id,'2025-03-15','equipment',3200.00,'Mechanical keyboard for workstation','approved',@harsh_id,'2025-03-17 14:00:00',NULL),
  (@piyush_id,'2025-02-28','travel',2400.00,'Pune site visit for integration testing','paid',@harsh_id,'2025-03-01 10:00:00','2025-03-31'),
  (@piyush_id,'2025-05-05','other',1200.00,'AWS certification exam fee','pending',NULL,NULL,NULL);

-- Piyush tasks
INSERT IGNORE INTO tasks (title,description,assigned_by,assigned_to,priority,status,due_date,timer_hours,achievement_level,completed_at) VALUES
  ('Full Stack Portal Module v1','Build employee self-service portal with React + API integration.',@harsh_id,@piyush_id,'High','Completed','2025-04-15',48,'excellent','2025-04-14 17:30:00'),
  ('Authentication Middleware Refactor','JWT auth refactor to support Manager/HR roles. Add token expiry.',@harsh_id,@piyush_id,'High','Completed','2025-04-20',24,'outstanding','2025-04-19 16:45:00'),
  ('Database Query Optimization','Optimize attendance+salary queries. Target <200ms.',@harsh_id,@piyush_id,'Medium','Completed','2025-04-30',48,'good','2025-04-29 18:00:00'),
  ('Unit Tests — Admin Controller','Write unit tests for adminController.js. 80%+ coverage.',@harsh_id,@piyush_id,'Medium','Completed','2025-05-02',48,'good','2025-05-01 17:00:00'),
  ('Full Stack Portal Module v2','Extend portal: payslip PDF, advance form, expense claim.',@harsh_id,@piyush_id,'High','In Progress','2025-05-20',72,'none',NULL),
  ('Mobile Responsive Fixes','Fix layout issues on tasks/salary/leave.html for <640px.',@harsh_id,@piyush_id,'Medium','In Progress','2025-05-14',24,'none',NULL),
  ('API Rate Limiting','Implement rate limiting on all public endpoints.',@harsh_id,@piyush_id,'Medium','Pending','2025-05-25',24,'none',NULL),
  ('Email Notification Service','SMTP integration for leave/salary/task alert emails.',@harsh_id,@piyush_id,'Low','Pending','2025-06-05',48,'none',NULL),
  ('Security Audit — Input Validation','Joi/Zod validation on all controller endpoints.',@harsh_id,@piyush_id,'High','Overdue','2025-05-05',48,'none',NULL);

-- Piyush achievements
INSERT IGNORE INTO achievements (user_id,achievement_type,level,points,message,awarded_by) VALUES
  (@piyush_id,'task_complete','excellent',150,'Portal Module v1 delivered a day early. Zero bugs in review.',@harsh_id),
  (@piyush_id,'task_complete','outstanding',200,'Auth middleware refactor ahead of schedule. Role guards adopted by whole team.',@harsh_id),
  (@piyush_id,'weekly_star','good',100,'Most commits this week — 3 modules in parallel.',@admin_id),
  (@piyush_id,'monthly_star','good',150,'Best attendance in Engineering for April 2025.',@admin_id);

-- Piyush documents
INSERT IGNORE INTO employee_documents (user_id,doc_type,doc_name,file_path,uploaded_by) VALUES
  (@piyush_id,'offer_letter','Offer Letter — Nov 2022','/uploads/docs/piyush/offer_letter_nov2022.pdf',@admin_id),
  (@piyush_id,'contract','Employment Contract v1','/uploads/docs/piyush/employment_contract_2022.pdf',@admin_id),
  (@piyush_id,'id_proof','Aadhaar Card','/uploads/docs/piyush/aadhaar.pdf',@piyush_id),
  (@piyush_id,'id_proof','PAN Card','/uploads/docs/piyush/pan.pdf',@piyush_id),
  (@piyush_id,'certificate','B.Tech Computer Science 2021','/uploads/docs/piyush/btech_degree.pdf',@piyush_id),
  (@piyush_id,'certificate','AWS Cloud Practitioner 2024','/uploads/docs/piyush/aws_cert.pdf',@piyush_id),
  (@piyush_id,'other','Increment Letter — Apr 2024','/uploads/docs/piyush/increment_apr2024.pdf',@admin_id);

-- Piyush productivity scores
INSERT IGNORE INTO productivity_scores (user_id,score_date,completion_rate,delay_count,productivity_score) VALUES
  (@piyush_id,'2025-05-01',100.00,0,96.50),
  (@piyush_id,'2025-04-01',85.71,1,82.30),
  (@piyush_id,'2025-03-01',80.00,1,78.50),
  (@piyush_id,'2025-02-01',75.00,2,72.10),
  (@piyush_id,'2025-01-01',83.33,1,80.60),
  (@piyush_id,'2024-12-01',70.00,2,68.40);

-- ═══════════════════════════════════════════════════════════
-- 4. KARTIK JAISWAL — Product Analyst (role 2)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Kartik Jaiswal','kartik.jaiswal@wip.com','$2b$10$kJ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,2,1850,'active',@prod_dept,68000.00,'+91 87766 55443','Product Analyst','2023-07-10','2000-01-18','male','full_time',@morn_shift);
SET @kartik_id = (SELECT user_id FROM users WHERE email='kartik.jaiswal@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@kartik_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@kartik_id,2025,'sick',12,2,0,0),(@kartik_id,2025,'casual',12,1,0,0),
  (@kartik_id,2025,'earned',15,0,0,0),(@kartik_id,2025,'unpaid',0,0,0,0),(@kartik_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@kartik_id,4,2025,63600.00,0.00,9200.00,54400.00,'paid','2025-04-30','April 2025',@admin_id),
  (@kartik_id,3,2025,63600.00,0.00,9200.00,54400.00,'pending',NULL,'March 2025',@admin_id);

INSERT IGNORE INTO salary_advances (user_id,amount,reason,status,approved_by,approved_at,repay_months,repaid_amount) VALUES
  (@kartik_id,30000.00,'Education fee — MBA entrance coaching','pending',NULL,NULL,3,0.00);

INSERT IGNORE INTO attendance (user_id,work_date,clock_in,clock_out,status,total_hours,ot_hours) VALUES
  (@kartik_id,'2025-05-07','2025-05-07 09:18:00','2025-05-07 18:05:00','late',8.78,0.78),
  (@kartik_id,'2025-05-06','2025-05-06 09:05:00','2025-05-06 18:00:00','present',8.92,0.92),
  (@kartik_id,'2025-05-05',NULL,NULL,'absent',NULL,0.00),
  (@kartik_id,'2025-05-02','2025-05-02 09:00:00','2025-05-02 18:00:00','present',9.00,1.00),
  (@kartik_id,'2025-05-01','2025-05-01 09:00:00','2025-05-01 18:00:00','present',9.00,1.00);

INSERT IGNORE INTO leave_requests (user_id,leave_type,from_date,to_date,days,reason,status) VALUES
  (@kartik_id,'sick','2025-05-12','2025-05-13',2,'Fever and flu','pending');

-- ═══════════════════════════════════════════════════════════
-- 5. RAHUL MEHTA — Product Manager (role 3)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Rahul Mehta','rahul.mehta@wip.com','$2b$10$rM1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',3,3,2640,'active',@prod_dept,120000.00,'+91 91234 56789','Product Manager Lead','2021-01-15','1992-05-08','male','full_time',@morn_shift);
SET @rahul_id = (SELECT user_id FROM users WHERE email='rahul.mehta@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@rahul_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@rahul_id,2025,'sick',12,1,0,2),(@rahul_id,2025,'casual',12,2,0,1),
  (@rahul_id,2025,'earned',15,0,0,3),(@rahul_id,2025,'unpaid',0,0,0,0),(@rahul_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@rahul_id,4,2025,112000.00,0.00,18000.00,94000.00,'pending',NULL,'April 2025',@admin_id),
  (@rahul_id,3,2025,112000.00,0.00,18000.00,94000.00,'paid','2025-03-31','March 2025',@admin_id);

-- ═══════════════════════════════════════════════════════════
-- 6. AISHA KHAN — UI/UX Designer (role 2)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Aisha Khan','aisha.khan@wip.com','$2b$10$aK1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,2,1920,'pending',@des_dept,65000.00,'+91 99887 76655','UI/UX Designer','2024-02-05','2001-11-30','female','full_time',@morn_shift);
SET @aisha_id = (SELECT user_id FROM users WHERE email='aisha.khan@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@aisha_id,TRUE,FALSE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@aisha_id,2025,'sick',12,1,0,0),(@aisha_id,2025,'casual',12,1,0,0),
  (@aisha_id,2025,'earned',14,0,0,0),(@aisha_id,2025,'unpaid',0,0,0,0),(@aisha_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@aisha_id,4,2025,60750.00,0.00,9000.00,51750.00,'pending',NULL,'April 2025',@admin_id);

-- ═══════════════════════════════════════════════════════════
-- 7. VIKRAM NAIR — HR Manager (role 4)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Vikram Nair','vikram.nair@wip.com','$2b$10$vN1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',4,3,2110,'active',@hr_dept,95000.00,'+91 97654 32109','HR Manager','2020-06-01','1989-04-22','male','full_time',@morn_shift);
SET @vikram_id = (SELECT user_id FROM users WHERE email='vikram.nair@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@vikram_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@vikram_id,2025,'sick',12,2,0,0),(@vikram_id,2025,'casual',12,1,0,1),
  (@vikram_id,2025,'earned',15,0,0,5),(@vikram_id,2025,'unpaid',0,0,0,0),(@vikram_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@vikram_id,4,2025,88750.00,0.00,14250.00,74500.00,'pending',NULL,'April 2025',@admin_id),
  (@vikram_id,3,2025,88750.00,0.00,14250.00,74500.00,'paid','2025-03-31','March 2025',@admin_id);

-- ═══════════════════════════════════════════════════════════
-- 8. SNEHA PATEL — Backend Developer (role 2)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Sneha Patel','sneha.patel@wip.com','$2b$10$sP1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,3,2480,'active',@eng_dept,78000.00,'+91 88990 01122','Backend Developer','2022-09-01','1999-03-07','female','full_time',@morn_shift);
SET @sneha_id = (SELECT user_id FROM users WHERE email='sneha.patel@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@sneha_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@sneha_id,2025,'sick',12,1,0,0),(@sneha_id,2025,'casual',12,2,0,0),
  (@sneha_id,2025,'earned',15,0,6,0),(@sneha_id,2025,'unpaid',0,0,0,0),(@sneha_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@sneha_id,4,2025,72850.00,0.00,11700.00,61150.00,'paid','2025-04-30','April 2025',@admin_id),
  (@sneha_id,3,2025,72850.00,0.00,11700.00,61150.00,'paid','2025-03-31','March 2025',@admin_id);

-- ═══════════════════════════════════════════════════════════
-- 9. RIYA KAPOOR — Digital Marketing Lead (role 2)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Riya Kapoor','riya.kapoor@wip.com','$2b$10$rK1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,2,2050,'active',@mkt_dept,70000.00,'+91 96655 44332','Digital Marketing Lead','2023-03-20','1998-08-25','female','full_time',@morn_shift);
SET @riya_id = (SELECT user_id FROM users WHERE email='riya.kapoor@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@riya_id,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@riya_id,2025,'sick',12,0,0,0),(@riya_id,2025,'casual',12,2,0,0),
  (@riya_id,2025,'earned',12,0,0,0),(@riya_id,2025,'unpaid',0,0,0,0),(@riya_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@riya_id,4,2025,65450.00,0.00,10500.00,54950.00,'pending',NULL,'April 2025',@admin_id);

INSERT IGNORE INTO expense_claims (user_id,claim_date,category,amount,description,status,reviewed_by,reviewed_at) VALUES
  (@riya_id,'2025-05-03','equipment',6500.00,'Camera for content shoot','pending',NULL,NULL),
  (@riya_id,'2025-04-18','travel',3200.00,'Mumbai brand event — travel and stay','approved',@vikram_id,'2025-04-20 10:00:00');

INSERT IGNORE INTO leave_requests (user_id,leave_type,from_date,to_date,days,reason,status) VALUES
  (@riya_id,'half_day','2025-05-09','2025-05-09',1,'Doctor appointment — morning only','pending');

-- ═══════════════════════════════════════════════════════════
-- 10. DIVYA MENON — Finance Analyst (role 2)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Divya Menon','divya.menon@wip.com','$2b$10$dM1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,2,1980,'active',@fin_dept,75000.00,'+91 92233 44556','Finance Analyst','2022-08-15','1997-12-03','female','full_time',@morn_shift);
SET @divya_id = (SELECT user_id FROM users WHERE email='divya.menon@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@divya_id,TRUE,TRUE,TRUE,FALSE,TRUE,FALSE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@divya_id,2025,'sick',12,2,0,0),(@divya_id,2025,'casual',12,1,0,0),
  (@divya_id,2025,'earned',13,0,0,1),(@divya_id,2025,'unpaid',0,0,0,0),(@divya_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@divya_id,4,2025,70100.00,0.00,11250.00,58850.00,'paid','2025-04-30','April 2025',@admin_id);

INSERT IGNORE INTO expense_claims (user_id,claim_date,category,amount,description,status,reviewed_by,reviewed_at,paid_on) VALUES
  (@divya_id,'2025-04-25','other',3200.00,'Finance conference registration fee','approved',@vikram_id,'2025-04-26 09:00:00',NULL);

-- ═══════════════════════════════════════════════════════════
-- Update department managers
-- ═══════════════════════════════════════════════════════════
UPDATE departments SET manager_id=@harsh_id  WHERE dept_name='Engineering';
UPDATE departments SET manager_id=@rahul_id  WHERE dept_name='Product';
UPDATE departments SET manager_id=@vikram_id WHERE dept_name='HR';
UPDATE departments SET manager_id=@riya_id   WHERE dept_name='Marketing';
UPDATE departments SET manager_id=@divya_id  WHERE dept_name='Finance';

-- Assign users to departments
UPDATE users SET department_id=@eng_dept  WHERE email IN ('priya.sharma@wip.com','piyush.sharma@wip.com','harsh.vardhan@wip.com','sneha.patel@wip.com');
UPDATE users SET department_id=@prod_dept WHERE email IN ('rahul.mehta@wip.com','kartik.jaiswal@wip.com');
UPDATE users SET department_id=@des_dept  WHERE email='aisha.khan@wip.com';
UPDATE users SET department_id=@hr_dept   WHERE email='vikram.nair@wip.com';
UPDATE users SET department_id=@fin_dept  WHERE email='divya.menon@wip.com';
UPDATE users SET department_id=@mkt_dept  WHERE email='riya.kapoor@wip.com';

-- ═══════════════════════════════════════════════════════════
-- Holiday calendar
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO holiday_calendar (name, holiday_date, holiday_type, description) VALUES
  ('Republic Day',            '2025-01-26','public', 'National holiday'),
  ('Holi',                    '2025-03-14','public', 'Festival of colors'),
  ('Good Friday',             '2025-04-18','public', 'Christian holiday'),
  ('Eid ul-Fitr',             '2025-03-31','public', 'End of Ramadan'),
  ('Company Foundation Day',  '2025-05-15','company','WIP annual celebration'),
  ('Independence Day',        '2025-08-15','public', 'National holiday'),
  ('Ganesh Chaturthi',        '2025-08-27','optional','Regional holiday'),
  ('Dussehra',                '2025-10-02','public', 'National holiday'),
  ('Diwali',                  '2025-10-20','public', 'Festival of lights'),
  ('Diwali (Day 2)',          '2025-10-21','optional','Optional holiday'),
  ('Christmas',               '2025-12-25','public', 'Christian holiday'),
  ('New Year Eve',            '2025-12-31','optional','Optional half day');

-- ═══════════════════════════════════════════════════════════
-- Audit log entries for all onboardings
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO audit_logs (actor_id,action,entity_type,new_values,ip_address) VALUES
  (@admin_id,'BULK_ONBOARD','users',JSON_OBJECT('employees_added',9,'batch','v6.0 launch'),'192.168.1.1'),
  (@admin_id,'GENERATE_SALARY','salary_records',JSON_OBJECT('month',4,'year',2025,'count',10),'192.168.1.1'),
  (@admin_id,'CREATE_DEPT','departments',JSON_OBJECT('depts_created','Marketing,Finance'),'192.168.1.1');

-- ═══════════════════════════════════════════════════════════
-- Final verification query
-- ═══════════════════════════════════════════════════════════
SELECT
  u.user_id,
  u.full_name,
  r.role_name,
  d.dept_name,
  u.designation,
  FORMAT(u.base_salary,0) AS base_salary,
  u.total_points AS points,
  u.status,
  u.gender,
  u.join_date,
  (SELECT COUNT(*) FROM tasks        WHERE assigned_to=u.user_id)  AS tasks,
  (SELECT COUNT(*) FROM salary_records WHERE user_id=u.user_id)    AS payslips,
  (SELECT COUNT(*) FROM leave_balances WHERE user_id=u.user_id)    AS leave_types,
  (SELECT COUNT(*) FROM attendance     WHERE user_id=u.user_id)    AS att_records
FROM users u
JOIN roles r ON u.role_id=r.role_id
LEFT JOIN departments d ON u.department_id=d.dept_id
WHERE u.email LIKE '%wip.com'
ORDER BY u.join_date ASC;

SELECT CONCAT('✅ All employees seeded — ',COUNT(*),' users in workforce_intelligence') AS result
FROM users WHERE email LIKE '%wip.com';

-- END OF FILE: seed_all_employees.sql

-- ==========================================================================================
-- FILE 26/26: seed_piyush_sharma.sql
-- SECTION: SEED: PIYUSH SHARMA
-- DESCRIPTION: Additional employee seed data with extended profile
-- TABLES: 0 | LINES: 268
-- ==========================================================================================

-- ============================================================
-- seed_piyush_sharma.sql — Complete data for Mr. Piyush Sharma
-- FIXED: Uses email-based ID lookup, no hardcoded IDs
-- Run AFTER schema.sql (or workforce_intelligence_COMPLETE.sql)
-- mysql -u root -p workforce_intelligence < seed_piyush_sharma.sql
-- ============================================================
-- USE statement removed (handled at top)

-- ── Safe ID lookups (no hardcoded IDs) ───────────────────────────
SET @eng_dept   = (SELECT dept_id  FROM departments WHERE dept_name  = 'Engineering'    LIMIT 1);
SET @morn_shift = (SELECT shift_id FROM shifts      WHERE shift_name = 'Morning Shift'  LIMIT 1);
SET @harsh_id   = (SELECT user_id  FROM users       WHERE email      = 'harsh.vardhan@wip.com' LIMIT 1);
SET @admin_id   = (SELECT user_id  FROM users       WHERE role_id    = 1                LIMIT 1);

-- Fallback: if admin doesn't exist yet, use 1
SET @admin_id = COALESCE(@admin_id, 1);

-- ── 1. USER PROFILE ───────────────────────────────────────────────
INSERT IGNORE INTO users (
  full_name, email, password_hash, role_id,
  access_level, total_points, status,
  department_id, base_salary, phone, profile_notes,
  designation, join_date, date_of_birth,
  address, emergency_contact,
  gender, employment_type, shift_id, last_login
) VALUES (
  'Piyush Sharma',
  'piyush.sharma@wip.com',
  '$2b$10$X9v2QkLmN3pR7sT1uV5wOeYZaB6cD8eF0gH2iJ4kL6mN8oP0qR2s',
  2, 3, 2200, 'active',
  @eng_dept, 72000.00, '+91 93344 55667',
  'Full Stack Developer with 2+ years in Node.js and React. Quick learner with strong debugging skills.',
  'Full Stack Developer', '2022-11-14', '1998-07-22',
  'Flat 4B, Sunrise Apartments, Sector 18, Noida, UP - 201301',
  'Sunita Sharma (Mother) +91 98800 11223',
  'male', 'full_time', @morn_shift, '2025-05-07 09:05:00'
);
SET @piyush_id = (SELECT user_id FROM users WHERE email = 'piyush.sharma@wip.com' LIMIT 1);

-- ── 2. PERMISSIONS ────────────────────────────────────────────────
INSERT IGNORE INTO user_permissions (
  user_id, can_view_analytics, can_view_reports, can_use_chat,
  can_request_extension, can_view_salary, can_view_team,
  can_view_attendance, can_clock_in_out, can_request_advance, updated_by
) VALUES (@piyush_id, TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE, @admin_id);

-- ── 3. ATTENDANCE ─────────────────────────────────────────────────
INSERT IGNORE INTO attendance (user_id,work_date,clock_in,clock_out,status,total_hours,ot_hours,remarks) VALUES
  (@piyush_id,'2025-05-07','2025-05-07 09:05:00',NULL,'present',NULL,0.00,NULL),
  (@piyush_id,'2025-05-06','2025-05-06 09:02:00','2025-05-06 19:30:00','present',10.47,2.47,'Late deployment'),
  (@piyush_id,'2025-05-05','2025-05-05 09:10:00','2025-05-05 18:15:00','present',9.08,1.08,NULL),
  (@piyush_id,'2025-05-02','2025-05-02 09:00:00','2025-05-02 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-05-01','2025-05-01 09:18:00','2025-05-01 18:10:00','late',8.87,0.87,'Metro delay'),
  (@piyush_id,'2025-04-30','2025-04-30 09:03:00','2025-04-30 20:00:00','present',10.95,2.95,'Month-end push'),
  (@piyush_id,'2025-04-29','2025-04-29 09:00:00','2025-04-29 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-28','2025-04-28 09:05:00','2025-04-28 18:05:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-25','2025-04-25 09:00:00','2025-04-25 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-24',NULL,NULL,'absent',NULL,0.00,'Personal emergency'),
  (@piyush_id,'2025-04-23','2025-04-23 09:00:00','2025-04-23 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-22','2025-04-22 09:00:00','2025-04-22 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-21','2025-04-21 09:00:00','2025-04-21 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-18','2025-04-18 09:00:00','2025-04-18 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-17','2025-04-17 09:00:00','2025-04-17 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-16','2025-04-16 10:30:00','2025-04-16 14:30:00','half_day',4.00,0.00,'Approved half day'),
  (@piyush_id,'2025-04-15','2025-04-15 09:05:00','2025-04-15 18:10:00','present',9.08,1.08,NULL),
  (@piyush_id,'2025-04-14','2025-04-14 09:00:00','2025-04-14 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-11',NULL,NULL,'leave',NULL,0.00,'Casual leave approved'),
  (@piyush_id,'2025-04-10',NULL,NULL,'leave',NULL,0.00,'Casual leave approved'),
  (@piyush_id,'2025-04-09','2025-04-09 09:00:00','2025-04-09 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-08','2025-04-08 09:22:00','2025-04-08 18:10:00','late',8.80,0.80,'Traffic'),
  (@piyush_id,'2025-04-07','2025-04-07 09:00:00','2025-04-07 18:00:00','present',9.00,1.00,NULL);

-- ── 4. LEAVE REQUESTS ─────────────────────────────────────────────
INSERT IGNORE INTO leave_requests (user_id,leave_type,from_date,to_date,days,reason,status,reviewed_by,reviewed_at) VALUES
  (@piyush_id,'casual',  '2025-04-10','2025-04-11',2,'Personal work at home town','approved',@harsh_id,'2025-04-08 11:30:00'),
  (@piyush_id,'half_day','2025-04-16','2025-04-16',1,'Bank work',                  'approved',@harsh_id,'2025-04-15 16:00:00'),
  (@piyush_id,'earned',  '2025-05-15','2025-05-18',4,'Family trip to Rishikesh',   'pending', NULL,      NULL),
  (@piyush_id,'casual',  '2025-03-20','2025-03-21',2,'Attending friend wedding',   'rejected',@harsh_id,'2025-03-18 10:00:00');

-- ── 5. LEAVE BALANCES ─────────────────────────────────────────────
INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@piyush_id,2025,'sick',   12,0,0,0),
  (@piyush_id,2025,'casual', 12,2,0,1),
  (@piyush_id,2025,'earned', 15,0,4,0),
  (@piyush_id,2025,'unpaid',  0,0,0,0),
  (@piyush_id,2025,'other',   0,0,0,0);

-- ── 6. SALARY RECORDS ─────────────────────────────────────────────
INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@piyush_id,4,2025,79800,0,    10800,69000,'paid',      '2025-04-30','April 2025 itemized payroll',    @admin_id),
  (@piyush_id,3,2025,79800,0,    10800,69000,'paid',      '2025-03-31','March 2025',                     @admin_id),
  (@piyush_id,2,2025,79800,0,    11800,68000,'paid',      '2025-02-28','Feb — 1 absent day deduction',   @admin_id),
  (@piyush_id,1,2025,79800,5000, 10800,74000,'paid',      '2025-01-31','Jan — New Year performance bonus',@admin_id),
  (@piyush_id,12,2024,72000,8000,10200,69800,'paid',      '2024-12-31','Dec — Annual bonus',             @admin_id),
  (@piyush_id,11,2024,72000,0,   10200,61800,'paid',      '2024-11-30','Nov — First month pro-rated',    @admin_id);

-- ── 7. SALARY LINE ITEMS (April 2025) ────────────────────────────
SET @sal_apr = (SELECT salary_id FROM salary_records WHERE user_id=@piyush_id AND month=4 AND year=2025 LIMIT 1);
INSERT IGNORE INTO salary_line_items (salary_id,component_id,amount)
  SELECT @sal_apr, component_id, amount FROM (
    SELECT 'Basic Salary'      cname, 43200.00 amount UNION ALL
    SELECT 'HRA',                     17280.00         UNION ALL
    SELECT 'Travel Allowance',         1600.00         UNION ALL
    SELECT 'Medical Allowance',        1250.00         UNION ALL
    SELECT 'Special Allowance',       16470.00         UNION ALL
    SELECT 'Provident Fund',           5184.00         UNION ALL
    SELECT 'Professional Tax',          200.00         UNION ALL
    SELECT 'Advance Deduction',        5000.00         UNION ALL
    SELECT 'Leave Deduction',             0.00         UNION ALL
    SELECT 'ESI',                        216.00
  ) v JOIN salary_components sc ON sc.name = v.cname AND sc.is_active = TRUE;

-- ── 8. SALARY REVISIONS ───────────────────────────────────────────
INSERT IGNORE INTO salary_revisions (user_id,old_salary,new_salary,effective_date,reason,revised_by) VALUES
  (@piyush_id,60000,72000,'2022-11-14','Joining salary',                     @admin_id),
  (@piyush_id,72000,72000,'2023-11-14','Annual review — probation extended', @admin_id),
  (@piyush_id,72000,78000,'2024-04-01','Performance increment 8.3%',         @admin_id),
  (@piyush_id,78000,72000,'2024-11-14','Role re-alignment, CTC unchanged',   @admin_id);

-- ── 9. SALARY ADVANCES ────────────────────────────────────────────
INSERT IGNORE INTO salary_advances (user_id,amount,reason,status,approved_by,approved_at,repay_months,repaid_amount) VALUES
  (@piyush_id,20000,'Vehicle repair — two-wheeler engine overhaul','approved',@admin_id,'2025-04-01 10:30:00',2,10000),
  (@piyush_id,15000,'Laptop upgrade for WFH setup',                'pending', NULL,NULL,3,0);

-- ── 10. EXPENSE CLAIMS ────────────────────────────────────────────
INSERT IGNORE INTO expense_claims (user_id,claim_date,category,amount,description,status,reviewed_by,reviewed_at,paid_on) VALUES
  (@piyush_id,'2025-04-20','travel',   1800,'Cab to client office — Gurgaon',      'paid',    @harsh_id,'2025-04-22 11:00:00','2025-04-30'),
  (@piyush_id,'2025-04-05','food',      650,'Team lunch during sprint planning',    'approved',@harsh_id,'2025-04-07 09:30:00',NULL),
  (@piyush_id,'2025-03-15','equipment',3200,'Mechanical keyboard for workstation',  'approved',@harsh_id,'2025-03-17 14:00:00',NULL),
  (@piyush_id,'2025-02-28','travel',   2400,'Pune site visit — integration testing','paid',    @harsh_id,'2025-03-01 10:00:00','2025-03-31'),
  (@piyush_id,'2025-05-05','other',    1200,'AWS certification exam fee',           'pending', NULL,NULL,NULL);

-- ── 11. TASKS ─────────────────────────────────────────────────────
INSERT IGNORE INTO tasks (title,description,assigned_by,assigned_to,priority,status,due_date,achievement_level,completed_at) VALUES
  ('Full Stack Portal Module v1',      'Build employee self-service portal using React + API.',               @harsh_id,@piyush_id,'High',  'Completed', '2025-04-15','excellent',  '2025-04-14 17:30:00'),
  ('Authentication Middleware Refactor','JWT refactor for Manager/HR roles + token expiry enforcement.',      @harsh_id,@piyush_id,'High',  'Completed', '2025-04-20','outstanding','2025-04-19 16:45:00'),
  ('Database Query Optimization',      'Optimize attendance/salary queries. Target <200ms response.',         @harsh_id,@piyush_id,'Medium','Completed', '2025-04-30','good',       '2025-04-29 18:00:00'),
  ('Unit Tests — Admin Controller',    'Write unit tests for adminController.js. Achieve 80%+ coverage.',    @harsh_id,@piyush_id,'Medium','Completed', '2025-05-02','good',       '2025-05-01 17:00:00'),
  ('Full Stack Portal Module v2',      'Extend portal: payslip PDF, advance form, expense claim submission.', @harsh_id,@piyush_id,'High',  'In Progress','2025-05-20','none',       NULL),
  ('Mobile Responsive Fixes',          'Fix layout issues on tasks/salary/leave.html for <640px screens.',   @harsh_id,@piyush_id,'Medium','In Progress','2025-05-14','none',       NULL),
  ('API Rate Limiting',                'Implement rate limiting on all public API endpoints.',                @harsh_id,@piyush_id,'Medium','Pending',    '2025-05-25','none',       NULL),
  ('Email Notification Service',       'SMTP integration for leave/salary/task alert emails.',               @harsh_id,@piyush_id,'Low',   'Pending',    '2025-06-05','none',       NULL),
  ('Security Audit — Input Validation','Joi/Zod validation on all controller endpoints.',                    @harsh_id,@piyush_id,'High',  'Overdue',    '2025-05-05','none',       NULL);

-- Capture task IDs
SET @t1 = (SELECT task_id FROM tasks WHERE title='Full Stack Portal Module v1'       AND assigned_to=@piyush_id LIMIT 1);
SET @t2 = (SELECT task_id FROM tasks WHERE title='Authentication Middleware Refactor' AND assigned_to=@piyush_id LIMIT 1);
SET @t5 = (SELECT task_id FROM tasks WHERE title='Full Stack Portal Module v2'       AND assigned_to=@piyush_id LIMIT 1);
SET @t9 = (SELECT task_id FROM tasks WHERE title='Security Audit — Input Validation' AND assigned_to=@piyush_id LIMIT 1);

-- ── 12. TASK LOGS ─────────────────────────────────────────────────
INSERT IGNORE INTO task_logs (task_id,status,remarks,updated_by) VALUES
  (@t1,'Pending',     'Task assigned to Piyush',                              @harsh_id),
  (@t1,'In Progress', 'Piyush started UI components',                          @piyush_id),
  (@t1,'Completed',   'All modules deployed. Code reviewed by Harsh.',          @piyush_id),
  (@t2,'Pending',     'JWT refactor needed for v6.0',                          @harsh_id),
  (@t2,'In Progress', 'Manager/HR role guards added to middleware',             @piyush_id),
  (@t2,'Completed',   'Expiry enforcement added. All tests passing.',            @piyush_id),
  (@t5,'Pending',     'Portal v2 scope defined',                               @harsh_id),
  (@t5,'In Progress', 'Payslip PDF component 60% complete',                    @piyush_id),
  (@t9,'Pending',     'Security task assigned — high priority',                @harsh_id),
  (@t9,'Overdue',     'Missed — deprioritized due to Portal v2 work',          @harsh_id);

-- ── 13. TASK COMMENTS ─────────────────────────────────────────────
INSERT IGNORE INTO task_comments (task_id,user_id,comment) VALUES
  (@t1,@piyush_id,'Started with attendance module. Using React hooks + Axios. PR by EOD.'),
  (@t1,@harsh_id, 'Good progress. Make sure salary permission gate works before merge.'),
  (@t1,@piyush_id,'Permission gate tested. PR #47 raised and ready for review.'),
  (@t2,@harsh_id, 'Critical for v6.0 release. TokenExpiredError must return 401 clearly.'),
  (@t2,@piyush_id,'Done. Added staffOrAbove and hrOrAbove guards. PR #52 ready.'),
  (@t5,@piyush_id,'Using jsPDF for payslip. Draft ready — needs salary_line_items API.'),
  (@t5,@harsh_id, 'Good. Once PDF done, move to advance form. Keep the UX clean.'),
  (@t9,@harsh_id, 'Piyush please prioritize after Portal v2. Validation gaps are security risk.');

-- ── 14. TASK SUGGESTIONS ─────────────────────────────────────────
INSERT IGNORE INTO task_suggestions (task_id,user_id,suggestion,source) VALUES
  (@t5,@piyush_id,'Use html2canvas + jsPDF for payslip PDF to preserve CSS formatting. Cache salary_line_items on client.','ai'),
  (@t9,@piyush_id,'Use Joi for request body validation and express-validator for query/param sanitization. Start with salary and leave endpoints.','ai'),
  (@t5,@piyush_id,'Add @media print CSS so payslip renders cleanly without nav/footer elements.','ai');

-- ── 15. ACHIEVEMENTS ─────────────────────────────────────────────
INSERT IGNORE INTO achievements (user_id,task_id,achievement_type,level,points,message,awarded_by) VALUES
  (@piyush_id,@t1,'task_complete','excellent',   150,'Portal Module v1 delivered a day early. Zero bugs in review.',              @harsh_id),
  (@piyush_id,@t2,'task_complete','outstanding', 200,'Auth middleware ahead of schedule. Role guards adopted team-wide.',          @harsh_id),
  (@piyush_id,NULL,'weekly_star', 'good',        100,'Most commits this week — contributed to 3 modules in parallel.',            @admin_id),
  (@piyush_id,NULL,'monthly_star','good',        150,'Best attendance in Engineering for April 2025. Zero unplanned absences.',    @admin_id);

-- ── 16. PRODUCTIVITY SCORES ───────────────────────────────────────
INSERT IGNORE INTO productivity_scores (user_id,score_date,completion_rate,delay_count,productivity_score) VALUES
  (@piyush_id,'2025-05-01',100.00,0,96.50),
  (@piyush_id,'2025-04-01', 85.71,1,82.30),
  (@piyush_id,'2025-03-01', 80.00,1,78.50),
  (@piyush_id,'2025-02-01', 75.00,2,72.10),
  (@piyush_id,'2025-01-01', 83.33,1,80.60),
  (@piyush_id,'2024-12-01', 70.00,2,68.40);

-- ── 17. ALERTS ───────────────────────────────────────────────────
INSERT IGNORE INTO alerts (user_id,task_id,alert_message,alert_type,is_read) VALUES
  (@piyush_id,NULL,'✅ Earned leave 15–18 May submitted — pending manager approval.','general',FALSE),
  (@piyush_id,@t5, '📋 Task "Full Stack Portal Module v2" due in 13 days. Progress: 60%.','task_assigned',FALSE),
  (@piyush_id,@t9, '⚠️ Task "Security Audit — Input Validation" is overdue by 2 days.','overdue',FALSE),
  (@piyush_id,NULL,'💰 April 2025 salary credited. Net: ₹69,000.','salary_paid',TRUE),
  (@piyush_id,NULL,'💳 Salary advance ₹20,000 approved. Repayment: ₹10,000 × 2 months.','general',TRUE),
  (@piyush_id,@t2, '🏆 Achievement: Outstanding — Auth Middleware Refactor ahead of schedule.','achievement',TRUE),
  (@piyush_id,@t1, '🏆 Achievement: Excellent — Portal Module v1 delivered early.','achievement',TRUE),
  (@piyush_id,NULL,'💰 March 2025 salary credited. Net: ₹69,000.','salary_paid',TRUE);

-- ── 18. EMPLOYEE DOCUMENTS ───────────────────────────────────────
INSERT IGNORE INTO employee_documents (user_id,doc_type,doc_name,file_path,uploaded_by) VALUES
  (@piyush_id,'offer_letter','Offer Letter — Nov 2022',      '/uploads/docs/piyush/offer_letter.pdf',    @admin_id),
  (@piyush_id,'contract',    'Employment Contract v1',        '/uploads/docs/piyush/contract_2022.pdf',   @admin_id),
  (@piyush_id,'id_proof',    'Aadhaar Card',                  '/uploads/docs/piyush/aadhaar.pdf',         @piyush_id),
  (@piyush_id,'id_proof',    'PAN Card',                      '/uploads/docs/piyush/pan.pdf',             @piyush_id),
  (@piyush_id,'certificate', 'B.Tech Computer Science 2021',  '/uploads/docs/piyush/btech_degree.pdf',    @piyush_id),
  (@piyush_id,'certificate', 'AWS Cloud Practitioner 2024',   '/uploads/docs/piyush/aws_cert.pdf',        @piyush_id),
  (@piyush_id,'other',       'Increment Letter — Apr 2024',   '/uploads/docs/piyush/increment_2024.pdf',  @admin_id);

-- ── 19. AUDIT LOGS ───────────────────────────────────────────────
INSERT IGNORE INTO audit_logs (actor_id,action,entity_type,entity_id,new_values,ip_address) VALUES
  (@admin_id,'CREATE_USER',         'users',           @piyush_id, JSON_OBJECT('email','piyush.sharma@wip.com','role','Employee'),'192.168.1.1'),
  (@admin_id,'APPROVE_USER',        'users',           @piyush_id, JSON_OBJECT('status','active'),'192.168.1.1'),
  (@admin_id,'UPDATE_PERMISSIONS',  'user_permissions',@piyush_id, JSON_OBJECT('can_request_advance',true),'192.168.1.1'),
  (@admin_id,'UPSERT_SALARY',       'salary_records',  NULL,       JSON_OBJECT('month',4,'year',2025,'net',69000),'192.168.1.1'),
  (@admin_id,'MARK_SALARY_PAID',    'salary_records',  NULL,       JSON_OBJECT('paid_on','2025-04-30'),'192.168.1.1'),
  (@admin_id,'REVIEW_ADVANCE',      'salary_advances', NULL,       JSON_OBJECT('amount',20000,'status','approved'),'192.168.1.1'),
  (@harsh_id,'APPROVE_LEAVE',       'leave_requests',  NULL,       JSON_OBJECT('type','casual','days',2,'status','approved'),'10.0.0.8'),
  (@harsh_id,'APPROVE_LEAVE',       'leave_requests',  NULL,       JSON_OBJECT('type','half_day','days',1,'status','approved'),'10.0.0.8'),
  (@harsh_id,'REJECT_LEAVE',        'leave_requests',  NULL,       JSON_OBJECT('type','casual','days',2,'status','rejected'),'10.0.0.8'),
  (@admin_id,'UPDATE_USER',         'users',           @piyush_id, JSON_OBJECT('designation','Full Stack Developer'),'192.168.1.1');


-- ── 20. REPORTS — Piyush performance summary ─────────────────────────────
INSERT IGNORE INTO reports (report_title, report_type, period, status, generated_by, summary, report_data)
VALUES (
  'Employee Profile Report — Piyush Sharma',
  'hr',
  'May 2025',
  'published',
  @admin_id,
  'Complete onboarding and performance summary for Piyush Sharma (Full Stack Developer, Engineering Dept). Join: 14 Nov 2022. Points: 2200. Completion rate: 86.7%. Tasks completed: 4. OT hours: 12.5.',
  JSON_OBJECT(
    'user_id',   @piyush_id,
    'name',      'Piyush Sharma',
    'dept',      'Engineering',
    'join_date', '2022-11-14',
    'salary',    72000,
    'points',    2200,
    'tasks_done', 4,
    'tasks_open', 3,
    'ot_hours',   12.5,
    'completion_rate', 86.7
  )
);

-- ── VERIFY ────────────────────────────────────────────────────────
SELECT
  'Piyush Sharma' AS employee,
  (SELECT COUNT(*) FROM attendance        WHERE user_id=@piyush_id) AS attendance_records,
  (SELECT COUNT(*) FROM salary_records    WHERE user_id=@piyush_id) AS salary_records,
  (SELECT COUNT(*) FROM leave_requests    WHERE user_id=@piyush_id) AS leave_requests,
  (SELECT COUNT(*) FROM tasks             WHERE assigned_to=@piyush_id) AS tasks,
  (SELECT COUNT(*) FROM achievements      WHERE user_id=@piyush_id) AS achievements,
  (SELECT COUNT(*) FROM expense_claims    WHERE user_id=@piyush_id) AS expense_claims,
  (SELECT COUNT(*) FROM employee_documents WHERE user_id=@piyush_id) AS documents,
  (SELECT COUNT(*) FROM alerts            WHERE user_id=@piyush_id) AS alerts,
  (SELECT COUNT(*) FROM audit_logs        WHERE entity_id=@piyush_id OR actor_id=@piyush_id) AS audit_entries;

SELECT 'seed_piyush_sharma.sql complete ✅ — 20 tables populated' AS result;

-- END OF FILE: seed_piyush_sharma.sql

-- ==========================================================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- ==========================================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================================================
-- SUMMARY
-- ==========================================================================================
-- Total files merged:  26
-- Total CREATE TABLEs: 173
-- Total source lines:  5,264
-- Missing files:       None
-- Generated:          2026-07-10 09:23:03
--
-- WorkforceIQ v12.0 — Complete HRMS Platform
-- Node.js · Express · MySQL 8.0+ · JWT · bcryptjs · Socket.io · Docker
-- ==========================================================================================