> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 🗄️ Backend Schema — Workforce Intelligence

**Database**: MySQL 8.0 | **Engine**: InnoDB | **Charset**: utf8mb4_unicode_ci  
**Monetary values**: Stored as INTEGER (paise) — divide by 100 for display  
**Dates**: DATE type | **Timestamps**: DATETIME DEFAULT CURRENT_TIMESTAMP

---

## 1. Core Tables

### `companies`
```sql
CREATE TABLE companies (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  pan           VARCHAR(10),
  tan           VARCHAR(10),
  epf_code      VARCHAR(30),
  esi_code      VARCHAR(30),
  gstin         VARCHAR(15),
  address       TEXT,
  state_code    CHAR(2),
  logo_url      VARCHAR(500),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `roles`
```sql
CREATE TABLE roles (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        ENUM('admin','hr','manager','employee') NOT NULL,
  description VARCHAR(200),
  permissions JSON  -- {"payroll": true, "compliance": true, ...}
);
-- Seed: 1=admin, 2=hr, 3=manager, 4=employee
```

### `users`
```sql
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    INT UNSIGNED NOT NULL,
  role_id       INT UNSIGNED NOT NULL DEFAULT 4,
  emp_reg_no    VARCHAR(30) UNIQUE,   -- EMP-2026-0001
  full_name     VARCHAR(200) NOT NULL,
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(100) NOT NULL,  -- bcryptjs SALT=12
  phone         VARCHAR(15),
  department    VARCHAR(100),
  designation   VARCHAR(100),
  manager_id    INT UNSIGNED,
  join_date     DATE,
  status        ENUM('active','inactive','on_notice','exited') DEFAULT 'active',
  profile_photo VARCHAR(500),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (role_id)    REFERENCES roles(id),
  FOREIGN KEY (manager_id) REFERENCES users(id),
  INDEX idx_email (email),
  INDEX idx_company (company_id),
  INDEX idx_status (status)
);
```

### `refresh_tokens`
```sql
CREATE TABLE refresh_tokens (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token_hash VARCHAR(100) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked    BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_token (token_hash)
);
```

---

## 2. Employee Tables

### `employee_profiles`
```sql
CREATE TABLE employee_profiles (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED UNIQUE NOT NULL,
  dob             DATE,
  gender          ENUM('male','female','other','prefer_not'),
  blood_group     VARCHAR(5),
  emergency_contact_name  VARCHAR(200),
  emergency_contact_phone VARCHAR(15),
  address         TEXT,
  city            VARCHAR(100),
  state           VARCHAR(100),
  pincode         VARCHAR(10),
  pan_encrypted   VARBINARY(500),  -- AES-256-GCM
  aadhar_last4    CHAR(4),         -- Only last 4 stored
  uan             VARCHAR(12),     -- UAN for PF
  esi_number      VARCHAR(17),
  grade_id        INT UNSIGNED,
  probation_end   DATE,
  confirmed_on    DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### `employee_grades`
```sql
CREATE TABLE employee_grades (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  INT UNSIGNED NOT NULL,
  grade_name  VARCHAR(50) NOT NULL,   -- L1, L2, Senior, Manager
  min_ctc     INT,                    -- Paise
  max_ctc     INT,                    -- Paise
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

### `bank_accounts`
```sql
CREATE TABLE bank_accounts (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  bank_name       VARCHAR(100),
  account_no_enc  VARBINARY(500),   -- AES-256-GCM
  ifsc            VARCHAR(11),
  account_type    ENUM('savings','current') DEFAULT 'savings',
  is_primary      BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 3. Payroll Tables

### `salary_structures`
```sql
CREATE TABLE salary_structures (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           INT UNSIGNED NOT NULL,
  effective_from    DATE NOT NULL,
  ctc               INT NOT NULL,         -- Annual CTC in paise
  basic             INT NOT NULL,         -- Monthly basic in paise
  hra               INT DEFAULT 0,
  special_allowance INT DEFAULT 0,
  transport_allow   INT DEFAULT 0,
  medical_allow     INT DEFAULT 0,
  lta               INT DEFAULT 0,
  food_wallet       INT DEFAULT 0,
  other_allowances  JSON,
  is_current        BOOLEAN DEFAULT TRUE,
  created_by        INT UNSIGNED,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_current (user_id, is_current)
);
```

### `payroll_runs`
```sql
CREATE TABLE payroll_runs (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      INT UNSIGNED NOT NULL,
  month           TINYINT NOT NULL,    -- 1-12
  year            SMALLINT NOT NULL,
  status          ENUM('draft','processing','completed','locked') DEFAULT 'draft',
  total_gross     BIGINT DEFAULT 0,    -- Paise
  total_deductions BIGINT DEFAULT 0,
  total_net       BIGINT DEFAULT 0,
  employee_count  SMALLINT DEFAULT 0,
  run_by          INT UNSIGNED,
  locked_by       INT UNSIGNED,
  locked_at       DATETIME,
  run_at          DATETIME,
  notes           TEXT,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  UNIQUE KEY uk_company_period (company_id, month, year)
);
```

### `payslips`
```sql
CREATE TABLE payslips (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payroll_run_id    INT UNSIGNED NOT NULL,
  user_id           INT UNSIGNED NOT NULL,
  month             TINYINT NOT NULL,
  year              SMALLINT NOT NULL,
  -- Earnings (all paise)
  basic             INT NOT NULL,
  hra               INT DEFAULT 0,
  special_allowance INT DEFAULT 0,
  transport_allow   INT DEFAULT 0,
  medical_allow     INT DEFAULT 0,
  lta               INT DEFAULT 0,
  food_wallet       INT DEFAULT 0,
  variable_pay      INT DEFAULT 0,
  gross             INT NOT NULL,
  -- Deductions
  pf_employee       INT DEFAULT 0,
  esi_employee      INT DEFAULT 0,
  tds               INT DEFAULT 0,
  professional_tax  INT DEFAULT 0,
  lwf_employee      INT DEFAULT 0,
  loan_deduction    INT DEFAULT 0,
  advance_deduction INT DEFAULT 0,
  other_deductions  INT DEFAULT 0,
  total_deductions  INT DEFAULT 0,
  -- Net
  net_pay           INT NOT NULL,
  -- Employer contributions (not in net, for reporting)
  pf_employer       INT DEFAULT 0,
  esi_employer      INT DEFAULT 0,
  lwf_employer      INT DEFAULT 0,
  -- Metadata
  days_paid         TINYINT DEFAULT 26,
  days_lop          TINYINT DEFAULT 0,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id),
  FOREIGN KEY (user_id)        REFERENCES users(id),
  INDEX idx_user_period (user_id, month, year)
);
```

### `salary_revisions`
```sql
CREATE TABLE salary_revisions (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  old_ctc         INT NOT NULL,
  new_ctc         INT NOT NULL,
  hike_percent    DECIMAL(5,2),
  effective_date  DATE NOT NULL,
  reason          ENUM('annual_increment','promotion','market_correction','performance'),
  approved_by     INT UNSIGNED,
  letter_sent     BOOLEAN DEFAULT FALSE,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 4. Attendance Tables

### `attendance`
```sql
CREATE TABLE attendance (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  date          DATE NOT NULL,
  punch_in      DATETIME,
  punch_out     DATETIME,
  method        ENUM('fingerprint','face','qr','pin','gps','rfid','manual'),
  status        ENUM('present','absent','late','half_day','wfh','holiday','weekend'),
  hours_worked  DECIMAL(4,2),
  location_lat  DECIMAL(10,8),
  location_lng  DECIMAL(11,8),
  device_id     VARCHAR(100),
  regularised   BOOLEAN DEFAULT FALSE,
  regularise_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uk_user_date (user_id, date),
  INDEX idx_user_date (user_id, date)
);
```

### `shifts`
```sql
CREATE TABLE shifts (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   INT UNSIGNED NOT NULL,
  name         VARCHAR(100) NOT NULL,  -- Morning, General, Evening, Night
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  grace_minutes TINYINT DEFAULT 15,
  is_night_shift BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

---

## 5. Leave Tables

### `leave_types`
```sql
CREATE TABLE leave_types (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      INT UNSIGNED NOT NULL,
  name            VARCHAR(100) NOT NULL,  -- Annual, Sick, Casual, Comp-off...
  annual_quota    TINYINT DEFAULT 0,
  carry_forward   BOOLEAN DEFAULT FALSE,
  max_carry_days  TINYINT DEFAULT 0,
  encashable      BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

### `leave_balances`
```sql
CREATE TABLE leave_balances (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  leave_type_id INT UNSIGNED NOT NULL,
  year          SMALLINT NOT NULL,
  opening       DECIMAL(5,1) DEFAULT 0,
  earned        DECIMAL(5,1) DEFAULT 0,
  taken         DECIMAL(5,1) DEFAULT 0,
  balance       DECIMAL(5,1) DEFAULT 0,
  FOREIGN KEY (user_id)       REFERENCES users(id),
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
  UNIQUE KEY uk_user_type_year (user_id, leave_type_id, year)
);
```

### `leave_requests`
```sql
CREATE TABLE leave_requests (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  leave_type_id   INT UNSIGNED NOT NULL,
  from_date       DATE NOT NULL,
  to_date         DATE NOT NULL,
  days            DECIMAL(4,1) NOT NULL,
  reason          TEXT,
  status          ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
  approved_by     INT UNSIGNED,
  approved_at     DATETIME,
  rejection_reason TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)       REFERENCES users(id),
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
  INDEX idx_user_status (user_id, status)
);
```

---

## 6. Compliance Tables

### `statutory_rates`
```sql
CREATE TABLE statutory_rates (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type            ENUM('pf','esi','lwf','pt','bonus') NOT NULL,
  state_code      CHAR(2),       -- NULL for national rates
  effective_from  DATE NOT NULL,
  employee_rate   DECIMAL(6,4),  -- Percentage
  employer_rate   DECIMAL(6,4),
  ceiling_amount  INT,           -- Paise
  min_amount      INT,
  max_amount      INT,
  INDEX idx_type_state (type, state_code)
);
```

### `pf_returns`
```sql
CREATE TABLE pf_returns (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id     INT UNSIGNED NOT NULL,
  month          TINYINT NOT NULL,
  year           SMALLINT NOT NULL,
  total_employees SMALLINT,
  employee_share BIGINT,    -- Paise
  employer_share BIGINT,
  total_amount   BIGINT,
  challan_no     VARCHAR(30),
  filed_on       DATE,
  status         ENUM('pending','filed','overdue') DEFAULT 'pending',
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

### `investment_declarations`
```sql
CREATE TABLE investment_declarations (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  fiscal_year  VARCHAR(7) NOT NULL,   -- "2026-27"
  section_80c  INT DEFAULT 0,          -- Paise
  section_80d  INT DEFAULT 0,
  hra_claimed  INT DEFAULT 0,
  lta_claimed  INT DEFAULT 0,
  section_80e  INT DEFAULT 0,
  section_80g  INT DEFAULT 0,
  other_deductions INT DEFAULT 0,
  total_declared INT DEFAULT 0,
  regime       ENUM('new','old') DEFAULT 'new',
  status       ENUM('draft','submitted','verified') DEFAULT 'draft',
  submitted_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uk_user_fy (user_id, fiscal_year)
);
```

---

## 7. Hiring Tables

### `job_postings`
```sql
CREATE TABLE job_postings (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      INT UNSIGNED NOT NULL,
  title           VARCHAR(200) NOT NULL,
  department      VARCHAR(100),
  location        VARCHAR(200),
  type            ENUM('full_time','part_time','contract','intern'),
  experience_min  TINYINT,
  experience_max  TINYINT,
  salary_min      INT,    -- Paise per month
  salary_max      INT,
  jd              TEXT,
  skills          JSON,
  openings        TINYINT DEFAULT 1,
  status          ENUM('draft','active','paused','closed') DEFAULT 'draft',
  created_by      INT UNSIGNED,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

### `candidates`
```sql
CREATE TABLE candidates (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id          INT UNSIGNED NOT NULL,
  full_name       VARCHAR(200) NOT NULL,
  email           VARCHAR(200),
  phone           VARCHAR(15),
  resume_url      VARCHAR(500),
  stage           ENUM('applied','screening','interview','offer','joined','rejected') DEFAULT 'applied',
  source          ENUM('direct','referral','linkedin','naukri','other'),
  referred_by     INT UNSIGNED,
  current_ctc     INT,
  expected_ctc    INT,
  notice_period   TINYINT,    -- Days
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES job_postings(id),
  INDEX idx_job_stage (job_id, stage)
);
```

---

## 8. Performance Tables

### `performance_reviews`
```sql
CREATE TABLE performance_reviews (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  reviewer_id     INT UNSIGNED NOT NULL,
  review_type     ENUM('self','manager','peer','report','360'),
  period          VARCHAR(20) NOT NULL,   -- "Q3-2026"
  quality_score   TINYINT,                -- 1-5
  teamwork_score  TINYINT,
  delivery_score  TINYINT,
  leadership_score TINYINT,
  overall_score   DECIMAL(3,1),
  comments        TEXT,
  achievements    TEXT,
  development_goals TEXT,
  status          ENUM('draft','submitted','reviewed') DEFAULT 'draft',
  submitted_at    DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);
```

### `goals_okr`
```sql
CREATE TABLE goals_okr (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  parent_id       INT UNSIGNED,           -- For key results under objectives
  type            ENUM('objective','key_result'),
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  period          VARCHAR(20),            -- "Q3-2026"
  target_value    DECIMAL(10,2),
  current_value   DECIMAL(10,2) DEFAULT 0,
  unit            VARCHAR(50),            -- %, ₹, count, etc.
  status          ENUM('on_track','at_risk','behind','completed') DEFAULT 'on_track',
  due_date        DATE,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)   REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES goals_okr(id)
);
```

---

## 9. Security & Audit Tables

### `audit_log`
```sql
CREATE TABLE audit_log (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  INT UNSIGNED,
  user_id     INT UNSIGNED,
  ip_address  VARCHAR(45),
  action      VARCHAR(100) NOT NULL,
  -- Examples: PAYROLL_RUN, SALARY_EDIT, EMPLOYEE_CREATE, LOGIN, LOGOUT, DATA_EXPORT
  entity      VARCHAR(100),   -- Table name: users, payslips, leave_requests
  entity_id   INT UNSIGNED,
  old_value   JSON,
  new_value   JSON,
  status      ENUM('success','failed') DEFAULT 'success',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user    (user_id),
  INDEX idx_entity  (entity, entity_id),
  INDEX idx_created (created_at),
  INDEX idx_action  (action)
  -- NO UPDATE, DELETE permissions on this table
);
```

### `fraud_alerts`
```sql
CREATE TABLE fraud_alerts (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  INT UNSIGNED NOT NULL,
  type        ENUM('ghost_employee','duplicate_account','salary_anomaly',
                   'access_anomaly','geofence_violation','bulk_export'),
  severity    ENUM('low','medium','high','critical'),
  user_id     INT UNSIGNED,
  description TEXT,
  evidence    JSON,
  status      ENUM('open','investigating','resolved','false_positive') DEFAULT 'open',
  assigned_to INT UNSIGNED,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

### `posh_complaints`
```sql
CREATE TABLE posh_complaints (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      INT UNSIGNED NOT NULL,
  complainant_id  INT UNSIGNED,       -- NULL if anonymous
  respondent_name VARCHAR(200),       -- Not a FK — may be external
  nature          ENUM('verbal','physical','visual','quid_pro_quo','hostile_environment'),
  incident_date   DATE,
  description     TEXT,               -- Encrypted at application layer
  status          ENUM('received','under_inquiry','inquiry_complete',
                       'action_taken','closed','false_complaint'),
  icc_members     JSON,
  inquiry_deadline DATE,              -- 90 days from receipt (PoSH Act)
  outcome         TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
  -- ACCESS RESTRICTED: Only ICC members via role-based query filter
);
```

---

## 10. Employee Requests Table

### `employee_requests`
```sql
CREATE TABLE employee_requests (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  type          ENUM('salary_certificate','noc','experience_letter','bank_letter',
                     'it_equipment','wfh_approval','shift_change','address_change',
                     'document_update','other'),
  description   TEXT,
  status        ENUM('pending','in_progress','approved','rejected') DEFAULT 'pending',
  handled_by    INT UNSIGNED,
  handled_at    DATETIME,
  response_note TEXT,
  document_url  VARCHAR(500),    -- Generated document if applicable
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (handled_by) REFERENCES users(id),
  INDEX idx_user_status (user_id, status)
);
```

---

## 11. Key Indexes Summary

```sql
-- High-frequency queries optimised with indexes:
users:           email, company_id, status, manager_id
payslips:        user_id+month+year, payroll_run_id
attendance:      user_id+date (UNIQUE), date, status
leave_requests:  user_id+status, from_date, to_date
audit_log:       user_id, entity+entity_id, created_at, action
job_postings:    company_id+status
candidates:      job_id+stage
performance:     user_id, reviewer_id, period
goals_okr:       user_id, parent_id, status
fraud_alerts:    company_id, severity, status
```

---

## 12. Data Retention Policy (DPDP Act 2023)

| Table | Retention | Action After |
|---|---|---|
| payslips | 7 years | Archive to cold storage |
| pf_returns | 7 years | Archive |
| audit_log | 5 years | Archive |
| posh_complaints | 3 years | Secure deletion |
| attendance | 3 years | Archive |
| leave_requests | 3 years | Archive |
| fraud_alerts | 2 years | Delete |
| users (exited) | 2 years | Anonymise (name → "Former Employee") |
