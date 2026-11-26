module.exports = async function seedTalent(context) {
  await seedProjects(context);
  await seedRecruitment(context);
  await seedLearning(context);
  await seedPeopleOperations(context);
};

async function seedProjects({ q, insert, people, active, departments, admin, manager, primary, day, at, stamp, pad, choose }) {
  const names = ['Employee portal rollout','Payroll reconciliation','Office move','New starter handbook','Training refresh','Travel policy review'];
  const projectStates = ['planning','active','on_hold','completed','cancelled'];
  await insert('projects', ['name','description','department_id','manager_id','status','priority','start_date','due_date','completion_pct',
    'budget','spent','tags','created_by','created_at'], Array.from({length:25},(_,index) => {
    const state = choose(projectStates,index);
    const budget = 85_000 + index*14_000;
    return [stamp(choose(names,index))+' '+pad(index+1),'Synthetic project with sample assignments and milestones.',
      choose(departments,index).dept_id,manager,state,choose(['low','medium','high','critical'],index),day(-70-index),
      day(state==='completed'?-5-index:20+index),choose([0,45,60,100,20],index),budget,Math.round(budget*choose([0,0.45,0.6,0.95,0.15],index)),
      JSON.stringify(['demo','workforce']),admin,at(-80-index)];
  }));
  const projects = await q('SELECT project_id,status FROM projects WHERE description=? ORDER BY project_id', ['Synthetic project with sample assignments and milestones.']);
  await insert('project_members', ['project_id','user_id','role','joined_at'], projects.flatMap((project,index) => {
    const ids = [manager, primary, ...Array.from({length:6},(_,n) => choose(active,index*4+n).id)];
    return [...new Set(ids)].map((id,n) => [project.project_id,id,n===0?'lead':n===1?'reviewer':'member',at(-50-index)]);
  }));
  await insert('project_milestones', ['project_id','title','description','due_date','status','completed_at'], projects.flatMap((project,index) =>
    ['Requirements agreed','Pilot ready','Review and closeout'].map((title,n) => {
      const completed = project.status==='completed' || n===0 && project.status==='active';
      return [project.project_id,title,'Synthetic milestone for project progress testing.',day(n===0?-10:14+n*5+index),
        completed?'completed':n===0&&project.status==='on_hold'?'missed':'pending',completed?at(-12-index):null];
    })));
  const work = ['Review requirements','Check sample payroll totals','Prepare handover','Write training notes','Review access checklist','Send pilot feedback'];
  await insert('tasks', ['project_id','title','description','assigned_by','assigned_to','priority','status','due_date','timer_deadline','timer_hours',
    'extension_requested','extension_hours','extension_reason','extension_status','achievement_level','completed_at','created_at'],
    people.flatMap((user,index)=>[0,1,2,3].map(n => {
      const state = choose(['Pending','In Progress','Completed','Overdue'],n);
      const extension = n===1&&index%4===0;
      return [choose(projects,index+n).project_id,stamp(choose(work,index+n))+' '+pad(index+1),
        'Synthetic assignment for task filters, updates, and extension testing.',manager,user.id,choose(['Low','Medium','High'],index+n),
        state,day(n<2?8+index%20:-2-index%10),n===1?at(3+index%6):null,n===1?24:null,extension,extension?4:null,
        extension?'Waiting for sample input':null,extension?'pending':'none',n===2?'good':'none',n===2?at(-1-index%9):null,at(-24-index%10)];
    })));
  const tasks = await q('SELECT task_id,assigned_to,status FROM tasks WHERE description=? ORDER BY task_id',
    ['Synthetic assignment for task filters, updates, and extension testing.']);
  await insert('task_logs', ['task_id','status','remarks','updated_by','updated_at'], tasks.map(task =>
    [task.task_id,task.status,'Synthetic status change',task.assigned_to,at(-2)]));
  await insert('task_comments', ['task_id','user_id','comment','created_at'], tasks.filter((task,index)=>index%3===0).map(task =>
    [task.task_id,task.assigned_to,'Demo check-in: example notes attached to this assignment.',at(-5)]));
  await insert('achievements', ['user_id','task_id','achievement_type','level','points','message','awarded_by','created_at'],
    tasks.filter(task=>task.status==='Completed').map((task,index)=>[task.assigned_to,task.task_id,'task_complete',
      choose(['good','excellent','outstanding'],index),10+index%3*5,'Recognition for completing a sample assignment.',manager,at(-1-index%9)]));
  await insert('productivity_scores', ['user_id','score_date','completion_rate','delay_count','productivity_score'], people.flatMap((user,index)=>
    [0,1,2,3].map(n=>[user.id,day(-14-n*28),62+(index+n)%39,(index+n)%5,60+(index+n)%41])), 'score_id');
}

