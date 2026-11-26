-- ══════════════════════════════════════════════════════════════════
--  v12.2 Migration — Notifications, Projects, Additional Fixes
-- ══════════════════════════════════════════════════════════════════

-- ── Notifications (global) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  notification_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  type             VARCHAR(60) NOT NULL,         -- e.g. 'cab_booking','leave_approved'
  title            VARCHAR(200) NOT NULL,
  message          TEXT,
  data             JSON,
  is_read          TINYINT(1) DEFAULT 0,
  read_at          TIMESTAMP NULL,
  action_url       VARCHAR(255),
  icon             VARCHAR(10) DEFAULT '🔔',
  priority         ENUM('low','normal','high','urgent') DEFAULT 'normal',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user  (user_id, is_read),
  INDEX idx_notif_type  (type),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ── Projects ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  project_id       INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(200) NOT NULL,
  description      TEXT,
  department_id    INT,
  manager_id       INT,
  status           ENUM('planning','active','on_hold','completed','cancelled') DEFAULT 'planning',
  priority         ENUM('low','medium','high','critical') DEFAULT 'medium',
  start_date       DATE,
  due_date         DATE,
  completion_pct   TINYINT DEFAULT 0,
  budget           DECIMAL(14,2),
  spent            DECIMAL(14,2) DEFAULT 0,
  tags             VARCHAR(255),
  created_by       INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(dept_id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id)    REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)    REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS project_members (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  project_id  INT NOT NULL,
  user_id     INT NOT NULL,
  role        ENUM('lead','member','reviewer','stakeholder') DEFAULT 'member',
  joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pm (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_milestones (
  milestone_id  INT AUTO_INCREMENT PRIMARY KEY,
  project_id    INT NOT NULL,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  due_date      DATE,
  status        ENUM('pending','completed','missed') DEFAULT 'pending',
  completed_at  TIMESTAMP NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- Link tasks to projects (ADD COLUMN if tasks table already exists)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INT DEFAULT NULL AFTER task_id;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id_fk_added TINYINT DEFAULT 0;

-- ── loan_installments alias view (for FnF compatibility) ─────────
-- exitController uses loan_installments, actual table is loan_repayments
-- Create view so both names work
CREATE OR REPLACE VIEW loan_installments AS
  SELECT
    repayment_id AS installment_id,
    loan_id,
    user_id,
    amount,
    due_date,
    paid_date,
    status,
    created_at
  FROM loan_repayments;

-- ── chat_messages (if not already created by socket/chat) ────────
CREATE TABLE IF NOT EXISTS chat_rooms (
  room_id       INT AUTO_INCREMENT PRIMARY KEY,
  room_type     ENUM('direct','group','department','company') DEFAULT 'direct',
  name          VARCHAR(100),
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id    INT AUTO_INCREMENT PRIMARY KEY,
  room_id       INT,
  sender_id     INT NOT NULL,
  receiver_id   INT,                    -- for direct messages
  message       TEXT NOT NULL,
  message_type  ENUM('text','image','file','system') DEFAULT 'text',
  file_url      VARCHAR(255),
  is_read       TINYINT(1) DEFAULT 0,
  read_at       TIMESTAMP NULL,
  is_deleted    TINYINT(1) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chat_room   (room_id, created_at),
  INDEX idx_chat_direct (sender_id, receiver_id),
  FOREIGN KEY (sender_id)   REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_room_members (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  room_id   INT NOT NULL,
  user_id   INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_crm (room_id, user_id),
  FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ── Seed: Default notification categories ────────────────────────
-- (No seed data needed - notifications are generated dynamically)

-- ── Seed: Sample projects for demo ───────────────────────────────
INSERT IGNORE INTO projects (project_id, name, description, status, priority, start_date, due_date, completion_pct, created_by) VALUES
(1, 'WorkforceIQ Platform v13', 'Next major version development', 'active', 'high', '2026-01-01', '2026-12-31', 45, 1),
(2, 'Employee Wellness Initiative', 'Company-wide mental health and wellness program', 'active', 'medium', '2026-03-01', '2026-09-30', 30, 1),
(3, 'Office Expansion - Pune', 'New office setup at Pune location', 'planning', 'medium', '2026-07-01', '2026-12-31', 5, 1);

