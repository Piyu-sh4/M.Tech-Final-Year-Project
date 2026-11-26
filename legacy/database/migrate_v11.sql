-- ══════════════════════════════════════════════════════════════
--  v11.0 Migration — 16 Missing Features
-- ══════════════════════════════════════════════════════════════

-- 1. Performance Reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
  review_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  reviewer_id     INT NOT NULL,
  review_cycle    VARCHAR(30) NOT NULL,   -- 'Q1-2025','Annual-2025'
  review_type     ENUM('self','manager','peer','360') DEFAULT 'manager',
  period_start    DATE,
  period_end      DATE,
  -- Scores 1-5
  score_quality       DECIMAL(3,1) DEFAULT 0,
  score_delivery      DECIMAL(3,1) DEFAULT 0,
  score_communication DECIMAL(3,1) DEFAULT 0,
  score_teamwork      DECIMAL(3,1) DEFAULT 0,
  score_initiative    DECIMAL(3,1) DEFAULT 0,
  score_leadership    DECIMAL(3,1) DEFAULT 0,
  overall_score       DECIMAL(3,1) DEFAULT 0,
  rating          ENUM('exceptional','exceeds','meets','below','unsatisfactory') DEFAULT 'meets',
  strengths       TEXT,
  improvements    TEXT,
  goals_next      TEXT,
  reviewer_notes  TEXT,
  status          ENUM('draft','submitted','acknowledged','completed') DEFAULT 'draft',
  submitted_at    TIMESTAMP NULL,
  acknowledged_at TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 2. Onboarding Checklists