async function seedRecruitment({ q, insert, people, departments, primary, hr, manager, day, at, stamp, pad, choose }) {
  const titles = ['Support Analyst','Payroll Specialist','Training Coordinator','Operations Engineer','HR Associate','Facilities Technician'];
  const jobs = Array.from({length:25},(_,index)=>({
    title: stamp(choose(titles,index))+' '+pad(index+1), department: choose(departments,index), index,
  }));
  await insert('job_postings', ['title','department_id','location','job_type','candidate_type','description','skills_required',
    'min_salary','max_salary','openings','status','posted_by','approved_by','closes_at','created_at'],
    jobs.map(job=>[job.title,job.department.dept_id,choose(['Demo HQ','Demo North','Remote'],job.index),
      choose(['full_time','part_time','contract','internship'],job.index),choose(['experienced','fresher','both'],job.index),
      'Synthetic vacancy for testing the recruiting pipeline.','Communication, planning and reporting',350_000+job.index*20_000,
      560_000+job.index*22_000,1+job.index%4,choose(['active','draft','paused','closed','cancelled'],job.index),
      hr,job.index%5===0?hr:null,day(20+job.index),at(-15-job.index)]));
  await insert('job_requisitions', ['title','department_id','positions','reason','expected_start','job_level','budget_ctc','requested_by','reviewed_by','status'],
    jobs.map(job=>[job.title,job.department.dept_id,1+job.index%4,'Synthetic staffing request',day(35+job.index),
      'L'+(job.index%6+1),530_000+job.index*12_000,manager,job.index%4?hr:null,choose(['pending','approved','rejected','fulfilled'],job.index)]));
  const openings = await q('SELECT job_id,title,department_id FROM job_postings WHERE description=? ORDER BY job_id', ['Synthetic vacancy for testing the recruiting pipeline.']);
  const candidateStates = ['applied','shortlisted','on_hold','rejected','selected','offer_sent','offer_accepted','offer_declined','joined','withdrawn'];
  await insert('candidates', ['job_id','full_name','email','current_location','candidate_type','total_experience','expected_ctc','source','status',
    'reject_reason','joining_date','actual_joining_date','created_at'], Array.from({length:100},(_,index) => {
    const state=choose(candidateStates,index);
    return [choose(openings,index).job_id,'Demo Candidate '+pad(index+1),'wfi-v3-candidate-'+pad(index+1)+'@example.test','Demo North',
      index%4?'experienced':'fresher',index%4?index%9+1:0,360_000+index*4_000,choose(['portal','employee_referral','campus','agency'],index),
      state,state==='rejected'?'Sample vacancy filled':null,state==='joined'?day(-2):state==='offer_accepted'?day(20):null,
      state==='joined'?day(-2):null,at(-60+index%30)];
  }));
  const candidates = await q('SELECT candidate_id,job_id,full_name,email,status FROM candidates WHERE email LIKE ? ORDER BY candidate_id', ['wfi-v3-candidate-%@example.test']);
  const openingById = new Map(openings.map(job=>[job.job_id,job]));
  await insert('interview_rounds', ['candidate_id','job_id','round_number','round_type','round_name','mode','interviewer_id','scheduled_at','duration_mins',
    'status','result','technical_score','communication_score','overall_score','feedback','recorded_by','created_at'],
    candidates.filter(person=>!['applied','withdrawn'].includes(person.status)).flatMap((person,index) =>
      [0,1].map(n=>{
        const state = n===0?'completed':choose(['scheduled','completed','cancelled','no_show','rescheduled'],index);
        const complete = state === 'completed';
        return [person.candidate_id,person.job_id,n+1,n?'technical':'screening',n?'Skills discussion':'Initial screen',
          choose(['online','video','phone','offline'],index+n),manager,at(complete?-19-index%15:9+index%21),n?45:25,state,
          complete?(index%5?'pass':'fail'):'pending',complete?65+index%31:null,complete?70+index%26:null,
          complete?67+index%29:null,complete?'Synthetic interviewer feedback.':null,hr,at(-43+index%8)];
      })));
  const offers = {selected:'draft',offer_sent:'sent',offer_accepted:'accepted',offer_declined:'declined',joined:'accepted'};
  await insert('offer_letters', ['candidate_id','job_id','designation','department_id','joining_date','offer_ctc','basic_salary','hra','allowances','work_location','work_mode',
    'offer_valid_till','status','accepted_at','declined_at','decline_reason','generated_by','approved_by'],
  candidates.filter(person=>offers[person.status]).map((person,index)=>{
    const status=offers[person.status];
    return [person.candidate_id,person.job_id,'Demo '+choose(titles,index),openingById.get(person.job_id).department_id,day(person.status==='joined'?-2:25),
      600_000,32_000,12_000,6_000,'Demo HQ','hybrid',day(12),status,status==='accepted'?at(-6):null,status==='declined'?at(-4):null,
      status==='declined'?'Synthetic decline reason':null,hr,status==='draft'?null:hr];
  }));
  await insert('employee_referrals', ['referred_by','candidate_id','job_id','referral_name','referral_email','relationship','status','bonus_eligible','bonus_amount','created_at'],
    candidates.slice(0,45).map((person,index)=>[index<5?primary:choose(people,index).id,person.candidate_id,person.job_id,person.full_name,
      person.email,'Former colleague',choose(['submitted','reviewing','shortlisted','rejected','hired'],index),index%5===4,index%5===4?7_500:0,at(-21-index%14)]));
}

