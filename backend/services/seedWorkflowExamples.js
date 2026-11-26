// Additional demo rows for modules that had schema but no usable first-run examples.
module.exports = async function seedWorkflowExamples(conn, query) {
  const q = (sql, args) => query(conn,sql,args);
  const [admin] = await q("SELECT user_id FROM users WHERE email='admin@wip.com'");
  const [employee] = await q("SELECT user_id FROM users WHERE email='employee@wfintelligence.com'");
  const a = admin.user_id, e = employee.user_id;
  const lwf = require('../config/moduleCatalog')['lwf-tracker'];
  await q(`INSERT INTO demo_module_records (module_slug,title,details,status,target_date)
    VALUES (?,?,?,?,CURRENT_DATE+INTERVAL 10 DAY)`,[lwf.slug,lwf.example,lwf.details,lwf.states[0]]);
  await q(`INSERT INTO attendance (user_id,work_date,clock_in,clock_out,total_hours,status,remarks)
    SELECT user_id,CURRENT_DATE,TIMESTAMP(CURRENT_DATE,'08:00:00'),TIMESTAMP(CURRENT_DATE,'12:00:00'),4,'present','Demo shift'
    FROM users WHERE role_id=2 AND user_id<>? AND status='active' AND
    user_id NOT IN (SELECT user_id FROM attendance WHERE work_date=CURRENT_DATE) ORDER BY user_id LIMIT 5`,[e]);
  await q(`INSERT INTO leave_requests (user_id,leave_type,from_date,to_date,days,reason,status)
    VALUES (?,'casual',CURRENT_DATE+INTERVAL 5 DAY,CURRENT_DATE+INTERVAL 5 DAY,1,'Demo personal day','pending')`,[e]);
  await q("UPDATE leave_balances SET pending=pending+1 WHERE user_id=? AND year=YEAR(CURRENT_DATE+INTERVAL 5 DAY) AND leave_type='casual'",[e]);
  await q(`INSERT INTO expense_claims (user_id,claim_date,expense_date,category,description,amount,status)
    VALUES (?,CURRENT_DATE-INTERVAL 2 DAY,CURRENT_DATE-INTERVAL 2 DAY,'equipment','Demo headset reimbursement',1250,'pending')`,[e]);
  await q(`INSERT INTO travel_requests (user_id,travel_type,from_location,to_location,travel_date,return_date,purpose,estimated_cost,mode_of_travel,status)
    VALUES (?,'domestic','Demo HQ','Demo training centre',CURRENT_DATE+INTERVAL 10 DAY,CURRENT_DATE+INTERVAL 11 DAY,'New starter workshop',5400,'train','approved')`,[e]);
  await q(`INSERT INTO cab_bookings (user_id,route_id,vehicle_id,booking_date,trip_type,status,seat_number)
    SELECT ?,r.route_id,v.vehicle_id,CURRENT_DATE+INTERVAL 3 DAY,'both','pending',1
    FROM cab_routes r CROSS JOIN cab_vehicles v WHERE r.is_active=1 AND v.is_active=1 ORDER BY r.route_id,v.vehicle_id LIMIT 1`,[e]);
  await q(`INSERT INTO asset_assignments (asset_id,user_id,assigned_by)
    SELECT a.asset_id,?,? FROM assets a WHERE a.status='available'
    AND NOT EXISTS (SELECT 1 FROM asset_assignments z WHERE z.asset_id=a.asset_id AND z.returned_at IS NULL) ORDER BY a.asset_id LIMIT 1`,[e,a]);
  await q("UPDATE assets SET status='assigned' WHERE asset_id IN (SELECT asset_id FROM asset_assignments WHERE user_id=? AND returned_at IS NULL)",[e]);
  await q(`INSERT INTO assets (asset_code,asset_name,category,status,location,notes)
    VALUES ('DEMO-RETIRED-01','Retired demonstration monitor','monitor','retired','Demo storage','Awaiting recycling pickup')`);
  await q(`INSERT INTO bgv_requests (user_id,agency_name,checks_requested,consent_given,status,result,requested_by)
    VALUES (?,'Example Verification',JSON_ARRAY('Employment'),1,'completed','clear',?)`,[e,a]);
  await q(`INSERT INTO candidates (job_id,full_name,email,candidate_type,status)
    SELECT job_id,'Demo Candidate','candidate@example.test','experienced','shortlisted' FROM job_postings ORDER BY job_id LIMIT 1`);
  await q(`INSERT INTO interview_rounds (candidate_id,job_id,round_type,round_name,mode,interviewer_id,scheduled_at)
    SELECT candidate_id,job_id,'screening','Initial screening','video',?,NOW()+INTERVAL 6 DAY
    FROM candidates WHERE email='candidate@example.test'`,[a]);
  await q(`INSERT INTO employee_referrals (referred_by,candidate_id,job_id,referral_name,referral_email,relationship)
    SELECT ?,candidate_id,job_id,full_name,email,'Former colleague' FROM candidates WHERE email='candidate@example.test'`,[e]);
  await q(`INSERT INTO hr_letters (user_id,letter_type,ref_no,content,issued_date,generated_by)
    VALUES (?,'confirmation_letter','DEMO-HR-01','Example confirmation letter for testing.',CURRENT_DATE,?)`,[e,a]);
  await q(`INSERT INTO user_sessions (session_id,user_id,device_info,browser,os,city,is_current,last_active,expires_at)
    VALUES (UUID(),?,'Example desktop','Chrome','macOS','Demo Office',0,NOW()-INTERVAL 1 DAY,NOW()+INTERVAL 7 DAY),
      (UUID(),?,'Example mobile','Chrome','Android','Demo Office',0,NOW()-INTERVAL 2 DAY,NOW()+INTERVAL 6 DAY)`,[e,a]);
  await q(`INSERT INTO posh_complaints (reference_no,complainant_id,incident_date,nature,description,status)
    VALUES ('DEMO-POSH-01',?,CURRENT_DATE-INTERVAL 7 DAY,'Training example','Fictional record for checking case access.','resolved')`,[e]);
  await q(`INSERT INTO posh_training (user_id,training_type,training_date,mode,completed,valid_until)
    VALUES (?,'Workplace conduct orientation',CURRENT_DATE-INTERVAL 15 DAY,'e-learning',1,CURRENT_DATE+INTERVAL 350 DAY)`,[e]);
  await q(`INSERT INTO pulse_surveys (title,frequency,created_by,start_date,close_date,is_active)
    VALUES ('Demo onboarding pulse','one-time',?,CURRENT_DATE,CURRENT_DATE+INTERVAL 7 DAY,1)`,[a]);
  await q(`INSERT INTO safety_emergency_contacts (user_id,name,relation,phone,is_primary)
    VALUES (?,'Example emergency contact','Other','0000000000',1),(?,'Example safety desk','Office','0000000000',1)`,[e,a]);
  await q(`INSERT INTO safety_night_shift_approvals (user_id,shift_date,start_time,end_time,cab_required,status)
    VALUES (?,CURRENT_DATE+INTERVAL 4 DAY,'18:00:00','22:00:00',1,'approved')`,[e]);
  await q("INSERT INTO safety_sos_events (user_id,trigger_type,status) VALUES (?,'manual','resolved')",[e]);
  await q(`INSERT INTO investment_declarations (user_id,financial_year,tax_regime,sec_80c_amount,status,submitted_at)
    VALUES (?,'2026-27','old',35000,'submitted',NOW())`,[e]);
  await q(`INSERT INTO meetings (title,description,meeting_type,host_id,room_code,scheduled_at,duration_mins)
    VALUES ('Demo onboarding check-in','Review the example checklist and training schedule.','internal',?,'WFI-DEMO-01',NOW()+INTERVAL 2 DAY,30)`,[a]);
  await q(`INSERT INTO notifications (user_id,type,title,message,action_url)
    VALUES (?,'system','Welcome to the workforce demo','Your attendance, leave, tasks and payslip examples are ready.','/modules.html')`,[e]);
  await q(`INSERT INTO audit_logs (actor_id,action,entity_type)
    VALUES (?,'DEMO_READY','workspace'),(?,'DEMO_READY','workspace')`,[a,e]);
};
