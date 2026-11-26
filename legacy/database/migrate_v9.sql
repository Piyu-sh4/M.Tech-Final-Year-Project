-- ══════════════════════════════════════════════════════════════
--  Workforce Intelligence Platform – v9.0 Migration
--  Adds: Employee Grades · Family Transfer · Benefits · Banking
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- MODULE 5 · EMPLOYEE GRADES & CAREER PROGRESSION
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employee_grades (
  grade_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  grade_level     ENUM('L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','L11','L12') NOT NULL,
  designation     VARCHAR(120),
  department      VARCHAR(80),
  effective_date  DATE NOT NULL,
  salary_band_min DECIMAL(14,2),
  salary_band_max DECIMAL(14,2),
  assigned_by     INT,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS promotions (
  promotion_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  from_grade      VARCHAR(10),
  to_grade        VARCHAR(10),
  from_designation VARCHAR(120),
  to_designation  VARCHAR(120),
  reason          TEXT,
  effective_date  DATE NOT NULL,
  salary_revision DECIMAL(12,2) DEFAULT 0,
  approved_by     INT,
  status          ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS skills (
  skill_id    INT AUTO_INCREMENT PRIMARY KEY,
  skill_name  VARCHAR(100) NOT NULL UNIQUE,
  category    VARCHAR(60),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skill_assessments (
  assessment_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  skill_id        INT NOT NULL,
  proficiency     ENUM('beginner','intermediate','advanced','expert') DEFAULT 'beginner',
  verified        TINYINT(1) DEFAULT 0,
  verified_by     INT,
  last_updated    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_skill (user_id, skill_id),
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id)    REFERENCES skills(skill_id),
  FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS certifications (
  cert_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  cert_name     VARCHAR(150) NOT NULL,
  issuing_body  VARCHAR(120),
  cert_number   VARCHAR(80),
  issue_date    DATE,
  expiry_date   DATE,
  cert_url      VARCHAR(255),
  is_verified   TINYINT(1) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Seed skills
INSERT IGNORE INTO skills (skill_name, category) VALUES
('JavaScript','Frontend'),('TypeScript','Frontend'),('React','Frontend'),
('Vue.js','Frontend'),('Angular','Frontend'),('HTML/CSS','Frontend'),
('Node.js','Backend'),('Python','Backend'),('Java','Backend'),
('Go','Backend'),('PHP','Backend'),('Ruby','Backend'),
('MySQL','Database'),('PostgreSQL','Database'),('MongoDB','Database'),
('Redis','Database'),('Elasticsearch','Database'),
('Docker','DevOps'),('Kubernetes','DevOps'),('AWS','DevOps'),
('Azure','DevOps'),('GCP','DevOps'),('Terraform','DevOps'),('CI/CD','DevOps'),
('Machine Learning','AI/Data'),('Deep Learning','AI/Data'),('NLP','AI/Data'),
('Data Analysis','AI/Data'),('Power BI','AI/Data'),('Tableau','AI/Data'),
('React Native','Mobile'),('Flutter','Mobile'),('iOS','Mobile'),('Android','Mobile'),
('Scrum','Management'),('Agile','Management'),('JIRA','Management'),
('Communication','Soft Skills'),('Leadership','Soft Skills'),('Problem Solving','Soft Skills');


-- ─────────────────────────────────────────────────────────────
-- MODULE 6 · FAMILY & MARRIAGE TRANSFER
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS family_information (
  family_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL UNIQUE,
  marital_status  ENUM('single','married','divorced','widowed') DEFAULT 'single',
  spouse_name     VARCHAR(100),
  spouse_employer VARCHAR(120),
  spouse_location VARCHAR(80),
  marriage_date   DATE,
  children_count  INT DEFAULT 0,
  emergency_contact_1 VARCHAR(20),
  emergency_contact_2 VARCHAR(20),
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transfer_requests (
  transfer_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  transfer_type   ENUM('office','remote','hybrid','family','marriage','medical','personal') NOT NULL,
  from_location   VARCHAR(100),
  to_location     VARCHAR(100),
  reason          TEXT NOT NULL,
  preferred_date  DATE,
  is_urgent       TINYINT(1) DEFAULT 0,
  supporting_doc  VARCHAR(255),
  -- approval chain
  manager_action  ENUM('pending','approved','rejected') DEFAULT 'pending',
  manager_id      INT,
  manager_at      TIMESTAMP NULL,
  manager_remarks TEXT,
  hr_action       ENUM('pending','approved','rejected') DEFAULT 'pending',
  hr_id           INT,
  hr_at           TIMESTAMP NULL,
  hr_remarks      TEXT,
  admin_action    ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_id        INT,
  admin_at        TIMESTAMP NULL,
  admin_remarks   TEXT,
  status          ENUM('pending','under_review','approved','rejected','completed') DEFAULT 'pending',
  effective_date  DATE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (hr_id)      REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id)   REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS relocation_history (
  history_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  transfer_id   INT,
  from_location VARCHAR(100),
  to_location   VARCHAR(100),
  moved_date    DATE,
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (transfer_id) REFERENCES transfer_requests(transfer_id) ON DELETE SET NULL
);


-- ─────────────────────────────────────────────────────────────
-- MODULE 7 · EMPLOYEE BENEFITS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insurance_plans (
  plan_id       INT AUTO_INCREMENT PRIMARY KEY,
  plan_name     VARCHAR(120) NOT NULL,
  plan_type     ENUM('health','life','dental','vision','family','maternity','accidental') NOT NULL,
  provider      VARCHAR(120),
  coverage_amount DECIMAL(14,2),
  premium_monthly DECIMAL(10,2),
  employee_share  DECIMAL(10,2) DEFAULT 0,
  company_share   DECIMAL(10,2) DEFAULT 0,
  description   TEXT,
  is_active     TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_benefits (
  benefit_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  plan_id       INT NOT NULL,
  enrollment_date DATE,
  expiry_date   DATE,
  status        ENUM('active','expired','cancelled','pending') DEFAULT 'active',
  nominee_name  VARCHAR(100),
  nominee_relation VARCHAR(60),
  policy_number VARCHAR(60),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES insurance_plans(plan_id)
);

CREATE TABLE IF NOT EXISTS dependent_members (
  dependent_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  name          VARCHAR(100) NOT NULL,
  relation      ENUM('spouse','child','parent','sibling','other') NOT NULL,
  dob           DATE,
  is_covered    TINYINT(1) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Seed default insurance plans
INSERT IGNORE INTO insurance_plans (plan_name, plan_type, provider, coverage_amount, premium_monthly, employee_share, company_share, description) VALUES
('Group Health Gold',     'health',     'Star Health',   500000,  2500, 500,  2000, 'Covers self + family. Cashless at 5000+ hospitals. No pre-existing exclusion after 2 yrs.'),
('Group Health Silver',   'health',     'Star Health',   300000,  1800, 300,  1500, 'Self coverage. Cashless at network hospitals.'),
('Term Life Insurance',   'life',       'LIC India',     5000000, 800,  0,    800,  'Pure term life. 5 Crore cover for employees.'),
('Dental Plus',           'dental',     'Bajaj Allianz', 50000,   400,  200,  200,  'Dental cleanings, fillings, root canals covered.'),
('Maternity Care',        'maternity',  'HDFC Ergo',     100000,  600,  0,    600,  'Covers delivery, pre/post natal, new-born care.'),
('Accidental Coverage',   'accidental', 'New India',     1000000, 300,  0,    300,  '10L accidental death and disability cover.'),
('Family Floater Premium','family',     'Star Health',   1000000, 4500, 1000, 3500, 'Covers self + spouse + 2 children. 1 Crore floater.');


-- ─────────────────────────────────────────────────────────────
-- MODULE 8 · EMPLOYEE BANKING
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employee_banking (
  banking_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL UNIQUE,
  -- Salary Account
  bank_name       VARCHAR(100),
  account_number  VARCHAR(255),        -- AES-encrypted at app layer
  account_type    ENUM('savings','current','salary') DEFAULT 'salary',
  ifsc_code       VARCHAR(20),
  branch_name     VARCHAR(120),
  account_holder  VARCHAR(100),
  -- UPI
  upi_id          VARCHAR(100),
  -- PF
  pf_account_number VARCHAR(50),
  pf_uan            VARCHAR(20),
  -- ESI
  esi_number        VARCHAR(30),
  -- Verification
  is_verified       TINYINT(1) DEFAULT 0,
  verified_by       INT,
  verified_at       TIMESTAMP NULL,
  -- Audit
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- Performance indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_grades_user      ON employee_grades(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_user  ON promotions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_skills_user      ON skill_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_user    ON transfer_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_benefits_user    ON employee_benefits(user_id, status);
