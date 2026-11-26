-- ══════════════════════════════════════════════════════════════
--  Workforce Intelligence Platform – Demo Seed Data v9.0
--  ⚠️  DEMO DATA ONLY — NOT REAL EMPLOYEES
--  Run AFTER schema.sql and migrate_v8.sql and migrate_v9.sql
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- DEPARTMENTS (12)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO departments (department_name, description) VALUES
('Engineering',       'Software development, frontend, backend, fullstack'),
('Quality Assurance', 'Manual and automation testing'),
('DevOps',            'Infrastructure, CI/CD, cloud operations'),
('AI / Data Science', 'Machine learning, NLP, data engineering'),
('Product',           'Product management and ownership'),
('Human Resources',   'People ops, talent acquisition, L&D'),
('Finance',           'Accounts, payroll, FP&A'),
('Leadership',        'Executive and senior management'),
('Design',            'UI/UX, branding, motion design'),
('Sales',             'Business development, enterprise sales'),
('Marketing',         'Digital marketing, content, growth'),
('Legal',             'Compliance, contracts, IP');

-- ─────────────────────────────────────────────────────────────
-- USERS — 100 demo employees
-- Passwords are all: Demo@1234  (bcrypt hash below is for that)
-- ─────────────────────────────────────────────────────────────
SET @pw = '$2b$10$4XZgz7LbHg2fYB5V6PkPxOyBFoW1jYHN3hUnR5sXkVLiWqEQK8b3u';

-- ADMINS (role_id = 1)
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Rajesh Kumar',    'rajesh@techcorp.in',    @pw, 1, 8, 'CTO',                    'active'),
('Sunita Reddy',    'sunita@techcorp.in',    @pw, 1, 6, 'CHRO',                   'active'),
('Vinod Mehta',     'vinod@techcorp.in',     @pw, 1, 7, 'CFO',                    'active');

-- HR (role_id = 4)
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Neha Joshi',      'neha@techcorp.in',      @pw, 4, 6, 'HR Manager',             'active'),
('Priti Gupta',     'priti@techcorp.in',     @pw, 4, 6, 'HR Business Partner',    'active'),
('Kavita Nair',     'kavita@techcorp.in',    @pw, 4, 6, 'Talent Acquisition Lead','active');

-- MANAGERS (role_id = 3)
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Vikram Singh',    'vikram@techcorp.in',    @pw, 3, 1, 'Engineering Manager',    'active'),
('Arjun Patel',     'arjun@techcorp.in',     @pw, 3, 1, 'Lead Frontend Engineer', 'active'),
('Suresh Nair',     'suresh@techcorp.in',    @pw, 3, 1, 'Backend Lead',           'active'),
('Deepak Sharma',   'deepak@techcorp.in',    @pw, 3, 3, 'DevOps Lead',            'active'),
('Ramesh Iyer',     'ramesh@techcorp.in',    @pw, 3, 2, 'QA Lead',                'active'),
('Priya Menon',     'pmenon@techcorp.in',    @pw, 3, 4, 'Lead Data Scientist',    'active'),
('Karthik Rao',     'karthik@techcorp.in',   @pw, 3, 5, 'Senior Product Manager', 'active'),
('Anand Verma',     'anand@techcorp.in',     @pw, 3, 8, 'Delivery Manager',       'active'),
('Shalini Kumar',   'shalini@techcorp.in',   @pw, 3, 9, 'Design Lead',            'active'),
('Arun Krishnan',   'arun@techcorp.in',      @pw, 3, 10,'Sales Manager',          'active');

-- EMPLOYEES (role_id = 2) — Engineering Frontend
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Priya Sharma',    'priya@techcorp.in',     @pw, 2, 1, 'Senior Frontend Dev',    'active'),
('Sneha Reddy',     'sneha@techcorp.in',     @pw, 2, 1, 'Frontend Developer',     'active'),
('Rahul Mehta',     'rahul@techcorp.in',     @pw, 2, 1, 'Junior Frontend Dev',    'active'),
('Divya Krishnan',  'divya@techcorp.in',     @pw, 2, 1, 'Frontend Developer',     'active'),
('Manish Patel',    'manish@techcorp.in',    @pw, 2, 1, 'Senior Frontend Dev',    'active'),
('Anjali Singh',    'anjali@techcorp.in',    @pw, 2, 1, 'Junior Frontend Dev',    'active'),
('Rohan Verma',     'rohan@techcorp.in',     @pw, 2, 1, 'Frontend Developer',     'active');

-- Engineering Backend
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Kiran Sharma',    'kiran@techcorp.in',     @pw, 2, 1, 'Senior Backend Dev',     'active'),
('Nikhil Gupta',    'nikhil@techcorp.in',    @pw, 2, 1, 'Backend Developer',      'active'),
('Tanvi Rao',       'tanvi@techcorp.in',     @pw, 2, 1, 'Junior Backend Dev',     'active'),
('Aditya Kumar',    'aditya@techcorp.in',    @pw, 2, 1, 'Backend Developer',      'active'),
('Siddharth Nair',  'siddharth@techcorp.in', @pw, 2, 1, 'Senior Backend Dev',     'active'),
('Pooja Mehta',     'pooja@techcorp.in',     @pw, 2, 1, 'Backend Developer',      'active'),
('Vivek Reddy',     'vivek@techcorp.in',     @pw, 2, 1, 'Full Stack Developer',   'active');

