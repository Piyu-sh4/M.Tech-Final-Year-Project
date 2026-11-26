-- ============================================================
-- seed_piyush_sharma.sql — Complete data for Mr. Piyush Sharma
-- FIXED: Uses email-based ID lookup, no hardcoded IDs
-- Run AFTER schema.sql (or workforce_intelligence_COMPLETE.sql)
-- mysql -u root -p workforce_intelligence < seed_piyush_sharma.sql
-- ============================================================
USE workforce_intelligence;

-- ── Safe ID lookups (no hardcoded IDs) ───────────────────────────
SET @eng_dept   = (SELECT dept_id  FROM departments WHERE dept_name  = 'Engineering'    LIMIT 1);
SET @morn_shift = (SELECT shift_id FROM shifts      WHERE shift_name = 'Morning Shift'  LIMIT 1);
SET @harsh_id   = (SELECT user_id  FROM users       WHERE email      = 'harsh.vardhan@wip.com' LIMIT 1);
SET @admin_id   = (SELECT user_id  FROM users       WHERE role_id    = 1                LIMIT 1);

-- Fallback: if admin doesn't exist yet, use 1
SET @admin_id = COALESCE(@admin_id, 1);

-- ── 1. USER PROFILE ───────────────────────────────────────────────
INSERT IGNORE INTO users (
  full_name, email, password_hash, role_id,
  access_level, total_points, status,
  department_id, base_salary, phone, profile_notes,
  designation, join_date, date_of_birth,
  address, emergency_contact,
  gender, employment_type, shift_id, last_login
) VALUES (
  'Piyush Sharma',
  'piyush.sharma@wip.com',
  '$2b$10$X9v2QkLmN3pR7sT1uV5wOeYZaB6cD8eF0gH2iJ4kL6mN8oP0qR2s',
  2, 3, 2200, 'active',
  @eng_dept, 72000.00, '+91 93344 55667',
  'Full Stack Developer with 2+ years in Node.js and React. Quick learner with strong debugging skills.',
  'Full Stack Developer', '2022-11-14', '1998-07-22',
  'Flat 4B, Sunrise Apartments, Sector 18, Noida, UP - 201301',
  'Sunita Sharma (Mother) +91 98800 11223',
  'male', 'full_time', @morn_shift, '2025-05-07 09:05:00'
);
SET @piyush_id = (SELECT user_id FROM users WHERE email = 'piyush.sharma@wip.com' LIMIT 1);

-- ── 2. PERMISSIONS ────────────────────────────────────────────────
INSERT IGNORE INTO user_permissions (
  user_id, can_view_analytics, can_view_reports, can_use_chat,
  can_request_extension, can_view_salary, can_view_team,
  can_view_attendance, can_clock_in_out, can_request_advance, updated_by
) VALUES (@piyush_id, TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE, @admin_id);

-- ── 3. ATTENDANCE ─────────────────────────────────────────────────
INSERT IGNORE INTO attendance (user_id,work_date,clock_in,clock_out,status,total_hours,ot_hours,remarks) VALUES
  (@piyush_id,'2025-05-07','2025-05-07 09:05:00',NULL,'present',NULL,0.00,NULL),
  (@piyush_id,'2025-05-06','2025-05-06 09:02:00','2025-05-06 19:30:00','present',10.47,2.47,'Late deployment'),
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

-- ── 4. LEAVE REQUESTS ─────────────────────────────────────────────
INSERT IGNORE INTO leave_requests (user_id,leave_type,from_date,to_date,days,reason,status,reviewed_by,reviewed_at) VALUES
  (@piyush_id,'casual',  '2025-04-10','2025-04-11',2,'Personal work at home town','approved',@harsh_id,'2025-04-08 11:30:00'),
  (@piyush_id,'half_day','2025-04-16','2025-04-16',1,'Bank work',                  'approved',@harsh_id,'2025-04-15 16:00:00'),
  (@piyush_id,'earned',  '2025-05-15','2025-05-18',4,'Family trip to Rishikesh',   'pending', NULL,      NULL),
  (@piyush_id,'casual',  '2025-03-20','2025-03-21',2,'Attending friend wedding',   'rejected',@harsh_id,'2025-03-18 10:00:00');

-- ── 5. LEAVE BALANCES ─────────────────────────────────────────────
INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled,taken,pending,carry_forward) VALUES
  (@piyush_id,2025,'sick',   12,0,0,0),
  (@piyush_id,2025,'casual', 12,2,0,1),
  (@piyush_id,2025,'earned', 15,0,4,0),
  (@piyush_id,2025,'unpaid',  0,0,0,0),
  (@piyush_id,2025,'other',   0,0,0,0);

