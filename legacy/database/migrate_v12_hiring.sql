-- ══════════════════════════════════════════════════════════════
--  v12.0 Migration — Hiring Process + Cab Issue Tickets
--  + Technical Support Enhancements
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. JOB POSTINGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_postings (
  job_id          INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(150) NOT NULL,
  department_id   INT,
  location        VARCHAR(100),
  job_type        ENUM('full_time','part_time','contract','internship') DEFAULT 'full_time',
  candidate_type  ENUM('fresher','experienced','both') DEFAULT 'both',
  min_experience  DECIMAL(4,1) DEFAULT 0,  -- years
  max_experience  DECIMAL(4,1) DEFAULT 50,
  min_salary      DECIMAL(12,2),
  max_salary      DECIMAL(12,2),
  currency        VARCHAR(10) DEFAULT 'INR',
  skills_required TEXT,
  description     LONGTEXT NOT NULL,
  requirements    TEXT,
  benefits        TEXT,
  openings        INT DEFAULT 1,
  status          ENUM('draft','active','paused','closed','cancelled') DEFAULT 'draft',
  posted_by       INT,
  approved_by     INT,
  closes_at       DATE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
  FOREIGN KEY (posted_by)     REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by)   REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 2. CANDIDATES / APPLICANTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidates (
  candidate_id    INT AUTO_INCREMENT PRIMARY KEY,
  job_id          INT NOT NULL,
  full_name       VARCHAR(120) NOT NULL,
  email           VARCHAR(150) NOT NULL,
  phone           VARCHAR(20),
  dob             DATE,
  gender          ENUM('male','female','other','prefer_not'),
  current_location VARCHAR(100),
  candidate_type  ENUM('fresher','experienced') NOT NULL,
  -- Fresher fields
  college_name    VARCHAR(200),
  degree          VARCHAR(100),
  branch          VARCHAR(100),
  graduation_year YEAR,
  cgpa            DECIMAL(4,2),
  -- Experienced fields
  current_company VARCHAR(150),
  current_designation VARCHAR(100),
  total_experience DECIMAL(4,1) DEFAULT 0,  -- years
  current_ctc     DECIMAL(12,2),
  expected_ctc    DECIMAL(12,2),
  notice_period   INT DEFAULT 0,  -- days
  -- Common
  resume_url      VARCHAR(255),
  linkedin_url    VARCHAR(255),
  github_url      VARCHAR(255),
  portfolio_url   VARCHAR(255),
  cover_letter    TEXT,
  source          ENUM('portal','linkedin','naukri','employee_referral','campus','walk_in','agency','other') DEFAULT 'portal',
  referred_by     INT,
  status          ENUM('applied','shortlisted','rejected','on_hold','selected','withdrawn','offer_sent','offer_accepted','offer_declined','joined') DEFAULT 'applied',
  reject_reason   TEXT,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id)      REFERENCES job_postings(job_id) ON DELETE CASCADE,
  FOREIGN KEY (referred_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 3. INTERVIEW ROUNDS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interview_rounds (
  round_id        INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id    INT NOT NULL,
  job_id          INT NOT NULL,
  round_number    INT NOT NULL DEFAULT 1,
  round_type      ENUM('screening','aptitude','technical','hr','managerial','final','assignment') NOT NULL,
  round_name      VARCHAR(100),
  mode            ENUM('online','offline','phone','video') DEFAULT 'online',
  interviewer_id  INT,
  scheduled_at    DATETIME,
  duration_mins   INT DEFAULT 60,
  location        VARCHAR(200),       -- room / video link
  status          ENUM('scheduled','completed','cancelled','no_show','rescheduled') DEFAULT 'scheduled',
  result          ENUM('pass','fail','on_hold','pending') DEFAULT 'pending',
  technical_score INT,               -- /100
  communication_score INT,           -- /100
  problem_solving_score INT,         -- /100
  overall_score   INT,               -- /100
  strengths       TEXT,
  weaknesses      TEXT,
  feedback        TEXT,
  recommendation  ENUM('strongly_recommend','recommend','neutral','not_recommend','strongly_not_recommend'),
  recorded_by     INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id)   REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  FOREIGN KEY (job_id)         REFERENCES job_postings(job_id) ON DELETE CASCADE,
  FOREIGN KEY (interviewer_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (recorded_by)    REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 4. OFFER LETTERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offer_letters (
  offer_id        INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id    INT NOT NULL,
  job_id          INT NOT NULL,
  designation     VARCHAR(100) NOT NULL,
  department_id   INT,
  joining_date    DATE,
  offer_ctc       DECIMAL(12,2) NOT NULL,
  basic_salary    DECIMAL(12,2),
  hra             DECIMAL(12,2),
  allowances      DECIMAL(12,2),
  probation_months INT DEFAULT 3,
  work_location   VARCHAR(100),
  work_mode       ENUM('onsite','remote','hybrid') DEFAULT 'onsite',
  offer_valid_till DATE,
  status          ENUM('draft','sent','accepted','declined','expired','revoked') DEFAULT 'draft',
  accepted_at     TIMESTAMP NULL,
  declined_at     TIMESTAMP NULL,
  decline_reason  TEXT,
  offer_letter_url VARCHAR(255),
  generated_by    INT,
  approved_by     INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id)  REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  FOREIGN KEY (job_id)        REFERENCES job_postings(job_id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
  FOREIGN KEY (generated_by)  REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by)   REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 5. PRE-JOINING DOCUMENTS CHECKLIST (for candidates)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidate_documents (
  doc_id          INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id    INT NOT NULL,
  doc_type        ENUM('id_proof','address_proof','pan_card','aadhaar','degree_certificate','marksheets','experience_letter','salary_slip','offer_letter_previous','other') NOT NULL,
  doc_name        VARCHAR(100),
  file_url        VARCHAR(255),
  status          ENUM('pending','uploaded','verified','rejected') DEFAULT 'pending',
  verified_by     INT,
  verified_at     TIMESTAMP NULL,
  reject_reason   TEXT,
  uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by)  REFERENCES users(user_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 6. EMPLOYEE REFERRALS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_referrals (
  referral_id     INT AUTO_INCREMENT PRIMARY KEY,
  referred_by     INT NOT NULL,
  candidate_id    INT,
  job_id          INT NOT NULL,
  referral_name   VARCHAR(120) NOT NULL,
  referral_email  VARCHAR(150) NOT NULL,
  referral_phone  VARCHAR(20),
  relationship    VARCHAR(80),
  cover_note      TEXT,
  status          ENUM('submitted','reviewing','shortlisted','rejected','hired') DEFAULT 'submitted',
  bonus_eligible  TINYINT(1) DEFAULT 0,
  bonus_amount    DECIMAL(10,2),
  bonus_paid_at   TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referred_by)  REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE SET NULL,
  FOREIGN KEY (job_id)       REFERENCES job_postings(job_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- 7. CAB ISSUE / COMPLAINT TICKETS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_issues (
  issue_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  booking_id      INT,
  issue_type      ENUM('late_pickup','no_show','rude_driver','ac_not_working','unsafe_driving','wrong_route','vehicle_condition','overcharging','cancellation','other') NOT NULL,
  priority        ENUM('low','medium','high','urgent') DEFAULT 'medium',
  subject         VARCHAR(200) NOT NULL,
  description     LONGTEXT NOT NULL,
  status          ENUM('open','in_review','resolved','closed','escalated') DEFAULT 'open',
  assigned_to     INT,
  resolution      TEXT,
  resolved_at     TIMESTAMP NULL,
  satisfaction    TINYINT,   -- 1-5
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id)  REFERENCES cab_bookings(booking_id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cab_issue_comments (
  comment_id  INT AUTO_INCREMENT PRIMARY KEY,
  issue_id    INT NOT NULL,
  user_id     INT NOT NULL,
  message     TEXT NOT NULL,
  is_internal TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES cab_issues(issue_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(user_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- 8. TECHNICAL SUPPORT ENHANCEMENTS
--    (Extends helpdesk with escalation, SLA, knowledge base)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS helpdesk_sla (
  sla_id          INT AUTO_INCREMENT PRIMARY KEY,
  priority        ENUM('low','medium','high','critical') NOT NULL UNIQUE,
  response_hours  INT NOT NULL,    -- first response SLA in hours
  resolve_hours   INT NOT NULL,    -- resolution SLA in hours
  escalate_hours  INT NOT NULL     -- escalate if not resolved in N hours
);
INSERT IGNORE INTO helpdesk_sla (priority,response_hours,resolve_hours,escalate_hours) VALUES
('low',24,120,168),('medium',8,48,72),('high',2,24,36),('critical',1,4,8);

CREATE TABLE IF NOT EXISTS helpdesk_escalations (
  escalation_id   INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id       INT NOT NULL,
  escalated_by    INT,
  escalated_to    INT,
  reason          TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id)    REFERENCES helpdesk_tickets(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (escalated_by) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (escalated_to) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS helpdesk_kb (
  kb_id           INT AUTO_INCREMENT PRIMARY KEY,
  category        ENUM('it_hardware','it_software','access','hr_query','payroll','facilities','other') NOT NULL,
  title           VARCHAR(200) NOT NULL,
  content         LONGTEXT NOT NULL,
  tags            VARCHAR(255),
  helpful_count   INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  created_by      INT,
  is_published    TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Seed KB articles
INSERT IGNORE INTO helpdesk_kb (category,title,content,tags,created_by) VALUES
('it_software','How to reset VPN credentials','1. Go to IT portal\n2. Click Reset VPN Password\n3. Enter your employee ID\n4. Check email for OTP\n5. Set new password\n6. Reconnect VPN client','vpn,password,reset',1),
('access','How to request system access','Submit access request via helpdesk. Attach manager approval email. Access provisioned within 1 business day.','access,permissions,system',1),
('payroll','Salary credit timeline','Salaries are credited on the last working day of each month. If not received by 3rd of next month, raise a helpdesk ticket.','salary,payroll,credit',1),
('it_hardware','Laptop slow performance troubleshooting','1. Restart laptop\n2. Check for Windows updates\n3. Run disk cleanup\n4. Check for malware\n5. If issue persists, raise ticket for hardware check.','laptop,slow,performance',1);

-- ─────────────────────────────────────────────────────────────
-- SEED DATA — Sample Job Postings
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO job_postings (title,department_id,location,job_type,candidate_type,min_experience,max_experience,min_salary,max_salary,skills_required,description,requirements,openings,status,posted_by,closes_at) VALUES
('Junior Software Engineer',1,'Bangalore',  'full_time','fresher',0,0,400000,700000,'Java,Spring Boot,MySQL','Entry-level Java developer position for fresh graduates.','B.Tech/B.E. in CS/IT with 60%+ CGPA',3,'active',1,'2026-09-30'),
('Senior React Developer', 1,'Remote',      'full_time','experienced',3,7,1200000,2000000,'React,TypeScript,Node.js','Lead frontend development for our SaaS platform.','3+ years React experience required',2,'active',1,'2026-08-31'),
('HR Business Partner',   2,'Mumbai',       'full_time','experienced',2,5,800000,1200000,'HR Policies,HRIS,Recruitment','Partner with business teams on HR strategy.','MBA HR preferred',1,'active',1,'2026-07-31'),
('Campus Intern - Data Science',1,'Hyderabad','internship','fresher',0,0,15000,25000,'Python,ML,Pandas','6-month data science internship for final year students.','Final year B.Tech/M.Tech with ML knowledge',5,'active',1,'2026-07-15');
