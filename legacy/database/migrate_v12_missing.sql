-- ═══════════════════════════════════════════════════════════════
--  v12.0 Missing Tables Migration
--  Compliance, Travel, Exit, Dependents, Recruitment, Cab Safety
-- ═══════════════════════════════════════════════════════════════

-- Travel Requests
CREATE TABLE IF NOT EXISTS travel_requests (
  request_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  travel_type       ENUM('domestic','international') DEFAULT 'domestic',
  from_location     VARCHAR(150) NOT NULL,
  to_location       VARCHAR(150) NOT NULL,
  travel_date       DATE NOT NULL,
  return_date       DATE,
  purpose           TEXT NOT NULL,
  estimated_cost    DECIMAL(10,2) DEFAULT 0,
  approved_amount   DECIMAL(10,2),
  mode_of_travel    ENUM('flight','train','bus','car','other') DEFAULT 'flight',
  accommodation_required TINYINT(1) DEFAULT 0,
  notes             TEXT,
  status            ENUM('pending','approved','rejected','completed') DEFAULT 'pending',
  approved_by       INT,
  review_note       TEXT,
  reviewed_at       TIMESTAMP NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Expense Claims
CREATE TABLE IF NOT EXISTS expense_claims (
  claim_id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NOT NULL,
  travel_request_id  INT,
  expense_date       DATE NOT NULL,
  category           ENUM('transport','accommodation','meals','fuel','communication','office_supplies','other') NOT NULL,
  description        VARCHAR(255),
  amount             DECIMAL(10,2) NOT NULL,
  approved_amount    DECIMAL(10,2),
  currency           VARCHAR(10) DEFAULT 'INR',
  receipt_url        VARCHAR(255),
  notes              TEXT,
  reject_reason      TEXT,
  status             ENUM('pending','approved','rejected','in_batch','reimbursed') DEFAULT 'pending',
  reviewed_by        INT,
  reviewed_at        TIMESTAMP NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)           REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (travel_request_id) REFERENCES travel_requests(request_id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by)       REFERENCES users(user_id) ON DELETE SET NULL
);

