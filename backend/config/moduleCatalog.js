// Screen definitions for pages whose original HTML was a design mockup.
// API paths are relative to /api and always use the authenticated user's role.
const modules = {};
const sections = ['People', 'Time & pay', 'Hiring & development', 'Operations', 'Governance'];

const field = (key, label, type = 'text', options) => ({ key, label, type, options });
const text = (key, label) => field(key, label);
const date = (key, label) => field(key, label, 'date');
const num = (key, label) => field(key, label, 'number');
const select = (key, label, options) => field(key, label, 'select', options.split('|'));
const form = (path, label, ...fields) => ({ path, label, fields });
const view = (slug, group, title, path, keys, extra = {}) => {
  modules[slug] = { slug, group: sections[group], title, path, columns: keys.split(' '), ...extra };
};
const tracker = (slug, group, title, subject, states, example, details, scope = 'staff') => {
  modules[slug] = { slug, group: sections[group], title, subject, states: states.split('|'), scope,
    example, details };
};

view('feedback-history', 4, 'Feedback history', '/auth/sign-out-feedback', 'submitted_at full_name rating comment status review_note build_request_id', {
  roles: [1], hideGenericExport: true, links: ['build-requests'],
  actions: [
    { label:'Mark as read', path:'/auth/sign-out-feedback/:id', key:'feedback_id', match:['status','Unread'], payload:{ action:'read' } },
    { label:'Mark as unread', path:'/auth/sign-out-feedback/:id', key:'feedback_id', match:['status','Read'], payload:{ action:'unread' } },
    { label:'Add or edit review note', path:'/auth/sign-out-feedback/:id', key:'feedback_id', payload:{ action:'note' },
      input:{ key:'note', label:'Comment or suggestion for administrators', type:'textarea', sourceKey:'review_note' } },
    { label:'Forward as build request', path:'/auth/sign-out-feedback/:id', key:'feedback_id', match:['build_request_id',null],
      payload:{ action:'forward' }, input:{ key:'note', label:'Build instructions (first line becomes the title)', type:'textarea' } },
    { label:'Delete feedback', path:'/auth/sign-out-feedback/:id', key:'feedback_id', payload:{ action:'delete' },
      confirm:'Remove this feedback from history? Any linked build request will stay in the queue.' }
  ]
});
view('employee-directory', 0, 'Employee directory', '/modules/data/directory', 'full_name designation department employment_type');
view('org-chart', 0, 'Reporting relationships', '/modules/data/reporting', 'full_name designation department manager');
view('headcount', 0, 'Headcount by department', '/modules/data/headcount', 'department active pending total');
view('workforce-planning', 0, 'Workforce planning', '/modules/data/headcount', 'department active pending total');
view('diversity', 0, 'Workforce distribution', '/modules/data/diversity', 'group headcount', { staffOnly: true });
view('employee-self-service', 0, 'Employee self service', '/auth/me', 'full_name email company_name designation department_name employment_type join_date', {
  links: ['leave','attendance','payslip-portal','dependents','profile','document-vault','expenses','travel']
});
view('dependents', 0, 'Dependents', '/benefits/dependents', 'name relation dob is_covered', {
  form: form('/benefits/dependents', 'Add dependent', text('name','Name'), select('relation','Relationship','spouse|child|parent|other'), date('dob','Date of birth'))
});
view('welfare', 0, 'Employee welfare & insurance', '/benefits/plans', 'plan_name plan_type provider coverage_amount description');
view('flexible-benefits', 0, 'Flexible benefits', '/benefits/plans', 'plan_name plan_type provider coverage_amount description');
view('salary-transfer', 1, 'Salary transfer history', '/admin/salary/my', 'year month net_salary credit_due_on payment_status paid_on', {
  links: ['company-policies']
});
view('leave', 1, 'Leave requests', '/admin/leave/my', 'leave_type from_date to_date days reason status full_name', {
  staffPath: '/admin/leave',
  form: form('/admin/leave', 'Request leave', select('leave_type','Leave type','casual|sick|earned|unpaid|other|half_day'), date('from_date','From date'), date('to_date','To date'), text('reason','Reason')),
  actions: [{ label:'Approve', path:'/admin/leave/:id/approve', key:'leave_id', match:['status','pending'], roles:[1,3,4] }]
});
view('attendance', 1, 'Attendance', '/admin/attendance/my', 'work_date full_name clock_in clock_out total_hours status', {
  staffPath: '/modules/data/attendance',
  buttons: [{ label:'Clock in', path:'/admin/attendance/clock-in' }, { label:'Clock out', path:'/admin/attendance/clock-out' }]
});
view('time-tracker', 1, 'Time tracker', '/admin/attendance/my', 'work_date clock_in clock_out total_hours ot_hours status', {
  buttons: [{ label:'Clock in', path:'/admin/attendance/clock-in' }, { label:'Clock out', path:'/admin/attendance/clock-out' }]
});
view('expenses', 1, 'Expense claims', '/travel/expenses/my', 'expense_date full_name category description amount status', {
  staffPath: '/travel/expenses',
  actions: [
    ...['approved','rejected'].map(status => ({label:status === 'approved' ? 'Approve expense' : 'Reject expense',path:'/admin/expense-claims/:id/review',key:'claim_id',payload:{status},roles:[1,3,4],notOwn:true,match:['status','pending']})),
    {label:'Record payment',path:'/admin/expense-claims/:id/review',key:'claim_id',payload:{status:'paid'},roles:[1,4],notOwn:true,match:['status','approved']}
  ],
  form: form('/travel/expenses', 'Submit expense', date('expense_date','Claim date'), select('category','Category','travel|food|medical|equipment|other'), num('amount','Amount'), text('description','Description'))
});
view('travel', 3, 'Travel requests', '/travel/requests/my', 'travel_date full_name from_location to_location purpose estimated_cost status', {
  staffPath: '/travel/requests',
  actions: [
    ...['approve','reject'].map(action => ({
      label: action === 'approve' ? 'Approve travel' : 'Reject travel', path:'/travel/requests/:id',
      key:'request_id', payload:{action}, roles:[1,3,4], notOwn:true, match:['status','pending']
    })),
    {label:'Cancel travel request',path:'/travel/requests/:id/cancel',key:'request_id',method:'POST',
      ownOnly:true,match:['status','pending'],confirm:'Cancel this pending travel request?'}
  ],
  form: form('/travel/requests', 'Request travel', select('travel_type','Travel type','domestic|international'), text('from_location','From'), text('to_location','To'), date('travel_date','Departure'), date('return_date','Return'), text('purpose','Purpose'), num('estimated_cost','Estimated cost'))
});
view('payslip-portal', 1, 'Payslips', '/admin/salary/my', 'full_name year month base_salary bonus deductions net_salary credit_due_on payment_status paid_on', {
  links: ['company-policies'],
  staffPath: '/admin/salary',
  download: { key:'salary_id', path:'/admin/salary/:id/payslip-pdf', label:'Download PDF' }
});
view('salary-revision', 1, 'Salary revisions', '/modules/data/revisions', 'effective_date full_name old_salary new_salary reason');
view('salary-advance', 1, 'Salary advances', '/modules/data/advances', 'created_at full_name requested_percentage amount payroll_period reason status repay_months', {
  staffPath: '/admin/salary-advances',
  form: form('/admin/salary-advances', 'Request an advance',
    num('percentage','Percentage of upcoming payout'), field('reason','Reason for the advance','textarea')),
  actions: ['approved','rejected'].map(status => ({
    label: status === 'approved' ? 'Approve advance' : 'Reject advance',
    path: '/admin/salary-advances/:id/review', key:'advance_id', payload:{status},
    roles:[1,4], notOwn:true, match:['status','pending']
  }))
});
view('holiday-calendar', 1, 'Holiday calendar', '/modules/data/holidays', 'holiday_date name holiday_type description', {
  form: { ...form('/admin/holidays', 'Add holiday', text('name','Name'), date('holiday_date','Date'), select('holiday_type','Type','public|company|optional'), text('description','Description')), roles:[1,3,4] }
});
view('festival-calendar', 1, 'Festival calendar', '/modules/data/holidays', 'holiday_date name holiday_type description');
view('hr-calendar', 1, 'HR calendar', '/modules/data/calendar', 'event_date title category status');
view('shift-roster', 1, 'Shift roster', '/modules/data/roster', 'full_name shift_name start_time end_time department');
view('performance', 2, 'Performance reviews', '/performance/my', 'full_name review_cycle review_type overall_score rating status', {
  staffPath: '/performance/all',
  actions: [{ label:'Acknowledge', path:'/performance/:id/acknowledge', key:'review_id', match:['status','submitted'], roles:[2] }]
});
view('360-feedback', 2, '360° feedback', '/modules/data/feedback', 'full_name review_cycle review_type overall_score rating status');
const studyGuideDownload = { label: 'Download study guide PDF', path: '/training/courses/:id/study-guide', key: 'course_id', availableKey: 'has_study_guide', filename: 'study-guide' };
view('training', 2, 'Training courses', '/training/courses', 'title skill_name category format provider duration_mins is_mandatory status', {
  downloads: [studyGuideDownload],
  links: ['my-learning', 'skills-matrix', 'training-review'],
  form: { ...form('/training/courses', 'Add course', text('title','Course title'),
    select('category','Category','technical|soft_skills|compliance|leadership|product|security'),
    select('format','Format','video|document|quiz|workshop|webinar|external'),
    {...num('duration_mins','Duration in minutes'), optional:true},
    {...text('provider','Provider'), optional:true},
    {...field('description','Description','textarea'), optional:true},
    {...field('study_guide','Study guide and practice assignment','textarea'), optional:true, maxLength:4000},
    {...field('skill_id','Related skill','lookup','trainingSkills'), optional:true},
    {...field('video_url','Learning video (HTTPS)','url'), optional:true},
    {...field('url','Learning website (HTTPS)','url'), optional:true}),
    key: 'course_id', roles: [1,4], editLabel: 'Edit course' },
  externalLinks: { video_url: 'Watch learning video', url: 'Open learning website' },
  actions: [{ label:'Enroll', path:'/training/enroll', key:'course_id', bodyKey:'course_id', method:'POST', match:['status','available'] }]
});
view('my-learning', 2, 'My learning', '/training/my', 'title is_mandatory progress_pct assessment_score next_step', {
  links: ['training','my-certificates'],
  externalLinks: { video_url: 'Watch learning video', url: 'Open learning website' },
  downloads: [studyGuideDownload, { label: 'Download certificate PDF', path: '/training/certificates/:id',
    key: 'enrollment_id', availableKey: 'has_certificate', filename: 'training-certificate' }],
  actions: [
    { label: 'Update progress', path: '/training/progress/:id', key: 'course_id', hide: ['progress_locked', 1],
      input: { key: 'progress_pct', label: 'Progress (%)', type: 'number', max: 100 } },
    ...['enrolled','in_progress','failed'].map(status => ({ label: 'Withdraw enrollment', path: '/training/my/:id', key: 'course_id',
      method: 'DELETE', match: ['status',status], confirm: 'Withdraw from this course and remove the recorded progress?' })),
  ]
});
view('training-review', 2, 'Training certificate review', '/training/all-enrollments', 'full_name title progress_pct assessment_score completed_at certificate_stage', {
  roles: [1,4], links: ['training','certificate-register'],
  actions: [{ label: 'Issue certificate', path: '/training/certificates/:id', key: 'enrollment_id', method: 'POST',
    match: ['can_issue',1], notOwn: true, certificateConfirmation: true }]
});
const certificateFields = 'learner_name course_title issued_at template status correction_status proposed_name';
view('my-certificates', 2, 'My certificates', '/training/certificate-register/my', certificateFields, {
  links:['my-learning'], hideGenericExport:true, certificateRegister:true,
  download:{label:'Download certificate PDF',path:'/training/certificates/:id',key:'enrollment_id',availableKey:'downloadable',filename:'training-certificate'},
  actions:[{label:'Request name correction',path:'/training/certificate-register/my/:id/correction',
    key:'enrollment_id',method:'POST',match:['status','issued'],hide:['correction_status','pending'],
    input:{key:'proposed_name',label:'Corrected name',type:'text',maxLength:150}}]
});
view('certificate-register', 2, 'Certificate register', '/training/certificate-register/review', certificateFields, {
  roles:[1,4], links:['training-review','my-certificates'], hideGenericExport:true, certificateRegister:true,
  download:{label:'Download certificate PDF',path:'/training/certificate-register/review/:id/pdf',
    key:'enrollment_id',availableKey:'downloadable',filename:'training-certificate'},
  actions:[
    ...['approve','reject'].map(action=>({label:action === 'approve' ? 'Approve name correction' : 'Reject name correction',
      path:'/training/certificate-register/review/:id',key:'enrollment_id',notOwn:true,
      match:['correction_status','pending'],hide:['status','revoked'],payload:{action},
      confirm:'Record this certificate correction decision?'})),
    {label:'Revoke certificate',path:'/training/certificate-register/review/:id',key:'enrollment_id',notOwn:true,
      match:['status','issued'],payload:{action:'revoke'},confirm:'Revoke this certificate and disable its downloads?'}
  ]
});
view('skills-matrix', 2, 'Skills matrix', '/modules/data/skills', 'full_name skill_name proficiency verified', { links: ['training', 'my-learning'] });
view('hiring', 2, 'Job openings', '/hiring/jobs', 'title location job_type openings status');
view('interview-scheduler', 2, 'Interviews', '/modules/data/interviews', 'scheduled_at title round_name mode status', { staffOnly:true });
view('employee-referral', 2, 'Employee referrals', '/hiring/referrals/my', 'referral_name job_title relationship status bonus_amount', {
  staffPath:'/hiring/referrals',
  form: form('/hiring/referrals', 'Submit referral', text('referral_name','Candidate name'), field('referral_email','Candidate email','email'), field('job_id','Job opening','lookup','jobs'), text('relationship','Relationship'), text('cover_note','Notes'))
});
view('background-verification', 2, 'Background verification', '/modules/data/bgv', 'full_name agency_name checks_requested status result');
view('registration-tracker', 2, 'Registration tracker', '/admin/users/pending', 'full_name email company_name role_name status created_at', {
  staffOnly:true, actions:[{ label:'Approve', path:'/admin/users/:id/approve', key:'user_id', roles:[1,3,4] }]
});
view('onboarding', 2, 'Onboarding checklist', '/onboarding/my', 'title category description status due_day', {
  actions: [{ label:'Mark complete', path:'/onboarding/task/:id', key:'task_id', payload:{status:'completed'}, hide:['status','completed'] }]
});
view('confirmation-letter', 2, 'Confirmation letters', '/modules/data/confirmations', 'ref_no full_name letter_type issued_date');
view('assets', 3, 'Asset register', '/assets/my', 'asset_code asset_name category brand assigned_user location status', {
  staffPath:'/assets', form:{...form('/assets', 'Add asset',text('asset_code','Asset code'),text('asset_name','Asset name'),
    select('category','Category','laptop|desktop|monitor|phone|tablet|keyboard|mouse|headset|other'),text('location','Location')),roles:[1]}
});
view('asset-disposal', 3, 'Asset retirement register', '/modules/data/retired-assets', 'asset_code asset_name category location status notes', { staffOnly:true });
view('cab-booking', 3, 'Cab bookings', '/modules/data/cabs', 'booking_date route_name pickup_stop trip_type status', {
  links:['cab-tracking','cab-issues','cab-drivers'],
  form: form('/cab/book','Book a cab',field('route_id','Route','lookup','cabRoutes'),field('vehicle_id','Vehicle','lookup','cabVehicles'),date('booking_date','Travel date'),select('trip_type','Trip','pickup|drop|both')),
  actions:[{ label:'Cancel booking', path:'/cab/my/:id', key:'booking_id', method:'DELETE', match:['status','pending'] }]
});
view('team-connect', 3, 'Team connect', '/modules/data/teams', 'department manager headcount', { links:['chat','meetings','announcements'] });
view('real-time-monitor', 3, 'Attendance monitor', '/modules/data/today', 'full_name work_date clock_in clock_out status', {staffOnly:true, refresh:true});
view('activity-history', 4, 'Activity history', '/modules/data/activity', 'created_at action entity_type entity_id');
view('session-management', 4, 'Account sessions', '/modules/data/sessions', 'device_info browser os ip_address is_current last_active expires_at revoked_at', {
  actions:[{label:'Revoke session',path:'/auth/sessions/:id',method:'DELETE',key:'session_id',match:['is_active',1]}]
});
view('audit-log', 4, 'Audit log', '/admin/audit-logs', 'created_at actor_name action entity_type entity_id', { staffOnly:true });
view('compliance', 4, 'Compliance overview', '/modules/data/compliance', 'register records', {staffOnly:true,links:['minimum-wages','posh-compliance','tax-portal','company-policies']});
view('meetings', 3, 'Meetings', '/meetings', 'title scheduled_at meeting_type meeting_provider meeting_url host_name duration_mins status cancellation_reason', {
  edit:{ownerKey:'host_id',key:'meeting_id'},urlColumns:['meeting_url'],
  form: {...form('/meetings','Schedule meeting',text('title','Title'),field('scheduled_at','Date and time','datetime-local'),num('duration_mins','Duration in minutes'),
    select('meeting_type','Type','internal|client|interview|standup|review|training'),text('description','Agenda'),select('meeting_provider','Meeting provider','internal|zoom|google_meet|teams|other'),{...field('meeting_url','Meeting link','url'),optional:true}),key:'meeting_id'}
});
view('family-transfer', 0, 'Transfer requests', '/transfers/my', 'transfer_type from_location to_location reason preferred_date status', {
  staffPath:'/transfers', form:form('/transfers','Request transfer',select('transfer_type','Type','office|remote|hybrid|family|marriage|medical|personal'),
    text('from_location','From'),text('to_location','To'),text('reason','Reason'),date('preferred_date','Preferred date'))
});
view('letter-management', 2, 'HR letters', '/letters/my', 'ref_no letter_type full_name issued_date content', {links:['confirmation-letter']});
view('cab-drivers', 3, 'Cab drivers', '/modules/data/drivers', 'full_name route_name vehicle_type rating status', {staffOnly:true,links:['cab-booking']});
view('cab-driver-panel', 3, 'Driver assignments', '/modules/data/dispatch', 'booking_date full_name route_name trip_type status journey_status', {staffOnly:true,links:['cab-drivers']});
view('company-policies', 4, 'Company policies', '/modules/data/policies', 'policy_name category version effective_date content');
view('policy-library', 4, 'Policy library', '/modules/data/policies', 'policy_name category version effective_date content');
view('posh-complaints', 4, 'PoSH case register', '/modules/data/posh', 'reference_no incident_date nature status filed_at', {
  links:['confidential-cases']
});
view('confidential-cases', 4, 'Confidential safety cases', '/safety/complaints/my',
  'complaint_id incident_date complaint_type status assigned_to_name description resolution', {
    staffPath:'/safety/complaints', staffRoles:[1,4], hideGenericExport:true, links:['posh-complaints','women-safety'],
    form:form('/safety/complaints','File confidential complaint',date('incident_date','Incident date'),
      select('complaint_type','Case type','harassment|discrimination|unsafe_environment|stalking|other'),
      select('is_anonymous','Submit anonymously','no|yes'),
      {...num('against_user_id','Named employee ID'),optional:true},field('description','Description','textarea')),
    actions:[
      {label:'Begin review',path:'/safety/complaints/:id',key:'complaint_id',roles:[1,4],notOwn:true,match:['status','filed'],payload:{status:'under_review'}},
      ...['filed','under_review','icc_referred'].map(status=>({label:'Assign reviewer',path:'/safety/complaints/:id',key:'complaint_id',
        roles:[1,4],notOwn:true,match:['status',status],input:{key:'assigned_to',label:'Reviewer employee ID',type:'number'}})),
      {label:'Refer to committee',path:'/safety/complaints/:id',key:'complaint_id',roles:[1,4],notOwn:true,
        match:['status','under_review'],payload:{status:'icc_referred'}},
      ...['under_review','icc_referred'].map(status=>({label:'Resolve case',path:'/safety/complaints/:id',key:'complaint_id',
        roles:[1,4],notOwn:true,match:['status',status],payload:{status:'resolved'},
        input:{key:'resolution',label:'Case resolution',type:'textarea'}})),
      {label:'Close case',path:'/safety/complaints/:id',key:'complaint_id',roles:[1,4],notOwn:true,
        match:['status','resolved'],payload:{status:'closed'},confirm:'Close this resolved case?'}
    ]
  });
