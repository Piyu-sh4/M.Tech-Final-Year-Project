-- ============================================================
-- BASE MIGRATION SCRIPT (required before v5.1 migration)
-- Run this first when setting up on an existing database
-- Safe to run multiple times (uses IF NOT EXISTS / IGNORE)
-- ============================================================

USE workforce_intelligence;

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
