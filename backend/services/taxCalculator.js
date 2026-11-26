const failure = message => Object.assign(new Error(message), {status:400});
function getCurrentFY() {
  const now = new Date();
  const year = now.getUTCFullYear() - (now.getUTCMonth() < 3 ? 1 : 0);
  return year + '-' + String(year + 1).slice(-2);
}
function validateYear(value) {
  return typeof value === 'string' && /^(20\d{2})-\d{2}$/.test(value) &&
    value.slice(-2) === String(Number(value.slice(0,4)) + 1).slice(-2);
}
function money(body,key) {
  const raw = body[key] ?? 0;
  if (!['number','string'].includes(typeof raw) || raw === '') throw failure('Enter a valid amount for ' + key.replaceAll('_',' ') + '.');
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 5000000) throw failure('Amounts must be between zero and ₹50 lakh. Use the official calculator for larger incomes.');
  return value;
}
function slabTax(income,slabs) {
  let tax = 0, previous = 0;
  for (const [ceiling,rate] of slabs) {
    tax += Math.max(0,Math.min(income,ceiling) - previous) * rate;
    previous = ceiling;
  }
  return tax;
}
function calculateTax(body) {
  const fy = body.financial_year || getCurrentFY();
  if (!['2024-25','2025-26','2026-27'].includes(fy)) throw failure('This estimate supports financial years 2024–25 through 2026–27. Use the official calculator for other years.');
  const regime = body.regime ?? 'new';
  if (!['old','new'].includes(regime)) throw failure('Choose the old or new regime.');
  const income = money(body,'gross_income');
  const deductions = Object.fromEntries(['ded_80c','ded_80d','ded_80e','ded_80g','ded_nps','ded_hra','ded_other','rent_paid','professional_tax']
    .map(key => [key,money(body,key)]));
  const standard = regime === 'new' ? 75000 : 50000;
  const claimed = regime === 'old' ? Math.min(deductions.ded_80c,150000) + Math.min(deductions.ded_80d,25000) +
    Math.min(deductions.ded_nps,50000) + deductions.ded_80e + deductions.ded_80g + deductions.ded_hra +
    deductions.ded_other + deductions.professional_tax : 0;
  const taxable = Math.max(0,Math.round((income - standard - claimed)/10)*10);
  const modern = fy !== '2024-25';
  const newSlabs = modern ? [[400000,0],[800000,.05],[1200000,.10],[1600000,.15],[2000000,.20],[2400000,.25],[Infinity,.30]] :
    [[300000,0],[700000,.05],[1000000,.10],[1200000,.15],[1500000,.20],[Infinity,.30]];
  const slabs = regime === 'new' ? newSlabs : [[250000,0],[500000,.05],[1000000,.20],[Infinity,.30]];
  const base = slabTax(taxable,slabs);
  const threshold = regime === 'old' ? 500000 : modern ? 1200000 : 700000;
  const rebate = taxable <= threshold ? Math.min(base,regime === 'old' ? 12500 : modern ? 60000 : 25000) : 0;
  const relief = regime === 'new' && taxable > threshold ? Math.max(0,base - (taxable - threshold)) : 0;
  const afterRelief = Math.max(0,base - rebate - relief);
  const cess = afterRelief * .04;
  const payable = Math.round((afterRelief + cess)/10)*10;
  return {financial_year:fy,regime,gross_income:income,taxable_income:taxable,base_tax:Math.round(base),
    rebate:Math.round(rebate),marginal_relief:Math.round(relief),cess:Math.round(cess),tax_payable:payable,
    total_tax:payable,monthly_tds:Math.round(payable/12),
    deductions_detail:{std_deduction:standard,...deductions,total_deductions:claimed},
    scope:'Estimate for resident salaried individuals under 60 with ordinary income up to ₹50 lakh. Enter only eligible deductions. Use the official portal for filing and other income categories.',
    source_url:'https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1'};
}
module.exports = {calculateTax,getCurrentFY,validateYear};
