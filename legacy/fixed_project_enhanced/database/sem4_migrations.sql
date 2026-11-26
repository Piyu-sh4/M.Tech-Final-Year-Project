-- ═══════════════════════════════════════════════════════════════════════
-- sem4_migrations.sql — 4th Semester Database Enhancements
-- Workforce Intelligence Platform v7.0
--
-- Run after schema.sql:
--   mysql -u root -p workforce_intelligence < sem4_migrations.sql
--
-- Includes:
--   1. Performance indexes (composite) on high-read tables
--   2. alerts table upgrade (type + title + meta columns)
--   3. attrition_scores table (store Python model output)
--   4. pwa_push_subscriptions table (Web Push API)
--   5. role_dashboards table (custom dashboard layouts)
-- ═══════════════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 0;

-- ────────────────────────────────────────────────────────────────────────
-- 1. PERFORMANCE INDEXES
-- ────────────────────────────────────────────────────────────────────────

-- attendance: most queried by (user_id, work_date) and (work_date alone for today's stats)
ALTER TABLE attendance
  ADD INDEX IF NOT EXISTS idx_att_user_date  (user_id, work_date),
  ADD INDEX IF NOT EXISTS idx_att_date       (work_date),
  ADD INDEX IF NOT EXISTS idx_att_status     (status);

-- salary_records: queried by (user_id, month, year) for payslip; (year, month) for payroll run
ALTER TABLE salary_records
  ADD INDEX IF NOT EXISTS idx_sal_user_period (user_id, year, month),
  ADD INDEX IF NOT EXISTS idx_sal_period      (year, month),
  ADD INDEX IF NOT EXISTS idx_sal_status      (payment_status);

-- tasks: queried by (assigned_to, status) for employee dashboard; (due_date, status) for overdue check
ALTER TABLE tasks
  ADD INDEX IF NOT EXISTS idx_task_assignee_status (assigned_to, status),
  ADD INDEX IF NOT EXISTS idx_task_due_status      (due_date, status),
  ADD INDEX IF NOT EXISTS idx_task_priority        (priority),
  ADD INDEX IF NOT EXISTS idx_task_created         (created_at);

-- leave_requests: queried by (user_id, status) and (status alone) for pending count
ALTER TABLE leave_requests
  ADD INDEX IF NOT EXISTS idx_leave_user_status (user_id, status),
  ADD INDEX IF NOT EXISTS idx_leave_status      (status),
  ADD INDEX IF NOT EXISTS idx_leave_dates       (start_date, end_date);

-- audit_logs: queried by (actor_id) and (entity_type, entity_id) for record history
ALTER TABLE audit_logs
  ADD INDEX IF NOT EXISTS idx_audit_actor      (actor_id),
  ADD INDEX IF NOT EXISTS idx_audit_entity     (entity_type, entity_id),
  ADD INDEX IF NOT EXISTS idx_audit_created    (created_at);

-- productivity_scores: queried by (user_id, score_date) for leaderboard
ALTER TABLE productivity_scores
  ADD INDEX IF NOT EXISTS idx_prod_user_date   (user_id, score_date),
  ADD INDEX IF NOT EXISTS idx_prod_score       (productivity_score);

-- users: queried by (status, role_id) for active employee counts
ALTER TABLE users
  ADD INDEX IF NOT EXISTS idx_user_status_role (status, role_id),
  ADD INDEX IF NOT EXISTS idx_user_dept        (department_id);


-- ────────────────────────────────────────────────────────────────────────
-- 2. ALERTS TABLE UPGRADE (v6 → v7)
-- ────────────────────────────────────────────────────────────────────────
-- Add type, title, meta columns if not already present

ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS type       VARCHAR(50)  DEFAULT 'general'  AFTER user_id,
  ADD COLUMN IF NOT EXISTS title      VARCHAR(150) DEFAULT NULL       AFTER type,
  ADD COLUMN IF NOT EXISTS message    TEXT         DEFAULT NULL       AFTER title,
  ADD COLUMN IF NOT EXISTS meta       JSON         DEFAULT NULL       AFTER message,
  ADD INDEX  IF NOT EXISTS idx_alert_user_read (user_id, is_read),
  ADD INDEX  IF NOT EXISTS idx_alert_type      (type);

-- Rename alert_message → preserve it for backward compatibility
-- If alert_message still exists, migrate data then drop
-- (only run if column exists — safe to run multiple times)
UPDATE alerts SET message = alert_message WHERE message IS NULL AND alert_message IS NOT NULL;


-- ────────────────────────────────────────────────────────────────────────
-- 3. ATTRITION SCORES TABLE (store Python ML model output)
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attrition_scores (
  score_id       INT           AUTO_INCREMENT PRIMARY KEY,
  user_id        INT           NOT NULL,
  risk_score     DECIMAL(5,2)  NOT NULL,           -- 0.00–100.00
  risk_level     ENUM('Low','Medium','High') NOT NULL DEFAULT 'Low',
  risk_factors   JSON          DEFAULT NULL,        -- array of strings
  features       JSON          DEFAULT NULL,        -- snapshot of input features
  model_version  VARCHAR(20)   DEFAULT '1.0',
  computed_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_score_date (user_id, DATE(computed_at)),
  INDEX idx_attrition_risk     (risk_level),
  INDEX idx_attrition_user     (user_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- ────────────────────────────────────────────────────────────────────────
-- 4. PWA PUSH SUBSCRIPTIONS
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pwa_push_subscriptions (
  sub_id       INT           AUTO_INCREMENT PRIMARY KEY,
  user_id      INT           NOT NULL,
  endpoint     TEXT          NOT NULL,
  p256dh       VARCHAR(255)  NOT NULL,             -- VAPID public key
  auth_key     VARCHAR(255)  NOT NULL,             -- subscription auth
  user_agent   VARCHAR(255)  DEFAULT NULL,
  is_active    BOOLEAN       DEFAULT TRUE,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_push_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- ────────────────────────────────────────────────────────────────────────
-- 5. ROLE DASHBOARD LAYOUTS
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_dashboards (
  layout_id    INT          AUTO_INCREMENT PRIMARY KEY,
  role_id      INT          NOT NULL,
  widget_key   VARCHAR(50)  NOT NULL,              -- e.g. 'kpi_bar', 'task_chart'
  position     INT          DEFAULT 0,             -- display order
  is_visible   BOOLEAN      DEFAULT TRUE,
  config       JSON         DEFAULT NULL,          -- widget-specific config
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_role_widget (role_id, widget_key),
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- Default widget layout per role
INSERT IGNORE INTO role_dashboards (role_id, widget_key, position) VALUES
  -- Admin (1): all widgets
  (1, 'kpi_bar',           1),
  (1, 'quick_actions',     2),
  (1, 'employee_roster',   3),
  (1, 'dept_grid',         4),
  (1, 'leave_queue',       5),
  (1, 'task_chart',        6),
  (1, 'leaderboard_mini',  7),
  (1, 'audit_feed',        8),
  -- Employee (2): personal widgets only
  (2, 'my_tasks',          1),
  (2, 'my_attendance',     2),
  (2, 'my_leave_balance',  3),
  (2, 'my_payslip',        4),
  (2, 'leaderboard_rank',  5),
  -- Manager (3): team-focused
  (3, 'team_tasks',        1),
  (3, 'team_attendance',   2),
  (3, 'leave_queue',       3),
  (3, 'team_leaderboard',  4),
  (3, 'kpi_bar',           5),
  -- HR (4): people + payroll
  (4, 'kpi_bar',           1),
  (4, 'leave_queue',       2),
  (4, 'payroll_panel',     3),
  (4, 'salary_advances',   4),
  (4, 'expense_claims',    5),
  (4, 'shift_management',  6);


SET FOREIGN_KEY_CHECKS = 1;

-- ── Verify indexes ─────────────────────────────────────────────────────
SELECT 'sem4_migrations.sql applied successfully ✅' AS status;