-- Engineering Full Stack
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Harsh Agarwal',   'harsh@techcorp.in',     @pw, 2, 1, 'Senior Full Stack Dev',  'active'),
('Sonal Joshi',     'sonal@techcorp.in',     @pw, 2, 1, 'Full Stack Developer',   'active'),
('Neeraj Yadav',    'neeraj@techcorp.in',    @pw, 2, 1, 'Junior Full Stack Dev',  'active'),
('Riya Mishra',     'riya@techcorp.in',      @pw, 2, 1, 'Full Stack Developer',   'active'),
('Sahil Bhat',      'sahil@techcorp.in',     @pw, 2, 1, 'Full Stack Developer',   'active');

-- QA Team
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Ananya Iyer',     'ananya@techcorp.in',    @pw, 2, 2, 'Senior QA Engineer',     'active'),
('Raj Kapoor',      'raj@techcorp.in',       @pw, 2, 2, 'QA Engineer',            'active'),
('Swati Pandey',    'swati@techcorp.in',     @pw, 2, 2, 'Automation QA',          'active'),
('Mohit Jain',      'mohit@techcorp.in',     @pw, 2, 2, 'QA Engineer',            'active'),
('Shruti Patil',    'shruti@techcorp.in',    @pw, 2, 2, 'Senior QA Engineer',     'active'),
('Vishal Sharma',   'vishal@techcorp.in',    @pw, 2, 2, 'QA Analyst',             'active'),
('Pallavi Singh',   'pallavi@techcorp.in',   @pw, 2, 2, 'Automation QA',          'active');

-- DevOps Team
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Sanjay Krishnan', 'sanjay@techcorp.in',   @pw, 2, 3, 'Senior DevOps Eng',      'active'),
('Gaurav Rathore',  'gaurav@techcorp.in',   @pw, 2, 3, 'DevOps Engineer',        'active'),
('Amit Sharma',     'amit@techcorp.in',     @pw, 2, 3, 'Cloud Engineer',         'active'),
('Neeti Arora',     'neeti@techcorp.in',    @pw, 2, 3, 'SRE Engineer',           'active'),
('Tarun Mishra',    'tarun@techcorp.in',    @pw, 2, 3, 'DevOps Engineer',        'active');

-- AI / Data Science
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Priya Nair',      'priya.n@techcorp.in',  @pw, 2, 4, 'ML Engineer',            'active'),
('Ashish Verma',    'ashish@techcorp.in',   @pw, 2, 4, 'Data Engineer',          'active'),
('Kaveri Sharma',   'kaveri@techcorp.in',   @pw, 2, 4, 'Data Analyst',           'active'),
('Vikram Bhatt',    'vikram.b@techcorp.in', @pw, 2, 4, 'Senior ML Engineer',     'active'),
('Ritika Gupta',    'ritika@techcorp.in',   @pw, 2, 4, 'AI Engineer',            'active'),
('Ishaan Joshi',    'ishaan@techcorp.in',   @pw, 2, 4, 'Data Scientist',         'active');

-- Product
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Smita Rao',       'smita@techcorp.in',    @pw, 2, 5, 'Product Manager',        'active'),
('Chirag Patel',    'chirag@techcorp.in',   @pw, 2, 5, 'Product Analyst',        'active'),
('Nisha Mehta',     'nisha@techcorp.in',    @pw, 2, 5, 'Product Owner',          'active'),
('Varun Malhotra',  'varun@techcorp.in',    @pw, 2, 5, 'Business Analyst',       'active');

-- Design
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Ritu Sharma',     'ritu@techcorp.in',     @pw, 2, 9, 'Senior UI/UX Designer',  'active'),
('Aryan Kapoor',    'aryan@techcorp.in',    @pw, 2, 9, 'UI Designer',            'active'),
('Meera Nair',      'meera@techcorp.in',    @pw, 2, 9, 'UX Researcher',          'active'),
('Tarun Gupta',     'tarun.g@techcorp.in',  @pw, 2, 9, 'Motion Designer',        'active');

-- Sales & Marketing
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Ajay Malhotra',   'ajay@techcorp.in',     @pw, 2, 10, 'Business Dev Executive', 'active'),
('Pooja Dixit',     'pooja.d@techcorp.in',  @pw, 2, 10, 'Enterprise Sales Exec',  'active'),
('Rajan Chauhan',   'rajan@techcorp.in',    @pw, 2, 10, 'BDE',                    'active'),
('Shweta Bose',     'shweta@techcorp.in',   @pw, 2, 11, 'Digital Marketing Exec', 'active'),
('Deepti Roy',      'deepti@techcorp.in',   @pw, 2, 11, 'Content Manager',        'active'),
('Harish Menon',    'harish@techcorp.in',   @pw, 2, 11, 'Growth Manager',         'active');

