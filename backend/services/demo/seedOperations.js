module.exports = async function seedOperations(context) {
  await seedTravelAndAssets(context);
  await seedFinanceAndTransfers(context);
  await seedServiceDeskAndSafety(context);
};

async function seedTravelAndAssets({ q, insert, people, personas, primary, admin, hr, day, at, stamp, pad, choose }) {
  const travelers = [...people.filter((employee, index) => index % 3 === 0).map(user => user.id), primary, personas.hr?.user_id, admin]
    .filter(Boolean);
  const cases = [...new Set(travelers)].flatMap((id, index) => ['pending','approved','rejected','completed'].map((status, number) => ({
    id, status, from: number < 2 ? 8 + index % 15 + number * 2 : -18 - index % 8 - number * 3,
    purpose: stamp('Site visit') + ' ' + pad(index + 1) + '/' + number,
    number,
  })));
  await insert('travel_requests', ['user_id','travel_type','from_location','to_location','travel_date','return_date','purpose',
    'estimated_cost','approved_amount','mode_of_travel','accommodation_required','status','approved_by','review_note','reviewed_at','created_at'],
  cases.map(row => [row.id,row.number === 2 ? 'international' : 'domestic','Demo HQ','Demo Training Office',
    day(row.from),day(row.from + 2),row.purpose,4_250 + row.number * 2_500,[1,3].includes(row.number) ? 4_000 + row.number * 2_500 : null,
    choose(['train','car','flight','bus'],row.number),row.number !== 1,row.status,
    row.number ? hr : null,row.status === 'rejected' ? 'Sample budget approval missing' : null,row.number ? at(Math.min(-3,row.from - 2)) : null,
    at(Math.min(-6,row.from - 5))]));
  const travelIds = await q('SELECT request_id,user_id,purpose FROM travel_requests WHERE purpose LIKE ?', [stamp('Site visit') + '%']);
  await insert('expense_claims', ['user_id','travel_request_id','claim_date','expense_date','category','amount','description','status','approved_amount',
    'currency','reviewed_by','reviewed_at','paid_on','reject_reason','created_at'],
  travelIds.map((row,index) => {
    const state = choose(['pending','approved','rejected','paid'],index);
    const claimDay = -2 - index % 45;
    const amount = choose([0.99,249.50,1840.75,24999.99,875.25],index);
    return [row.user_id,row.request_id,day(claimDay),day(claimDay),choose(['food','travel','equipment','other'],index),amount,
      stamp('Reimbursement') + ' · ' + choose(['Team meal','Train ticket','Display adapter','Workshop supplies'],index),
      state,['approved','paid'].includes(state) ? amount : null,'INR',state === 'pending' ? null : hr,state === 'pending' ? null : at(claimDay+1),
      state === 'paid' ? day(claimDay + 1) : null,state === 'rejected' ? 'Sample receipt does not match the claim' : null,at(claimDay)];
  }));
  await insert('reimbursement_batches', ['batch_name','payment_date','payment_reference','status','created_by','processed_at'], [
    [stamp('Travel reimbursements'),day(-1),'WFI-V3-BATCH-01','processed',hr,at(-1)],
    [stamp('Equipment reimbursements'),day(4),null,'created',hr,null],
  ]);
  const [batch] = await q('SELECT batch_id FROM reimbursement_batches WHERE payment_reference=?', ['WFI-V3-BATCH-01']);
  const paidClaims = await q("SELECT claim_id FROM expense_claims WHERE description LIKE ? AND status='paid' ORDER BY claim_id LIMIT 15", [stamp('Reimbursement')+'%']);
  await insert('reimbursement_batch_items', ['batch_id','claim_id'], paidClaims.map(row => [batch.batch_id,row.claim_id]));

  const assetCases = Array.from({length: 75}, (_,index) => ({
    code:'WFI-V3-ASSET-' + pad(index+1),
    category:choose(['laptop','monitor','headset','phone','tablet','keyboard'],index),
    status:choose(['assigned','available','maintenance','retired','lost'],index),
    index,
  }));
  await insert('assets', ['asset_code','asset_name','category','brand','model','serial_number','purchase_date','purchase_cost','warranty_end','condition','status','location','notes'],
    assetCases.map(row => [row.code,stamp(row.category) + ' ' + pad(row.index+1),row.category,'Example Equipment','Demo model',row.code,
      day(-550-row.index),1_200 + row.index * 850,day(180-row.index),row.status === 'maintenance' ? 'damaged' : 'good',row.status,'Demo HQ',
      row.status === 'retired' ? 'Retired during sample inventory review' : null]));
  const assets = await q('SELECT asset_id,status FROM assets WHERE asset_code LIKE ? ORDER BY asset_code', ['WFI-V3-ASSET-%']);
  await insert('asset_assignments', ['asset_id','user_id','assigned_by','assigned_at','returned_at','condition_out','condition_in','notes'],
    assets.filter(row => ['assigned','available'].includes(row.status)).map((row,index) =>
      [row.asset_id,index % 7 === 0 ? primary : choose(people,index).id,admin,at(-45-index),
        row.status === 'available' ? at(-3-index % 10) : null,'good',row.status === 'available' ? 'good' : null,stamp('Inventory movement')]));

  const routes = await q('SELECT route_id,base_lat,base_lng FROM cab_routes WHERE is_active=1 ORDER BY route_id');
  const vehicles = await q('SELECT vehicle_id FROM cab_vehicles WHERE is_active=1 ORDER BY vehicle_id');
  const drivers = await q("SELECT driver_id FROM cab_drivers WHERE status='active' ORDER BY driver_id");
  if (!routes.length || !vehicles.length) return;
  const rideCases = Array.from({length: 52},(_,index) => {
    const status = choose(['pending','approved','rejected','cancelled','approved'],index);
    const complete = status === 'approved' && index % 2 === 0;
    return {
      id:index % 4 === 0 ? primary : choose(people,index).id, index, status, complete,
      offset:complete ? -2-index : 6+index,
      route:choose(routes,index),vehicle:choose(vehicles,index),driver:drivers.length ? choose(drivers,index) : null,
    };
  });
  await insert('cab_bookings', ['user_id','route_id','vehicle_id','booking_date','trip_type','night_cab','seat_number','status','approved_by','approved_at',
    'reject_reason','special_note','driver_id','journey_status','journey_start','journey_end','driver_rating','pickup_location','drop_location','booked_at'],
  rideCases.map(row => [row.id,row.route.route_id,row.vehicle.vehicle_id,day(row.offset),choose(['pickup','drop','both'],row.index),
    row.index % 3 === 0,1,row.status,row.status === 'approved' ? admin : null,row.status === 'approved' ? at(Math.min(-1,row.offset - 1)) : null,
    row.status === 'rejected' ? 'Sample route unavailable' : null,stamp('Transport booking'),row.status === 'approved' ? row.driver?.driver_id ?? null : null,
    row.complete ? 'completed' : 'waiting',row.complete ? at(row.offset,'08:00:00') : null,row.complete ? at(row.offset,'09:00:00') : null,
    row.complete ? 3 + row.index % 3 : null,'Demo Pickup Stop','Demo HQ',at(Math.min(-2,row.offset-2))]));
  const rideIds = await q('SELECT booking_id,user_id FROM cab_bookings WHERE special_note=? ORDER BY booking_id', [stamp('Transport booking')]);
  await insert('cab_issues', ['user_id','booking_id','issue_type','priority','subject','description','status','assigned_to','resolution','resolved_at'],
    rideIds.slice(0,25).map((row,index) => [row.user_id,row.booking_id,choose(['late_pickup','no_show','ac_not_working','wrong_route','other'],index),
      choose(['low','medium','high','urgent'],index),stamp('Transport feedback') + ' ' + pad(index+1),
      'Synthetic report for testing transport issue review.',choose(['open','in_review','resolved','closed','escalated'],index),hr,
      index % 5 === 2 ? 'Sample replacement vehicle arranged' : null,index % 5 === 2 ? at(-1) : null]));
}