-- ── 6. SALARY RECORDS ─────────────────────────────────────────────
INSERT IGNORE INTO salary_records (user_id,month,year,base_salary,bonus,deductions,net_salary,payment_status,paid_on,remarks,created_by) VALUES
  (@piyush_id,4,2025,79800,0,    10800,69000,'paid',      '2025-04-30','April 2025 itemized payroll',    @admin_id),
  (@piyush_id,3,2025,79800,0,    10800,69000,'paid',      '2025-03-31','March 2025',                     @admin_id),
  (@piyush_id,2,2025,79800,0,    11800,68000,'paid',      '2025-02-28','Feb — 1 absent day deduction',   @admin_id),
  (@piyush_id,1,2025,79800,5000, 10800,74000,'paid',      '2025-01-31','Jan — New Year performance bonus',@admin_id),
  (@piyush_id,12,2024,72000,8000,10200,69800,'paid',      '2024-12-31','Dec — Annual bonus',             @admin_id),
  (@piyush_id,11,2024,72000,0,   10200,61800,'paid',      '2024-11-30','Nov — First month pro-rated',    @admin_id);

-- ── 7. SALARY LINE ITEMS (April 2025) ────────────────────────────
SET @sal_apr = (SELECT salary_id FROM salary_records WHERE user_id=@piyush_id AND month=4 AND year=2025 LIMIT 1);
INSERT IGNORE INTO salary_line_items (salary_id,component_id,amount)
  SELECT @sal_apr, component_id, amount FROM (
    SELECT 'Basic Salary'      cname, 43200.00 amount UNION ALL
    SELECT 'HRA',                     17280.00         UNION ALL
    SELECT 'Travel Allowance',         1600.00         UNION ALL
    SELECT 'Medical Allowance',        1250.00         UNION ALL
    SELECT 'Special Allowance',       16470.00         UNION ALL
    SELECT 'Provident Fund',           5184.00         UNION ALL
    SELECT 'Professional Tax',          200.00         UNION ALL
    SELECT 'Advance Deduction',        5000.00         UNION ALL
    SELECT 'Leave Deduction',             0.00         UNION ALL
    SELECT 'ESI',                        216.00
  ) v JOIN salary_components sc ON sc.name = v.cname AND sc.is_active = TRUE;

-- ── 8. SALARY REVISIONS ───────────────────────────────────────────
INSERT IGNORE INTO salary_revisions (user_id,old_salary,new_salary,effective_date,reason,revised_by) VALUES
  (@piyush_id,60000,72000,'2022-11-14','Joining salary',                     @admin_id),
  (@piyush_id,72000,72000,'2023-11-14','Annual review — probation extended', @admin_id),
  (@piyush_id,72000,78000,'2024-04-01','Performance increment 8.3%',         @admin_id),
  (@piyush_id,78000,72000,'2024-11-14','Role re-alignment, CTC unchanged',   @admin_id);

-- ── 9. SALARY ADVANCES ────────────────────────────────────────────
INSERT IGNORE INTO salary_advances (user_id,amount,reason,status,approved_by,approved_at,repay_months,repaid_amount) VALUES
  (@piyush_id,20000,'Vehicle repair — two-wheeler engine overhaul','approved',@admin_id,'2025-04-01 10:30:00',2,10000),
  (@piyush_id,15000,'Laptop upgrade for WFH setup',                'pending', NULL,NULL,3,0);

-- ── 10. EXPENSE CLAIMS ────────────────────────────────────────────
INSERT IGNORE INTO expense_claims (user_id,claim_date,category,amount,description,status,reviewed_by,reviewed_at,paid_on) VALUES
  (@piyush_id,'2025-04-20','travel',   1800,'Cab to client office — Gurgaon',      'paid',    @harsh_id,'2025-04-22 11:00:00','2025-04-30'),
  (@piyush_id,'2025-04-05','food',      650,'Team lunch during sprint planning',    'approved',@harsh_id,'2025-04-07 09:30:00',NULL),
  (@piyush_id,'2025-03-15','equipment',3200,'Mechanical keyboard for workstation',  'approved',@harsh_id,'2025-03-17 14:00:00',NULL),
  (@piyush_id,'2025-02-28','travel',   2400,'Pune site visit — integration testing','paid',    @harsh_id,'2025-03-01 10:00:00','2025-03-31'),
  (@piyush_id,'2025-05-05','other',    1200,'AWS certification exam fee',           'pending', NULL,NULL,NULL);