-- Finance & HR Staff
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Anita Roy',       'anita@techcorp.in',    @pw, 2, 7, 'Senior Accountant',       'active'),
('Suresh Jain',     'suresh.j@techcorp.in', @pw, 2, 7, 'Finance Analyst',         'active'),
('Rekha Patel',     'rekha@techcorp.in',    @pw, 2, 7, 'Payroll Executive',       'active'),
('Sumit Banerjee',  'sumit@techcorp.in',    @pw, 2, 6, 'HR Executive',            'active'),
('Latha Krishnan',  'latha@techcorp.in',    @pw, 2, 6, 'Recruiter',               'active');

-- Additional Engineering (to reach ~100)
INSERT IGNORE INTO users (full_name, email, password, role_id, department_id, designation, status) VALUES
('Tushar Sharma',   'tushar@techcorp.in',   @pw, 2, 1, 'Backend Developer',       'active'),
('Kavita Iyer',     'kavita.i@techcorp.in', @pw, 2, 1, 'Frontend Developer',      'active'),
('Pankaj Yadav',    'pankaj@techcorp.in',   @pw, 2, 1, 'Full Stack Developer',    'active'),
('Sarita Joshi',    'sarita@techcorp.in',   @pw, 2, 1, 'Senior Backend Dev',      'active'),
('Mukesh Kumar',    'mukesh@techcorp.in',   @pw, 2, 1, 'Backend Developer',       'active'),
('Lalitha Menon',   'lalitha@techcorp.in',  @pw, 2, 1, 'Frontend Developer',      'active'),
('Ashok Nair',      'ashok@techcorp.in',    @pw, 2, 1, 'Full Stack Developer',    'active'),
('Sunita Jain',     'sunita.j@techcorp.in', @pw, 2, 2, 'QA Engineer',             'active'),
('Ramdev Patil',    'ramdev@techcorp.in',   @pw, 2, 3, 'DevOps Engineer',         'active'),
('Geeta Sharma',    'geeta@techcorp.in',    @pw, 2, 4, 'Data Analyst',            'active'),
('Hemant Gupta',    'hemant@techcorp.in',   @pw, 2, 1, 'Junior Backend Dev',      'active'),
('Preeti Saxena',   'preeti@techcorp.in',   @pw, 2, 1, 'Junior Frontend Dev',     'active'),
('Aakash Bhatt',    'aakash@techcorp.in',   @pw, 2, 1, 'Backend Developer',       'active'),
('Shipra Malhotra', 'shipra@techcorp.in',   @pw, 2, 9, 'UI Designer',             'active'),
('Naveen Reddy',    'naveen@techcorp.in',   @pw, 2, 1, 'Senior Full Stack Dev',   'active');