async function seedFinanceAndTransfers({ q, insert, people, personas, primary, admin, hr, manager, anchor, day, at, stamp, pad, choose }) {
  const financePeople = [...new Set([primary, ...people.slice(-5).map(user=>user.id), ...people.filter((user,index)=>index%5===0).map(user=>user.id)])];
  const aprilYear = anchor.getUTCFullYear() - (anchor.getUTCMonth() < 3 ? 1 : 0);
  const financialYear = year => year + '-' + String(year+1).slice(-2);
  await insert('tax_declarations', ['user_id','financial_year','regime','ppf','health_self','hra_rent_paid','status','submitted_at','approved_by','approved_at','notes'],
    financePeople.flatMap((id,index) => [aprilYear-1,aprilYear].map((year,period) => {
      const state = period ? choose(['draft','submitted','approved'],index) : 'approved';
      const oldRegime = index % 2 === 0;
      return [id,financialYear(year),oldRegime?'old':'new',oldRegime?32_000:0,oldRegime?12_000:0,oldRegime?130_000:0,state,
        state === 'draft' ? null : at(-20),state === 'approved'?hr:null,state === 'approved'?at(-10):null,stamp('Tax declaration')];
    })), 'declaration_id');
  await insert('investment_declarations', ['user_id','financial_year','tax_regime','sec_80c_amount','sec_80d_amount','status','submitted_at','approved_by','approved_at','remarks'],
    financePeople.flatMap((id,index) => ['draft','submitted','approved','rejected'].map((state,period) =>
      [id,financialYear(aprilYear-period),index%2?'new':'old',index%2?0:45_000,index%2?0:15_000,state,period?at(-25):null,
        state==='approved'?hr:null,state==='approved'?at(-10):null,stamp('Investment review')])), 'decl_id');
  await insert('form16_records', ['user_id','financial_year','gross_salary','total_deductions','taxable_income','tax_liability','tds_deducted','regime','employer_name'],
    financePeople.map((id,index) => [id,financialYear(aprilYear-1),630_000 + index*12_000,50_000,580_000 + index*12_000,18_000,18_000,
      index%2?'new':'old','Workforce Intelligence Demo']), 'form16_id');
  await insert('employee_banking', ['user_id','bank_name','account_number','account_type','ifsc_code','branch_name','account_holder','is_verified','verified_by','verified_at'],
    financePeople.map((id,index) => [id,'Demo Bank','00000000'+pad(index+1),'salary','DEMO0000000','Training Branch','Synthetic account',
      index%2,index%2?hr:null,index%2?at(-25):null]), 'banking_id');
  const plans = await q('SELECT plan_id FROM insurance_plans WHERE is_active=1 ORDER BY plan_id');
  if (plans.length) {
    await insert('employee_benefits', ['user_id','plan_id','enrollment_date','expiry_date','status','nominee_name','nominee_relation','policy_number'],
      financePeople.flatMap((id,index) => ['active','pending','expired'].map((status,n) => [id,choose(plans,index+n).plan_id,day(-365),
        status === 'expired' ? day(-30) : day(180),status,'Demo beneficiary','Other','WFI-V3-POL-' + pad(index+1) + '-' + n])));
  }
  await insert('dependent_members', ['user_id','name','relation','dob','is_covered'],
    financePeople.flatMap((id,index) => [[id,'Demo Child '+pad(index+1),'child',day(-2_920-index),1],
      [id,'Demo Parent '+pad(index+1),'parent',null,0]]));
  await insert('family_information', ['user_id','marital_status','children_count','spouse_location'],
    financePeople.map((id,index)=>[id,index%2?'married':'single',index%2,index%2?'Demo North':null]), 'family_id');

  const loanStates = ['draft','pending','under_review','approved','rejected','disbursed','closed','foreclosed'];
  await insert('loan_applications', ['user_id','loan_type','principal','tenure_months','interest_rate','emi_amount','purpose','status','manager_action','hr_action',
    'admin_action','manager_id','hr_id','admin_id','amount_requested','amount_disbursed','disbursal_date','repayment_start','total_payable','disbursal_ref',
    'foreclosed_at','created_at'], loanStates.flatMap((status,index) => [primary,choose(financePeople,index+5)].filter((id,n,list)=>list.indexOf(id)===n).map((id,n) => {
      const principal = 24_000 + index * 6_000;
      const tenure = 6;
      const interest = 0.08/12;
      const emi = Math.round(principal * interest / (1-(1+interest)**(-tenure))*100)/100;
      const funded = index >= 5;
      return [id,choose(['education','personal','vehicle','medical'],index),principal,tenure,8,emi,stamp('Loan scenario')+' '+status,status,
        index>=2?'approved':'pending',index>=3?(index===4?'rejected':'approved'):'pending',index===3||funded?'approved':'pending',
        index>=2?manager:null,index>=3?hr:null,index===3||funded?admin:null,principal,funded?principal:null,
        funded?day(index>=6?-220:-75):null,funded?day(index>=6?-190:-45):null,Math.round(emi*tenure*100)/100,
        funded?'WFI-V3-LOAN-'+index+'-'+n:null,status==='foreclosed'?at(-10):null,at(funded?-230:-14-index)];
    })));
  const loans = await q("SELECT loan_id,user_id,principal,emi_amount,status FROM loan_applications WHERE purpose LIKE ? AND status IN ('disbursed','closed','foreclosed')", [stamp('Loan scenario') + '%']);
  await insert('loan_repayments', ['loan_id','user_id','installment_no','due_date','principal_comp','interest_comp','emi_amount','amount_due',
    'principal_part','interest_part','status','paid_date','paid_amount','amount_paid','deducted_from_salary'],
    loans.flatMap(loan => {
      let remaining = Number(loan.principal);
      const emi = Number(loan.emi_amount);
      return Array.from({length:6},(_,n) => {
        const interest = Math.round(remaining * 0.08 / 12 * 100) / 100;
        const principal = n===5 ? remaining : Math.round((emi-interest)*100)/100;
        remaining = Math.round((remaining-principal)*100)/100;
        const installment = Math.round((principal+interest)*100)/100;
        const offset = (loan.status === 'disbursed' ? -45 : -190) + 30*n;
        const status = loan.status === 'disbursed' ? choose(['paid','overdue','upcoming','upcoming','upcoming','upcoming'],n) : 'paid';
        return [loan.loan_id,loan.user_id,n+1,day(offset),principal,interest,installment,installment,principal,interest,status,
          status==='paid'?day(offset):null,status==='paid'?installment:0,status==='paid'?installment:0,status==='paid'?1:0];
      });
    }));
  await insert('transfer_requests', ['user_id','transfer_type','from_location','to_location','reason','preferred_date','is_urgent','manager_action',
    'manager_id','hr_action','hr_id','admin_action','admin_id','status','effective_date','created_at'],
    financePeople.slice(0,15).flatMap(id => ['pending','under_review','approved','rejected','completed'].map((status,n) =>
      [id,choose(['office','remote','hybrid','family','personal'],n),'Demo HQ','Demo South',stamp('Work location request'),day(20+n),
        n===3,n?'approved':'pending',n?manager:null,n>=2?(n===3?'rejected':'approved'):'pending',n>=2?hr:null,
        n===2||n===4?'approved':'pending',n===2||n===4?admin:null,status,n===4?day(-8):null,at(-28+n)])));
}

