-- ============================================================
-- Workforce Intelligence v12.0 — User Setup
-- Run this ONCE after creating the database
-- mysql -u root -p < database/setup_user.sql
-- ============================================================

-- Create application database
CREATE DATABASE IF NOT EXISTS workforce_intelligence
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create application user with password P123/
CREATE USER IF NOT EXISTS 'wfi_user'@'localhost' IDENTIFIED BY 'P123/';
CREATE USER IF NOT EXISTS 'wfi_user'@'%'         IDENTIFIED BY 'P123/';

-- Grant full access to the database
GRANT ALL PRIVILEGES ON workforce_intelligence.* TO 'wfi_user'@'localhost';
GRANT ALL PRIVILEGES ON workforce_intelligence.* TO 'wfi_user'@'%';

FLUSH PRIVILEGES;

SELECT 'Setup complete. User: wfi_user | Password: P123/' AS result;
