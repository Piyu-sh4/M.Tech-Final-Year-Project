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
