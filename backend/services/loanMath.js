const round = value => Math.round((value + Number.EPSILON) * 100) / 100;

function calculateEMI(principal, annualRate, months) {
  const rate = annualRate / 1200;
  const payment = rate === 0 ? principal / months : principal * rate / (1 - (1 + rate) ** -months);
  const emi = round(payment);
  return { emi, total: round(payment * months), interest: round(payment * months - principal) };
}

function repaymentSchedule(principal, annualRate, months, startDate) {
  const date = new Date(startDate + 'T00:00:00Z');
  const day = date.getUTCDate();
  const { emi } = calculateEMI(principal, annualRate, months);
  let balance = principal;
  return Array.from({ length: months }, (_, index) => {
    const interest = round(balance * annualRate / 1200);
    const principalPart = index === months - 1 ? balance : Math.min(balance, round(emi - interest));
    const due = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + index + 1, 0));
    due.setUTCDate(Math.min(day, due.getUTCDate()));
    balance = round(balance - principalPart);
    return { number: index + 1, due: due.toISOString().slice(0,10), principal: principalPart,
      interest, amount: round(principalPart + interest) };
  });
}

module.exports = { calculateEMI, repaymentSchedule, round };
