-- ══════════════════════════════════════════════════════════════
--  Workforce Intelligence Platform – v8.0 Migration
--  Adds: Settings Center · Tax Portal · Loan Portal · Women Safety
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- MODULE 1 · COMPANY SETTINGS CENTER
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS company_settings (
  setting_id    INT AUTO_INCREMENT PRIMARY KEY,
  setting_group VARCHAR(60)  NOT NULL,
  setting_key   VARCHAR(100) NOT NULL,
  setting_value TEXT,
  value_type    ENUM('string','number','boolean','json') DEFAULT 'string',
  description   VARCHAR(255),
  updated_by    INT,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_group_key (setting_group, setting_key),
  FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS company_policies (
  policy_id     INT AUTO_INCREMENT PRIMARY KEY,
  policy_name   VARCHAR(120) NOT NULL,
  category      VARCHAR(60)  NOT NULL,
  content       LONGTEXT     NOT NULL,
  version       VARCHAR(20)  DEFAULT '1.0',
  is_active     TINYINT(1)   DEFAULT 1,
  effective_date DATE,
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS office_locations (
  location_id       INT AUTO_INCREMENT PRIMARY KEY,
  city              VARCHAR(80)  NOT NULL,
  state             VARCHAR(80),
  address           TEXT,
  pincode           VARCHAR(10),
  capacity          INT          DEFAULT 0,
  hr_contact        VARCHAR(120),
  emergency_contact VARCHAR(20),
  latitude          DECIMAL(10,7),
  longitude         DECIMAL(10,7),
  is_active         TINYINT(1)   DEFAULT 1,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT IGNORE INTO company_settings (setting_group, setting_key, setting_value, value_type, description) VALUES
('company','name',                    'TechCorp India Pvt Ltd',          'string',  'Legal company name'),
('company','cin',                     'U72900KA2018PTC123456',           'string',  'Corporate Identification Number'),
('company','gstin',                   '29ABCDE1234F1Z5',                 'string',  'GST Registration Number'),
('company','pan',                     'ABCDE1234F',                      'string',  'Company PAN'),
('company','email',                   'hr@techcorp.in',                  'string',  'HR email'),
('company','phone',                   '+91 80 4567 8900',                'string',  'Main phone'),
('company','website',                 'https://techcorp.in',             'string',  'Company website'),
('company','founded_year',            '2018',                            'number',  'Year founded'),
('company','financial_year',          'April-March',                     'string',  'Financial year cycle'),
('work','default_shift_hours',        '9',                               'number',  'Standard shift hours'),
('work','ot_multiplier',              '1.5',                             'number',  'Overtime rate multiplier'),
('work','probation_months',           '6',                               'number',  'Probation period months'),
('work','notice_period_days',         '90',                              'number',  'Notice period (days)'),
('work','week_off',                   'Sunday',                          'string',  'Weekly off day'),
('work','max_wfh_days',               '2',                               'number',  'Max WFH days per week'),
('tax','old_regime_basic_exemption',  '250000',                          'number',  'Old regime basic exemption'),
('tax','new_regime_basic_exemption',  '300000',                          'number',  'New regime basic exemption'),
('tax','standard_deduction',          '50000',                           'number',  'Standard deduction for salaried'),
('tax','pf_employee_percent',         '12',                              'number',  'Employee PF %'),
('tax','pf_employer_percent',         '12',                              'number',  'Employer PF %'),
('tax','esi_employee_percent',        '0.75',                            'number',  'Employee ESI %'),
('tax','esi_employer_percent',        '3.25',                            'number',  'Employer ESI %'),
('tax','professional_tax_monthly',    '200',                             'number',  'Professional tax per month'),
('tax','hra_metro_percent',           '50',                              'number',  'HRA % metro cities'),
('tax','hra_non_metro_percent',       '40',                              'number',  'HRA % non-metro'),
('loan','max_home_loan_salary_months','36',                              'number',  'Max home loan (salary months)'),
('loan','max_vehicle_loan_months',    '18',                              'number',  'Max vehicle loan (salary months)'),
('loan','max_personal_loan_months',   '6',                               'number',  'Max personal loan (salary months)'),
('loan','min_tenure_months',          '12',                              'number',  'Min employment months to apply'),
('loan','max_emi_salary_percent',     '40',                              'number',  'Max EMI as % of gross salary'),
('loan','default_interest_rate',      '8',                               'number',  'Default annual interest rate %'),
('safety','sos_alert_emails',         'security@techcorp.in,hr@techcorp.in', 'string', 'SOS alert recipients'),
('safety','female_cab_mandatory_night','1',                              'boolean', 'Mandate female cab after 8PM'),
('safety','night_shift_start_hour',   '20',                              'number',  '24-hr start of night shift'),
('safety','night_shift_end_hour',     '6',                               'number',  '24-hr end of night shift'),
('safety','safe_checkin_interval_mins','30',                             'number',  'Safe check-in interval (mins)'),
('notification','leave_approval_email','1',                              'boolean', 'Email on leave approval'),
('notification','salary_slip_email',  '1',                               'boolean', 'Email when payslip generated'),
('notification','birthday_wishes',    '1',                               'boolean', 'Auto birthday notifications');

-- Seed office locations
INSERT IGNORE INTO office_locations (city, state, address, pincode, capacity, hr_contact, emergency_contact) VALUES
('Bengaluru','Karnataka','4th Floor, Prestige Tech Park, Outer Ring Road, Marathahalli','560103',450,'hr.blr@techcorp.in','+91 98450 12345'),
('Hyderabad','Telangana','Level 7, My Home Hub, Madhapur, HITEC City','500081',300,'hr.hyd@techcorp.in','+91 98490 23456'),
('Pune','Maharashtra','3rd Floor, Panchshil Business Park, Yerwada','411006',250,'hr.pune@techcorp.in','+91 98220 34567'),
('Chennai','Tamil Nadu','Olympia Tech Park, Tower C, Guindy','600032',200,'hr.che@techcorp.in','+91 98400 45678'),
('Noida','Uttar Pradesh','Plot A-8, Sector 63, Noida Special Economic Zone','201301',180,'hr.noi@techcorp.in','+91 98100 56789'),
('Gurugram','Haryana','DLF Cyber City, Phase III, Building 9A','122002',220,'hr.gur@techcorp.in','+91 98110 67890'),
('Mumbai','Maharashtra','Nirlon Knowledge Park, Western Express Highway, Goregaon','400063',200,'hr.mum@techcorp.in','+91 98200 78901'),
('Kolkata','West Bengal','DLF IT Park, New Town, Rajarhat','700156',120,'hr.kol@techcorp.in','+91 98300 89012'),
('Ahmedabad','Gujarat','Synergy Business Park, SG Road, Bodakdev','380054',100,'hr.ahm@techcorp.in','+91 97230 90123'),
('Kochi','Kerala','InfoPark Phase 1, Kakkanad','682042',80,'hr.koc@techcorp.in','+91 98470 01234');


-- ─────────────────────────────────────────────────────────────
-- MODULE 2 · INCOME TAX PORTAL
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tax_declarations (
  declaration_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NOT NULL,
  financial_year      VARCHAR(10) NOT NULL DEFAULT '2025-26',
  regime              ENUM('old','new') DEFAULT 'new',
  ppf                 DECIMAL(12,2) DEFAULT 0,
  elss                DECIMAL(12,2) DEFAULT 0,
  life_insurance      DECIMAL(12,2) DEFAULT 0,
  nsc                 DECIMAL(12,2) DEFAULT 0,
  fd_5yr              DECIMAL(12,2) DEFAULT 0,
  tuition_fees        DECIMAL(12,2) DEFAULT 0,
  home_loan_principal DECIMAL(12,2) DEFAULT 0,
  health_self         DECIMAL(12,2) DEFAULT 0,
  health_parents      DECIMAL(12,2) DEFAULT 0,
  edu_loan_interest   DECIMAL(12,2) DEFAULT 0,
  donations_80g       DECIMAL(12,2) DEFAULT 0,
  hra_rent_paid       DECIMAL(12,2) DEFAULT 0,
  hra_city_type       ENUM('metro','non_metro') DEFAULT 'metro',
  nps_80ccd           DECIMAL(12,2) DEFAULT 0,
  home_loan_interest  DECIMAL(12,2) DEFAULT 0,
  status              ENUM('draft','submitted','approved') DEFAULT 'draft',
  submitted_at        TIMESTAMP NULL,
  approved_by         INT,
  approved_at         TIMESTAMP NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_fy (user_id, financial_year),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS form16_records (
  form16_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  financial_year   VARCHAR(10) NOT NULL,
  gross_salary     DECIMAL(14,2),
  total_deductions DECIMAL(14,2),
  taxable_income   DECIMAL(14,2),
  tax_liability    DECIMAL(14,2),
  tds_deducted     DECIMAL(14,2),
  regime           ENUM('old','new') DEFAULT 'new',
  generated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pdf_path         VARCHAR(255),
  UNIQUE KEY uq_user_fy16 (user_id, financial_year),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- ─────────────────────────────────────────────────────────────
-- MODULE 3 · EMPLOYEE LOAN PORTAL
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loan_applications (
  loan_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  loan_type        ENUM('home','vehicle','education','marriage','medical','emergency','personal') NOT NULL,
  principal        DECIMAL(14,2) NOT NULL,
  tenure_months    INT NOT NULL,
  interest_rate    DECIMAL(5,2)  DEFAULT 8.00,
  emi_amount       DECIMAL(12,2),
  purpose          TEXT,
  status           ENUM('draft','pending','under_review','approved','rejected','disbursed','closed') DEFAULT 'pending',
  manager_action   ENUM('pending','approved','rejected') DEFAULT 'pending',
  manager_id       INT,
  manager_at       TIMESTAMP NULL,
  manager_remarks  TEXT,
  hr_action        ENUM('pending','approved','rejected') DEFAULT 'pending',
  hr_id            INT,
  hr_at            TIMESTAMP NULL,
  hr_remarks       TEXT,
  admin_action     ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_id         INT,
  admin_at         TIMESTAMP NULL,
  admin_remarks    TEXT,
  disbursal_date   DATE,
  disbursal_ref    VARCHAR(60),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (hr_id)      REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id)   REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS loan_repayments (
  repayment_id   INT AUTO_INCREMENT PRIMARY KEY,
  loan_id        INT NOT NULL,
  installment_no INT NOT NULL,
  due_date       DATE NOT NULL,
  principal_comp DECIMAL(12,2) DEFAULT 0,
  interest_comp  DECIMAL(12,2) DEFAULT 0,
  emi_amount     DECIMAL(12,2),
  paid_date      DATE,
  paid_amount    DECIMAL(12,2),
  status         ENUM('upcoming','paid','overdue') DEFAULT 'upcoming',
  FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id) ON DELETE CASCADE
);


-- ─────────────────────────────────────────────────────────────
-- MODULE 4 · WOMEN SAFETY PLATFORM
-- Matches column names used in safetyController.js exactly
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS safety_sos_events (
  sos_id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NOT NULL,
  trigger_type       ENUM('panic_button','app_shake','auto_timer','manual','voice') DEFAULT 'panic_button',
  lat                DECIMAL(10,7),
  lng                DECIMAL(10,7),
  address            VARCHAR(255),
  status             ENUM('active','responding','resolved') DEFAULT 'active',
  notified_contacts  TINYINT(1) DEFAULT 0,
  resolved_by        INT,
  resolved_at        TIMESTAMP NULL,
  resolution_notes   TEXT,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS safety_emergency_contacts (
  contact_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  name            VARCHAR(100) NOT NULL,
  relation        VARCHAR(60),
  phone           VARCHAR(20) NOT NULL,
  email           VARCHAR(120),
  is_primary      TINYINT(1) DEFAULT 0,
  notify_on_sos   TINYINT(1) DEFAULT 1,
  notify_on_late  TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS safety_complaints (
  complaint_id    INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id     INT NOT NULL,
  accused_id      INT,
  incident_date   DATE NOT NULL,
  location        VARCHAR(200),
  category        ENUM('verbal','physical','sexual','cyber','other') NOT NULL,
  description     LONGTEXT NOT NULL,
  witnesses       TEXT,
  is_anonymous    TINYINT(1) DEFAULT 0,
  evidence_path   VARCHAR(255),
  status          ENUM('filed','under_review','icc_referred','resolved','closed') DEFAULT 'filed',
  icc_member_id   INT,
  icc_assigned_at TIMESTAMP NULL,
  resolution      TEXT,
  resolved_at     TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id)   REFERENCES users(user_id),
  FOREIGN KEY (accused_id)    REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (icc_member_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS safety_night_shift_approvals (
  approval_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  shift_date   DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  cab_required TINYINT(1) DEFAULT 1,
  female_cab   TINYINT(1) DEFAULT 1,
  escort_req   TINYINT(1) DEFAULT 0,
  status       ENUM('pending','approved','rejected') DEFAULT 'pending',
  approved_by  INT,
  approved_at  TIMESTAMP NULL,
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- Performance indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tax_decl_user ON tax_declarations(user_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_loan_user     ON loan_applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sos_user      ON safety_sos_events(user_id, status);
CREATE INDEX IF NOT EXISTS idx_complaint_st  ON safety_complaints(status, created_at);
CREATE INDEX IF NOT EXISTS idx_settings_grp  ON company_settings(setting_group);
