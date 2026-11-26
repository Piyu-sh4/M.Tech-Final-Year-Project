const { readFile } = require('node:fs/promises');
const path = require('node:path');
const barcode = require('jsbarcode');
const { imageExtension, storedPath } = require('./uploadFiles');
const { renderPDF } = require('./pdfService');

const escape = value => String(value ?? '').replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

async function photoMarkup(profile) {
  const filename = storedPath(profile.photo_url, 'photos');
  if (filename) {
    const bytes = await readFile(filename).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    const format = bytes && imageExtension(bytes);
    if (format) {
      const type = format === 'jpg' ? 'jpeg' : format;
      return '<img alt="Profile photo" src="data:image/' + type + ';base64,' + bytes.toString('base64') + '">';
    }
  }
  return escape((profile.full_name || 'U').charAt(0).toUpperCase());
}

function barcodeMarkup(value) {
  const target = {};
  barcode(target, value, { format: 'CODE128' });
  const data = target.encodings.map(encoding => encoding.data).join('');
  // Add quiet zones so the barcode remains legible to scanners.
  const runs = Array.from(data.matchAll(/1+/g), match =>
    '<rect x="' + (match.index + 10) + '" y="0" width="' + match[0].length + '" height="42"/>').join('');
  return '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 ' +
    (data.length + 20) + ' 42" fill="#132742">' + runs + '</svg>';
}

async function renderEmployeeIdCard(profile) {
  const styles = await readFile(path.join(__dirname, '../../frontend/employee-id-card.css'), 'utf8');
  const employeeCode = 'EMP' + String(profile.user_id).padStart(4, '0');
  const date = profile.join_date ? new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(profile.join_date) : '—';
  const fields = [
    ['Employee code', employeeCode], ['Department', profile.dept_name], ['Role', profile.role_name],
    ['Join date', date], ['Email', profile.email, true], ['Phone', profile.phone, true],
  ].map(([label, value, wide]) =>
    '<div class="id-field' + (wide ? ' id-field-wide' : '') + '"><div class="id-field-label">' +
    label + '</div><div class="id-field-value">' + escape(value || '—') + '</div></div>').join('');
  const photo = await photoMarkup(profile);
  return renderPDF(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Employee ID card</title>
    <style>body { font: 16px system-ui, sans-serif; } ${styles}</style>
    <body><article class="id-card" id="idCardEl" aria-label="Employee identity card">
      <div class="id-logo">${escape(profile.company_name || 'Workforce Intelligence')}</div>
      <div class="id-identity"><div class="id-photo">${photo}</div><div>
        <div class="id-name">${escape(profile.full_name)}</div>
        <div class="id-designation">${escape(profile.designation || '')}</div></div></div>
      <div class="id-grid">${fields}</div>
      <div class="id-barcode">${barcodeMarkup(employeeCode)}<div class="id-barcode-text">${employeeCode}</div></div>
      <div class="id-footer">Valid: ${new Date().getFullYear()}</div>
    </article></body></html>`);
}

module.exports = { renderEmployeeIdCard };
