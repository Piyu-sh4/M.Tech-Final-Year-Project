-- ============================================================
-- seed_admin.sql — Creates the default Admin user (role_id = 1)
-- ⚠️  RUN THIS FIRST, before seed_all_employees.sql
-- ============================================================
-- Credentials:
--   Email   : admin@wip.com
--   Password: Admin@123
--
-- Usage:
--   mysql -u root -p workforce_intelligence < database/seed_admin.sql
-- ============================================================

USE workforce_intelligence;

-- ── Insert Admin user ─────────────────────────────────────
-- Password hash for: Admin@123
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

SELECT CONCAT('✅ Admin user created. Login: admin@wip.com / Admin@123') AS result;