async function seedLearning({ q, insert, people, active, primary, hr, manager, anchor, day, at, year, stamp, pad, choose }) {
  const quarter = Math.floor(anchor.getUTCMonth()/3)+1;
  const staffReviews = people.flatMap((user,index)=>[0,1,2,3].map(n=>{
    const state = choose(['draft','submitted','acknowledged','completed'],(index+n)%4);
    const score = choose([2.4,3.2,3.8,4.7,1.4],index+n);
    return [user.id,n===0?user.id:manager,'Q'+quarter+'-'+year,choose(['self','manager','peer','360'],n),day(-90),day(-5),
      score,score,score,score,score,score,score,
      score<1.5?'unsatisfactory':score<2.5?'below':score<3.5?'meets':score<4.5?'exceeds':'exceptional',
      stamp('Review: structured handovers'),'Sample improvement: share progress sooner.','Review the next quarter’s objectives.',
      state,state==='draft'?null:at(-5),['acknowledged','completed'].includes(state)?at(-1):null,at(-12)];
  }));
  await insert('performance_reviews', ['user_id','reviewer_id','review_cycle','review_type','period_start','period_end','score_quality','score_delivery',
    'score_communication','score_teamwork','score_initiative','score_leadership','overall_score','rating','strengths','improvements','goals_next','status',
    'submitted_at','acknowledged_at','created_at'], staffReviews);
  const skills = await q('SELECT skill_id FROM skills ORDER BY skill_id LIMIT 24');
  if (skills.length >= 6) await insert('skill_assessments',['user_id','skill_id','proficiency','verified','verified_by','last_updated'],
    people.flatMap((user,index)=>Array.from({length:6},(_,n)=>[user.id,choose(skills,index+n).skill_id,
      choose(['beginner','intermediate','advanced','expert'],index+n),n%2,n%2?manager:null,at(-6-n)])), 'assessment_id');
  await insert('training_courses', ['title','description','category','format','duration_mins','provider','is_mandatory','created_by'],
    ['Workplace conduct','Payroll basics','Data handling','Project handovers','Mentor orientation','Service desk triage'].map((title,index)=>
      [stamp(title),'Synthetic training catalog entry.',choose(['compliance','technical','security','product','leadership','soft_skills'],index),
        choose(['video','document','quiz','workshop','webinar','external'],index),25+index*15,'Demo Learning',index<3,hr]));
  const courses = await q("SELECT course_id FROM training_courses WHERE provider='Demo Learning' ORDER BY course_id");
  await insert('training_enrollments', ['user_id','course_id','status','progress_pct','score','enrolled_at','completed_at'],
    people.flatMap((user,index)=>courses.filter((course,n)=>n<4 || n===index%courses.length).map((course,n)=>{
      const state = choose(['enrolled','in_progress','completed','failed'],index+n);
      return [user.id,course.course_id,state,choose([0,55,100,100],index+n),state==='completed'?90:state==='failed'?40:null,
        at(-15-n),['completed','failed'].includes(state)?at(-2-n):null];
    })));
  const tasks = await q('SELECT t.task_id FROM onboarding_tasks t JOIN onboarding_templates o ON o.template_id=t.template_id WHERE o.is_default=1 ORDER BY t.sort_order LIMIT 12');
  await insert('onboarding_progress', ['user_id','task_id','status','completed_at','notes'],
    [...active.slice(0,26).map(user=>user.id),primary].flatMap((id,index)=>tasks.map((task,n)=>{
      const state = choose(['pending','in_progress','completed','skipped'],index+n);
      return [id,task.task_id,state,state==='completed'?at(-3):null,'Synthetic onboarding checklist example.'];
    })), 'progress_id');
  const surveys = ['Onboarding experience','Team workload','Recognition','Quarterly check-in','Training follow-up'];
  await insert('pulse_surveys', ['title','week_number','year','frequency','applicable_to','created_by','start_date','close_date','is_active'],
    surveys.map((title,index)=>[stamp(title),Math.max(1,Math.min(53,Math.ceil((anchor-Date.UTC(year,0,1))/604800000)-index)),year,
      choose(['weekly','biweekly','monthly','one-time'],index),'all',hr,day(-7-index*14),day(7-index*14),index===0]));
  const surveyIds = await q('SELECT survey_id FROM pulse_surveys WHERE title LIKE ?', ['% Demo v3']);
  await insert('pulse_responses', ['survey_id','user_id','happiness_score','workload_score','recognition_score','nps_score','comments','is_anonymous','submitted_at'],
    surveyIds.flatMap((survey,index)=>active.slice(0,34).map((user,n)=>[survey.survey_id,user.id,1+(index+n)%5,1+(n+2)%5,
      1+(n+1)%5,(n+3)%11,'Synthetic feedback for reporting tests.',n%2,at(-3-index*14)])));
}