-- ─────────────────────────────────────────────────────────────
-- EMPLOYEE GRADES for key staff
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO employee_grades (user_id, grade_level, designation, department, effective_date, salary_band_min, salary_band_max, assigned_by)
SELECT u.user_id,
  CASE u.designation
    WHEN 'CTO'                   THEN 'L12'
    WHEN 'CHRO'                  THEN 'L11'
    WHEN 'CFO'                   THEN 'L11'
    WHEN 'HR Manager'            THEN 'L5'
    WHEN 'HR Business Partner'   THEN 'L4'
    WHEN 'Talent Acquisition Lead' THEN 'L4'
    WHEN 'Engineering Manager'   THEN 'L7'
    WHEN 'Lead Frontend Engineer' THEN 'L5'
    WHEN 'Backend Lead'          THEN 'L5'
    WHEN 'DevOps Lead'           THEN 'L5'
    WHEN 'QA Lead'               THEN 'L5'
    WHEN 'Lead Data Scientist'   THEN 'L5'
    WHEN 'Senior Product Manager' THEN 'L5'
    WHEN 'Delivery Manager'      THEN 'L6'
    WHEN 'Design Lead'           THEN 'L5'
    WHEN 'Sales Manager'         THEN 'L5'
    WHEN 'Senior Frontend Dev'   THEN 'L4'
    WHEN 'Senior Backend Dev'    THEN 'L4'
    WHEN 'Senior Full Stack Dev' THEN 'L4'
    WHEN 'Senior QA Engineer'    THEN 'L4'
    WHEN 'Senior DevOps Eng'     THEN 'L4'
    WHEN 'Senior ML Engineer'    THEN 'L4'
    WHEN 'Senior UI/UX Designer' THEN 'L4'
    WHEN 'Frontend Developer'    THEN 'L3'
    WHEN 'Backend Developer'     THEN 'L3'
    WHEN 'Full Stack Developer'  THEN 'L3'
    WHEN 'QA Engineer'           THEN 'L3'
    WHEN 'DevOps Engineer'       THEN 'L3'
    WHEN 'Cloud Engineer'        THEN 'L3'
    WHEN 'ML Engineer'           THEN 'L3'
    WHEN 'Data Engineer'         THEN 'L3'
    WHEN 'Data Analyst'          THEN 'L3'
    WHEN 'Data Scientist'        THEN 'L3'
    WHEN 'AI Engineer'           THEN 'L4'
    WHEN 'Product Manager'       THEN 'L4'
    WHEN 'Product Owner'         THEN 'L3'
    WHEN 'Product Analyst'       THEN 'L2'
    WHEN 'Business Analyst'      THEN 'L3'
    WHEN 'UI Designer'           THEN 'L3'
    WHEN 'UX Researcher'         THEN 'L3'
    WHEN 'Senior Accountant'     THEN 'L4'
    WHEN 'Finance Analyst'       THEN 'L3'
    WHEN 'Payroll Executive'     THEN 'L2'
    WHEN 'HR Executive'          THEN 'L2'
    WHEN 'Recruiter'             THEN 'L2'
    ELSE 'L2'
  END,
  u.designation, d.department_name, '2024-01-01',
  CASE u.designation
    WHEN 'CTO' THEN 5000000 WHEN 'CHRO' THEN 4000000 WHEN 'CFO' THEN 4500000
    WHEN 'Engineering Manager' THEN 2500000 WHEN 'Lead Frontend Engineer' THEN 2000000
    WHEN 'Delivery Manager' THEN 2200000 WHEN 'Senior Frontend Dev' THEN 1600000
    WHEN 'Senior Backend Dev' THEN 1700000 WHEN 'Frontend Developer' THEN 900000
    WHEN 'Backend Developer' THEN 1000000 WHEN 'QA Engineer' THEN 700000
    ELSE 600000
  END,
  CASE u.designation
    WHEN 'CTO' THEN 8000000 WHEN 'CHRO' THEN 6000000 WHEN 'CFO' THEN 7000000
    WHEN 'Engineering Manager' THEN 3500000 WHEN 'Lead Frontend Engineer' THEN 2800000
    WHEN 'Delivery Manager' THEN 3200000 WHEN 'Senior Frontend Dev' THEN 2200000
    WHEN 'Senior Backend Dev' THEN 2400000 WHEN 'Frontend Developer' THEN 1400000
    WHEN 'Backend Developer' THEN 1600000 WHEN 'QA Engineer' THEN 1200000
    ELSE 1000000
  END,
  1
FROM users u
JOIN departments d ON d.department_id = u.department_id
WHERE u.status = 'active';

-- ─────────────────────────────────────────────────────────────
-- SALARY RECORDS for all active employees
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO salaries (user_id, basic, hra, special_allowance, pf_deduction, tds, professional_tax, net_salary, month, year, status)
SELECT
  u.user_id,
  ROUND(CASE g.grade_level
    WHEN 'L12' THEN 350000 WHEN 'L11' THEN 280000 WHEN 'L10' THEN 220000
    WHEN 'L9'  THEN 180000 WHEN 'L8'  THEN 140000 WHEN 'L7'  THEN 110000
    WHEN 'L6'  THEN 90000  WHEN 'L5'  THEN 72000  WHEN 'L4'  THEN 56000
    WHEN 'L3'  THEN 42000  WHEN 'L2'  THEN 28000  ELSE 18000
  END) AS basic,
  ROUND(CASE g.grade_level
    WHEN 'L12' THEN 175000 WHEN 'L11' THEN 140000 WHEN 'L10' THEN 110000
    WHEN 'L9'  THEN 90000  WHEN 'L8'  THEN 70000  WHEN 'L7'  THEN 55000
    WHEN 'L6'  THEN 45000  WHEN 'L5'  THEN 36000  WHEN 'L4'  THEN 28000
    WHEN 'L3'  THEN 21000  WHEN 'L2'  THEN 14000  ELSE 9000
  END) AS hra,
  ROUND(CASE g.grade_level
    WHEN 'L12' THEN 87500  WHEN 'L11' THEN 70000  WHEN 'L10' THEN 55000
    WHEN 'L9'  THEN 45000  WHEN 'L8'  THEN 35000  WHEN 'L7'  THEN 27500
    WHEN 'L6'  THEN 22500  WHEN 'L5'  THEN 18000  WHEN 'L4'  THEN 14000
    WHEN 'L3'  THEN 10500  WHEN 'L2'  THEN 7000   ELSE 4500
  END) AS special_allowance,
  ROUND(CASE g.grade_level
    WHEN 'L12' THEN 42000 WHEN 'L11' THEN 33600 WHEN 'L10' THEN 26400
    WHEN 'L9'  THEN 21600 WHEN 'L8'  THEN 16800 WHEN 'L7'  THEN 13200
    WHEN 'L6'  THEN 10800 WHEN 'L5'  THEN 8640  WHEN 'L4'  THEN 6720
    WHEN 'L3'  THEN 5040  WHEN 'L2'  THEN 3360  ELSE 2160
  END) AS pf_deduction,
  ROUND(CASE g.grade_level
    WHEN 'L12' THEN 45000 WHEN 'L11' THEN 35000 WHEN 'L10' THEN 28000
    WHEN 'L9'  THEN 22000 WHEN 'L8'  THEN 16000 WHEN 'L7'  THEN 12000
    WHEN 'L6'  THEN 9000  WHEN 'L5'  THEN 6500  WHEN 'L4'  THEN 5000
    WHEN 'L3'  THEN 3200  WHEN 'L2'  THEN 1800  ELSE 0
  END) AS tds,
  200 AS professional_tax,
  ROUND((CASE g.grade_level
    WHEN 'L12' THEN 612500 WHEN 'L11' THEN 490000 WHEN 'L10' THEN 385000
    WHEN 'L9'  THEN 315000 WHEN 'L8'  THEN 245000 WHEN 'L7'  THEN 192500
    WHEN 'L6'  THEN 157500 WHEN 'L5'  THEN 126000 WHEN 'L4'  THEN 98000
    WHEN 'L3'  THEN 73500  WHEN 'L2'  THEN 49000  ELSE 31500
  END) - CASE g.grade_level
    WHEN 'L12' THEN 42000 WHEN 'L11' THEN 33600 WHEN 'L10' THEN 26400
    WHEN 'L9'  THEN 21600 WHEN 'L8'  THEN 16800 WHEN 'L7'  THEN 13200
    WHEN 'L6'  THEN 10800 WHEN 'L5'  THEN 8640  WHEN 'L4'  THEN 6720
    WHEN 'L3'  THEN 5040  WHEN 'L2'  THEN 3360  ELSE 2160
  END - CASE g.grade_level
    WHEN 'L12' THEN 45000 WHEN 'L11' THEN 35000 WHEN 'L10' THEN 28000
    WHEN 'L9'  THEN 22000 WHEN 'L8'  THEN 16000 WHEN 'L7'  THEN 12000
    WHEN 'L6'  THEN 9000  WHEN 'L5'  THEN 6500  WHEN 'L4'  THEN 5000
    WHEN 'L3'  THEN 3200  WHEN 'L2'  THEN 1800  ELSE 0
  END - 200) AS net_salary,
  6 AS month, 2025 AS year, 'paid' AS status
