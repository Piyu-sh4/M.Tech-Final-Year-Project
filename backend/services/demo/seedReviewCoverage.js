const fs = require('node:fs');
const path = require('node:path');
const {query} = require('../database');

function ensureFiles() {
  const destination = path.join(__dirname,'../../uploads/demo');
  fs.mkdirSync(destination,{recursive:true});
  const file = path.join(destination,'workforce-handbook.pdf');
  if (!fs.existsSync(file)) fs.copyFileSync(path.join(__dirname,'../../../frontend/assets/demo-workforce-handbook.pdf'),file,fs.constants.COPYFILE_EXCL);
}

async function seed(connection) {
  const run = (sql,args) => query(connection,sql,args);
  const people = await run(`SELECT user_id,email FROM users WHERE email IN
    ('admin@wip.com','employee@wfintelligence.com','manager@wfintelligence.com','hr@wfintelligence.com','finance-ready@example.test')`);
  const [route] = await run('SELECT route_id FROM cab_routes ORDER BY route_id LIMIT 1');
  const [vehicle] = await run('SELECT vehicle_id FROM cab_vehicles ORDER BY vehicle_id LIMIT 1');
  for (const person of people) {
    const [{bookings}] = await run('SELECT COUNT(*) bookings FROM cab_bookings WHERE user_id=?',[person.user_id]);
    if (!bookings && route && vehicle) await run(`INSERT INTO cab_bookings (user_id,route_id,vehicle_id,booking_date,trip_type,status,special_note)
      VALUES (?,?,?,CURRENT_DATE + INTERVAL 3 DAY,'pickup','pending','Demo v5 staff transport')`,[person.user_id,route.route_id,vehicle.vehicle_id]);
    const [{contacts}] = await run('SELECT COUNT(*) contacts FROM safety_emergency_contacts WHERE user_id=?',[person.user_id]);
    if (!contacts) await run(`INSERT INTO safety_emergency_contacts (user_id,name,relation,phone,is_primary)
      VALUES (?,'Demo safety contact','Synthetic test contact','0000000000',1)`,[person.user_id]);
    await run(`INSERT INTO employee_documents (user_id,doc_type,doc_name,file_path,file_url,uploaded_by,status,notes)
      VALUES (?,'other','Demo workforce handbook','/uploads/demo/workforce-handbook.pdf','/uploads/demo/workforce-handbook.pdf',?,'verified','Original synthetic test document')`,[person.user_id,person.user_id]);
    await run(`INSERT IGNORE INTO leave_balances (user_id,year,leave_type,entitled) VALUES (?,YEAR(CURRENT_DATE),'casual',12)`,[person.user_id]);
  }
  const todayPeople = await run("SELECT user_id FROM users WHERE employee_code LIKE 'WFI-V3-%' AND status='active' ORDER BY user_id LIMIT 8");
  for (const person of todayPeople) await run(`INSERT IGNORE INTO attendance (user_id,work_date,clock_in,clock_out,total_hours,status,remarks)
    VALUES (?,CURRENT_DATE,TIMESTAMP(CURRENT_DATE,'09:00:00'),TIMESTAMP(CURRENT_DATE,'17:00:00'),8,'present','Demo v5 current-day coverage')`,[person.user_id]);
}
module.exports = {seed,ensureFiles};
