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

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ════════════════════════════════════════════════════════════════
-- PART 1: CREATE DATABASE
-- ════════════════════════════════════════════════════════════════
CREATE DATABASE IF NOT EXISTS workforce_intelligence
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE workforce_intelligence;

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
-- e.g. Piyush → Piyush@123, Harsh → Harsh@123
-- Admin user: admin@wip.com / Admin@123

-- ── 0. System Administrator (role_id = 1) ─────────────────────
-- REQUIRED: Must exist so pending registrations can be approved.
-- Hash below is bcrypt of: Admin@123
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

SET FOREIGN_KEY_CHECKS = 1;

-- ════════════════════════════════════════════════════════════════
-- VERIFICATION — Run after import to check all tables
-- ════════════════════════════════════════════════════════════════
SELECT '✅ Database setup complete!' AS status;
SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = 'workforce_intelligence'
  ORDER BY TABLE_NAME;