FROM users u
JOIN employee_grades g ON g.user_id = u.user_id
WHERE u.status = 'active'
  AND g.effective_date = (SELECT MAX(g2.effective_date) FROM employee_grades g2 WHERE g2.user_id = u.user_id);

-- ─────────────────────────────────────────────────────────────
-- ATTENDANCE for June 2025 (sample for first 10 users)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO attendance (user_id, date, clock_in, clock_out, status, hours_worked)
SELECT u.user_id, '2025-06-13', '09:02:00', '18:15:00', 'present', 9.22
FROM users u WHERE u.status='active' LIMIT 80;

INSERT IGNORE INTO attendance (user_id, date, clock_in, clock_out, status, hours_worked)
SELECT u.user_id, '2025-06-12', '08:58:00', '18:30:00', 'present', 9.53
FROM users u WHERE u.status='active' LIMIT 80;

INSERT IGNORE INTO attendance (user_id, date, clock_in, clock_out, status, hours_worked)
SELECT u.user_id, '2025-06-11', '09:15:00', '18:00:00', 'present', 8.75
FROM users u WHERE u.status='active' LIMIT 75;

-- ─────────────────────────────────────────────────────────────
-- SAMPLE TASKS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO tasks (title, description, assigned_to, assigned_by, priority, status, due_date) VALUES
('Customer Portal – Phase 2 API',    'Complete REST endpoints for portal v2',         17, 7,  'high',   'in_progress', '2025-06-20'),
('React Dashboard Component',        'Build reusable analytics dashboard component',  18, 8,  'high',   'in_progress', '2025-06-18'),
('DB Migration – Schema v3',         'Run and validate database migration scripts',   24, 9,  'medium', 'pending',     '2025-06-22'),
('Unit Test Coverage – Module A',    'Achieve 90% test coverage on auth module',      26, 11, 'medium', 'pending',     '2025-06-25'),
('Docker Containerization Setup',    'Containerize all microservices with Docker',    31, 10, 'low',    'completed',   '2025-06-10'),
('CI/CD Pipeline Automation',        'Set up GitHub Actions for all repos',           32, 10, 'high',   'in_progress', '2025-06-30'),
('ML Model Training – Attrition',    'Re-train attrition model with Q2 data',        36, 12, 'high',   'in_progress', '2025-06-28'),
('API Security Audit',               'Review all public endpoints for vulnerabilities',19, 7, 'high',   'pending',     '2025-06-21'),
('Q2 Client Demo Preparation',       'Prepare slide deck and live demo environment',  38, 13, 'high',   'overdue',     '2025-06-15'),
('Data Pipeline Optimization',       'Optimize ETL pipeline for 10x performance',     37, 12, 'medium', 'in_progress', '2025-07-05'),
('Feature Flags Implementation',     'Implement feature flag system with Redis',       20, 7,  'medium', 'pending',     '2025-06-29'),
('Performance Testing Suite',        'Build Locust-based load testing framework',      27, 11, 'low',    'pending',     '2025-07-10'),
('User Authentication Revamp',       'Migrate to JWT + refresh token architecture',   23, 9,  'high',   'in_progress', '2025-06-26'),
('Design System Documentation',      'Document all reusable UI components',           46, 14, 'low',    'completed',   '2025-06-08'),
('Kubernetes Cluster Setup',         'Deploy production K8s cluster on AWS EKS',      33, 10, 'high',   'pending',     '2025-07-15');