-- ── 11. TASKS ─────────────────────────────────────────────────────
INSERT IGNORE INTO tasks (title,description,assigned_by,assigned_to,priority,status,due_date,achievement_level,completed_at) VALUES
  ('Full Stack Portal Module v1',      'Build employee self-service portal using React + API.',               @harsh_id,@piyush_id,'High',  'Completed', '2025-04-15','excellent',  '2025-04-14 17:30:00'),
  ('Authentication Middleware Refactor','JWT refactor for Manager/HR roles + token expiry enforcement.',      @harsh_id,@piyush_id,'High',  'Completed', '2025-04-20','outstanding','2025-04-19 16:45:00'),
  ('Database Query Optimization',      'Optimize attendance/salary queries. Target <200ms response.',         @harsh_id,@piyush_id,'Medium','Completed', '2025-04-30','good',       '2025-04-29 18:00:00'),
  ('Unit Tests — Admin Controller',    'Write unit tests for adminController.js. Achieve 80%+ coverage.',    @harsh_id,@piyush_id,'Medium','Completed', '2025-05-02','good',       '2025-05-01 17:00:00'),
  ('Full Stack Portal Module v2',      'Extend portal: payslip PDF, advance form, expense claim submission.', @harsh_id,@piyush_id,'High',  'In Progress','2025-05-20','none',       NULL),
  ('Mobile Responsive Fixes',          'Fix layout issues on tasks/salary/leave.html for <640px screens.',   @harsh_id,@piyush_id,'Medium','In Progress','2025-05-14','none',       NULL),
  ('API Rate Limiting',                'Implement rate limiting on all public API endpoints.',                @harsh_id,@piyush_id,'Medium','Pending',    '2025-05-25','none',       NULL),
  ('Email Notification Service',       'SMTP integration for leave/salary/task alert emails.',               @harsh_id,@piyush_id,'Low',   'Pending',    '2025-06-05','none',       NULL),
  ('Security Audit — Input Validation','Joi/Zod validation on all controller endpoints.',                    @harsh_id,@piyush_id,'High',  'Overdue',    '2025-05-05','none',       NULL);

-- Capture task IDs
SET @t1 = (SELECT task_id FROM tasks WHERE title='Full Stack Portal Module v1'       AND assigned_to=@piyush_id LIMIT 1);
SET @t2 = (SELECT task_id FROM tasks WHERE title='Authentication Middleware Refactor' AND assigned_to=@piyush_id LIMIT 1);
SET @t5 = (SELECT task_id FROM tasks WHERE title='Full Stack Portal Module v2'       AND assigned_to=@piyush_id LIMIT 1);
SET @t9 = (SELECT task_id FROM tasks WHERE title='Security Audit — Input Validation' AND assigned_to=@piyush_id LIMIT 1);

-- ── 12. TASK LOGS ─────────────────────────────────────────────────
INSERT IGNORE INTO task_logs (task_id,status,remarks,updated_by) VALUES
  (@t1,'Pending',     'Task assigned to Piyush',                              @harsh_id),
  (@t1,'In Progress', 'Piyush started UI components',                          @piyush_id),
  (@t1,'Completed',   'All modules deployed. Code reviewed by Harsh.',          @piyush_id),
  (@t2,'Pending',     'JWT refactor needed for v6.0',                          @harsh_id),
  (@t2,'In Progress', 'Manager/HR role guards added to middleware',             @piyush_id),
  (@t2,'Completed',   'Expiry enforcement added. All tests passing.',            @piyush_id),
  (@t5,'Pending',     'Portal v2 scope defined',                               @harsh_id),
  (@t5,'In Progress', 'Payslip PDF component 60% complete',                    @piyush_id),
  (@t9,'Pending',     'Security task assigned — high priority',                @harsh_id),
  (@t9,'Overdue',     'Missed — deprioritized due to Portal v2 work',          @harsh_id);

-- ── 13. TASK COMMENTS ─────────────────────────────────────────────
INSERT IGNORE INTO task_comments (task_id,user_id,comment) VALUES
  (@t1,@piyush_id,'Started with attendance module. Using React hooks + Axios. PR by EOD.'),
  (@t1,@harsh_id, 'Good progress. Make sure salary permission gate works before merge.'),
  (@t1,@piyush_id,'Permission gate tested. PR #47 raised and ready for review.'),
  (@t2,@harsh_id, 'Critical for v6.0 release. TokenExpiredError must return 401 clearly.'),
  (@t2,@piyush_id,'Done. Added staffOrAbove and hrOrAbove guards. PR #52 ready.'),
  (@t5,@piyush_id,'Using jsPDF for payslip. Draft ready — needs salary_line_items API.'),
  (@t5,@harsh_id, 'Good. Once PDF done, move to advance form. Keep the UX clean.'),
  (@t9,@harsh_id, 'Piyush please prioritize after Portal v2. Validation gaps are security risk.');

