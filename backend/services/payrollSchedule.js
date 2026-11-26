const creditDay = 7;

function withCreditDeadline(record) {
  const month = Number(record.month);
  const year = Number(record.year);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const deadline = Number.isInteger(month) && month >= 1 && month <= 12 &&
    Number.isInteger(year) && year >= 1000 && nextYear <= 9999
    ? [nextYear, String(nextMonth).padStart(2, '0'), String(creditDay).padStart(2, '0')].join('-')
    : null;
  return { ...record, credit_due_on: deadline };
}

module.exports = { creditDay, withCreditDeadline };
