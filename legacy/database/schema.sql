-- ============================================================
-- schema.sql FIXED -- All 25 tables, all columns
-- Safe to run multiple times (IF NOT EXISTS everywhere)
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;

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

SET FOREIGN_KEY_CHECKS = 1;
SELECT 'schema.sql v6.0 loaded -- 25 tables ✅' AS result;