CREATE TABLE IF NOT EXISTS onboarding_templates (
  template_id   INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  role_id       INT,
  department_id INT,
  is_default    TINYINT(1) DEFAULT 0,
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  task_id       INT AUTO_INCREMENT PRIMARY KEY,
  template_id   INT NOT NULL,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  category      ENUM('document','it_setup','training','meet','hr_process','policy') DEFAULT 'hr_process',
  due_day       INT DEFAULT 1,            -- day N after joining
  assigned_to   ENUM('employee','hr','it','manager','admin') DEFAULT 'employee',
  is_mandatory  TINYINT(1) DEFAULT 1,
  sort_order    INT DEFAULT 0,
  FOREIGN KEY (template_id) REFERENCES onboarding_templates(template_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS onboarding_progress (
  progress_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  task_id       INT NOT NULL,
  status        ENUM('pending','in_progress','completed','skipped') DEFAULT 'pending',
  completed_at  TIMESTAMP NULL,
  notes         TEXT,
  UNIQUE KEY uq_user_task (user_id, task_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES onboarding_tasks(task_id) ON DELETE CASCADE
);

-- 3. Announcements / Notice Board
CREATE TABLE IF NOT EXISTS announcements (
  announcement_id INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(200) NOT NULL,
  body            LONGTEXT NOT NULL,
  category        ENUM('general','policy','event','urgent','hr','it','finance') DEFAULT 'general',
  target_roles    VARCHAR(20) DEFAULT 'all',   -- 'all','1','2','3','4' or comma list
  target_location VARCHAR(100) DEFAULT 'all',
  is_pinned       TINYINT(1) DEFAULT 0,
  is_active       TINYINT(1) DEFAULT 1,
  expires_at      TIMESTAMP NULL,
  attachment_url  VARCHAR(255),
  created_by      INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS announcement_reads (
  read_id         INT AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT NOT NULL,
  user_id         INT NOT NULL,
  read_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ann_user (announcement_id, user_id),
  FOREIGN KEY (announcement_id) REFERENCES announcements(announcement_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)         REFERENCES users(user_id) ON DELETE CASCADE
);

-- 4. Help Desk / IT Tickets
CREATE TABLE IF NOT EXISTS helpdesk_tickets (
  ticket_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  category      ENUM('it_hardware','it_software','access','hr_query','payroll','facilities','other') NOT NULL,
  priority      ENUM('low','medium','high','critical') DEFAULT 'medium',
  subject       VARCHAR(200) NOT NULL,
  description   LONGTEXT NOT NULL,
  status        ENUM('open','in_progress','pending_user','resolved','closed') DEFAULT 'open',
  assigned_to   INT,
  assigned_at   TIMESTAMP NULL,
  resolved_at   TIMESTAMP NULL,
  resolution    TEXT,
  satisfaction  TINYINT,          -- 1-5 rating
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS helpdesk_comments (
  comment_id  INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id   INT NOT NULL,
  user_id     INT NOT NULL,
  message     TEXT NOT NULL,
  is_internal TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES helpdesk_tickets(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(user_id) ON DELETE CASCADE
);

-- 5. Asset Management
CREATE TABLE IF NOT EXISTS assets (
  asset_id      INT AUTO_INCREMENT PRIMARY KEY,
  asset_code    VARCHAR(30) NOT NULL UNIQUE,
  asset_name    VARCHAR(150) NOT NULL,
  category      ENUM('laptop','desktop','monitor','phone','tablet','keyboard','mouse','headset','other') NOT NULL,
  brand         VARCHAR(80),
  model         VARCHAR(100),
  serial_number VARCHAR(80),
  purchase_date DATE,
  purchase_cost DECIMAL(12,2),
  warranty_end  DATE,
  condition     ENUM('new','good','fair','poor','damaged') DEFAULT 'good',
  status        ENUM('available','assigned','maintenance','retired','lost') DEFAULT 'available',
  location      VARCHAR(100),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_assignments (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id      INT NOT NULL,
  user_id       INT NOT NULL,
  assigned_by   INT,
  assigned_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  returned_at   TIMESTAMP NULL,
  condition_out ENUM('new','good','fair','poor') DEFAULT 'good',
  condition_in  ENUM('good','fair','poor','damaged') DEFAULT NULL,
  notes         TEXT,
  FOREIGN KEY (asset_id)     REFERENCES assets(asset_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by)  REFERENCES users(user_id) ON DELETE SET NULL
);

-- 6. Training & Learning
CREATE TABLE IF NOT EXISTS training_courses (
  course_id     INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  category      ENUM('technical','soft_skills','compliance','leadership','product','security') DEFAULT 'technical',
  format        ENUM('video','document','quiz','workshop','webinar','external') DEFAULT 'video',
  duration_mins INT DEFAULT 0,
  provider      VARCHAR(100),
  url           VARCHAR(255),
  is_mandatory  TINYINT(1) DEFAULT 0,
  target_grades VARCHAR(100),    -- 'L1,L2,L3' or 'all'
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  course_id     INT NOT NULL,
  status        ENUM('enrolled','in_progress','completed','failed') DEFAULT 'enrolled',
  progress_pct  INT DEFAULT 0,
  score         DECIMAL(5,2),
  enrolled_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at  TIMESTAMP NULL,
  certificate_url VARCHAR(255),
  UNIQUE KEY uq_user_course (user_id, course_id),
  FOREIGN KEY (user_id)   REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES training_courses(course_id) ON DELETE CASCADE
);

-- 7. Department Management (enhanced)
CREATE TABLE IF NOT EXISTS department_heads (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  user_id       INT NOT NULL,
  role          ENUM('head','deputy','coordinator') DEFAULT 'head',
  effective_from DATE,
  FOREIGN KEY (department_id) REFERENCES departments(dept_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)       REFERENCES users(user_id) ON DELETE CASCADE
);

-- Seed announcements
INSERT IGNORE INTO announcements (title, body, category, target_roles, is_pinned, is_active, created_by) VALUES
('Welcome to Workforce Intelligence Platform!',
 'Dear Team,\n\nWe are thrilled to announce the launch of our upgraded Workforce Intelligence Platform. This update includes Tax Portal, Loan Portal, Women Safety Module, Career Roadmap, Banking Details, Employee Benefits, and much more.\n\nKey highlights:\n• 41 modules now available\n• 100+ employee demo data\n• AI-powered career insights\n• Enhanced registration with grade, location, and work mode\n\nPlease explore the new features and reach out to HR for any queries.\n\nWarm regards,\nTechCorp HR Team',
 'general', 'all', 1, 1, 1),

('Q2 Performance Reviews — Now Open',
 'All managers are requested to complete Q2 2025 performance reviews for their team members by June 30, 2025.\n\nEmployees should submit self-assessments by June 20, 2025.\n\nNavigate to: Dashboard → Performance Reviews\n\nFor any queries, contact HR at hr@techcorp.in',
 'hr', 'all', 0, 1, 4),

('IMPORTANT: Company Policy Update — WFH Guidelines',
 'Effective July 1, 2025, the Work-From-Home policy has been updated:\n\n• Maximum 2 WFH days per week (unchanged)\n• All WFH requests must be submitted by Friday for the following week\n• Core hours 10 AM – 5 PM mandatory during WFH\n• Client-facing roles require office presence on client meeting days\n\nPlease acknowledge this announcement by clicking "Mark as Read".',
 'policy', 'all', 1, 1, 4),

('Office Closed — Independence Day (August 15)',
 'The office will remain closed on Friday, August 15, 2025 in observance of Independence Day.\n\nEnjoy the long weekend! 🇮🇳',
 'event', 'all', 0, 1, 4),

('New IT Helpdesk Portal Launched',
 'We have launched a new IT Helpdesk system for all your IT support, software access, and hardware requests.\n\nHow to raise a ticket:\n1. Go to Dashboard → Help Desk\n2. Click "New Ticket"\n3. Select category and describe your issue\n\nTarget SLA: High priority 4 hrs, Medium 24 hrs, Low 72 hrs.',
 'it', 'all', 0, 1, 1),

('Mandatory Cybersecurity Training — Complete by June 30',
 'All employees must complete the mandatory Cybersecurity Awareness Training by June 30, 2025.\n\nTopics covered:\n• Password security\n• Phishing awareness\n• Data classification\n• Secure remote work\n\nNavigate to: Dashboard → Training & Learning\n\nNote: Non-completion may affect your quarterly performance score.',
 'urgent', 'all', 1, 1, 4);

-- Seed training courses
INSERT IGNORE INTO training_courses (title, description, category, format, duration_mins, provider, is_mandatory, target_grades, created_by) VALUES
('Cybersecurity Awareness 2025',         'Essential security practices for all employees',                         'security',    'video',    45,  'Internal IT', 1, 'all', 1),
('Code Review Best Practices',           'How to give and receive effective code reviews',                          'technical',   'video',    60,  'Engineering', 0, 'L2,L3,L4', 1),
('Leadership Fundamentals',              'Core leadership skills for new team leads',                               'leadership',  'webinar',  120, 'HR',          0, 'L4,L5,L6', 1),
('POSH Awareness Training',              'Prevention of Sexual Harassment — mandatory for all employees',           'compliance',  'video',    90,  'HR Legal',    1, 'all', 1),
('AWS Cloud Practitioner Prep',          'Prepare for AWS Cloud Practitioner certification',                        'technical',   'video',    300, 'AWS',         0, 'L2,L3,L4,L5', 1),
('Effective Communication Skills',       'Written and verbal communication for professional settings',              'soft_skills', 'video',    60,  'HR',          0, 'all', 1),
('Agile & Scrum Mastery',                'Scrum framework, ceremonies, and best practices',                         'technical',   'workshop', 240, 'Engineering', 0, 'L2,L3,L4,L5', 1),
('Data Privacy & GDPR Basics',           'Understanding data privacy regulations and company obligations',           'compliance',  'document', 30,  'Legal',       1, 'all', 1),
('React 18 — New Features Deep Dive',    'Concurrent rendering, Suspense, and new hooks in React 18',               'technical',   'video',    90,  'Engineering', 0, 'L2,L3,L4', 1),
('Manager Essentials — First 90 Days',   'Transitioning from individual contributor to people manager',             'leadership',  'webinar',  180, 'HR',          0, 'L5,L6,L7', 1),
('Financial Literacy for Employees',     'Understanding your payslip, taxes, PF, and investments',                  'soft_skills', 'video',    60,  'Finance',     0, 'all', 1),
('Docker & Kubernetes Fundamentals',     'Container basics, Docker Compose, and K8s introduction',                  'technical',   'video',    120, 'DevOps',      0, 'L2,L3,L4', 1);

-- Seed assets
INSERT IGNORE INTO assets (asset_code, asset_name, category, brand, model, serial_number, purchase_date, purchase_cost, condition, status, location) VALUES
('LPTP-001','MacBook Pro 14" M3',    'laptop',  'Apple',  'MacBook Pro M3',    'C02ZK1ABMD6T', '2024-01-15', 185000, 'good',  'assigned',  'Bengaluru'),
('LPTP-002','MacBook Pro 14" M3',    'laptop',  'Apple',  'MacBook Pro M3',    'C02ZK2BCME7U', '2024-01-15', 185000, 'good',  'assigned',  'Bengaluru'),
('LPTP-003','Dell XPS 15',           'laptop',  'Dell',   'XPS 9530',          'DLL9530XPX001', '2023-06-10',120000, 'good',  'assigned',  'Hyderabad'),
('LPTP-004','Dell XPS 15',           'laptop',  'Dell',   'XPS 9530',          'DLL9530XPX002', '2023-06-10',120000, 'fair',  'assigned',  'Hyderabad'),
('LPTP-005','ThinkPad X1 Carbon',    'laptop',  'Lenovo', 'X1 Carbon Gen11',   'LNV1CRBNG11001','2023-09-01', 95000, 'good',  'available', 'Pune'),
('MNTR-001','Dell 27" 4K Monitor',   'monitor', 'Dell',   'U2723D',            'DLLU2723D001',  '2024-01-15', 42000, 'good',  'assigned',  'Bengaluru'),
('MNTR-002','Dell 27" 4K Monitor',   'monitor', 'Dell',   'U2723D',            'DLLU2723D002',  '2024-01-15', 42000, 'good',  'assigned',  'Bengaluru'),
('PHN-001', 'iPhone 15 Pro',         'phone',   'Apple',  'iPhone 15 Pro',     'APLIPH15P001',  '2024-03-01', 135000,'good',  'assigned',  'Bengaluru'),
('PHN-002', 'Samsung Galaxy S24',    'phone',   'Samsung','Galaxy S24 Ultra',  'SMSG24U002',    '2024-03-01', 125000,'good',  'assigned',  'Hyderabad'),
('HDST-001','Sony WH-1000XM5',       'headset', 'Sony',   'WH-1000XM5',        'SNYWH1000XM5001','2024-02-01',32000, 'good',  'assigned',  'Bengaluru'),
('HDST-002','Sony WH-1000XM5',       'headset', 'Sony',   'WH-1000XM5',        'SNYWH1000XM5002','2024-02-01',32000, 'good',  'available', 'Bengaluru'),
('LPTP-006','MacBook Air M2',        'laptop',  'Apple',  'MacBook Air M2',    'C02ZA1AAMD5S',  '2023-11-01',110000,'good',  'available', 'Chennai'),
('LPTP-007','HP EliteBook 840',      'laptop',  'HP',     'EliteBook 840 G10', 'HPE840G10001',  '2023-08-15', 85000, 'good', 'maintenance','Pune'),
('TBLT-001','iPad Pro 12.9"',        'tablet',  'Apple',  'iPad Pro M2 12.9"', 'APLIPPM2129001','2024-01-20', 92000, 'good',  'assigned',  'Bengaluru');

-- Seed onboarding template
INSERT IGNORE INTO onboarding_templates (name, is_default, created_by) VALUES
('Standard Engineer Onboarding', 1, 1);

INSERT IGNORE INTO onboarding_tasks (template_id, title, description, category, due_day, assigned_to, is_mandatory, sort_order) VALUES
(1, 'Submit ID Proof & Address Proof',          'Upload Aadhaar, PAN, and latest address proof to Documents section',      'document',   1,  'employee', 1, 1),
(1, 'Sign Employment Agreement',                'Review and digitally sign your employment contract',                       'document',   1,  'employee', 1, 2),
(1, 'Sign NDA & IP Agreement',                  'Review and sign Non-Disclosure and Intellectual Property agreements',      'document',   1,  'employee', 1, 3),
(1, 'Set up Work Email & Slack',                'IT will share credentials — set up 2FA immediately',                       'it_setup',   1,  'it',       1, 4),
(1, 'Laptop & Equipment Collection',            'Collect assigned laptop, headset, and access card from IT desk',          'it_setup',   1,  'it',       1, 5),
(1, 'Complete Banking Details',                 'Enter salary account details in Banking section for payroll setup',        'hr_process', 2,  'employee', 1, 6),
(1, 'Meet Your Reporting Manager',              'Schedule a 30-minute intro call with your manager',                       'meet',       2,  'manager',  1, 7),
(1, 'HR Induction Session',                     'Attend HR induction covering policies, benefits, and culture',            'training',   2,  'hr',       1, 8),
(1, 'Complete POSH Awareness Training',         'Mandatory training on Prevention of Sexual Harassment',                    'training',   3,  'employee', 1, 9),
(1, 'Complete Cybersecurity Training',          'Mandatory cybersecurity awareness training',                               'training',   3,  'employee', 1, 10),
(1, 'Meet Your Team Members',                   'Introduction round with immediate team',                                  'meet',       3,  'manager',  1, 11),
(1, 'Set Up Dev Environment',                   'Clone repos, install tools, run local stack per team wiki',               'it_setup',   4,  'employee', 1, 12),
(1, 'Add Emergency Contacts',                   'Update emergency contact details in your profile',                        'hr_process', 5,  'employee', 1, 13),
(1, 'Read Company Policies',                    'Review WFH, Leave, POSH, and Code of Conduct policies in Settings',       'policy',     5,  'employee', 1, 14),
(1, 'Submit PF & ESI Nomination Form',          'Fill and submit nomination form to HR',                                   'hr_process', 7,  'employee', 1, 15),
(1, 'First Week Check-in with HR',              'HR will schedule a 15-minute check-in on Day 7',                          'meet',       7,  'hr',       0, 16),
(1, 'Complete First Task Assignment',           'Complete the starter task assigned by your manager',                      'training',   14, 'employee', 1, 17),
(1, '30-Day Review Meeting',                    'Manager and HR 30-day review and feedback session',                       'meet',       30, 'manager',  1, 18),
(1, 'Confirm Benefits Enrollment',              'Enroll in health insurance and other benefits in Benefits section',       'hr_process', 14, 'employee', 1, 19),
(1, '90-Day Confirmation',                      'End of probation review and confirmation letter',                          'hr_process', 90, 'hr',       1, 20);

-- Seed helpdesk tickets (demo)
INSERT IGNORE INTO helpdesk_tickets (user_id, category, priority, subject, description, status, assigned_to) VALUES
(17, 'it_software',  'high',   'VPN not connecting after password reset',        'After resetting my corporate password, the VPN client shows authentication error.',               'open',        NULL),
(18, 'access',       'medium', 'Need access to Staging environment',             'Require read access to staging DB for debugging the portal issue. Manager approval attached.',    'in_progress', 1),
(19, 'it_hardware',  'low',    'Monitor flickers intermittently',                'Second monitor connected via HDMI flickers every 10-15 minutes. Driver update did not help.',    'open',        NULL),
(17, 'payroll',      'high',   'June salary not credited',                       'It is June 13 and salary for June has not been credited to my account. Payslip shows processed.','in_progress', 4),
(24, 'hr_query',     'medium', 'Clarification on maternity leave policy',        'Would like to understand the full maternity leave entitlement and salary continuation policy.',   'resolved',    4),
(31, 'it_software',  'high',   'AWS console access revoked after role change',   'Lost access to AWS production console after promotion to Senior DevOps. Need re-provisioning.',  'open',        NULL),
(36, 'facilities',   'low',    'Standing desk request for Hyderabad office',     'Request for a standing desk or height-adjustable table due to back condition (medical cert attached).','open',  NULL),
(18, 'it_hardware',  'medium', 'MacBook keyboard keys sticking',                 'Keys B, N, and space bar on MacBook Pro are sticking. Affects typing speed significantly.',       'resolved',    1);
