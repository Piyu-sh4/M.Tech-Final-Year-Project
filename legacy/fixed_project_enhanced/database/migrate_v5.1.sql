-- ============================================================
-- migrate_v5.1.sql — Safe ALTER-only migration
-- All tables now in schema.sql — this file only adds columns
-- that may be missing on older installations.
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS)
-- ============================================================
USE workforce_intelligence;

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