-- ── 14. TASK SUGGESTIONS ─────────────────────────────────────────
INSERT IGNORE INTO task_suggestions (task_id,user_id,suggestion,source) VALUES
  (@t5,@piyush_id,'Use html2canvas + jsPDF for payslip PDF to preserve CSS formatting. Cache salary_line_items on client.','ai'),
  (@t9,@piyush_id,'Use Joi for request body validation and express-validator for query/param sanitization. Start with salary and leave endpoints.','ai'),
  (@t5,@piyush_id,'Add @media print CSS so payslip renders cleanly without nav/footer elements.','ai');

-- ── 15. ACHIEVEMENTS ─────────────────────────────────────────────
INSERT IGNORE INTO achievements (user_id,task_id,achievement_type,level,points,message,awarded_by) VALUES
  (@piyush_id,@t1,'task_complete','excellent',   150,'Portal Module v1 delivered a day early. Zero bugs in review.',              @harsh_id),
  (@piyush_id,@t2,'task_complete','outstanding', 200,'Auth middleware ahead of schedule. Role guards adopted team-wide.',          @harsh_id),
  (@piyush_id,NULL,'weekly_star', 'good',        100,'Most commits this week — contributed to 3 modules in parallel.',            @admin_id),
  (@piyush_id,NULL,'monthly_star','good',        150,'Best attendance in Engineering for April 2025. Zero unplanned absences.',    @admin_id);

-- ── 16. PRODUCTIVITY SCORES ───────────────────────────────────────
INSERT IGNORE INTO productivity_scores (user_id,score_date,completion_rate,delay_count,productivity_score) VALUES
  (@piyush_id,'2025-05-01',100.00,0,96.50),
  (@piyush_id,'2025-04-01', 85.71,1,82.30),
  (@piyush_id,'2025-03-01', 80.00,1,78.50),
  (@piyush_id,'2025-02-01', 75.00,2,72.10),
  (@piyush_id,'2025-01-01', 83.33,1,80.60),
  (@piyush_id,'2024-12-01', 70.00,2,68.40);

-- ── 17. ALERTS ───────────────────────────────────────────────────
INSERT IGNORE INTO alerts (user_id,task_id,alert_message,alert_type,is_read) VALUES
  (@piyush_id,NULL,'✅ Earned leave 15–18 May submitted — pending manager approval.','general',FALSE),
  (@piyush_id,@t5, '📋 Task "Full Stack Portal Module v2" due in 13 days. Progress: 60%.','task_assigned',FALSE),
  (@piyush_id,@t9, '⚠️ Task "Security Audit — Input Validation" is overdue by 2 days.','overdue',FALSE),
  (@piyush_id,NULL,'💰 April 2025 salary credited. Net: ₹69,000.','salary_paid',TRUE),
  (@piyush_id,NULL,'💳 Salary advance ₹20,000 approved. Repayment: ₹10,000 × 2 months.','general',TRUE),
  (@piyush_id,@t2, '🏆 Achievement: Outstanding — Auth Middleware Refactor ahead of schedule.','achievement',TRUE),
  (@piyush_id,@t1, '🏆 Achievement: Excellent — Portal Module v1 delivered early.','achievement',TRUE),
  (@piyush_id,NULL,'💰 March 2025 salary credited. Net: ₹69,000.','salary_paid',TRUE);

-- ── 18. EMPLOYEE DOCUMENTS ───────────────────────────────────────
INSERT IGNORE INTO employee_documents (user_id,doc_type,doc_name,file_path,uploaded_by) VALUES
  (@piyush_id,'offer_letter','Offer Letter — Nov 2022',      '/uploads/docs/piyush/offer_letter.pdf',    @admin_id),
  (@piyush_id,'contract',    'Employment Contract v1',        '/uploads/docs/piyush/contract_2022.pdf',   @admin_id),
  (@piyush_id,'id_proof',    'Aadhaar Card',                  '/uploads/docs/piyush/aadhaar.pdf',         @piyush_id),
  (@piyush_id,'id_proof',    'PAN Card',                      '/uploads/docs/piyush/pan.pdf',             @piyush_id),
  (@piyush_id,'certificate', 'B.Tech Computer Science 2021',  '/uploads/docs/piyush/btech_degree.pdf',    @piyush_id),
  (@piyush_id,'certificate', 'AWS Cloud Practitioner 2024',   '/uploads/docs/piyush/aws_cert.pdf',        @piyush_id),
  (@piyush_id,'other',       'Increment Letter — Apr 2024',   '/uploads/docs/piyush/increment_2024.pdf',  @admin_id);

