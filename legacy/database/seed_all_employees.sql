-- ============================================================
-- seed_all_employees.sql — v6.0 Full Team Seed Data
-- Seeds all 9 employees: Priya, Rahul, Aisha, Vikram, Sneha,
--   Piyush, Harsh Vardhan, Kartik, Riya, Divya
-- Run AFTER: schema.sql → migrate_v5.1.sql → migrate_v6.0.sql
-- Usage: mysql -u root -p workforce_intelligence < database/seed_all_employees.sql
-- ============================================================

USE workforce_intelligence;

-- ── Ensure departments exist ──────────────────────────────
INSERT IGNORE INTO departments (dept_name, description) VALUES
  ('Engineering', 'Software development and technical operations'),
  ('Product',     'Product management, roadmap and analytics'),
  ('Design',      'UI/UX design and brand'),
  ('HR',          'Human resources and people management'),
  ('Finance',     'Accounts, payroll and financial operations'),
  ('Marketing',   'Digital marketing, growth and content');

-- ── Reference IDs ─────────────────────────────────────────
SET @admin_id   = 1;
SET @eng_dept   = (SELECT dept_id FROM departments WHERE dept_name='Engineering' LIMIT 1);
SET @prod_dept  = (SELECT dept_id FROM departments WHERE dept_name='Product'     LIMIT 1);
SET @des_dept   = (SELECT dept_id FROM departments WHERE dept_name='Design'      LIMIT 1);
SET @hr_dept    = (SELECT dept_id FROM departments WHERE dept_name='HR'          LIMIT 1);
SET @fin_dept   = (SELECT dept_id FROM departments WHERE dept_name='Finance'     LIMIT 1);
SET @mkt_dept   = (SELECT dept_id FROM departments WHERE dept_name='Marketing'   LIMIT 1);
SET @morn_shift = (SELECT shift_id FROM shifts WHERE shift_name='Morning Shift' LIMIT 1);