-- Reimbursement Batches
CREATE TABLE IF NOT EXISTS reimbursement_batches (
  batch_id           INT AUTO_INCREMENT PRIMARY KEY,
  batch_name         VARCHAR(100) NOT NULL,
  payment_date       DATE,
  payment_reference  VARCHAR(100),
  status             ENUM('created','processed') DEFAULT 'created',
  created_by         INT,
  processed_at       TIMESTAMP NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reimbursement_batch_items (
  item_id   INT AUTO_INCREMENT PRIMARY KEY,
  batch_id  INT NOT NULL,
  claim_id  INT NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES reimbursement_batches(batch_id) ON DELETE CASCADE,
  FOREIGN KEY (claim_id) REFERENCES expense_claims(claim_id) ON DELETE CASCADE
);

-- Resignations
CREATE TABLE IF NOT EXISTS resignations (
  resignation_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  reason            ENUM('better_opportunity','higher_salary','relocation','personal','health','work_environment','career_change','other') NOT NULL,
  last_working_day  DATE NOT NULL,
  revised_lwd       DATE,
  notice_period_days INT DEFAULT 60,
  comments          TEXT,
  manager_note      TEXT,
  hr_note           TEXT,
  acknowledged_at   TIMESTAMP NULL,
  hr_actioned_at    TIMESTAMP NULL,
  status            ENUM('submitted','manager_acknowledged','hr_approved','rejected','withdrawn') DEFAULT 'submitted',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Exit Checklist
CREATE TABLE IF NOT EXISTS exit_checklist (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  item         VARCHAR(200) NOT NULL,
  completed    TINYINT(1) DEFAULT 0,
  completed_at TIMESTAMP NULL,
  sort_order   INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- FnF Settlements
CREATE TABLE IF NOT EXISTS fnf_settlements (
  fnf_id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL UNIQUE,
  details_json      JSON,
  approved_amount   DECIMAL(12,2),
  hr_note           TEXT,
  payment_mode      VARCHAR(50),
  payment_reference VARCHAR(100),
  status            ENUM('calculated','approved','disbursed') DEFAULT 'calculated',
  approved_at       TIMESTAMP NULL,
  disbursed_at      TIMESTAMP NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Exit Interviews
CREATE TABLE IF NOT EXISTS exit_interviews (
  interview_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id               INT NOT NULL UNIQUE,
  primary_reason        ENUM('better_opportunity','salary','relocation','personal','work_env','career','health','other') NOT NULL,
  secondary_reason      VARCHAR(100),
  satisfaction_rating   TINYINT CHECK (satisfaction_rating BETWEEN 1 AND 5),
  recommend_company     TINYINT(1),
  improvement_suggestions TEXT,
  liked_most            TEXT,
  liked_least           TEXT,
  would_return          TINYINT(1),
  submitted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- BGV Requests
CREATE TABLE IF NOT EXISTS bgv_requests (
  bgv_id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  agency_name       VARCHAR(100),
  checks_requested  JSON,
  consent_given     TINYINT(1) DEFAULT 0,
  consent_at        TIMESTAMP NULL,
  status            ENUM('initiated','in_progress','completed','failed') DEFAULT 'initiated',
  result            ENUM('clear','discrepancy','pending') DEFAULT 'pending',
  remarks           TEXT,
  requested_by      INT,
  completed_at      TIMESTAMP NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Exit Documents
CREATE TABLE IF NOT EXISTS exit_documents (
  doc_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  doc_type      ENUM('experience_letter','relieving_letter','noc','salary_certificate') NOT NULL,
  content_json  JSON,
  generated_by  INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Dependents
CREATE TABLE IF NOT EXISTS dependents (
  dependent_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  relationship  ENUM('spouse','child','parent','sibling','other') NOT NULL,
  dob           DATE,
  gender        ENUM('male','female','other'),
  aadhaar       VARCHAR(20),
  is_insured    TINYINT(1) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insurance Plans
CREATE TABLE IF NOT EXISTS insurance_plans (
  plan_id           INT AUTO_INCREMENT PRIMARY KEY,
  plan_name         VARCHAR(100) NOT NULL,
  insurer           VARCHAR(100),
  policy_number     VARCHAR(50),
  coverage_amount   DECIMAL(12,2),
  premium_annual    DECIMAL(10,2),
  cashless_hospitals TEXT,
  features          TEXT,
  is_active         TINYINT(1) DEFAULT 1,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance Enrollments
CREATE TABLE IF NOT EXISTS insurance_enrollments (
  enrollment_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  dependent_id    INT,
  plan_id         INT NOT NULL,
  coverage_start  DATE,
  coverage_end    DATE,
  premium         DECIMAL(10,2),
  status          ENUM('active','cancelled','expired') DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (dependent_id) REFERENCES dependents(dependent_id) ON DELETE SET NULL,
  FOREIGN KEY (plan_id)      REFERENCES insurance_plans(plan_id) ON DELETE CASCADE
);

-- Health Cards
CREATE TABLE IF NOT EXISTS health_cards (
  card_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  card_number    VARCHAR(50) UNIQUE,
  enrollment_id  INT NOT NULL,
  issued_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (enrollment_id) REFERENCES insurance_enrollments(enrollment_id) ON DELETE CASCADE
);

-- Job Requisitions
CREATE TABLE IF NOT EXISTS job_requisitions (
  requisition_id   INT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(150) NOT NULL,
  department_id    INT,
  positions        INT DEFAULT 1,
  reason           TEXT,
  expected_start   DATE,
  job_level        VARCHAR(50),
  budget_ctc       DECIMAL(12,2),
  requested_by     INT,
  reviewed_by      INT,
  review_note      TEXT,
  reviewed_at      TIMESTAMP NULL,
  status           ENUM('pending','approved','rejected','fulfilled') DEFAULT 'pending',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id)  REFERENCES departments(department_id) ON DELETE SET NULL,
  FOREIGN KEY (requested_by)   REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by)    REFERENCES users(user_id) ON DELETE SET NULL
);

-- Joining Letters
CREATE TABLE IF NOT EXISTS joining_letters (
  letter_id       INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id    INT NOT NULL,
  ref_number      VARCHAR(50) UNIQUE,
  content_json    JSON,
  acknowledged    TINYINT(1) DEFAULT 0,
  acknowledged_at TIMESTAMP NULL,
  generated_by    INT,
  generated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id)  REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by)  REFERENCES users(user_id) ON DELETE SET NULL
);

-- Seed insurance plans
INSERT IGNORE INTO insurance_plans (plan_name, insurer, policy_number, coverage_amount, premium_annual, cashless_hospitals, features) VALUES
('Basic Health Cover', 'Star Health', 'SH-2025-001', 300000, 8000, 'Network of 12,000+ hospitals', 'Hospitalization, Day care, Pre/post'),
('Family Floater', 'HDFC Ergo', 'HE-2025-002', 500000, 14000, 'Network of 10,000+ hospitals', 'Self + Spouse + 2 Children'),
('Super Top-up', 'New India Assurance', 'NIA-2025-003', 2000000, 5500, 'All government hospitals', 'Super top-up over ₹3L deductible'),
('Group Mediclaim', 'Oriental Insurance', 'OI-2025-004', 400000, 10000, 'PAN India network', 'Group policy, pre-existing covered from day 1');

