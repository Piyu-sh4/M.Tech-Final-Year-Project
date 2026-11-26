process.env.DB_NAME=process.env.TEST_DB_NAME || 'workforce_intelligence_test';
const db=require('../backend/config/db');
const {query}=require('../backend/services/database');
const catalog=require('../backend/config/moduleCatalog');
const tables={dependents:'dependents',leave:'leave_requests',expenses:'expense_claims',travel:'travel_requests',
 'salary-advance':'salary_advances','holiday-calendar':'holiday_calendar','employee-referral':'employee_referrals',
 assets:'assets','cab-booking':'cab_bookings',meetings:'meetings','family-transfer':'transfer_requests',
 'tax-portal':'tax_declarations','loan-portal':'loan_applications',exit:'resignations','document-vault':'employee_documents'};
afterAll(async()=>new Promise(resolve=>db.end(resolve)));

test('every native dropdown uses values accepted by its MySQL enum',async()=>{
 const columns=await query(db,"SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() AND DATA_TYPE='enum'");
 let checked=0;
 for(const item of Object.values(catalog).filter(item=>item.form)) for(const field of item.form.fields) {
  if(field.type!=='select')continue;
  const column=columns.find(column=>column.TABLE_NAME===tables[item.slug]&&column.COLUMN_NAME===field.key);
  if(!column)continue;
  const values=[...column.COLUMN_TYPE.matchAll(/'([^']*)'/g)].map(match=>match[1].toLowerCase());
  expect(field.options.filter(value=>!values.includes((field.storageValues?.[value] || value).toLowerCase()))).toEqual([]);
  checked++;
 }
 expect(checked).toBeGreaterThan(10);
});

test('seeded database has no orphaned foreign key relationships',async()=>{
 const keys=await query(db,`SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME,CONSTRAINT_NAME
   FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
   ORDER BY TABLE_NAME,CONSTRAINT_NAME,ORDINAL_POSITION`);
 const groups=new Map();
 for(const key of keys) {
  for(const value of [key.TABLE_NAME,key.COLUMN_NAME,key.REFERENCED_TABLE_NAME,key.REFERENCED_COLUMN_NAME]) expect(value).toMatch(/^\w+$/);
  const id=key.TABLE_NAME+'.'+key.CONSTRAINT_NAME;
  if(!groups.has(id))groups.set(id,[]);
  groups.get(id).push(key);
 }
 const invalid=[];
 for(const [id,list] of groups) {
  const key=list[0];
  const join=list.map(x=>`a.\`${x.COLUMN_NAME}\`=b.\`${x.REFERENCED_COLUMN_NAME}\``).join(' AND ');
  const present=list.map(x=>`a.\`${x.COLUMN_NAME}\` IS NOT NULL`).join(' AND ');
  const [row]=await query(db,`SELECT COUNT(*) n FROM \`${key.TABLE_NAME}\` a LEFT JOIN \`${key.REFERENCED_TABLE_NAME}\` b ON ${join}
    WHERE ${present} AND b.\`${key.REFERENCED_COLUMN_NAME}\` IS NULL`);
  if(row.n)invalid.push({id,orphans:row.n});
 }
 expect(groups.size).toBeGreaterThan(200);
 expect(invalid).toEqual([]);
});