-- ═══════════════════════════════════════════════════════════
-- 1. HARSH VARDHAN — Engineering Manager (role 3)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Harsh Vardhan','harsh.vardhan@wip.com','$2b$10$hV1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',3,3,2980,'active',@eng_dept,135000.00,'+91 95566 77889','Engineering Manager','2019-04-01','1990-03-15','male','full_time',@morn_shift);
SET @harsh_id = (SELECT user_id FROM users WHERE email='harsh.vardhan@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@harsh_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@harsh_id,2025,'sick',12,1,0,2),(@harsh_id,2025,'casual',12,2,0,1),
  (@harsh_id,2025,'earned',15,0,5,3),(@harsh_id,2025,'unpaid',0,0,0,0),(@harsh_id,2025,'other',0,0,0,0);

-- ═══════════════════════════════════════════════════════════
-- 2. PRIYA SHARMA — Senior Developer (role 2)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Priya Sharma','priya.sharma@wip.com','$2b$10$pS1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,3,2840,'active',@eng_dept,85000.00,'+91 98765 43210','Senior Developer','2022-03-01','1997-09-12','female','full_time',@morn_shift);
SET @priya_id = (SELECT user_id FROM users WHERE email='priya.sharma@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@priya_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@priya_id,2025,'sick',12,0,0,0),(@priya_id,2025,'casual',12,3,3,0),
  (@priya_id,2025,'earned',15,0,0,0),(@priya_id,2025,'unpaid',0,0,0,0),(@priya_id,2025,'other',0,0,0,0);

-- ═══════════════════════════════════════════════════════════
-- 3. PIYUSH SHARMA — Full Stack Developer (role 2) — DETAILED
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,profile_notes,designation,join_date,date_of_birth,address,emergency_contact,gender,employment_type,shift_id,last_login)
VALUES (
  'Piyush Sharma','piyush.sharma@wip.com',
  '$2b$10$X9v2QkLmN3pR7sT1uV5wOeYZaB6cD8eF0gH2iJ4kL6mN8oP0qR2s',
  2,3,2200,'active',@eng_dept,72000.00,'+91 93344 55667',
  'Full Stack Developer with 2+ years in Node.js and React. Quick learner with strong debugging skills.',
  'Full Stack Developer','2022-11-14','1998-07-22',
  'Flat 4B, Sunrise Apartments, Sector 18, Noida, UP - 201301',
  'Sunita Sharma (Mother) — +91 98800 11223',
  'male','full_time',@morn_shift,'2025-05-07 09:05:00'
);
SET @piyush_id = (SELECT user_id FROM users WHERE email='piyush.sharma@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@piyush_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,@admin_id);

-- Piyush attendance (23 records)
INSERT IGNORE INTO attendance (user_id,work_date,clock_in,clock_out,status,total_hours,ot_hours,remarks) VALUES
  (@piyush_id,'2025-05-07','2025-05-07 09:05:00',NULL,'present',NULL,0.00,NULL),
  (@piyush_id,'2025-05-06','2025-05-06 09:02:00','2025-05-06 19:30:00','present',10.47,2.47,'Stayed late for deployment'),
  (@piyush_id,'2025-05-05','2025-05-05 09:10:00','2025-05-05 18:15:00','present',9.08,1.08,NULL),
  (@piyush_id,'2025-05-02','2025-05-02 09:00:00','2025-05-02 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-05-01','2025-05-01 09:18:00','2025-05-01 18:10:00','late',8.87,0.87,'Metro delay'),
  (@piyush_id,'2025-04-30','2025-04-30 09:03:00','2025-04-30 20:00:00','present',10.95,2.95,'Month-end push'),
  (@piyush_id,'2025-04-29','2025-04-29 09:00:00','2025-04-29 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-28','2025-04-28 09:05:00','2025-04-28 18:05:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-25','2025-04-25 09:00:00','2025-04-25 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-24',NULL,NULL,'absent',NULL,0.00,'Personal emergency'),
  (@piyush_id,'2025-04-23','2025-04-23 09:00:00','2025-04-23 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-22','2025-04-22 09:00:00','2025-04-22 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-21','2025-04-21 09:00:00','2025-04-21 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-18','2025-04-18 09:00:00','2025-04-18 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-17','2025-04-17 09:00:00','2025-04-17 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-16','2025-04-16 10:30:00','2025-04-16 14:30:00','half_day',4.00,0.00,'Approved half day'),
  (@piyush_id,'2025-04-15','2025-04-15 09:05:00','2025-04-15 18:10:00','present',9.08,1.08,NULL),
  (@piyush_id,'2025-04-14','2025-04-14 09:00:00','2025-04-14 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-11',NULL,NULL,'leave',NULL,0.00,'Casual leave approved'),
  (@piyush_id,'2025-04-10',NULL,NULL,'leave',NULL,0.00,'Casual leave approved'),
  (@piyush_id,'2025-04-09','2025-04-09 09:00:00','2025-04-09 18:00:00','present',9.00,1.00,NULL),
  (@piyush_id,'2025-04-08','2025-04-08 09:22:00','2025-04-08 18:10:00','late',8.80,0.80,'Traffic'),
  (@piyush_id,'2025-04-07','2025-04-07 09:00:00','2025-04-07 18:00:00','present',9.00,1.00,NULL);

-- Piyush leave requests
INSERT IGNORE INTO leave_requests (user_id,leave_type,from_date,to_date,days,reason,status,reviewed_by,reviewed_at) VALUES
  (@piyush_id,'casual','2025-04-10','2025-04-11',2,'Personal work at home town','approved',@harsh_id,'2025-04-08 11:30:00'),
  (@piyush_id,'half_day','2025-04-16','2025-04-16',1,'Bank work','approved',@harsh_id,'2025-04-15 16:00:00'),
  (@piyush_id,'earned','2025-05-15','2025-05-18',4,'Family trip to Rishikesh','pending',NULL,NULL),
  (@piyush_id,'casual','2025-03-20','2025-03-21',2,'Attending friend wedding','rejected',@harsh_id,'2025-03-18 10:00:00');

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@piyush_id,2025,'sick',12,0,0,0),(@piyush_id,2025,'casual',12,2,0,1),
  (@piyush_id,2025,'earned',15,0,4,0),(@piyush_id,2025,'unpaid',0,0,0,0),(@piyush_id,2025,'other',0,0,0,0);

