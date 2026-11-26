-- ============================================================
--  Workforce Intelligence Platform — v8.0 Migration
--  New Modules: Settings Center, Income Tax Portal,
--               Employee Loan Portal, Women Safety
-- ============================================================

-- ── 1. COMPANY SETTINGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_settings (
  setting_id       INT AUTO_INCREMENT PRIMARY KEY,
  setting_key      VARCHAR(100) NOT NULL UNIQUE,
  setting_value    TEXT,
  setting_group    VARCHAR(50) DEFAULT 'general',
  label            VARCHAR(150),
  description      TEXT,
  updated_by       INT,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS company_policies (
  policy_id        INT AUTO_INCREMENT PRIMARY KEY,
  policy_name      VARCHAR(150) NOT NULL,
  policy_type      ENUM('hr','leave','attendance','salary','cab','safety','general') DEFAULT 'general',
  content          LONGTEXT,
  version          VARCHAR(20) DEFAULT '1.0',
  is_active        TINYINT(1) DEFAULT 1,
  effective_from   DATE,
  created_by       INT,
  updated_by       INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS office_locations (
  location_id      INT AUTO_INCREMENT PRIMARY KEY,
  location_name    VARCHAR(150) NOT NULL,
  city             VARCHAR(100),
  state            VARCHAR(100),
  address          TEXT,
  pincode          VARCHAR(10),
  capacity         INT DEFAULT 0,
  hr_contact_id    INT,
  emergency_phone  VARCHAR(20),
  lat              DECIMAL(9,6),
  lng              DECIMAL(9,6),
  is_active        TINYINT(1) DEFAULT 1,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hr_contact_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ── 2. INCOME TAX ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tax_declarations (
  declaration_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  financial_year   VARCHAR(10) NOT NULL,
  regime           ENUM('old','new') DEFAULT 'new',
  -- HRA
  hra_claimed      DECIMAL(12,2) DEFAULT 0,
  rent_paid        DECIMAL(12,2) DEFAULT 0,
  is_metro         TINYINT(1) DEFAULT 0,
  -- Deductions (80C etc.)
  ded_80c          DECIMAL(12,2) DEFAULT 0,
  ded_80d          DECIMAL(12,2) DEFAULT 0,
  ded_80e          DECIMAL(12,2) DEFAULT 0,
  ded_80g          DECIMAL(12,2) DEFAULT 0,
  ded_nps          DECIMAL(12,2) DEFAULT 0,
  ded_hra          DECIMAL(12,2) DEFAULT 0,
  ded_other        DECIMAL(12,2) DEFAULT 0,
  -- Computed
  gross_income     DECIMAL(12,2) DEFAULT 0,
  taxable_income   DECIMAL(12,2) DEFAULT 0,
  tax_liability    DECIMAL(12,2) DEFAULT 0,
  tds_deducted     DECIMAL(12,2) DEFAULT 0,
  status           ENUM('draft','submitted','approved','rejected') DEFAULT 'draft',
  submitted_at     TIMESTAMP NULL,
  approved_by      INT,
  approved_at      TIMESTAMP NULL,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_year (user_id, financial_year),
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS form16_records (
  form16_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  financial_year   VARCHAR(10) NOT NULL,
  employer_name    VARCHAR(200),
  employer_tan     VARCHAR(20),
  gross_salary     DECIMAL(12,2),
  total_tds        DECIMAL(12,2),
  net_salary       DECIMAL(12,2),
  pdf_path         VARCHAR(500),
  generated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ── 3. LOAN PORTAL ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_applications (
  loan_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  loan_type        ENUM('home','vehicle','education','marriage','medical','emergency','personal') NOT NULL,
  amount_requested DECIMAL(12,2) NOT NULL,
  tenure_months    INT NOT NULL,
  interest_rate    DECIMAL(5,2) DEFAULT 8.50,
  purpose          TEXT,
  emi_amount       DECIMAL(12,2),
  total_payable    DECIMAL(12,2),
  -- Status flow: draft → pending → manager_approved → hr_approved → admin_approved → disbursed → closed → rejected
  status           ENUM('draft','pending','manager_approved','hr_approved','admin_approved','disbursed','closed','rejected') DEFAULT 'draft',
  manager_id       INT,
  manager_action   ENUM('pending','approved','rejected') DEFAULT 'pending',
  manager_note     TEXT,
  manager_at       TIMESTAMP NULL,
  hr_action        ENUM('pending','approved','rejected') DEFAULT 'pending',
  hr_note          TEXT,
  hr_at            TIMESTAMP NULL,
  admin_action     ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_note       TEXT,
  admin_at         TIMESTAMP NULL,
  disbursed_at     TIMESTAMP NULL,
  disbursed_by     INT,
  amount_disbursed DECIMAL(12,2),
  repayment_start  DATE,
  documents        JSON,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id)   REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (disbursed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS loan_repayments (
  repayment_id     INT AUTO_INCREMENT PRIMARY KEY,
  loan_id          INT NOT NULL,
  user_id          INT NOT NULL,
  installment_no   INT NOT NULL,
  due_date         DATE NOT NULL,
  amount_due       DECIMAL(12,2) NOT NULL,
  principal_part   DECIMAL(12,2) DEFAULT 0,
  interest_part    DECIMAL(12,2) DEFAULT 0,
  amount_paid      DECIMAL(12,2) DEFAULT 0,
  paid_date        DATE,
  status           ENUM('pending','paid','overdue') DEFAULT 'pending',
  deducted_from_salary TINYINT(1) DEFAULT 1,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id)  REFERENCES loan_applications(loan_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(user_id) ON DELETE CASCADE
);

-- ── 4. WOMEN SAFETY ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS safety_sos_events (
  sos_id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  trigger_type     ENUM('panic_button','fall_detected','auto_timer','manual') DEFAULT 'panic_button',
  lat              DECIMAL(9,6),
  lng              DECIMAL(9,6),
  address          TEXT,
  status           ENUM('active','responding','resolved','false_alarm') DEFAULT 'active',
  resolved_by      INT,
  resolved_at      TIMESTAMP NULL,
  resolution_notes TEXT,
  notified_contacts JSON,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS safety_complaints (
  complaint_id     INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id      INT,
  is_anonymous     TINYINT(1) DEFAULT 0,
  complaint_type   ENUM('harassment','discrimination','unsafe_environment','stalking','other') NOT NULL,
  against_user_id  INT,
  department_id    INT,
  incident_date    DATE,
  incident_location VARCHAR(200),
  description      LONGTEXT NOT NULL,
  evidence_paths   JSON,
  status           ENUM('filed','under_review','icc_referred','resolved','closed') DEFAULT 'filed',
  assigned_to      INT,
  icc_case_no      VARCHAR(50),
  resolution       TEXT,
  resolved_at      TIMESTAMP NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id)     REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (against_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to)     REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS safety_night_shift_approvals (
  approval_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  shift_date       DATE NOT NULL,
  shift_start      TIME,
  shift_end        TIME,
  transport_mode   ENUM('company_cab','own_vehicle','public','escort') DEFAULT 'company_cab',
  guardian_notified TINYINT(1) DEFAULT 0,
  guardian_phone   VARCHAR(20),
  status           ENUM('pending','approved','rejected') DEFAULT 'pending',
  approved_by      INT,
  approved_at      TIMESTAMP NULL,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS safety_emergency_contacts (
  contact_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  name             VARCHAR(150) NOT NULL,
  relation         VARCHAR(80),
  phone            VARCHAR(20) NOT NULL,
  email            VARCHAR(150),
  is_primary       TINYINT(1) DEFAULT 0,
  notify_on_sos    TINYINT(1) DEFAULT 1,
  notify_on_late   TINYINT(1) DEFAULT 1,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ── SEED: default company settings ──────────────────────────
INSERT IGNORE INTO company_settings (setting_key, setting_value, setting_group, label) VALUES
('company_name',         'Workforce Intelligence Pvt. Ltd.', 'profile',  'Company Name'),
('company_email',        'hr@workforce.in',                  'profile',  'Company Email'),
('company_phone',        '+91-9800000001',                   'profile',  'Company Phone'),
('company_website',      'https://workforce.in',             'profile',  'Website'),
('company_gst',          '29AABCU9603R1ZX',                  'profile',  'GST Number'),
('company_pan',          'AABCU9603R',                       'profile',  'PAN'),
('hq_address',           'Bengaluru, Karnataka, India',      'profile',  'Head Office'),
('work_hours_per_day',   '8',                                'attendance','Work Hours/Day'),
('work_days_per_week',   '5',                                'attendance','Work Days/Week'),
('overtime_rate',        '1.5',                              'payroll',  'OT Multiplier'),
('pf_employee_rate',     '12',                               'payroll',  'PF Employee %'),
('pf_employer_rate',     '12',                               'payroll',  'PF Employer %'),
('esi_employee_rate',    '0.75',                             'payroll',  'ESI Employee %'),
('esi_employer_rate',    '3.25',                             'payroll',  'ESI Employer %'),
('salary_day',           '1',                                'payroll',  'Salary Credit Day'),
('tax_regime_default',   'new',                              'tax',      'Default Tax Regime'),
('loan_max_multiplier',  '6',                                'loans',    'Max Loan (x Salary)'),
('loan_interest_home',   '7.5',                              'loans',    'Home Loan Rate %'),
('loan_interest_vehicle','9.0',                              'loans',    'Vehicle Loan Rate %'),
('loan_interest_edu',    '8.0',                              'loans',    'Education Loan Rate %'),
('loan_interest_emergency','10.0',                           'loans',    'Emergency Loan Rate %'),
('sos_auto_call',        '1',                                'safety',   'Auto-Call on SOS'),
('night_shift_approval', '1',                                'safety',   'Night Shift Approval Required'),
('female_cab_preference','1',                                'safety',   'Female Driver Preference');

-- ── SEED: office locations ───────────────────────────────────
INSERT IGNORE INTO office_locations (location_name, city, state, address, pincode, capacity, lat, lng) VALUES
('Bengaluru HQ',    'Bengaluru',   'Karnataka',       'Whitefield Tech Park, ITPL Road',    '560066', 500, 12.9716,  77.5946),
('Hyderabad',       'Hyderabad',   'Telangana',       'HITEC City, Gachibowli',             '500032', 300, 17.3850,  78.4867),
('Pune',            'Pune',        'Maharashtra',     'Hinjewadi Phase 2, Rajiv Gandhi IT', '411057', 250, 18.5204,  73.8567),
('Chennai',         'Chennai',     'Tamil Nadu',      'Sholinganallur, OMR Road',           '600119', 200, 13.0827,  80.2707),
('Noida',           'Noida',       'Uttar Pradesh',   'Sector 62, Electronic City',         '201309', 180, 28.6139,  77.3510),
('Gurugram',        'Gurugram',    'Haryana',         'Cyber City, DLF Phase 2',            '122002', 220, 28.4595,  77.0266),
('Mumbai',          'Mumbai',      'Maharashtra',     'BKC, Bandra Kurla Complex',          '400051', 150, 19.0760,  72.8777),
('Kolkata',         'Kolkata',     'West Bengal',     'Salt Lake Sector V',                  '700091', 120, 22.5726,  88.3639),
('Ahmedabad',       'Ahmedabad',   'Gujarat',         'GIFT City, Gandhinagar',             '382421',  80, 23.0225,  72.5714),
('Kochi',           'Kochi',       'Kerala',          'Infopark, Kakkanad',                 '682030',  90, 10.0021,  76.3053);

-- ── SEED: sample policies ────────────────────────────────────
INSERT IGNORE INTO company_policies (policy_name, policy_type, content, version, effective_from) VALUES
('Leave Policy 2024', 'leave',
 'Employees are entitled to 12 sick leaves, 12 casual leaves, and 15 earned leaves per year. Unused earned leaves can be carried forward up to 30 days.',
 '2.0', '2024-01-01'),
('Work From Home Policy', 'hr',
 'Employees may work from home up to 2 days per week subject to manager approval. WFH is not applicable during notice period.',
 '1.5', '2024-01-01'),
('POSH & Women Safety Policy', 'safety',
 'The company has a zero-tolerance policy against sexual harassment. All complaints must be filed within 3 months. ICC will investigate and respond within 90 days.',
 '1.0', '2023-01-01'),
('Loan & Advance Policy', 'salary',
 'Employees completing 1 year of service are eligible for salary advance up to 2 months salary. Loans up to 6x monthly salary are available based on eligibility.',
 '1.2', '2024-01-01');