-- ─────────────────────────────────────────────────────────────
-- LEAVE BALANCES
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO leave_balances (user_id, leave_type, total_days, used_days, remaining_days, year)
SELECT user_id, 'sick',   12, FLOOR(RAND()*5),   12-FLOOR(RAND()*5),   2025 FROM users WHERE status='active';
INSERT IGNORE INTO leave_balances (user_id, leave_type, total_days, used_days, remaining_days, year)
SELECT user_id, 'casual', 12, FLOOR(RAND()*4),   12-FLOOR(RAND()*4),   2025 FROM users WHERE status='active';
INSERT IGNORE INTO leave_balances (user_id, leave_type, total_days, used_days, remaining_days, year)
SELECT user_id, 'earned', 15, FLOOR(RAND()*3),   15-FLOOR(RAND()*3),   2025 FROM users WHERE status='active';

-- ─────────────────────────────────────────────────────────────
-- SAMPLE NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO notifications (user_id, title, message, type, is_read, created_at) VALUES
(17, 'Leave Approved',        'Your casual leave for Jun 18-19 has been approved.',          'leave',    0, NOW()),
(17, 'Salary Processed',      'Your June 2025 salary has been credited. View payslip.',      'salary',   0, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(17, 'Task Due Tomorrow',     'Task "React Dashboard Component" is due Jun 18.',             'task',     0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(17, 'Birthday Today! 🎂',   'Wish Kiran Sharma a happy birthday!',                         'general',  1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(7,  'SOS Alert',             'Priya Sharma triggered SOS at 14:28. Please respond.',        'sos',      0, NOW()),
(7,  'Loan Application',      'Sneha Reddy applied for a Home Loan of ₹25,00,000.',          'loan',     0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(4,  'New Employee Joined',   'Aakash Bhatt has been onboarded to Engineering team.',        'admin',    1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4,  'Pending Leave Requests','7 leave requests are pending your approval.',                 'leave',    0, DATE_SUB(NOW(), INTERVAL 6 HOUR));

-- ─────────────────────────────────────────────────────────────
-- SKILL ASSESSMENTS for demo users
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO skill_assessments (user_id, skill_id, proficiency, verified) VALUES
(17, 1,  'expert',        1),  -- Priya: JavaScript Expert
(17, 3,  'expert',        1),  -- Priya: React Expert
(17, 2,  'advanced',      0),  -- Priya: TypeScript Advanced
(17, 7,  'intermediate',  0),  -- Priya: Node.js Intermediate
(18, 1,  'advanced',      1),  -- Sneha: JavaScript Advanced
(18, 3,  'advanced',      0),  -- Sneha: React Advanced
(24, 7,  'expert',        1),  -- Kiran: Node.js Expert
(24, 13, 'advanced',      1),  -- Kiran: MySQL Advanced
(31, 18, 'expert',        1),  -- Sanjay: Docker Expert
(31, 19, 'advanced',      1),  -- Sanjay: Kubernetes Advanced
(31, 20, 'advanced',      0),  -- Sanjay: AWS Advanced
(36, 25, 'expert',        1),  -- Priya N: ML Expert
(36, 26, 'advanced',      1),  -- Priya N: Deep Learning Advanced
(36, 27, 'advanced',      0);  -- Priya N: NLP Advanced

-- ─────────────────────────────────────────────────────────────
-- CERTIFICATIONS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO certifications (user_id, cert_name, issuing_body, cert_number, issue_date, expiry_date, is_verified) VALUES
(31, 'AWS Solutions Architect Associate',  'Amazon Web Services',   'AWS-SAA-C03-234567', '2024-03-15', '2027-03-15', 1),
(31, 'Certified Kubernetes Administrator', 'CNCF',                  'CKA-2024-88901',     '2024-07-20', '2026-07-20', 1),
(36, 'TensorFlow Developer Certificate',   'Google',                 'TF-2023-112233',     '2023-11-10', '2025-11-10', 1),
(36, 'AWS Machine Learning Specialty',     'Amazon Web Services',   'AWS-ML-556677',      '2024-05-08', '2027-05-08', 1),
(24, 'MongoDB Certified Developer',        'MongoDB Inc.',           'MDB-DEV-445566',     '2024-01-20', '2026-01-20', 1),
(17, 'Meta React Developer Certificate',   'Meta / Coursera',        'META-REACT-789012',  '2023-09-01', NULL,         1);

-- ─────────────────────────────────────────────────────────────
-- FAMILY INFORMATION
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO family_information (user_id, marital_status, spouse_name, children_count, emergency_contact_1) VALUES
(17, 'married',  'Karan Sharma',   0, '+91 98765 12345'),
(7,  'married',  'Pooja Singh',    2, '+91 98765 23456'),
(8,  'single',   NULL,             0, '+91 98765 34567'),
(24, 'married',  'Deepika Nair',   1, '+91 98765 45678'),
(31, 'married',  'Sunita Krishna', 0, '+91 98765 56789');

-- ─────────────────────────────────────────────────────────────
-- EMPLOYEE BENEFITS ENROLLMENTS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO employee_benefits (user_id, plan_id, enrollment_date, status, nominee_name, nominee_relation)
SELECT u.user_id, 1, '2024-04-01', 'active', 'Family Member', 'spouse'
FROM users u WHERE u.status='active' LIMIT 80;

INSERT IGNORE INTO employee_benefits (user_id, plan_id, enrollment_date, status, nominee_name, nominee_relation)
SELECT u.user_id, 3, '2024-04-01', 'active', 'Family Member', 'spouse'
FROM users u WHERE u.status='active' LIMIT 80;

-- ─────────────────────────────────────────────────────────────
-- DEPENDENT MEMBERS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO dependent_members (user_id, name, relation, dob, is_covered) VALUES
(17, 'Karan Sharma',       'spouse', '1992-05-14', 1),
(7,  'Pooja Singh',        'spouse', '1988-11-22', 1),
(7,  'Aarav Singh',        'child',  '2018-03-10', 1),
(7,  'Anaya Singh',        'child',  '2021-07-15', 1),
(24, 'Deepika Nair',       'spouse', '1993-08-30', 1),
(24, 'Vihaan Sharma',      'child',  '2020-12-01', 1);

-- ─────────────────────────────────────────────────────────────
-- BANKING DETAILS (demo — masked)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO employee_banking (user_id, bank_name, account_number, account_type, ifsc_code, branch_name, account_holder, upi_id, pf_account_number, pf_uan, is_verified, verified_by, verified_at)
VALUES
(17, 'State Bank of India',  'XX1234567890XX', 'salary', 'SBIN0001234', 'MG Road Bengaluru', 'Priya Sharma',  'priya@upi',  'KN/BNG/12345/001', '100234567890', 1, 4, NOW()),
(18, 'HDFC Bank',            'XX9876543210XX', 'salary', 'HDFC0001234', 'Koramangala BLR',   'Sneha Reddy',   'sneha@paytm', 'KN/BNG/12345/002', '100234567891', 1, 4, NOW()),
(7,  'ICICI Bank',           'XX5555444433XX', 'salary', 'ICIC0001234', 'Indiranagar BLR',   'Vikram Singh',  'vikram@gpay', 'KN/BNG/12345/003', '100234567892', 1, 4, NOW()),
(31, 'Axis Bank',            'XX7777888899XX', 'salary', 'UTIB0001234', 'HSR Layout BLR',    'Sanjay Krishnan','sanjay@upi', 'KN/BNG/12345/004', '100234567893', 0, NULL, NULL),
(36, 'Kotak Mahindra Bank',  'XX3333222211XX', 'salary', 'KKBK0001234', 'Madhapur HYD',      'Priya Nair',    'priyan@upi', 'KN/HYD/23456/001', '100234567894', 0, NULL, NULL);

-- ─────────────────────────────────────────────────────────────
-- PROMOTIONS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO promotions (user_id, from_grade, to_grade, from_designation, to_designation, reason, effective_date, salary_revision, approved_by, status) VALUES
(17, 'L3', 'L4', 'Frontend Developer',       'Senior Frontend Developer', 'Exceptional performance, led portal redesign project end-to-end',  '2024-01-01', 120000, 7, 'approved'),
(18, 'L2', 'L3', 'Junior Frontend Dev',      'Frontend Developer',         'Consistent delivery, good code quality, peer recognition',         '2024-04-01', 80000,  7, 'approved'),
(24, 'L3', 'L4', 'Backend Developer',        'Senior Backend Developer',   'Built payment gateway integration saving ₹2Cr/year',              '2023-10-01', 100000, 7, 'approved'),
(31, 'L3', 'L4', 'DevOps Engineer',          'Senior DevOps Engineer',     'Achieved 99.9% uptime, cut infra costs by 30%',                    '2024-03-01', 110000, 10,'approved'),
(8,  'L4', 'L5', 'Senior Frontend Dev',      'Lead Frontend Engineer',     'Successfully led team of 8, delivered 3 major projects on time',   '2024-06-01', 150000, 7, 'approved');

-- ─────────────────────────────────────────────────────────────
-- TAX DECLARATIONS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO tax_declarations (user_id, financial_year, regime, ppf, elss, life_insurance, health_self, health_parents, hra_rent_paid, hra_city_type, nps_80ccd, status, submitted_at)
VALUES
(17, '2025-26', 'new',  0,     0,     0,      25000, 0,      120000, 'metro',     0,     'submitted', NOW()),
(18, '2025-26', 'old',  50000, 46500, 24000,  20000, 50000,  96000,  'metro',     50000, 'submitted', NOW()),
(7,  '2025-26', 'new',  0,     0,     0,      25000, 0,      180000, 'metro',     0,     'approved',  NOW()),
(24, '2025-26', 'old',  150000,0,     48000,  25000, 50000,  144000, 'metro',     50000, 'submitted', NOW());

-- ─────────────────────────────────────────────────────────────
-- LOAN APPLICATIONS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO loan_applications (user_id, loan_type, principal, tenure_months, interest_rate, emi_amount, purpose, status, manager_action, hr_action, admin_action, disbursal_date)
VALUES
(17, 'home',      2500000, 120, 8.0,  30349,  'Purchase of apartment in Whitefield, Bengaluru',        'disbursed', 'approved', 'approved', 'approved', '2024-02-01'),
(18, 'vehicle',   650000,  36,  9.0,  20677,  'Purchase of Honda City for daily commute',              'approved',  'approved', 'approved', 'approved', NULL),
(24, 'education', 800000,  48,  8.5,  19826,  'MBA program at IIM Bangalore for career development',   'pending',   'pending',  'pending',  'pending',  NULL),
(31, 'personal',  200000,  24,  11.0, 9303,   'Medical expenses for family member surgery',            'approved',  'approved', 'approved', 'approved', NULL),
(36, 'marriage',  400000,  36,  9.5,  12836,  'Marriage ceremony and related expenses',                'pending',   'approved', 'pending',  'pending',  NULL);

-- ─────────────────────────────────────────────────────────────
-- SOS EVENTS (demo)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO safety_sos_events (user_id, trigger_type, lat, lng, address, status, created_at) VALUES
(17, 'panic_button', 12.9716, 77.5946, 'Prestige Tech Park, Floor 3, Bengaluru', 'resolved',    DATE_SUB(NOW(), INTERVAL 5 DAY)),
(18, 'auto_timer',   17.4478, 78.3763, 'Cab Route 4, HITEC City, Hyderabad',     'resolved',    DATE_SUB(NOW(), INTERVAL 12 DAY)),
(17, 'panic_button', 12.9716, 77.5946, 'Prestige Tech Park, Parking B',          'active',      DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- ─────────────────────────────────────────────────────────────
-- SAFETY EMERGENCY CONTACTS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO safety_emergency_contacts (user_id, name, relation, phone, email, is_primary, notify_on_sos) VALUES
(17, 'Karan Sharma',   'Husband', '+91 98765 12345', 'karan@gmail.com',  1, 1),
(17, 'Rekha Sharma',   'Mother',  '+91 98765 99988', 'rekha@gmail.com',  0, 1),
(18, 'Anand Reddy',    'Father',  '+91 98765 77766', 'anand@gmail.com',  1, 1),
(7,  'Pooja Singh',    'Wife',    '+91 98765 55544', 'pooja@gmail.com',  1, 1);

-- ─────────────────────────────────────────────────────────────
-- TRANSFER REQUESTS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO transfer_requests (user_id, transfer_type, from_location, to_location, reason, preferred_date, status, manager_action, hr_action, admin_action) VALUES
(18, 'marriage',   'Bengaluru', 'Hyderabad', 'Getting married to someone based in Hyderabad. Requesting office transfer.',              '2025-07-01', 'approved', 'approved', 'approved', 'approved'),
(36, 'hybrid',     'Hyderabad', 'Hyderabad', 'Requesting 3 days WFH per week due to elderly parent care responsibilities at home.',    '2025-06-15', 'pending',  'pending',  'pending',  'pending'),
(31, 'office',     'Bengaluru', 'Pune',      'Spouse transferred to Pune. Requesting office transfer to maintain work-life balance.',  '2025-08-01', 'under_review','approved','pending','pending');

-- ─────────────────────────────────────────────────────────────
-- NIGHT SHIFT APPROVALS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO safety_night_shift_approvals (user_id, shift_date, start_time, end_time, cab_required, female_cab, escort_req, status, approved_by, approved_at) VALUES
(17, '2025-06-14', '20:00:00', '06:00:00', 1, 1, 0, 'approved', 7, NOW()),
(18, '2025-06-15', '20:00:00', '04:00:00', 1, 1, 1, 'pending',  NULL, NULL),
(17, '2025-06-10', '20:00:00', '06:00:00', 1, 1, 0, 'approved', 7, DATE_SUB(NOW(),INTERVAL 3 DAY));

-- ═══════════════════════════════════════════════════════════════
-- DEMO DATA INSERT COMPLETE
-- Total employees: ~100 | Departments: 12 | Grades: 12 levels
-- ⚠️  DEMO DATA ONLY — NOT REAL EMPLOYEES
-- ═══════════════════════════════════════════════════════════════