-- Piyush salary records (6 months)
INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@piyush_id,4,2025,79800.00,0.00,10800.00,69000.00,'paid','2025-04-30','April 2025 — Basic+HRA+Allowances. PF+PT deducted.',@admin_id),
  (@piyush_id,3,2025,79800.00,0.00,10800.00,69000.00,'paid','2025-03-31','March 2025',@admin_id),
  (@piyush_id,2,2025,79800.00,0.00,11800.00,68000.00,'paid','2025-02-28','Feb — 1 absent day deduction',@admin_id),
  (@piyush_id,1,2025,79800.00,5000.00,10800.00,74000.00,'paid','2025-01-31','Jan — New Year performance bonus',@admin_id),
  (@piyush_id,12,2024,72000.00,8000.00,10200.00,69800.00,'paid','2024-12-31','Dec — Annual bonus',@admin_id),
  (@piyush_id,11,2024,72000.00,0.00,10200.00,61800.00,'paid','2024-11-30','Nov — First month (pro-rated)',@admin_id);

-- Piyush salary revisions
INSERT IGNORE INTO salary_revisions (user_id,old_salary,new_salary,effective_date,reason,revised_by) VALUES
  (@piyush_id,60000.00,72000.00,'2022-11-14','Joining salary',@admin_id),
  (@piyush_id,72000.00,72000.00,'2023-11-14','Annual review — probation extended',@admin_id),
  (@piyush_id,72000.00,78000.00,'2024-04-01','Performance increment 8.3%',@admin_id),
  (@piyush_id,78000.00,72000.00,'2024-11-14','Role re-alignment, CTC unchanged',@admin_id);

-- Piyush advances
INSERT IGNORE INTO salary_advances (user_id,amount,reason,status,approved_by,approved_at,repay_months,repaid_amount) VALUES
  (@piyush_id,20000.00,'Vehicle repair — two-wheeler engine overhaul','approved',@admin_id,'2025-04-01 10:30:00',2,10000.00),
  (@piyush_id,15000.00,'Laptop upgrade for WFH setup','pending',NULL,NULL,3,0.00);

-- Piyush expense claims
INSERT IGNORE INTO expense_claims (user_id,claim_date,category,amount,description,status,reviewed_by,reviewed_at,paid_on) VALUES
  (@piyush_id,'2025-04-20','travel',1800.00,'Cab to client office — Gurgaon','paid',@harsh_id,'2025-04-22 11:00:00','2025-04-30'),
  (@piyush_id,'2025-04-05','food',650.00,'Team lunch during sprint planning','approved',@harsh_id,'2025-04-07 09:30:00',NULL),
  (@piyush_id,'2025-03-15','equipment',3200.00,'Mechanical keyboard for workstation','approved',@harsh_id,'2025-03-17 14:00:00',NULL),
  (@piyush_id,'2025-02-28','travel',2400.00,'Pune site visit for integration testing','paid',@harsh_id,'2025-03-01 10:00:00','2025-03-31'),
  (@piyush_id,'2025-05-05','other',1200.00,'AWS certification exam fee','pending',NULL,NULL,NULL);

-- Piyush tasks
INSERT IGNORE INTO tasks (title,description,assigned_by,assigned_to,priority,status,due_date,timer_hours,achievement_level,completed_at) VALUES
  ('Full Stack Portal Module v1','Build employee self-service portal with React + API integration.',@harsh_id,@piyush_id,'High','Completed','2025-04-15',48,'excellent','2025-04-14 17:30:00'),
  ('Authentication Middleware Refactor','JWT auth refactor to support Manager/HR roles. Add token expiry.',@harsh_id,@piyush_id,'High','Completed','2025-04-20',24,'outstanding','2025-04-19 16:45:00'),
  ('Database Query Optimization','Optimize attendance+salary queries. Target <200ms.',@harsh_id,@piyush_id,'Medium','Completed','2025-04-30',48,'good','2025-04-29 18:00:00'),
  ('Unit Tests — Admin Controller','Write unit tests for adminController.js. 80%+ coverage.',@harsh_id,@piyush_id,'Medium','Completed','2025-05-02',48,'good','2025-05-01 17:00:00'),
  ('Full Stack Portal Module v2','Extend portal: payslip PDF, advance form, expense claim.',@harsh_id,@piyush_id,'High','In Progress','2025-05-20',72,'none',NULL),
  ('Mobile Responsive Fixes','Fix layout issues on tasks/salary/leave.html for <640px.',@harsh_id,@piyush_id,'Medium','In Progress','2025-05-14',24,'none',NULL),
  ('API Rate Limiting','Implement rate limiting on all public endpoints.',@harsh_id,@piyush_id,'Medium','Pending','2025-05-25',24,'none',NULL),
  ('Email Notification Service','SMTP integration for leave/salary/task alert emails.',@harsh_id,@piyush_id,'Low','Pending','2025-06-05',48,'none',NULL),
  ('Security Audit — Input Validation','Joi/Zod validation on all controller endpoints.',@harsh_id,@piyush_id,'High','Overdue','2025-05-05',48,'none',NULL);