async function seedServiceDeskAndSafety({ q, insert, people, personas, primary, admin, hr, day, at, stamp, pad, choose }) {
  const subjects = ['Headset replacement','Access review','Payslip question','Desk move','Laptop setup','Portal notification'];
  const states = ['open','in_progress','pending_user','resolved','closed'];
  const reporters = [primary,primary,primary,primary,primary,...people.filter((user,index)=>index%2===0).map(user=>user.id)];
  await insert('helpdesk_tickets', ['user_id','category','priority','subject','description','status','assigned_to','assigned_at','resolved_at','resolution','satisfaction','created_at'],
    reporters.flatMap((id,index) => [0,1].map(n => {
      const state = choose(states,index+n);
      const resolved = ['resolved','closed'].includes(state);
      return [id,choose(['it_hardware','access','payroll','facilities','it_software','hr_query'],index+n),choose(['low','medium','high','critical'],index+n),
        stamp(choose(subjects,index+n))+' '+pad(index+1), 'Synthetic ticket for testing queue filters and comments.',state,index%5?hr:null,
        index%5?at(-5-index%9):null,resolved?at(-1-index%3):null,resolved?'Demo ticket resolved after follow-up.':null,resolved?3+index%3:null,at(-10-index%14)];
    })));
  const tickets = await q('SELECT ticket_id,user_id FROM helpdesk_tickets WHERE description=?', ['Synthetic ticket for testing queue filters and comments.']);
  await insert('helpdesk_comments', ['ticket_id','user_id','message','is_internal','created_at'],
    tickets.flatMap(row => [[row.ticket_id,row.user_id,'The sample ticket reproduces the issue on the demo account.',0,at(-4)],
      [row.ticket_id,hr,'Demo internal note for staff visibility testing.',1,at(-2)]]));
  await insert('notifications', ['user_id','type','title','message','is_read','read_at','action_url','priority','created_at'],
    people.filter((user,index)=>index%3===0||index>=people.length-5).flatMap(({id},index) =>
      ['normal','high','low','urgent'].map((priority,n) => [id,choose(['system','task_assigned','salary_paid','helpdesk_update'],n),
        stamp(choose(['Workspace update','Task reminder','Payroll ready','Support update'],n)),
        'Synthetic notification to test read and unread states.',(index+n)%2,(index+n)%2?at(-n-1):null,
        choose(['/modules.html','/tasks.html','/payslip-portal.html','/helpdesk.html'],n),priority,at(-n-2)])));
  await insert('audit_logs', ['actor_id','action','entity_type','new_values','created_at'], people.slice(-5).flatMap(({id}) =>
    ['DEMO_PROFILE_REVIEW','DEMO_POLICY_ACK','DEMO_EXPORT','DEMO_LEAVE_REVIEW'].map((action,index) =>
      [id,action,choose(['user','policy','report','leave_request'],index),JSON.stringify({ source: 'synthetic fixture' }),at(-index-1)])));
  await insert('user_sessions', ['session_id','user_id','device_info','browser','os','ip_address','city','is_current','is_suspicious','created_at','last_active','expires_at','revoked_at'],
    people.slice(-5).flatMap(({id}) => [0,1,2].map(index =>
      ['wfi-v3-device-' + id + '-' + index,id,stamp('Browser session'),choose(['Chrome','Firefox','Safari'],index),
        choose(['Windows','Linux','macOS'],index),'192.0.2.'+(10+index),'Demo Office',0,index===2,at(-8-index),at(-2-index),at(index? -1 : 14),index===2?at(-1):null])));
  await insert('safety_night_shift_approvals', ['user_id','shift_date','start_time','end_time','cab_required','status','approved_by','approved_at','notes'],
    people.slice(-5).flatMap(({id})=>['pending','approved','rejected'].map((status,n)=>
      [id,day(6+n),'18:00:00','23:00:00',n!==2,status,n?admin:null,n?at(-1):null,stamp('Night shift transport scenario')])));
  await insert('safety_sos_events', ['user_id','trigger_type','address','status','resolved_by','resolved_at','resolution_notes','created_at'],
    people.slice(0,6).map(({id},index) => [id,'manual','Demo site drill','resolved',admin,at(-5-index),'Synthetic safety drill, no real emergency.',at(-5-index,'09:00:00')]));
}
