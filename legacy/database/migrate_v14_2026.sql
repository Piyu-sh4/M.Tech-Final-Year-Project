-- ═══════════════════════════════════════════════════════════════
-- migrate_v14_2026.sql — FY 2026-27 Compliance & New Modules
-- Run AFTER all previous migrations (v13_uploads)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Investment Declarations (Form 12BB) ────────────────────
CREATE TABLE IF NOT EXISTS investment_declarations (
  decl_id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  financial_year  VARCHAR(10) NOT NULL DEFAULT '2026-27',
  tax_regime      ENUM('new','old') DEFAULT 'new',
  sec_80c_amount  DECIMAL(12,2) DEFAULT 0,
  sec_80d_amount  DECIMAL(12,2) DEFAULT 0,
  hra_amount      DECIMAL(12,2) DEFAULT 0,
  home_loan_int   DECIMAL(12,2) DEFAULT 0,
  nps_80ccd1b     DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) GENERATED ALWAYS AS
    (sec_80c_amount+sec_80d_amount+hra_amount+home_loan_int+nps_80ccd1b+other_deductions) STORED,
  status          ENUM('draft','submitted','approved','rejected') DEFAULT 'draft',
  submitted_at    DATETIME,
  approved_by     INT,
  approved_at     DATETIME,
  remarks         TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_fy (user_id, financial_year),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_fy (financial_year),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 2. 80C Investment Items ───────────────────────────────────
