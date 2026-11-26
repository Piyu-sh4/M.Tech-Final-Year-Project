(() => {
  const $ = id => document.getElementById(id);
  const token = localStorage.getItem('token');
  if (!token) { location.replace('/login.html'); return; }
  let currentUser, entries, current, rows = [], filtered = [], lookupCache = {};
  const pageSize = 30;
  let spreadsheetLibrary, exportingExcel = false;
  let page = 1, showArchived = false;
  const trackColumns = ['title','details','status','target_date','updated_at'];
  const label = k => ({ dob:'Date of birth', is_active:'Active', is_covered:'Covered', is_current:'Current', full_name:'Employee', ref_no:'Reference', ot_hours:'Overtime', net_salary:'Net pay', credit_due_on:'Credit due by', paid_on:'Recorded credit date', requested_percentage:'Payout percentage', assessment_score:'Assessment score', is_mandatory:'Required', payroll_period:'Payout month', tds:'TDS' })[k] ||
    k.replaceAll('_',' ').replace(/^./, c => c.toUpperCase());
  const formatMoney = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' });
  const monthFormat = new Intl.DateTimeFormat('en-IN', { month:'long', year:'numeric', timeZone:'UTC' });
  const formatPayoutMonth = (year, month) => monthFormat.format(new Date(Date.UTC(year, month - 1, 1)));
  const dateFormat = new Intl.DateTimeFormat('en-IN', { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' });
  const monetaryFields = new Set(['base_salary','net_salary','gross_income','bonus','deductions',
    'tax_liability','principal','emi_amount','estimated_cost','cash_advance_deduction','premium_annual']);
  const el = (tag, value) => {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = value;
    return node;
  };
  function link(href, name) {
    const a = el('a', name); a.href = href; return a;
  }
  function button(text, handler, primary) {
    const b = el('button', text);
    b.type = 'button';
    if (primary) b.className = 'primary';
    b.addEventListener('click', handler);
    return b;
  }
  function message(text = '', error = false) {
    $('message').textContent = text;
    $('message').dataset.error = error;
  }
  async function request(path, { method = 'GET', payload, blob = false } = {}) {
    const headers = {Authorization: 'Bearer ' + token};
    const multipart = payload instanceof FormData;
    if (payload !== undefined && !multipart) headers['Content-Type'] = 'application/json';
    const response = await fetch('/api' + path, { method, headers, body: multipart ? payload : payload === undefined ? undefined : JSON.stringify(payload) });
    if (response.status === 401) {
      localStorage.removeItem('token');
      location.assign('/login.html');
      throw Error('Sign in again to continue.');
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw Error(body.message || 'Request failed (' + response.status + ').');
    }
    return blob ? response.blob() : response.json();
  }
  const staff = () => [1,3,4].includes(currentUser.role_id);
  const can = item => !item.roles || item.roles.includes(currentUser.role_id);
  const recordsPath = () => '/modules/' + current.slug + '/records';
  const columns = () => current.workflow ? current.columns : current.states ? trackColumns : current.columns;
  const display = (key, value) => {
    if (value == null || value === '') return '—';
    if ((monetaryFields.has(key) || (current?.slug === 'salary-advance' && key === 'amount')) && Number.isFinite(Number(value)))
      return formatMoney.format(value);
    if (key === 'employment_type') return String(value).replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
    if (['requested_percentage', 'progress_pct', 'assessment_score'].includes(key)) return value + '%';
    if (key === 'payroll_period') return formatPayoutMonth(Math.floor(value / 100), value % 100);
    if (typeof value === 'boolean' || /^(is_|has_|verified$|completed$|cab_required$)/.test(key)) return Number(value) ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && /^\d{4}-\d\d-\d\d(T|$)/.test(value)) {
      if (value.includes('T') && /(_at|clock_in|clock_out)$/.test(key)) {
        const timestamp = new Date(value);
        if (Number.isFinite(timestamp.getTime())) return timestamp.toLocaleString();
      } else {
        const calendarDay = new Date(value.slice(0,10) + 'T00:00:00Z');
        if (Number.isFinite(calendarDay.getTime())) return dateFormat.format(calendarDay);
      }
    }
    return String(value);
  };
  async function mutate(control, options, success, onDone, onError) {
    control.disabled = true;
    message('Saving…');
    try {
      const result = await request(options.path, options);
      if (onDone) onDone();
      await load(false);
      message(result.message || success);
    } catch (error) {
      message(error.message, true);
      onError?.(error.message);
    }
    finally { control.disabled = false; }
  }
  function showRecord(row, opener) {
    WorkforceRecords.show(current.title + ' — record', columns().map(key => [label(key), display(key,row[key])]), [], opener);
  }
  function openActionForm(opener, title, options, input, value = '') {
    const dialog = $('record-form');
    const heading = el('h2', title);
    heading.id = 'record-form-heading';
    const form = el('form');
    const label = el('label', input.label);
    const field = el(input.type === 'textarea' ? 'textarea' : 'input');
    field.required = true;
    field.value = value ?? '';
    if (input.type === 'textarea') {
      field.rows = 4;
      field.maxLength = 1480;
    } else {
      field.type = input.type;
      if (input.type === 'number') {
        field.min = 0;
        if (input.max != null) field.max = input.max;
      }
      if (input.maxLength != null) field.maxLength = input.maxLength;
    }
    label.append(field);
    const error = el('p');
    error.className = 'form-error';
    error.setAttribute('role', 'alert');
    const submit = el('button', title);
    submit.type = 'submit';
    submit.className = 'primary';
    const controls = el('div');
    controls.className = 'form-actions';
    controls.append(button('Cancel', () => dialog.close()), submit);
    form.append(label, error, controls);
    form.addEventListener('submit', event => {
      event.preventDefault();
      error.textContent = '';
      mutate(submit, { ...options, payload: { ...options.payload, [input.key]: field.value } }, title + ' saved.',
        () => dialog.close(), message => { error.textContent = message; });
    });
    dialog.replaceChildren(heading, form);
    dialog.addEventListener('close', () => {
      if (opener.isConnected) opener.focus();
      else $('search').focus();
    }, { once: true });
    dialog.showModal();
    field.focus();
  }

  function externalResource(value, name) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) return null;
      const resource = link(url.href, name);
      resource.className = 'action-link';
      resource.target = '_blank';
      resource.rel = 'noopener noreferrer';
      return resource;
    } catch {
      return null;
    }
  }
  function actionCell(row) {
    const cell = el('td');
    cell.className = 'row-actions';
    cell.setAttribute('role','cell');
    cell.setAttribute('headers','record-column-actions');
    const controls = el('div');
    if (current.slug === 'exit' && row.status === 'hr_approved' &&
        [1,4].includes(currentUser.role_id) && row.user_id !== currentUser.user_id) {
      controls.append(button('View settlement', event => window.WorkforceFinance.showExitSettlement(row,event.currentTarget)));
    }
    if (current.slug === 'loan-portal' && ['disbursed','closed','foreclosed'].includes(row.status)) {
      controls.append(button('Repayments', () => window.WorkforceFinance.showRepayments(row)));
    }
    if (current.certificateRegister && row.downloadable) {
      controls.append(button('View certificate', async event => {
        const control = event.currentTarget;
        control.disabled = true;
        try {
          const url = URL.createObjectURL(await request(current.download.path.replace(':id',row.enrollment_id) + '?view=1',{blob:true}));
          const preview = link(url,'Open certificate PDF');
          preview.target = '_blank';
          preview.rel = 'noopener noreferrer';
          const dialog = WorkforceRecords.show('Certificate',columns().map(key=>[label(key),display(key,row[key])]),[preview],control);
          dialog.addEventListener('close', () => setTimeout(() => URL.revokeObjectURL(url),1000),{once:true});
        } catch (error) { message(error.message,true); }
        finally { control.disabled = false; }
      }));
    } else controls.append(button('View', event=>showRecord(row,event.currentTarget)));
    if (current.slug !== 'reports' && !current.hideGenericExport) {
      for (const [format, name] of [['pdf','Download record PDF'], ['docx','Download record Word document']]) {
        controls.append(button(name, async event => {
          const control = event.currentTarget;
          control.disabled = true;
          try {
            const fields = columns().map(key => [label(key), display(key,row[key]).slice(0,3000)]);
            const file = await request('/record-pdf' + (format === 'docx' ? '?format=docx' : ''),
              {method:'POST',payload:{title:current.title,fields},blob:true});
            saveFile(file,current.slug+'-record.'+format);
          } catch (error) { message(error.message,true); }
          finally { control.disabled = false; }
        }));
      }
    }
    if (current.states && row.editable!==false) controls.append(button('Edit', () => openForm(row)));
    if(current.workflow && row.deletable)controls.append(button('Delete draft',event=>{if(confirm('Remove this draft from active records? Its history will be retained.'))mutate(event.target,{path:recordsPath()+'/'+row.record_id,method:'DELETE'},'Draft removed.');}));
    if (current.form?.editLabel && can(current.form)) controls.append(button(current.form.editLabel, () => openForm(row)));
    if (current.edit && (row[current.edit.ownerKey] === currentUser.user_id || currentUser.role_id === 1) && ['scheduled','active'].includes(row.status)) {
      const menu = el('details');
      menu.append(el('summary','Meeting actions'),button('Edit details',()=>openForm(row)));
      if (row.status === 'scheduled') menu.append(button('Reschedule meeting',()=>meetingChange(row,false)));
      menu.append(button('Cancel meeting',()=>meetingChange(row,true)));
      controls.append(menu);
    }
    if (current.workflow) {
      controls.append(button('History', async event => {
        const opener = event.currentTarget;
        try {
          const history = await request(recordsPath() + '/' + row.record_id + '/history');
          WorkforceRecords.show('Workflow history', history.map(item =>
            [display('created_at', item.created_at) + ' · ' + item.actor_name,
              item.to_status + ' · ' + item.note]), [], opener);
        } catch (error) { message(error.message, true); }
      }));
      if (row.commentable) controls.append(button('Add comment', event => openActionForm(event.currentTarget,
        'Add comment', { path: recordsPath() + '/' + row.record_id + '/comments', method: 'POST' },
        { key: 'comment', label: 'Comment', type: 'textarea' })));
      if (row.restorable) controls.append(button('Restore draft', event => mutate(event.currentTarget,
        { path: recordsPath() + '/' + row.record_id + '/restore', method: 'POST', payload: { version: row.version } },
        'Draft restored.')));
      for (const next of row.allowed_transitions || []) controls.append(button(next, event => openActionForm(
        event.currentTarget, next, { path: recordsPath() + '/' + row.record_id + '/transition',
          method: 'POST', payload: { status: next, version: row.version } },
        { key: 'note', label: 'Decision note', type: 'textarea' })));
    }
    for (const file of current.downloads || (current.download ? [current.download] : [])) {
      if (row[file.key] == null || (file.availableKey && !row[file.availableKey])) continue;
      controls.append(button(file.label, async event => {
        event.target.disabled = true;
        try {
          const data = await request(file.path.replace(':id', row[file.key]), {blob:true});
          const extension = ({'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','application/pdf':'.pdf'})[data.type] || '';
          saveFile(data, (file.filename || current.slug) + '-' + row[file.key] + extension);
        }
        catch (error) { message(error.message, true); }
        finally { event.target.disabled = false; }
      }));
    }
    if (current.slug === 'training' && [1,4].includes(currentUser.role_id) && !row.has_assessment) {
      controls.append(button('Publish assessment', event =>
        WorkforceAssessment.open({ row, editor: true, opener: event.currentTarget, request, mutate })));
    }
    if (current.slug === 'my-learning' && row.can_take_assessment) {
      controls.append(button('Take assessment', async event => {
        const opener = event.currentTarget;
        opener.disabled = true;
        try { await WorkforceAssessment.open({ row, editor: false, opener, request, mutate }); }
        catch (error) { message(error.message, true); }
        finally { opener.disabled = false; }
      }));
    }
    if (current.slug === 'skills-matrix' && row.has_training) {
      const courses = link('/training.html?skill_id=' + encodeURIComponent(row.skill_id), 'Find training');
      courses.className = 'action-link';
      controls.append(courses);
    }
    for (const [key, name] of Object.entries(current.externalLinks || {})) {
      const resource = externalResource(row[key], name);
      if (resource) controls.append(resource);
    }
    for (const action of current.actions || []) {
      if (!can(action) || row[action.key] == null || (action.match && row[action.match[0]] !== action.match[1]) ||
          (action.ownOnly && row.user_id !== currentUser.user_id) || (action.notOwn && row.user_id === currentUser.user_id) ||
          (action.hide && row[action.hide[0]] === action.hide[1])) continue;
      controls.append(button(action.label, event => {
        const options = {
          path: action.path.replace(':id', encodeURIComponent(row[action.key])),
          method: action.method || 'PATCH',
        };
        options.payload = action.bodyKey ? { [action.bodyKey]: row[action.key] } :
          { ...action.payload, ...Object.fromEntries((action.rowPayload || []).map(key => [key, row[key]])) };
        if (action.certificateConfirmation)
          return WorkforceAssessment.confirmCertificate({ row, opener: event.currentTarget, options, mutate });
        if (action.input) return openActionForm(event.currentTarget, action.label, options, action.input, row[action.input.sourceKey || action.input.key]);
        if (action.confirm && !confirm(action.confirm)) return;
        mutate(event.currentTarget, options, action.label + ' saved.');
      }));
    }
    if (controls.children.length) cell.append(controls);
    else cell.textContent = '—';
    return cell;
  }
  function learningChecklist(row) {
    const checklist = el('ol');
    checklist.className = 'learning-checklist';
    checklist.setAttribute('aria-label', 'Course checklist');
    const courseworkComplete = Number(row.progress_pct) >= 100;
    const assessmentPassed = Boolean(row.assessment_passed);
    checklist.append(el('li', 'Coursework · ' + (courseworkComplete ? 'Complete' : display('progress_pct', row.progress_pct ?? 0))));
    if (row.has_assessment) checklist.append(el('li', 'Assessment · ' + (assessmentPassed ? 'Passed' : courseworkComplete ? 'Ready' : 'After coursework')));
    const certificateStatus = row.has_certificate ? 'Available' : row.certificate_revoked ? 'Revoked' :
      courseworkComplete && (!row.has_assessment || assessmentPassed) ? 'Awaiting issuance' : 'After course requirements';
    checklist.append(el('li', 'Certificate · ' + certificateStatus));
    return checklist;
  }
  function render() {
    const cols = columns(), term = $('search').value.trim().toLowerCase();
    filtered = rows.filter(row => cols.some(key => display(key,row[key]).toLowerCase().includes(term) || String(row[key] ?? '').toLowerCase().includes(term)));
    const table = $('workspace').querySelector('table');
    const header = el('tr');
    header.setAttribute('role','row');
    const hasActions = true;
    for (const key of [...cols, ...(hasActions ? ['actions'] : [])]) {
      const heading = el('th',label(key));
      heading.scope = 'col';
      heading.id = 'record-column-' + key;
      heading.setAttribute('role','columnheader');
      header.append(heading);
    }
    table.tHead.replaceChildren(header);
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, pages);
    const start = (page - 1) * pageSize;
    const fragment = document.createDocumentFragment();
    for (const row of filtered.slice(start, start + pageSize)) {
      const tr = el('tr');
      tr.setAttribute('role','row');
      for (const key of cols) {
        const td = el('td');
        td.setAttribute('role','cell');
        td.setAttribute('headers','record-column-' + key);
        if (['details','description','content','summary','comment','review_note'].includes(key)) td.dataset.wide = 'true';
        const mobileLabel = el('span',label(key));
        mobileLabel.className = 'cell-label';
        mobileLabel.setAttribute('aria-hidden','true');
        const value = display(key,row[key]);
        td.append(mobileLabel);
        if (key === 'status' || key === 'payment_status') {
          const badge = el('span',value);
          badge.className = 'pill';
          badge.dataset.tone = statusTone(value);
          td.append(badge);
        } else if (current.urlColumns?.includes(key) && /^https?:\/\//.test(row[key])) {
          if (current.slug === 'meetings' && ['cancelled','ended'].includes(row.status)) {
            td.append(document.createTextNode(row.status === 'cancelled' ? 'Meeting cancelled' : 'Meeting ended'));
            tr.append(td);
            continue;
          }
          const website = link(row[key],current.slug==='meetings'?'Join meeting ↗':'Visit bank ↗');
          website.target = '_blank'; website.rel = 'noopener noreferrer';
          td.append(website);
        } else if (current.slug === 'my-learning' && key === 'next_step') {
          td.append(el('strong',value), learningChecklist(row));
        } else if (key === 'certificate_stage') {
          td.append(el('span',value));
        } else td.append(document.createTextNode(value));
        tr.append(td);
      }
      if (hasActions) tr.append(actionCell(row));
      fragment.append(tr);
    }
    table.tBodies[0].replaceChildren(fragment);
    table.parentElement.hidden = !filtered.length;
    $('count').parentElement.dataset.empty = String(!filtered.length);
    $('clear-record-search').hidden = Boolean(filtered.length || !term);
    $('count').textContent = filtered.length === 0 ? (term ? 'No records match your search.' : 'No records yet.') :
      pages === 1 ? filtered.length + (filtered.length === 1 ? ' record' : ' records') :
      'Showing ' + (start + 1) + '–' + Math.min(start + pageSize, filtered.length) + ' of ' + filtered.length + ' records';
    $('export').disabled = !filtered.length;
    $('export-excel').disabled = exportingExcel || !filtered.length;
    $('prev-page').closest('nav').hidden = pages === 1;
    $('prev-page').disabled = page === 1;
    $('next-page').disabled = page === pages;
    $('page-indicator').textContent = 'Page ' + page + ' of ' + pages;
  }
  function statusTone(value) {
    const normalized = value.toLowerCase().replaceAll('_',' ');
    if (/^(approved|completed|achieved|active|paid|verified|resolved|present|accepted)$/.test(normalized)) return 'positive';
    if (/^(pending|submitted|planned|in progress|under review|draft|scheduled)$/.test(normalized)) return 'pending';
    if (/^(rejected|cancelled|overdue|failed|withdrawn|declined|absent|lost)$/.test(normalized)) return 'negative';
    return 'neutral';
  }
  async function load(showMessage = true) {
    if (showMessage) message('Loading records…');
    try {
      const canUseStaffPath = current.staffRoles ? current.staffRoles.includes(currentUser.role_id) : staff();
      let path = current.states ? recordsPath() : ((canUseStaffPath && current.staffPath) || current.path);
      const skill = current.slug === 'training' && new URLSearchParams(location.search).get('skill_id');
      if (skill) path += '?skill_id=' + encodeURIComponent(skill);
      if (current.workflow && showArchived) path += '?archive=1';
      const data = await request(path);
      const lists = ['tasks','rows','data','logs','records','users','plans','jobs','reviews','holidays','tickets','requests','courses','announcements','loans','resignations'];
      rows = Array.isArray(data) ? data : lists.map(key => data?.[key]).find(Array.isArray) || (data && Object.keys(data).length ? [data] : []);
      render();
      document.dispatchEvent(new Event('workforce:records-loaded'));
      if (showMessage) message('');
    } catch (error) {
      rows = []; render(); message(error.message,true);
      if (!showMessage) throw error;
    }
  }
  const trackerFields = () => [{key:'title',label:current.subject,type:'text'}, {key:'details',label:'Details',type:'textarea',optional:true},
    {key:'status',label:'Status',type:'select',options:current.states}, {key:'target_date',label:'Target date',type:'date',optional:true}];
  async function choices(name) {
    if (lookupCache[name]) return lookupCache[name];
    const lookups = { cabRoutes:['/cab/routes','route_id','route_name'], cabVehicles:['/cab/vehicles','vehicle_id','label'], jobs:['/hiring/jobs','job_id','title'], trainingSkills:['/training/skills','skill_id','skill_name'] };
    const [path,key,title] = lookups[name];
    const list = await request(path);
    return lookupCache[name] = list.map(row => [row[key],row[title] || row.vehicle_number || row.reg_number || 'Vehicle #' + row[key]]);
  }
  function meetingChange(row, cancelling) {
    const panel = $('record-form');
    const title = cancelling ? 'Cancel meeting' : 'Reschedule meeting';
    const heading = el('h2', title);
    heading.id = 'record-form-heading';
    const form = el('form');
    const label = el('label',cancelling ? 'Cancellation reason' : 'New date and time');
    const input = el(cancelling ? 'select' : 'input');
    input.required = true;
    if (cancelling) {
      for (const reason of ['Scheduling conflict','Host unavailable','Meeting no longer needed','Other'])
        input.append(el('option',reason));
    } else input.type = 'datetime-local';
    label.append(input);
    const note = el('textarea');
    note.maxLength = 400;
    const noteLabel = el('label','Note for participants');
    noteLabel.append(note);
    const message = el('p');
    message.setAttribute('role','alert');
    const submit = el('button',title);
    submit.type = 'submit';
    form.append(label,noteLabel,message,submit,button('Go back',()=>panel.close()));
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const base = '/meetings/'+row.meeting_id;
      const payload = cancelling ? {reason:input.value+(note.value.trim()?' — '+note.value.trim():'')} :
        {scheduled_at:new Date(input.value).toISOString(),reason:note.value.trim()};
      mutate(submit,{path:cancelling?base:base+'/reschedule',method:cancelling?'DELETE':'PATCH',payload},title+' saved.',()=>panel.close(),error=>{message.textContent=error;});
    });
    panel.replaceChildren(heading,form);
    panel.showModal();
  }

  async function openForm(row) {
    const panel = $('record-form');
    const def = current.states ? {label:row ? 'Edit record' : 'Add record', path:recordsPath(), fields:current.workflow ? trackerFields().filter(field=>field.key!=='status').concat(current.workflow.fields) : trackerFields()} : current.form;
    const heading = el('h2', row ? def.editLabel || (current.edit ? 'Edit meeting details' : def.label) : def.label), form = el('form'), grid = el('div');
    const errorText = el('p');
    errorText.className = 'form-error';
    errorText.setAttribute('role','alert');
    heading.id = 'record-form-heading';
    grid.className = 'form-grid';
    const opener = document.activeElement;
    panel.replaceChildren(heading,errorText,form);
    panel.showModal();
    panel.addEventListener('close', () => {
      if (opener?.isConnected) opener.focus();
      else $('search').focus();
    }, { once: true });
    form.append(grid);
    let advanceQuote;
    try {
      if (current.slug === 'salary-advance') {
        advanceQuote = await request('/admin/salary-advances/quote');
        if (!panel.open) return;
      }
      for (const f of def.fields.filter(field=>!(current.edit && row && field.key==='scheduled_at'))) {
        const wrapper = el('label',f.label);
        const select = f.type === 'select' || f.type === 'lookup';
        const input = el(select ? 'select' : f.type === 'textarea' ? 'textarea' : 'input');
        input.name = f.key;
        input.required = !f.optional;
        if (select) {
          if (f.optional) input.add(new Option('None', ''));
          const opts = f.type === 'lookup' ? await choices(f.options) : f.options.map(option => [option, label(option)]);
          for (const [value,text] of opts) {
            const opt = el('option',text); opt.value = value; input.append(opt);
          }
        } else if (f.type !== 'textarea') {
          input.type = f.type;
          if (f.type === 'number') { input.min = '0'; input.step = 'any'; }
          if (f.type === 'text') input.maxLength = 150;
        } else input.maxLength = f.maxLength ?? 1500;
        if (row?.[f.key] != null){if(f.type==='datetime-local'){const date=new Date(row[f.key]);input.value=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}else input.value=f.type==='date'?String(row[f.key]).slice(0,10):row[f.key];}
        else if (f.value != null) input.value = f.value;
        wrapper.append(input); grid.append(wrapper);
      }
      if (advanceQuote) {
        const percentage = form.elements.percentage;
        percentage.min = '1';
        percentage.max = String(advanceQuote.max_percentage);
        percentage.step = '1';
        percentage.disabled = advanceQuote.max_percentage === 0;
        const preview = el('p');
        preview.setAttribute('aria-live', 'polite');
        const refreshPreview = () => {
          const selected = percentage.valueAsNumber;
          const amount = Math.floor(Math.round(advanceQuote.payout * 100) * selected / 100) / 100;
          const remaining = Math.max(0, advanceQuote.available - (percentage.validity.valid ? amount : 0));
          const pay = advanceQuote.estimated ? 'Estimated take-home pay' : 'Upcoming take-home pay';
          preview.textContent = `${formatPayoutMonth(advanceQuote.year, advanceQuote.month)}. ${pay} ${formatMoney.format(advanceQuote.payout)}. `;
          if (!advanceQuote.max_percentage) {
            preview.textContent += 'There is no payout available for a new advance.';
          } else {
            if (advanceQuote.reserved) preview.textContent += `Existing requests ${formatMoney.format(advanceQuote.reserved)}. `;
            preview.textContent += `Choose 1–${advanceQuote.max_percentage}%. `;
            if (percentage.validity.valid)
              preview.textContent += `Requested ${formatMoney.format(amount)}. Remaining after recovery ${formatMoney.format(remaining)}.`;
          }
        };
        percentage.addEventListener('input', refreshPreview);
        refreshPreview();
        form.append(preview, el('p',
          'Explain why you need the advance. Approval records the request for payroll processing. Your payroll team handles the bank transfer.'));
      }
      if (current.slug === 'meetings' && !row) {
        const invitees = el('select');
        invitees.name = 'participant_user_ids';
        invitees.multiple = true;
        for (const user of await request('/meetings/invitees'))
          invitees.add(new Option(user.full_name,user.user_id));
        const inviteLabel = el('label','Invite colleagues (optional)');
        inviteLabel.append(invitees);
        grid.append(inviteLabel);
      }
    } catch (error) {
      errorText.textContent = error.message;
      panel.append(button('Close', () => panel.close()));
      return;
    }
    if (!panel.open) return;
    const footer = el('div'); footer.className = 'form-buttons';
    const submit = el('button','Save'); submit.type = 'submit'; submit.className = 'primary';
    if (advanceQuote) submit.disabled = advanceQuote.max_percentage === 0;
    footer.append(submit,button('Cancel',() => panel.close()));
    form.append(footer);
    form.addEventListener('submit', event => {
      event.preventDefault();
      errorText.textContent = '';
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData);
      if (advanceQuote) payload.expected_payout = {
        month:advanceQuote.month, year:advanceQuote.year, payout:advanceQuote.payout
      };
      if (current.slug === 'meetings' && !row) payload.participant_user_ids = formData.getAll('participant_user_ids').map(Number);
      for (const f of def.fields.filter(field=>!(current.edit && row && field.key==='scheduled_at'))) {
        if (f.type === 'number' || f.type === 'lookup') payload[f.key] = Number(payload[f.key]);
        if (f.type === 'datetime-local' && payload[f.key]) payload[f.key] = new Date(payload[f.key]).toISOString().slice(0,19).replace('T',' ');
      }
      mutate(submit,{path:row ? def.path + '/' + row[def.key || 'record_id'] : def.path, method:row ? 'PATCH' : 'POST',payload:def.multipart ? new FormData(form) : {...payload,...(current.workflow && row ? {version:row.version}: {})}},
        'Record saved.',() => panel.close(), text => { errorText.textContent = text; });
    });
    grid.querySelector('input, select, textarea')?.focus();
  }
  function saveFile(blob,name) {
    const url = URL.createObjectURL(blob), a = link(url,'');
    a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  function exportRows() {
    const visibleColumns = columns();
    return [visibleColumns.map(label), ...filtered.map(row => visibleColumns.map(key => {
      const value = row[key];
      if (value == null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      if (typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value) && !/(_at|clock_in|clock_out)$/.test(key))
        return value.slice(0,10);
      return value;
    }))];
  }
  function exportCSV() {
    const quote = value => {
      const text = String(value);
      const prefix = typeof value === 'string' && /^(?:[\t\r\n]|\s*[=+@-])/.test(text) ? "'" : '';
      return '"' + prefix + text.replaceAll('"','""') + '"';
    };
    const csv = exportRows().map(row => row.map(quote).join(',')).join('\r\n');
    saveFile(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}),current.slug + '.csv');
  }
  function loadSpreadsheetLibrary() {
    if (!spreadsheetLibrary) spreadsheetLibrary = new Promise((resolve, reject) => {
      const script = el('script');
      script.src = '/vendor/xlsx.js';
      script.addEventListener('load', () => resolve(window.XLSX), { once: true });
      script.addEventListener('error', () => {
        script.remove();
        reject(Error('Excel export could not load. Try again.'));
      }, { once: true });
      document.head.append(script);
    }).catch(error => { spreadsheetLibrary = undefined; throw error; });
    return spreadsheetLibrary;
  }
  async function exportExcel() {
    const records = exportRows();
    exportingExcel = true;
    $('export-excel').disabled = true;
    message('Preparing Excel workbook…');
    try {
      const spreadsheet = await loadSpreadsheetLibrary();
      // The grid is an array of primitive values. String cells stay text, including
      // user-entered values that Excel would otherwise interpret as formulas.
      const workbook = spreadsheet.utils.book_new();
      spreadsheet.utils.book_append_sheet(workbook, spreadsheet.utils.aoa_to_sheet(records), 'Records');
      const bytes = spreadsheet.write(workbook, { bookType: 'xlsx', type: 'array', compression: true });
      saveFile(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), current.slug + '.xlsx');
      message('');
    } catch (error) { message(error.message, true); }
    finally {
      exportingExcel = false;
      $('export-excel').disabled = !filtered.length;
    }
  }
  function directory() {
    $('workspace').replaceChildren($('directory-template').content.cloneNode(true));
    const base = [
      ['announcements','Announcements','People'],['benefits','Benefits','People'],['salary','Payroll','Time & pay'],
      ['tax-portal','Tax','Time & pay'],['meetings','Meetings','Operations'],['notifications','Notifications','Operations'],
      ['document-vault','Document vault','Operations'],['projects','Projects','Operations'],['helpdesk','Helpdesk','Operations'],
      ['profile','My profile','People'],['analytics','Analytics','Governance'],['settings','Settings','Governance']
    ].filter(([slug]) => !['analytics','tax-portal','document-vault','meetings'].includes(slug) && (slug !== 'settings' || staff())).map(([slug,title,group]) => ({slug,title,group}));
    const all = [...entries,...base].sort((a,b) => a.title.localeCompare(b.title));
    $('intro').textContent = 'Browse workforce data and open the tools available to your role.';
    const groups = [...new Set(all.map(item => item.group))].sort();
    const search = $('find-module');
    const clearFilters = $('clear-module-filters');
    let selectedGroup = '';
    for (const group of ['', ...groups]) {
      const chip = button(group || 'All modules', () => { selectedGroup = group; draw(); });
      chip.dataset.group = group;
      $('module-categories').append(chip);
    }
    const draw = () => {
      const query = search.value.trim().toLowerCase();
      const hasFilter = Boolean(query || selectedGroup);
      let count = 0;
      const list = $('module-list');
      for (const chip of $('module-categories').children) chip.setAttribute('aria-pressed',String(chip.dataset.group === selectedGroup));
      list.replaceChildren();
      for (const group of groups) {
        if (selectedGroup && group !== selectedGroup) continue;
        const groupItems = all.filter(item => item.group === group && item.title.toLowerCase().includes(query));
        if (!groupItems.length) continue;
        count += groupItems.length;
        const section = el('section'); section.className = 'module-group';
        const heading = el('div'); heading.className = 'module-group-heading';
        const total = el('span',groupItems.length + (groupItems.length === 1 ? ' module' : ' modules'));
        total.className = 'module-total';
        heading.append(el('h2',group),total);
        const grid = el('div'); grid.className = 'module-grid';
        for (const entry of groupItems) {
          const item = link('/' + entry.slug + '.html','');
          const arrow = el('span','→');
          arrow.className = 'module-arrow'; arrow.setAttribute('aria-hidden','true');
          item.append(el('span',entry.title),arrow);
          grid.append(item);
        }
        section.append(heading,grid);
        list.append(section);
      }
      const results = $('module-results');
      results.textContent = !count ? 'No matching modules.' : hasFilter ?
        count + (count === 1 ? ' module found' : ' modules found') : '';
      results.dataset.empty = String(!count);
      clearFilters.hidden = !hasFilter;
    };
    search.addEventListener('input',draw);
    clearFilters.addEventListener('click', () => {
      selectedGroup = '';
      search.value = '';
      draw();
      search.focus();
    });
    draw(); message('');
  }
  async function start() {
    [currentUser,entries] = await Promise.all([request('/auth/me'),request('/modules')]);
    $('dashboard').href = currentUser.role_id === 3 ? '/manager.html' : staff() ? '/admin-dashboard.html' : '/employee-dashboard.html';
    const slug = location.pathname.split('/').pop().replace(/\.html$/, '');
    $('modules-nav').setAttribute('aria-current','page');
    if (slug === 'modules') return directory();
    $('back-to-modules').hidden = false;
    current = entries.find(item => item.slug === slug);
    if (!current) { $('title').textContent = 'Module unavailable'; message('Your role does not have access to this module.',true); return; }
    document.title = current.title + ' · Workforce Intelligence';
    $('context').textContent = current.group;
    $('title').textContent = current.title;
    $('intro').textContent = current.workflow ? 'Workflow records, review decisions and history are saved in MySQL.' : current.states ? 'Demo register. Changes are saved here for testing.' : 'Live records from the workforce database.';
    $('workspace').replaceChildren($('records-template').content.cloneNode(true));
    if (current.slug === 'registration-tracker' && currentUser.role_id === 1) {
      const intake = link('/employee-import.html','Import employees');
      intake.className = 'action-link';
      $('actions').append(intake);
    }
    for (const slug of current.links || []) {
      if (['training-review','certificate-register'].includes(slug) && !entries.some(item => item.slug === slug)) continue;
      const a = link('/'+slug+'.html',entries.find(item => item.slug === slug)?.title || label(slug.replaceAll('-','_')));
      a.className = 'action-link'; $('actions').append(a);
    }
    if (current.states || (current.form && can(current.form))) $('actions').append(button(current.form?.label || 'Add record',() => openForm(),true));
    for (const item of current.buttons || []) if (can(item)) $('actions').append(button(item.label,event =>
      mutate(event.target,{path:item.path,method:'POST',payload:{}},item.label + ' recorded.')));
    if (current.workflow) {
      const archiveToggle = button('Archived drafts', async () => {
        showArchived = !showArchived;
        archiveToggle.setAttribute('aria-pressed', String(showArchived));
        page = 1;
        archiveToggle.disabled = true;
        try { await load(); }
        finally { archiveToggle.disabled = false; }
      });
      archiveToggle.setAttribute('aria-pressed', 'false');
      $('refresh').parentElement.prepend(archiveToggle);
    }
    $('refresh').addEventListener('click',() => load());
    $('export').hidden = Boolean(current.hideGenericExport);
    $('export').addEventListener('click',exportCSV);
    $('export-excel').hidden = Boolean(current.hideGenericExport);
    $('export-excel').addEventListener('click',exportExcel);
    $('search').addEventListener('input',() => { page = 1; render(); });
    $('clear-record-search').addEventListener('click', () => {
      const search = $('search');
      search.value = '';
      page = 1;
      render();
      search.focus();
    });
    $('prev-page').addEventListener('click',() => { page--; render(); $('count').scrollIntoView({ block:'nearest' }); });
    $('next-page').addEventListener('click',() => { page++; render(); $('count').scrollIntoView({ block:'nearest' }); });
    if(['attendance','time-tracker'].includes(current.slug))for(const [action,text] of [['clock_in','Device-verified clock in'],['clock_out','Device-verified clock out']])$('actions').append(button(text,async event=>{event.target.disabled=true;try{const result=await WorkforcePasskeys.attendance(action);await load();message(result.message);}catch(error){message(error.message,true);}finally{event.target.disabled=false;}}));
    await load();
    await window.WorkforceFinance?.mount({current,currentUser,request,load,message});
    if (current.refresh) setInterval(() => load(),30000);
  }
  start().catch(error => message(error.message,true));
  $('history-back').addEventListener('click',() => history.length > 1 ? history.back() : location.assign('/modules.html'));
  $('history-forward').addEventListener('click',() => history.forward());
})();