-- Piyush achievements
INSERT IGNORE INTO achievements (user_id,achievement_type,level,points,message,awarded_by) VALUES
  (@piyush_id,'task_complete','excellent',150,'Portal Module v1 delivered a day early. Zero bugs in review.',@harsh_id),
  (@piyush_id,'task_complete','outstanding',200,'Auth middleware refactor ahead of schedule. Role guards adopted by whole team.',@harsh_id),
  (@piyush_id,'weekly_star','good',100,'Most commits this week — 3 modules in parallel.',@admin_id),
  (@piyush_id,'monthly_star','good',150,'Best attendance in Engineering for April 2025.',@admin_id);

-- Piyush documents
INSERT IGNORE INTO employee_documents (user_id,doc_type,doc_name,file_path,uploaded_by) VALUES
  (@piyush_id,'offer_letter','Offer Letter — Nov 2022','/uploads/docs/piyush/offer_letter_nov2022.pdf',@admin_id),
  (@piyush_id,'contract','Employment Contract v1','/uploads/docs/piyush/employment_contract_2022.pdf',@admin_id),
  (@piyush_id,'id_proof','Aadhaar Card','/uploads/docs/piyush/aadhaar.pdf',@piyush_id),
  (@piyush_id,'id_proof','PAN Card','/uploads/docs/piyush/pan.pdf',@piyush_id),
  (@piyush_id,'certificate','B.Tech Computer Science 2021','/uploads/docs/piyush/btech_degree.pdf',@piyush_id),
  (@piyush_id,'certificate','AWS Cloud Practitioner 2024','/uploads/docs/piyush/aws_cert.pdf',@piyush_id),
  (@piyush_id,'other','Increment Letter — Apr 2024','/uploads/docs/piyush/increment_apr2024.pdf',@admin_id);

-- Piyush productivity scores
INSERT IGNORE INTO productivity_scores (user_id,score_date,completion_rate,delay_count,productivity_score) VALUES
  (@piyush_id,'2025-05-01',100.00,0,96.50),
  (@piyush_id,'2025-04-01',85.71,1,82.30),
  (@piyush_id,'2025-03-01',80.00,1,78.50),
  (@piyush_id,'2025-02-01',75.00,2,72.10),
  (@piyush_id,'2025-01-01',83.33,1,80.60),
  (@piyush_id,'2024-12-01',70.00,2,68.40);