async function seedPeopleOperations({ q, insert, people, active, personas, primary, admin, hr, manager, day, at, stamp, pad, choose }) {
  const individuals = [...new Set([primary, ...people.slice(-5).map(user=>user.id), ...active.slice(0,24).map(user=>user.id)])];
  await insert('hr_letters', ['user_id','letter_type','ref_no','content','issued_date','generated_by'],
    individuals.flatMap((id,index)=>['confirmation_letter','salary_certificate'].map((type,n)=>
      [id,type,'WFI-V3-HR-'+pad(index+1)+'-'+n,'Synthetic letter used for testing. It does not certify real employment.',day(-20-index),hr])));
  await insert('employee_documents', ['user_id','doc_type','doc_name','file_path','uploaded_by','category','file_url','status','shared_with_hr','uploaded_at'],
    individuals.flatMap((id,index)=>['contract','certificate','other'].map((type,n)=>
      [id,type,stamp(choose(['Sample agreement','Sample training certificate','Sample reference note'],n)),'/demo-reference.txt',hr,
        choose(['employment','educational','other'],n),'/demo-reference.txt',choose(['pending','verified','rejected'],index+n),n===1,at(-8-n)])));
  await insert('bgv_requests', ['user_id','agency_name','checks_requested','consent_given','consent_at','status','result','remarks','requested_by','completed_at'],
    individuals.flatMap((id,index)=>(id===primary?[0,1,2,3]:[index]).map(n=>{
      const state=choose(['initiated','in_progress','completed','failed'],n);
      return [id,'Synthetic Verification Desk',JSON.stringify(['employment','education']),n%4===0?0:1,n%4===0?null:at(-10),state,
        state==='completed'?'clear':state==='failed'?'discrepancy':'pending','Fictional verification workflow fixture.',hr,
        ['completed','failed'].includes(state)?at(-3):null];
    })));
  await insert('resignations', ['user_id','reason','last_working_day','notice_period_days','comments','status','created_at'],
    [[primary,'personal',day(-4),30,'Withdrawn sample request; available to test a new request.','withdrawn',at(-30)],
      ...active.slice(0,24).map((user,index)=>[user.id,choose(['relocation','career_change','personal','other'],index),day(18+index),
        30,stamp('Exit process'),choose(['submitted','manager_acknowledged','hr_approved','rejected','withdrawn'],index),at(-13-index%10)])]);
  await insert('exit_checklist',['user_id','item','completed','completed_at','sort_order'],
    active.slice(0,24).flatMap((user,index)=>['Return equipment','Confirm handover','Review final payslip'].map((item,n)=>
      [user.id,item,(index+n)%2,(index+n)%2?at(-3):null,n+1])));
  await insert('posh_training', ['user_id','training_type','training_date','mode','duration_hours','completed','valid_until'],
    individuals.map((id,index)=>[id,stamp('Workplace conduct training'),day(-30-index),choose(['e-learning','in-person','webinar'],index),1.5,
      index%3!==0,day(index%6===0?-4:180)]));
  await insert('posh_complaints', ['reference_no','complainant_id','incident_date','nature','location','description','status','filed_at','resolved_at','is_confidential'],
    ['filed','under_investigation','resolved','dismissed'].map((status,index)=>
      ['WFI-V3-CASE-'+pad(index+1),index===0?primary:choose(active,index).id,day(-15-index),'Synthetic training scenario','Demo Office',
        'Fictional case fixture for checking confidentiality and status filters.',status,at(-12-index),index>1?at(-3):null,1]));
  await insert('meetings', ['title','description','meeting_type','host_id','room_code','scheduled_at','duration_mins','ended_at','status','agenda','created_at'],
    Array.from({length:28},(_,index)=>{
      const state=choose(['scheduled','ended','cancelled','active'],index);
      const offset=state==='scheduled'?3+index:state==='active'?0:-2-index;
      return [stamp(choose(['Team handover','Payroll review','Office training','Project check-in'],index))+' '+pad(index+1),
        'Synthetic meeting for testing calendar and invitations.',choose(['internal','review','training','standup'],index),
        index%4===0?primary:manager,'WFI-V3-MTG-'+pad(index+1),at(offset),30,state==='ended'?at(offset,'10:30:00'):null,state,
        'Review sample actions and next steps.',at(-35-index%5)];
    }));
  const meetings = await q('SELECT meeting_id,host_id,status FROM meetings WHERE room_code LIKE ? ORDER BY meeting_id',['WFI-V3-MTG-%']);
  await insert('meeting_participants', ['meeting_id','user_id','role','status'],
    meetings.flatMap((meeting,index)=>[...new Set([meeting.host_id,primary,hr,admin,choose(active,index).id])].map((id,n)=>
      [meeting.meeting_id,id,n===0?'host':'participant',n===0?'accepted':meeting.status==='ended'?'left':n===1?'accepted':'invited'])));
  await insert('meeting_notes', ['meeting_id','author_id','content','note_type','assigned_to','due_date'], meetings.filter(row=>row.status==='ended').map(row=>
    [row.meeting_id,row.host_id,'Synthetic meeting action: follow up on the example checklist.','action',primary,day(10)]));
  await insert('announcements', ['title','body','category','target_roles','is_pinned','is_active','expires_at','created_by','created_at'],
    Array.from({length:24},(_,index)=>[stamp(choose(['Portal update','Office briefing','Learning session','Payroll reminder'],index))+' '+pad(index+1),
      'Synthetic announcement for testing category filters, role targeting, pinning and expiry.',
      choose(['general','hr','event','finance','it','policy','urgent'],index),choose(['all','2','3,4'],index),index%7===0,index%8!==0,
      index%3===0?at(-2):at(30+index),hr,at(-3-index)]));
  const announcements = await q('SELECT announcement_id FROM announcements WHERE title LIKE ? ORDER BY announcement_id',['% Demo v3 %']);
  await insert('announcement_reads', ['announcement_id','user_id','read_at'],
    announcements.filter((row,index)=>index%2===0).map(row=>[row.announcement_id,primary,at(-1)]));
  await insert('reports', ['report_title','report_type','period','status','generated_by','report_date','summary','report_data'],
    Array.from({length:24},(_,index)=>{
      const type=choose(['Productivity','Task Summary','Attendance','Payroll'],index);
      return [stamp(type)+' '+pad(index+1),type,choose(['monthly','quarterly','annual'],index),
        index%4===0?'draft':'published',index%5===0?primary:admin,at(-2-index*3),
        'Synthetic report snapshot used to test filters, record visibility, and CSV export.',JSON.stringify({ fixture:true, period:'demo', records:32+index*6 })];
    }));
}