view('posh-compliance', 4, 'PoSH training', '/modules/data/posh-training', 'training_type training_date mode completed valid_until');
view('minimum-wages', 4, 'Minimum wages reference', '/modules/data/wages', 'state skill_category daily_wage monthly_wage effective_from');
view('tax-portal', 1, 'Income tax', '/modules/data/tax', 'financial_year full_name regime gross_income tax_liability status', {
  links:['investment-declaration','form-24q'],
  form:form('/tax/declaration/draft','Save tax declaration',
    {...text('financial_year','Financial year'),value:require('../services/taxCalculator').getCurrentFY()},
    select('regime','Tax regime','new|old'),num('gross_income','Annual salary income'),
    {...num('ded_80c','Eligible section 80C deduction'),value:0},
    {...num('ded_80d','Eligible section 80D deduction'),value:0},
    {...num('ded_nps','Eligible additional NPS deduction'),value:0}),
  actions:[
    {label:'Submit for review',path:'/tax/declaration/:id/submit',method:'POST',key:'declaration_id',match:['status','draft'],ownOnly:true},
    {label:'Approve declaration',path:'/tax/declaration/review',method:'POST',key:'declaration_id',match:['status','submitted'],
      roles:[1,4],notOwn:true,payload:{action:'approved'},rowPayload:['user_id','financial_year']},
    {label:'Return declaration',path:'/tax/declaration/review',method:'POST',key:'declaration_id',match:['status','submitted'],
      roles:[1,4],notOwn:true,payload:{action:'rejected'},rowPayload:['user_id','financial_year']}
  ]
});
view('investment-declaration', 1, 'Investment declarations', '/modules/data/investments', 'financial_year regime status total_declared submitted_at');
view('form-24q', 4, 'Form 24Q reference', '/modules/data/tds', 'year month payroll_records', { staffOnly:true });
view('reports', 4, 'Reports', '/modules/data/reports', 'report_date report_title report_type period status summary', {
  download: { label: 'Download report PDF', path: '/reports/:id/pdf', key: 'report_id' },
});
view('data-export', 4, 'Data export', '/modules/data/directory', 'full_name designation department employment_type', {staffOnly:true});
view('id-card', 0, 'Employee ID', '/auth/me', 'user_id full_name designation department_name join_date');
view('pulse-survey', 2, 'Pulse surveys', '/modules/data/surveys', 'title frequency start_date close_date is_active');
view('awards', 2, 'Recognition and awards', '/modules/data/awards', 'full_name achievement_type level points message');
view('emergency-center', 3, 'Emergency resources', '/modules/data/emergency', 'name relation is_primary', {links:['women-safety','112-emergency','sos-alerts']});
view('women-safety', 3, 'Safety requests', '/safety/night-shift/my', 'shift_date full_name start_time end_time cab_required status', {
  staffPath:'/safety/night-shift', links:['emergency-center','women-safety-policy','confidential-cases'],
  form:form('/safety/night-shift','Request night shift',date('shift_date','Shift date'),field('shift_start','Start time','time'),
    field('shift_end','End time','time'),select('transport_mode','Transport','company_cab|own_vehicle|public|escort')),
  actions:[
    ...['approved','rejected'].map(action=>({label:action === 'approved' ? 'Approve night shift' : 'Reject night shift',
      path:'/safety/night-shift/:id/review',key:'approval_id',payload:{action},roles:[1,3,4],notOwn:true,match:['status','pending']})),
    {label:'Cancel night shift request',path:'/safety/night-shift/:id/cancel',key:'approval_id',method:'POST',
      ownOnly:true,match:['status','pending'],confirm:'Cancel this pending night shift request?'}
  ]
});
view('sos-alerts', 3, 'SOS incident register', '/modules/data/sos', 'created_at trigger_type status', { roles:[1,4] });
tracker('lwf-tracker', 4, 'Labour welfare fund review', 'Review item', 'Draft|In review|Verified', 'Example state contribution review', 'Confirm applicable rates and reporting dates with payroll.');
view('analytics', 4, 'Workforce analytics', '/modules/data/analytics', 'metric value', {staffOnly:true,links:['headcount','reports','ai-insights']});
view('loan-portal', 1, 'Loan applications', '/loans/my', 'full_name loan_type vehicle_kind principal tenure_months emi_amount purpose status review_stage', {
  staffPath:'/loans',links:['credit-score','bank-directory'],
  form:form('/loans/apply','Apply for employee loan',select('loan_type','Loan type','personal|home|bike|car|vehicle|education|marriage|medical|emergency'),
    num('amount_requested','Requested amount'),num('tenure_months','Repayment months'),text('purpose','Purpose')),
  actions:[
    ...['manager','hr','admin'].flatMap((role,index) => ['approved','rejected'].map(action => ({
      label:(action === 'approved' ? 'Approve ' : 'Reject ') + role + ' review',
      path:'/loans/:id/' + (role === 'admin' ? 'admin-approve' : role + '-review'),key:'loan_id',
      roles:[[1,3],[1,4],[1]][index],match:['review_stage',role],notOwn:true,payload:{action}
    }))),
    {label:'Record disbursement',path:'/loans/:id/disburse',key:'loan_id',method:'POST',roles:[1],notOwn:true,match:['status','approved']}
  ]
});
view('bank-directory', 1, 'Bank directory', '/loans/bank-partners', 'name category website_url checked_on', {links:['loan-portal','credit-score'],urlColumns:['website_url']});
view('exit', 2, 'Exit requests', '/exit/my-resignation', 'created_at last_working_day reason status full_name', {
  staffPath:'/exit/all', form:form('/exit/resign','Submit demo resignation',select('reason','Reason','personal|better_opportunity|higher_salary|relocation|health|work_environment|career_change|other'),date('last_working_day','Last working day'),{...field('comments','Additional comments','textarea'),optional:true}),
  actions:[
    {label:'Withdraw resignation',path:'/exit/withdraw',key:'resignation_id',bodyKey:'resignation_id',method:'POST',
      ownOnly:true,match:['status','submitted']},
    {label:'Acknowledge resignation',path:'/exit/manager-acknowledge',key:'resignation_id',bodyKey:'resignation_id',
      method:'POST',roles:[1,3,4],notOwn:true,match:['status','submitted']},
    ...['approve','reject'].map(action=>({
      label:action === 'approve' ? 'Approve resignation' : 'Reject resignation',path:'/exit/hr-approve',
      key:'resignation_id',method:'POST',roles:[1,4],notOwn:true,match:['status','manager_acknowledged'],
      rowPayload:['resignation_id'],payload:{action},confirm:'Record this resignation decision?'
    }))
  ]
});
view('document-vault', 0, 'Document register', '/modules/data/documents', 'full_name doc_name doc_type status created_at', {
  links:['profile'],
  form:{...form('/documents/upload','Upload document',text('doc_name','Document name'),
    select('category','Category','other|identity|educational|employment|financial|medical|address'),field('document','PDF or image','file')),multipart:true},
  download:{key:'doc_id',path:'/documents/:id/download',label:'Download file',availableKey:'file_url'},
  actions:[
    {label:'Share with HR',path:'/documents/:id/share',key:'doc_id',hide:['shared_with_hr',1],ownOnly:true},
    {label:'Verify document',path:'/documents/:id/review',key:'doc_id',roles:[1,4],notOwn:true,match:['status','pending'],payload:{status:'verified'}},
    {label:'Return document',path:'/documents/:id/review',key:'doc_id',roles:[1,4],notOwn:true,match:['status','pending'],payload:{status:'rejected',reason:'Please review and upload the requested correction.'}}
  ]
});
view('hr-copilot', 4, 'Workforce insights', '/modules/data/analytics', 'metric value', {staffOnly:true,links:['ai-insights','chat']});
view('ai-assistant', 4, 'Workforce assistant', '/modules/data/analytics', 'metric value', {staffOnly:true,links:['ai-insights','chat']});
view('112-emergency', 3, 'Emergency contacts', '/modules/data/emergency', 'name relation is_primary', {links:['emergency-center']});
view('women-safety-policy', 4, 'Workplace safety policies', '/modules/data/policies', 'policy_name category version effective_date content', {links:['women-safety','posh-compliance']});