-- ── 19. AUDIT LOGS ───────────────────────────────────────────────
INSERT IGNORE INTO audit_logs (actor_id,action,entity_type,entity_id,new_values,ip_address) VALUES
  (@admin_id,'CREATE_USER',         'users',           @piyush_id, JSON_OBJECT('email','piyush.sharma@wip.com','role','Employee'),'192.168.1.1'),
  (@admin_id,'APPROVE_USER',        'users',           @piyush_id, JSON_OBJECT('status','active'),'192.168.1.1'),
  (@admin_id,'UPDATE_PERMISSIONS',  'user_permissions',@piyush_id, JSON_OBJECT('can_request_advance',true),'192.168.1.1'),
  (@admin_id,'UPSERT_SALARY',       'salary_records',  NULL,       JSON_OBJECT('month',4,'year',2025,'net',69000),'192.168.1.1'),
  (@admin_id,'MARK_SALARY_PAID',    'salary_records',  NULL,       JSON_OBJECT('paid_on','2025-04-30'),'192.168.1.1'),
  (@admin_id,'REVIEW_ADVANCE',      'salary_advances', NULL,       JSON_OBJECT('amount',20000,'status','approved'),'192.168.1.1'),
  (@harsh_id,'APPROVE_LEAVE',       'leave_requests',  NULL,       JSON_OBJECT('type','casual','days',2,'status','approved'),'10.0.0.8'),
  (@harsh_id,'APPROVE_LEAVE',       'leave_requests',  NULL,       JSON_OBJECT('type','half_day','days',1,'status','approved'),'10.0.0.8'),
  (@harsh_id,'REJECT_LEAVE',        'leave_requests',  NULL,       JSON_OBJECT('type','casual','days',2,'status','rejected'),'10.0.0.8'),
  (@admin_id,'UPDATE_USER',         'users',           @piyush_id, JSON_OBJECT('designation','Full Stack Developer'),'192.168.1.1');


-- ── 20. REPORTS — Piyush performance summary ─────────────────────────────
INSERT IGNORE INTO reports (report_title, report_type, period, status, generated_by, summary, report_data)
VALUES (
  'Employee Profile Report — Piyush Sharma',
  'hr',
  'May 2025',
  'published',
  @admin_id,
  'Complete onboarding and performance summary for Piyush Sharma (Full Stack Developer, Engineering Dept). Join: 14 Nov 2022. Points: 2200. Completion rate: 86.7%. Tasks completed: 4. OT hours: 12.5.',
  JSON_OBJECT(
    'user_id',   @piyush_id,
    'name',      'Piyush Sharma',
    'dept',      'Engineering',
    'join_date', '2022-11-14',
    'salary',    72000,
    'points',    2200,
    'tasks_done', 4,
    'tasks_open', 3,
    'ot_hours',   12.5,
    'completion_rate', 86.7
  )
);

-- ── VERIFY ────────────────────────────────────────────────────────
SELECT
  'Piyush Sharma' AS employee,
  (SELECT COUNT(*) FROM attendance        WHERE user_id=@piyush_id) AS attendance_records,
  (SELECT COUNT(*) FROM salary_records    WHERE user_id=@piyush_id) AS salary_records,
  (SELECT COUNT(*) FROM leave_requests    WHERE user_id=@piyush_id) AS leave_requests,
  (SELECT COUNT(*) FROM tasks             WHERE assigned_to=@piyush_id) AS tasks,
  (SELECT COUNT(*) FROM achievements      WHERE user_id=@piyush_id) AS achievements,
  (SELECT COUNT(*) FROM expense_claims    WHERE user_id=@piyush_id) AS expense_claims,
  (SELECT COUNT(*) FROM employee_documents WHERE user_id=@piyush_id) AS documents,
  (SELECT COUNT(*) FROM alerts            WHERE user_id=@piyush_id) AS alerts,
  (SELECT COUNT(*) FROM audit_logs        WHERE entity_id=@piyush_id OR actor_id=@piyush_id) AS audit_entries;

SELECT 'seed_piyush_sharma.sql complete ✅ — 20 tables populated' AS result;
