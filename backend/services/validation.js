function isISODate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '1000-01-01' &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
}
module.exports = {isISODate};