tracker('regularization', 1, 'Attendance corrections', 'Correction request', 'Submitted|Under review|Approved|Declined', 'Missed checkout', 'Correct checkout time for a training day.', 'own');
tracker('wfh-tracker', 1, 'Remote work requests', 'Work arrangement', 'Requested|Approved|Declined|Completed', 'Remote work for documentation sprint', 'Remote work request for the handbook review.', 'own');
tracker('shift-bidding', 1, 'Shift preferences', 'Shift preference', 'Requested|Waitlisted|Approved|Declined', 'Morning shift preference', 'Preferred shift for the next rotation.', 'own');
tracker('statutory-bonus', 1, 'Statutory bonus review', 'Review item', 'Draft|Under review|Approved', 'Annual bonus eligibility review', 'Review payroll eligibility and confirm the calculation in payroll.');
tracker('probation', 2, 'Probation reviews', 'Review', 'Scheduled|In progress|Completed', 'Probation check-in', 'Review goals, support needs and confirmation criteria.', 'own');
tracker('goals-okr', 2, 'Goals and key results', 'Objective', 'Planned|In progress|Achieved|Deferred', 'Publish the employee handbook', 'Key result: publish the revised handbook and collect team feedback.', 'own');
tracker('career-roadmap', 2, 'Career plans', 'Milestone', 'Planned|In progress|Achieved', 'Mentor a new starter', 'Run two onboarding sessions and collect feedback.', 'own');
tracker('contract-labour', 4, 'Contract labour register', 'Register item', 'Draft|Under review|Verified|Closed', 'Facilities staffing records', 'Review the contractor’s workforce documentation.');
tracker('vendor-management', 3, 'Vendor register', 'Vendor', 'Proposed|Under review|Active|Inactive', 'Example Office Supplies', 'Review the sample office supplier agreement.');
tracker('visitor-management', 3, 'Visitor register', 'Visit', 'Scheduled|Checked in|Checked out|Cancelled', 'Office facilities walkthrough', 'Meet the facilities coordinator at the front desk.');
tracker('disciplinary', 4, 'Case register', 'Case reference', 'Open|Under review|Resolved', 'Example policy review', 'Training exercise with no actual employee attached.');
modules.disciplinary.roles = [1, 4];
tracker('grievance', 4, 'Grievance register', 'Case subject', 'Submitted|Under review|Resolved', 'Break room accessibility', 'Review a sample workplace accessibility concern.', 'own');
tracker('maternity-leave', 1, 'Maternity leave planning', 'Plan', 'Draft|Submitted|Approved|Closed', 'Leave handover plan', 'Sample schedule and handover checklist.', 'own');
tracker('mental-health', 0, 'Wellbeing resources', 'Resource', 'Available|In review|Archived', 'Wellbeing check-in guide', 'Sample guide for preparing for a confidential wellbeing discussion.');
tracker('credit-score', 1, 'Financial wellness checklist', 'Checklist item', 'Planned|In progress|Complete', 'Review your credit report', 'Track follow-up here. No credit bureau is connected.', 'own');
modules['credit-score'].title = 'Credit report and financial wellness';
modules['credit-score'].links = ['loan-portal','bank-directory'];
tracker('biometric-enrollment', 3, 'Biometric enrollment register', 'Enrollment record', 'Requested|Reviewed|Withdrawn', 'Example enrollment request', 'Demo workflow records only. No biometric data is collected.', 'own');
tracker('face-recognition', 3, 'Biometric review register', 'Review record', 'Open|Reviewed|Closed', 'Camera consent review', 'Demo review record. No image or facial data is collected.');
tracker('cybersecurity', 4, 'Security review register', 'Review item', 'Open|In review|Closed', 'Quarterly access review', 'Review access with the relevant system owner.');
tracker('threat-monitor', 4, 'Security incident register', 'Incident', 'Reported|Triaged|Resolved', 'Example unusual sign-in', 'Sample incident for testing triage. No live security feed is connected.');
tracker('fraud-detection', 4, 'Payroll review register', 'Review item', 'Flagged|In review|Cleared', 'Example duplicate claim review', 'Sample review item. No automatic fraud detection is run.');

for (const [slug,profile] of Object.entries(require('./workflowProfiles.json'))) {
  const item=modules[slug];
  if (!item) continue;
  item.workflow=profile;
  item.columns=['title',...profile.fields.map(field=>field.key),'status','target_date','version'];
}
modules['loan-portal'].form.fields.find(field=>field.key==='loan_type').storageValues={bike:'vehicle',car:'vehicle'};
modules['registration-tracker'].roles=[1,4];
modules['leave'].actions[0].notOwn=true;
module.exports = modules;