-- ═══════════════════════════════════════════════════════════
-- 4. KARTIK JAISWAL — Product Analyst (role 2)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Kartik Jaiswal','kartik.jaiswal@wip.com','$2b$10$kJ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,2,1850,'active',@prod_dept,68000.00,'+91 87766 55443','Product Analyst','2023-07-10','2000-01-18','male','full_time',@morn_shift);
SET @kartik_id = (SELECT user_id FROM users WHERE email='kartik.jaiswal@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@kartik_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@kartik_id,2025,'sick',12,2,0,0),(@kartik_id,2025,'casual',12,1,0,0),
  (@kartik_id,2025,'earned',15,0,0,0),(@kartik_id,2025,'unpaid',0,0,0,0),(@kartik_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@kartik_id,4,2025,63600.00,0.00,9200.00,54400.00,'paid','2025-04-30','April 2025',@admin_id),
  (@kartik_id,3,2025,63600.00,0.00,9200.00,54400.00,'pending',NULL,'March 2025',@admin_id);

INSERT IGNORE INTO salary_advances (user_id,amount,reason,status,approved_by,approved_at,repay_months,repaid_amount) VALUES
  (@kartik_id,30000.00,'Education fee — MBA entrance coaching','pending',NULL,NULL,3,0.00);

INSERT IGNORE INTO attendance (user_id,work_date,clock_in,clock_out,status,total_hours,ot_hours) VALUES
  (@kartik_id,'2025-05-07','2025-05-07 09:18:00','2025-05-07 18:05:00','late',8.78,0.78),
  (@kartik_id,'2025-05-06','2025-05-06 09:05:00','2025-05-06 18:00:00','present',8.92,0.92),
  (@kartik_id,'2025-05-05',NULL,NULL,'absent',NULL,0.00),
  (@kartik_id,'2025-05-02','2025-05-02 09:00:00','2025-05-02 18:00:00','present',9.00,1.00),
  (@kartik_id,'2025-05-01','2025-05-01 09:00:00','2025-05-01 18:00:00','present',9.00,1.00);

INSERT IGNORE INTO leave_requests (user_id,leave_type,from_date,to_date,days,reason,status) VALUES
  (@kartik_id,'sick','2025-05-12','2025-05-13',2,'Fever and flu','pending');

-- ═══════════════════════════════════════════════════════════
-- 5. RAHUL MEHTA — Product Manager (role 3)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Rahul Mehta','rahul.mehta@wip.com','$2b$10$rM1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',3,3,2640,'active',@prod_dept,120000.00,'+91 91234 56789','Product Manager Lead','2021-01-15','1992-05-08','male','full_time',@morn_shift);
SET @rahul_id = (SELECT user_id FROM users WHERE email='rahul.mehta@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@rahul_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@rahul_id,2025,'sick',12,1,0,2),(@rahul_id,2025,'casual',12,2,0,1),
  (@rahul_id,2025,'earned',15,0,0,3),(@rahul_id,2025,'unpaid',0,0,0,0),(@rahul_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@rahul_id,4,2025,112000.00,0.00,18000.00,94000.00,'pending',NULL,'April 2025',@admin_id),
  (@rahul_id,3,2025,112000.00,0.00,18000.00,94000.00,'paid','2025-03-31','March 2025',@admin_id);

-- ═══════════════════════════════════════════════════════════
-- 6. AISHA KHAN — UI/UX Designer (role 2)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Aisha Khan','aisha.khan@wip.com','$2b$10$aK1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,2,1920,'pending',@des_dept,65000.00,'+91 99887 76655','UI/UX Designer','2024-02-05','2001-11-30','female','full_time',@morn_shift);
SET @aisha_id = (SELECT user_id FROM users WHERE email='aisha.khan@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@aisha_id,TRUE,FALSE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@aisha_id,2025,'sick',12,1,0,0),(@aisha_id,2025,'casual',12,1,0,0),
  (@aisha_id,2025,'earned',14,0,0,0),(@aisha_id,2025,'unpaid',0,0,0,0),(@aisha_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@aisha_id,4,2025,60750.00,0.00,9000.00,51750.00,'pending',NULL,'April 2025',@admin_id);

-- ═══════════════════════════════════════════════════════════
-- 7. VIKRAM NAIR — HR Manager (role 4)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Vikram Nair','vikram.nair@wip.com','$2b$10$vN1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',4,3,2110,'active',@hr_dept,95000.00,'+91 97654 32109','HR Manager','2020-06-01','1989-04-22','male','full_time',@morn_shift);
SET @vikram_id = (SELECT user_id FROM users WHERE email='vikram.nair@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@vikram_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@vikram_id,2025,'sick',12,2,0,0),(@vikram_id,2025,'casual',12,1,0,1),
  (@vikram_id,2025,'earned',15,0,0,5),(@vikram_id,2025,'unpaid',0,0,0,0),(@vikram_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@vikram_id,4,2025,88750.00,0.00,14250.00,74500.00,'pending',NULL,'April 2025',@admin_id),
  (@vikram_id,3,2025,88750.00,0.00,14250.00,74500.00,'paid','2025-03-31','March 2025',@admin_id);

-- ═══════════════════════════════════════════════════════════
-- 8. SNEHA PATEL — Backend Developer (role 2)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Sneha Patel','sneha.patel@wip.com','$2b$10$sP1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,3,2480,'active',@eng_dept,78000.00,'+91 88990 01122','Backend Developer','2022-09-01','1999-03-07','female','full_time',@morn_shift);
SET @sneha_id = (SELECT user_id FROM users WHERE email='sneha.patel@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@sneha_id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@sneha_id,2025,'sick',12,1,0,0),(@sneha_id,2025,'casual',12,2,0,0),
  (@sneha_id,2025,'earned',15,0,6,0),(@sneha_id,2025,'unpaid',0,0,0,0),(@sneha_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@sneha_id,4,2025,72850.00,0.00,11700.00,61150.00,'paid','2025-04-30','April 2025',@admin_id),
  (@sneha_id,3,2025,72850.00,0.00,11700.00,61150.00,'paid','2025-03-31','March 2025',@admin_id);

-- ═══════════════════════════════════════════════════════════
-- 9. RIYA KAPOOR — Digital Marketing Lead (role 2)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Riya Kapoor','riya.kapoor@wip.com','$2b$10$rK1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,2,2050,'active',@mkt_dept,70000.00,'+91 96655 44332','Digital Marketing Lead','2023-03-20','1998-08-25','female','full_time',@morn_shift);
SET @riya_id = (SELECT user_id FROM users WHERE email='riya.kapoor@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@riya_id,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@riya_id,2025,'sick',12,0,0,0),(@riya_id,2025,'casual',12,2,0,0),
  (@riya_id,2025,'earned',12,0,0,0),(@riya_id,2025,'unpaid',0,0,0,0),(@riya_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@riya_id,4,2025,65450.00,0.00,10500.00,54950.00,'pending',NULL,'April 2025',@admin_id);

INSERT IGNORE INTO expense_claims (user_id,claim_date,category,amount,description,status,reviewed_by,reviewed_at) VALUES
  (@riya_id,'2025-05-03','equipment',6500.00,'Camera for content shoot','pending',NULL,NULL),
  (@riya_id,'2025-04-18','travel',3200.00,'Mumbai brand event — travel and stay','approved',@vikram_id,'2025-04-20 10:00:00');

INSERT IGNORE INTO leave_requests (user_id,leave_type,from_date,to_date,days,reason,status) VALUES
  (@riya_id,'half_day','2025-05-09','2025-05-09',1,'Doctor appointment — morning only','pending');

-- ═══════════════════════════════════════════════════════════
-- 10. DIVYA MENON — Finance Analyst (role 2)
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO users (full_name,email,password_hash,role_id,access_level,total_points,status,department_id,base_salary,phone,designation,join_date,date_of_birth,gender,employment_type,shift_id)
VALUES ('Divya Menon','divya.menon@wip.com','$2b$10$dM1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ',2,2,1980,'active',@fin_dept,75000.00,'+91 92233 44556','Finance Analyst','2022-08-15','1997-12-03','female','full_time',@morn_shift);
SET @divya_id = (SELECT user_id FROM users WHERE email='divya.menon@wip.com' LIMIT 1);

INSERT IGNORE INTO user_permissions (user_id,can_view_analytics,can_view_reports,can_use_chat,can_request_extension,can_view_salary,can_view_team,can_view_attendance,can_clock_in_out,can_request_advance,updated_by)
VALUES (@divya_id,TRUE,TRUE,TRUE,FALSE,TRUE,FALSE,TRUE,TRUE,FALSE,@admin_id);

INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@divya_id,2025,'sick',12,2,0,0),(@divya_id,2025,'casual',12,1,0,0),
  (@divya_id,2025,'earned',13,0,0,1),(@divya_id,2025,'unpaid',0,0,0,0),(@divya_id,2025,'other',0,0,0,0);

INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@divya_id,4,2025,70100.00,0.00,11250.00,58850.00,'paid','2025-04-30','April 2025',@admin_id);

INSERT IGNORE INTO expense_claims (user_id,claim_date,category,amount,description,status,reviewed_by,reviewed_at,paid_on) VALUES
  (@divya_id,'2025-04-25','other',3200.00,'Finance conference registration fee','approved',@vikram_id,'2025-04-26 09:00:00',NULL);

-- ═══════════════════════════════════════════════════════════
-- Update department managers
-- ═══════════════════════════════════════════════════════════
UPDATE departments SET manager_id=@harsh_id  WHERE dept_name='Engineering';
UPDATE departments SET manager_id=@rahul_id  WHERE dept_name='Product';
UPDATE departments SET manager_id=@vikram_id WHERE dept_name='HR';
UPDATE departments SET manager_id=@riya_id   WHERE dept_name='Marketing';
UPDATE departments SET manager_id=@divya_id  WHERE dept_name='Finance';

-- Assign users to departments
UPDATE users SET department_id=@eng_dept  WHERE email IN ('priya.sharma@wip.com','piyush.sharma@wip.com','harsh.vardhan@wip.com','sneha.patel@wip.com');
UPDATE users SET department_id=@prod_dept WHERE email IN ('rahul.mehta@wip.com','kartik.jaiswal@wip.com');
UPDATE users SET department_id=@des_dept  WHERE email='aisha.khan@wip.com';
UPDATE users SET department_id=@hr_dept   WHERE email='vikram.nair@wip.com';
UPDATE users SET department_id=@fin_dept  WHERE email='divya.menon@wip.com';
UPDATE users SET department_id=@mkt_dept  WHERE email='riya.kapoor@wip.com';

-- ═══════════════════════════════════════════════════════════
-- Holiday calendar
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO holiday_calendar (name, holiday_date, holiday_type, description) VALUES
  ('Republic Day',            '2025-01-26','public', 'National holiday'),
  ('Holi',                    '2025-03-14','public', 'Festival of colors'),
  ('Good Friday',             '2025-04-18','public', 'Christian holiday'),
  ('Eid ul-Fitr',             '2025-03-31','public', 'End of Ramadan'),
  ('Company Foundation Day',  '2025-05-15','company','WIP annual celebration'),
  ('Independence Day',        '2025-08-15','public', 'National holiday'),
  ('Ganesh Chaturthi',        '2025-08-27','optional','Regional holiday'),
  ('Dussehra',                '2025-10-02','public', 'National holiday'),
  ('Diwali',                  '2025-10-20','public', 'Festival of lights'),
  ('Diwali (Day 2)',          '2025-10-21','optional','Optional holiday'),
  ('Christmas',               '2025-12-25','public', 'Christian holiday'),
  ('New Year Eve',            '2025-12-31','optional','Optional half day');

-- ═══════════════════════════════════════════════════════════
-- Audit log entries for all onboardings
-- ═══════════════════════════════════════════════════════════
INSERT IGNORE INTO audit_logs (actor_id,action,entity_type,new_values,ip_address) VALUES
  (@admin_id,'BULK_ONBOARD','users',JSON_OBJECT('employees_added',9,'batch','v6.0 launch'),'192.168.1.1'),
  (@admin_id,'GENERATE_SALARY','salary_records',JSON_OBJECT('month',4,'year',2025,'count',10),'192.168.1.1'),
  (@admin_id,'CREATE_DEPT','departments',JSON_OBJECT('depts_created','Marketing,Finance'),'192.168.1.1');

-- ═══════════════════════════════════════════════════════════
-- Final verification query
-- ═══════════════════════════════════════════════════════════
SELECT
  u.user_id,
  u.full_name,
  r.role_name,
  d.dept_name,
  u.designation,
  FORMAT(u.base_salary,0) AS base_salary,
  u.total_points AS points,
  u.status,
  u.gender,
  u.join_date,
  (SELECT COUNT(*) FROM tasks        WHERE assigned_to=u.user_id)  AS tasks,
  (SELECT COUNT(*) FROM salary_records WHERE user_id=u.user_id)    AS payslips,
  (SELECT COUNT(*) FROM leave_balances WHERE user_id=u.user_id)    AS leave_types,
  (SELECT COUNT(*) FROM attendance     WHERE user_id=u.user_id)    AS att_records
FROM users u
JOIN roles r ON u.role_id=r.role_id
LEFT JOIN departments d ON u.department_id=d.dept_id
WHERE u.email LIKE '%wip.com'
ORDER BY u.join_date ASC;

SELECT CONCAT('✅ All employees seeded — ',COUNT(*),' users in workforce_intelligence') AS result
FROM users WHERE email LIKE '%wip.com';