CREATE TABLE IF NOT EXISTS declaration_items (
  item_id         INT AUTO_INCREMENT PRIMARY KEY,
  decl_id         INT NOT NULL,
  investment_type VARCHAR(100) NOT NULL,
  amount          DECIMAL(12,2) NOT NULL,
  proof_type      VARCHAR(50),
  proof_uploaded  TINYINT(1) DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (decl_id) REFERENCES investment_declarations(decl_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 3. Pulse Surveys ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pulse_surveys (
  survey_id       INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(200) NOT NULL,
  week_number     INT,
  year            INT DEFAULT 2026,
  frequency       ENUM('weekly','biweekly','monthly','one-time') DEFAULT 'weekly',
  applicable_to   VARCHAR(100) DEFAULT 'all',
  created_by      INT,
  start_date      DATE,
  close_date      DATE,
  is_active       TINYINT(1) DEFAULT 1,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id),
  INDEX idx_week (week_number, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pulse_responses (
  resp_id         INT AUTO_INCREMENT PRIMARY KEY,
  survey_id       INT NOT NULL,
  user_id         INT NOT NULL,
  happiness_score TINYINT CHECK (happiness_score BETWEEN 1 AND 5),
  workload_score  TINYINT CHECK (workload_score BETWEEN 1 AND 5),
  recognition_score TINYINT CHECK (recognition_score BETWEEN 1 AND 5),
  nps_score       TINYINT CHECK (nps_score BETWEEN 0 AND 10),
  comments        TEXT,
  is_anonymous    TINYINT(1) DEFAULT 1,
  submitted_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_survey (survey_id, user_id),
  FOREIGN KEY (survey_id) REFERENCES pulse_surveys(survey_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 4. POSH Complaints ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS posh_complaints (
  complaint_id    INT AUTO_INCREMENT PRIMARY KEY,
  reference_no    VARCHAR(20) UNIQUE,
  complainant_id  INT NOT NULL,
  incident_date   DATE NOT NULL,
  nature          VARCHAR(100) NOT NULL,
  location        VARCHAR(200),
  description     TEXT NOT NULL,
  witnesses       TEXT,
  evidence_files  JSON,
  status          ENUM('filed','under_investigation','resolved','dismissed') DEFAULT 'filed',
  icc_remarks     TEXT,
  filed_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at     DATETIME,
  is_confidential TINYINT(1) DEFAULT 1,
  FOREIGN KEY (complainant_id) REFERENCES users(user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 5. POSH Training Records ─────────────────────────────────
CREATE TABLE IF NOT EXISTS posh_training (
  training_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  training_type   VARCHAR(100),
  training_date   DATE,
  mode            ENUM('e-learning','in-person','webinar') DEFAULT 'e-learning',
  duration_hours  DECIMAL(4,1),
  completed       TINYINT(1) DEFAULT 0,
  certificate_url VARCHAR(500),
  valid_until     DATE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 6. Session Management ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id      VARCHAR(64) PRIMARY KEY,
  user_id         INT NOT NULL,
  device_info     VARCHAR(300),
  browser         VARCHAR(100),
  os              VARCHAR(100),
  ip_address      VARCHAR(45),
  city            VARCHAR(100),
  country         VARCHAR(100),
  is_current      TINYINT(1) DEFAULT 0,
  is_suspicious   TINYINT(1) DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at      DATETIME,
  revoked_at      DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_active (last_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 7. Login History ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_history (
  log_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  event_type      ENUM('login','logout','failed','suspicious','revoke') DEFAULT 'login',
  ip_address      VARCHAR(45),
  city            VARCHAR(100),
  device_info     VARCHAR(300),
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_event (event_type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 8. Salary Revisions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_revisions (
  revision_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  effective_date  DATE NOT NULL,
  old_ctc         DECIMAL(12,2),
  new_ctc         DECIMAL(12,2),
  hike_percent    DECIMAL(5,2),
  hike_reason     ENUM('annual','promotion','market_correction','performance','other') DEFAULT 'annual',
  approved_by     INT,
  status          ENUM('pending','approved','rejected') DEFAULT 'pending',
  arrear_months   INT DEFAULT 0,
  arrear_amount   DECIMAL(12,2) DEFAULT 0,
  letter_url      VARCHAR(500),
  remarks         TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at     DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (approved_by) REFERENCES users(user_id),
  INDEX idx_user (user_id),
  INDEX idx_effective (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 9. Minimum Wages State Data ──────────────────────────────
CREATE TABLE IF NOT EXISTS minimum_wages (
  wage_id         INT AUTO_INCREMENT PRIMARY KEY,
  state           VARCHAR(50) NOT NULL,
  skill_category  ENUM('unskilled','semi_skilled','skilled','highly_skilled') NOT NULL,
  daily_wage      DECIMAL(8,2) NOT NULL,
  monthly_wage    DECIMAL(10,2) NOT NULL,
  vda             DECIMAL(8,2) DEFAULT 0,
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  revision_cycle  ENUM('january','july','october','april') DEFAULT 'january',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_state_skill_date (state, skill_category, effective_from),
  INDEX idx_state (state),
  INDEX idx_effective (effective_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed minimum wages (Jan 2026 revision)
INSERT IGNORE INTO minimum_wages (state, skill_category, daily_wage, monthly_wage, vda, effective_from, revision_cycle) VALUES
  ('Karnataka','unskilled',480.00,12499.00,1200.00,'2026-01-01','january'),
  ('Karnataka','skilled',562.00,14612.00,1200.00,'2026-01-01','january'),
  ('Karnataka','highly_skilled',619.00,16094.00,1200.00,'2026-01-01','january'),
  ('Maharashtra','unskilled',498.00,12948.00,1460.00,'2026-01-01','january'),
  ('Maharashtra','skilled',583.00,15158.00,1460.00,'2026-01-01','january'),
  ('Maharashtra','highly_skilled',641.00,16666.00,1460.00,'2026-01-01','january'),
  ('Delhi','unskilled',578.00,15028.00,2100.00,'2025-10-01','october'),
  ('Delhi','skilled',693.00,18018.00,2100.00,'2025-10-01','october'),
  ('Telangana','unskilled',466.00,12116.00,980.00,'2026-01-01','january'),
  ('Telangana','skilled',567.00,14742.00,980.00,'2026-01-01','january');

-- ── 10. Payslip Access Log (DPDP compliance) ─────────────────
CREATE TABLE IF NOT EXISTS payslip_access_log (
  log_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  payslip_month   VARCHAR(7),  -- 'YYYY-MM'
  action          ENUM('view','download','email','share') DEFAULT 'view',
  ip_address      VARCHAR(45),
  accessed_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 11. DPDP Consent Management ──────────────────────────────
CREATE TABLE IF NOT EXISTS data_consents (
  consent_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  consent_type    VARCHAR(100) NOT NULL,  -- 'payroll_processing', 'ai_insights', 'location_tracking'
  purpose         TEXT,
  consented       TINYINT(1) DEFAULT 0,
  consented_at    DATETIME,
  withdrawn_at    DATETIME,
  ip_address      VARCHAR(45),
  UNIQUE KEY uq_user_consent (user_id, consent_type),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Summary ──────────────────────────────────────────────────
-- Tables added: investment_declarations, declaration_items,
--   pulse_surveys, pulse_responses, posh_complaints, posh_training,
--   user_sessions, login_history, salary_revisions,
--   minimum_wages (+ seed data), payslip_access_log, data_consents
-- Total new tables: 12

-- ── HR Letters table (if not already present) ─────────────────
CREATE TABLE IF NOT EXISTS hr_letters (
  letter_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  letter_type     ENUM('offer_letter','confirmation_letter','experience_letter',
                       'relieving_letter','salary_certificate','noc_letter',
                       'warning_letter','promotion_letter') NOT NULL,
  ref_no          VARCHAR(40),
  content         LONGTEXT,
  extra_data      JSON,
  issued_date     DATE DEFAULT (CURDATE()),
  generated_by    INT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(user_id),
  INDEX idx_user (user_id),
  INDEX idx_type (letter_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── exit_documents (if missing from earlier migrations) ────────
CREATE TABLE IF NOT EXISTS exit_documents (
  doc_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  doc_type        VARCHAR(50),
  content_json    JSON,
  generated_by    INT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
