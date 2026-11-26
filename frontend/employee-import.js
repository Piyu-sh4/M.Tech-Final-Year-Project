(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    location.replace('/login.html');
    return;
  }

  const element = id => document.getElementById(id);
  const fileInput = element('employee-spreadsheet');
  const previewButton = element('preview-button');
  const discardButton = element('discard-spreadsheet');
  const submitButton = element('submit-import');
  const preview = element('import-preview');
  const message = element('message');
  const columns = [
    ['row_number', 'Data row'], ['full_name', 'Full name'], ['email', 'Email'],
    ['designation', 'Job title'], ['department', 'Department'], ['company', 'Company'],
    ['error', 'Validation']
  ];
  let reviewedRows = [];

  function announce(text, error = false) {
    message.textContent = text;
    message.dataset.error = error;
  }

  async function request(path, rows) {
    const headers = { Authorization: 'Bearer ' + token };
    if (rows) headers['Content-Type'] = 'application/json';
    const response = await fetch('/api' + path, {
      method: rows ? 'POST' : 'GET',
      headers,
      body: rows ? JSON.stringify({ rows }) : undefined
    });
    if (response.status === 401) {
      localStorage.removeItem('token');
      location.replace('/login.html');
      throw Error('Sign in again to continue.');
    }
    const data = await response.json();
    if (!response.ok) throw Error(data.message || data.error || 'Employee import could not continue.');
    return data;
  }

  function resetPreview() {
    reviewedRows = [];
    preview.hidden = true;
    submitButton.hidden = true;
    element('import-preview-rows').replaceChildren();
  }

  function setBusy(busy) {
    for (const control of [fileInput, previewButton, discardButton, submitButton]) control.disabled = busy;
  }

  async function spreadsheetRows(file) {
    if (!/\.(csv|xlsx)$/i.test(file?.name || '') || file.size > 2 * 1024 * 1024)
      throw Error('Choose a CSV or XLSX file up to 2 MB.');
    if (!window.XLSX) throw Error('The spreadsheet reader did not load. Refresh and try again.');
    const workbook = XLSX.read(await file.arrayBuffer(), { type:'array', raw:true, sheets:0, sheetRows:52 });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw Error('No worksheet was found.');
    const range = XLSX.utils.decode_range(sheet['!fullref'] || sheet['!ref'] || 'A1');
    // Check the original bounds before conversion so the parser limit cannot truncate a batch.
    if (range.e.r - range.s.r > 50) throw Error('Choose a spreadsheet with 1 to 50 employee rows.');
    if (range.e.c - range.s.c >= 5) throw Error('Use only the columns in the CSV template.');
    const [header = [], ...rows] = XLSX.utils.sheet_to_json(sheet, { header:1, defval:'', blankrows:false });
    const names = header.map(value => String(value).trim().toLowerCase());
    const allowed = ['full_name', 'email', 'designation', 'department', 'company'];
    if (!names.includes('full_name') || !names.includes('email') ||
        names.some(name => !allowed.includes(name)) || new Set(names).size !== names.length) {
      throw Error('Use the column names in the CSV template. Remove any password or extra columns.');
    }
    if (!rows.length || rows.length > 50) throw Error('Choose a spreadsheet with 1 to 50 employee rows.');
    return rows.map(row => Object.fromEntries(names.map((name, index) => [name, String(row[index] ?? '')])));
  }

  function showPreview(rows) {
    const fragment = document.createDocumentFragment();
    for (const row of rows) {
      const record = document.createElement('tr');
      record.className = 'wfi-record-row';
      record.setAttribute('role','row');
      for (const [key, label] of columns) {
        const cell = document.createElement('td');
        cell.dataset.columnLabel = label;
        cell.setAttribute('role','cell');
        cell.textContent = key === 'error' ? row.error || 'Ready' : row[key] || '—';
        if (key === 'error' && row.error) cell.className = 'form-error';
        record.append(cell);
      }
      fragment.append(record);
    }
    const errors = rows.filter(row => row.error).length;
    element('import-preview-rows').replaceChildren(fragment);
    element('import-preview-summary').textContent = errors ?
      errors + ' of ' + rows.length + ' rows need corrections. Update the spreadsheet and preview it again.' :
      rows.length + ' ready to import. Employees will be pending until approved in the registration tracker.';
    preview.hidden = false;
    return !errors;
  }

  fileInput.addEventListener('change', () => {
    resetPreview();
    discardButton.hidden = !fileInput.files.length;
    announce('');
  });

  discardButton.addEventListener('click', () => {
    fileInput.value = '';
    discardButton.hidden = true;
    resetPreview();
    announce('Spreadsheet discarded.');
    fileInput.focus();
  });

  element('import-form').addEventListener('submit', async event => {
    event.preventDefault();
    resetPreview();
    setBusy(true);
    announce('Checking the spreadsheet…');
    try {
      const rows = await spreadsheetRows(fileInput.files[0]);
      const result = await request('/upload/employee-intake/preview', rows);
      if (showPreview(result.rows)) {
        reviewedRows = rows;
        submitButton.hidden = false;
      }
      announce('Preview ready.');
    } catch (error) { announce(error.message, true); }
    finally { setBusy(false); }
  });

  submitButton.addEventListener('click', async () => {
    if (!reviewedRows.length) return;
    setBusy(true);
    announce('Sending employees to registration review…');
    try {
      const result = await request('/upload/employee-intake', reviewedRows);
      resetPreview();
      fileInput.value = '';
      discardButton.hidden = true;
      announce(result.imported + (result.imported === 1 ? ' employee sent' : ' employees sent') + ' to registration review.');
      element('registration-review').focus();
    } catch (error) {
      submitButton.hidden = true;
      reviewedRows = [];
      announce(error.message, true);
    } finally { setBusy(false); }
  });

  request('/auth/me').then(user => {
    if (user.role_id !== 1) throw Error('Administrator access is required to import employees.');
    element('import-section').hidden = false;
    announce('');
  }).catch(error => announce(error.message, true));
})();
