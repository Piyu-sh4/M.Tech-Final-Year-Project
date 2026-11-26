-- ============================================================
-- migrate_v6.0.sql — Safe ALTER-only migration
-- All new tables are now in schema.sql.
-- This file only adds columns on older installations.
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS)
-- ============================================================
USE workforce_intelligence;

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
