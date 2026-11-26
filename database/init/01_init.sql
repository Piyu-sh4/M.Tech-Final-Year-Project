-- ============================================================
-- Workforce Intelligence — Database bootstrap
-- Runs first on a fresh MySQL container (docker-entrypoint-initdb.d).
-- Creates the workforce_intelligence database and the wfi_user
-- application account. All tables (including roles) are created
-- by 02_master.sql — do NOT define tables here, or the schema in
-- 02_master.sql will be skipped by CREATE TABLE IF NOT EXISTS.
-- ============================================================

CREATE DATABASE IF NOT EXISTS workforce_intelligence
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- mysql_native_password: the backend's 'mysql' driver cannot use MySQL 8's default caching_sha2_password.
CREATE USER IF NOT EXISTS 'wfi_user'@'%'         IDENTIFIED WITH mysql_native_password BY 'P123/';
CREATE USER IF NOT EXISTS 'wfi_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'P123/';

GRANT ALL PRIVILEGES ON workforce_intelligence.* TO 'wfi_user'@'%';
GRANT ALL PRIVILEGES ON workforce_intelligence.* TO 'wfi_user'@'localhost';

FLUSH PRIVILEGES;
