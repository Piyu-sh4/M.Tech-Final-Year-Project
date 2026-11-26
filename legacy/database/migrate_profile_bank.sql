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
