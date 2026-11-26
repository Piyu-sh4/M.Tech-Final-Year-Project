(() => {
  const byId = id => document.getElementById(id);
  const labels = {queued:'Queued',in_progress:'In progress',blocked:'Blocked',in_review:'In review',completed:'Completed'};
  const eventLabels = {submitted:'Submitted',claimed:'Picked up',follow_up:'Follow-up',status:'Status update',result:'Result submitted'};
  const eventTime = value => new Date(value).toLocaleString();
  let current;
  let user;
  let olderThan;
  let selectedStatus = '';
  let updating = false;
  let queuedCount = 0;

  function showMessage(text = '', error = false) {
    const message = byId('build-message');
    message.textContent = text;
    message.dataset.error = String(error);
  }

  async function request(path, method = 'GET', body) {
    let response;
    try {
      response = await fetch('/api'+path,{
        method,
        headers:{Authorization:'Bearer '+localStorage.getItem('token'),'Content-Type':'application/json'},
        body:body === undefined ? undefined : JSON.stringify(body)
      });
    } catch {
      throw Error('Could not reach the build request queue. Refresh to check the current status.');
    }
    const result = await response.json().catch(()=>({}));
    if (response.status === 401) location.assign('/login.html');
    if (!response.ok) throw Object.assign(Error(result.message || 'Build requests could not be loaded.'), {status:response.status});
    return result;
  }

  function element(tag, content, className) {
    const node = document.createElement(tag);
    if (content !== undefined) node.textContent = content;
    if (className) node.className = className;
    return node;
  }

  function button(label, operation) {
    const control = element('button',label);
    control.type = 'button';
    control.onclick = () => perform(control,operation);
    return control;
  }

  async function perform(control, operation) {
    if (updating) return;
    updating = control.disabled = true;
    showMessage();
    try { await operation(); }
    catch (error) { showMessage(error.message,true); }
    finally {
      updating = false;
      control.disabled = false;
      byId('claim-next').disabled = !queuedCount;
    }
  }

  async function loadQueue(append = false) {
    const settings = new URLSearchParams();
    if (selectedStatus) settings.set('status',selectedStatus);
    if (append && olderThan) settings.set('before',olderThan);
    const result = await request('/build-requests?'+settings);
    const container = byId('queue-list');
    if (!append) container.replaceChildren();
    const list = element('ul',undefined,'build-list');
    for (const item of result.requests) {
      const row = element('li');
      const title = button('#'+item.request_id+' · '+item.title,()=>openRequest(item.request_id));
      const badge = element('span',labels[item.status],'build-status');
      badge.dataset.status = item.status;
      const header = element('div',undefined,'build-row-header');
      header.append(title,badge);
      const summary = [item.author || 'Former administrator'];
      if (item.assignee) summary.push('Picked up by '+item.assignee);
      summary.push('Updated '+eventTime(item.updated_at));
      row.append(header,element('p',summary.join(' · ')));
      list.append(row);
    }
    container.append(result.requests.length ? list : element('p','No requests match this filter.'));
    queuedCount = result.counts.queued || 0;
    byId('claim-next').disabled = updating || !queuedCount;
    byId('claim-next-empty').hidden = queuedCount > 0;
    updateFilters(result.counts);
    olderThan = result.next_before;
    byId('load-older').hidden = olderThan === null;
  }

  function updateFilters(counts) {
    for (const filter of byId('build-filters').children) {
      const status = filter.dataset.status;
      const count = status ? counts[status] || 0 : Object.values(counts).reduce((total,value)=>total+value,0);
      filter.textContent = (labels[status] || 'All')+' ('+count+')';
      filter.setAttribute('aria-pressed',String(status === selectedStatus));
    }
  }

  async function openRequest(id) {
    renderDetail(await request('/build-requests/'+id));
    byId('build-detail-title').focus();
  }

  function promptFor(item) {
    const followUps = item.events.filter(event=>event.kind === 'follow_up')
      .map(event=>event.actor_name+' · '+eventTime(event.created_at)+'\n'+event.body);
    return [
      'Work on Workforce Intelligence build request #'+item.request_id+' (revision '+item.revision+').',
      'Title: '+item.title,
      'Submitted by: '+(item.author || 'Former administrator'),
      'Instructions:\n'+item.instructions,
      'Acceptance criteria:\n'+(item.acceptance_criteria || 'See instructions.'),
      ...followUps.map(note=>'Admin follow-up:\n'+note),
      'Verify your changes and report the results and a commit or pull request link. Follow the existing project release process.'
    ].join('\n\n');
  }

  async function change(item, action, note, evidenceUrl) {
    const updated = await request('/build-requests/'+item.request_id,'PATCH',{
      action,revision:item.revision,note,evidence_url:evidenceUrl
    });
    renderDetail(updated);
    await loadQueue();
    byId('build-detail-title').focus();
    showMessage('Build request updated.');
  }

  function noteForm(item, action, label, submitText, evidence = false) {
    const form = element('form',undefined,'build-form');
    const labelNode = element('label',label);
    const note = element('textarea');
    note.rows = 4;
    note.maxLength = 8000;
    note.required = true;
    labelNode.append(note);
    form.append(labelNode);
    let link;
    if (evidence) {
      const evidenceLabel = element('label','GitHub commit or pull request URL (optional)');
      link = element('input');
      link.type = 'url';
      link.maxLength = 500;
      evidenceLabel.append(link);
      form.append(evidenceLabel);
    }
    const save = element('button',submitText,'primary');
    form.append(save);
    form.onsubmit = event => {
      event.preventDefault();
      perform(save,()=>change(item,action,note.value,link?.value));
    };
    return form;
  }

  function disclosure(label, content) {
    const details = element('details');
    details.append(element('summary',label),content);
    return details;
  }

  function renderDetail(item) {
    current = item;
    const panel = byId('build-detail');
    const heading = element('h2','#'+item.request_id+' · '+item.title);
    heading.id = 'build-detail-title';
    heading.tabIndex = -1;
    const actions = element('div',undefined,'build-actions');
    actions.append(button('Copy prompt for Codex',async ()=>{
      const text = promptFor(item);
      try {
        await navigator.clipboard.writeText(text);
        showMessage('Prompt copied. Paste it into your Codex chat.');
      } catch {
        byId('build-copy-fallback')?.remove();
        const prompt = element('textarea');
        prompt.value = text;
        prompt.readOnly = true;
        prompt.rows = 10;
        prompt.setAttribute('aria-label','Build request prompt');
        const fallback = disclosure('Build request prompt',prompt);
        fallback.id = 'build-copy-fallback';
        fallback.open = true;
        actions.after(fallback);
        prompt.select();
      }
    }));
    if (item.status === 'queued') actions.append(button('Pick up this request',()=>change(item,'claim')));
    if (item.status === 'in_review') actions.append(button('Mark review complete',()=>change(item,'complete')));
    panel.replaceChildren(heading,element('p',labels[item.status]+' · Revision '+item.revision+
      ' · '+(item.author || 'Former administrator')+' · '+eventTime(item.created_at)+
      (item.assignee ? ' · Picked up by '+item.assignee : '')),
      element('h3','Instructions'),element('p',item.instructions,'build-text'));
    if (item.acceptance_criteria) panel.append(element('h3','Acceptance criteria'),element('p',item.acceptance_criteria,'build-text'));
    panel.append(actions);
    const history = element('ol',undefined,'build-history');
    for (const entry of item.events) {
      const row = element('li');
      row.append(element('strong',eventLabels[entry.kind]+' · '+entry.actor_name+' · '+eventTime(entry.created_at)));
      if (entry.body) row.append(element('p',entry.body,'build-text'));
      if (entry.evidence_url) {
        const link = element('a','Open commit or pull request');
        link.href = entry.evidence_url;
        link.rel = 'noopener noreferrer';
        link.target = '_blank';
        row.append(link);
      }
      history.append(row);
    }
    panel.append(element('h3','History'),history);
    if (item.status === 'in_progress' && item.assigned_to === user.user_id) {
      panel.append(disclosure('Submit result for review',noteForm(item,'submit_result','Changes and test results','Submit result',true)),
        disclosure('Mark blocked',noteForm(item,'block','What is blocking this request?','Mark blocked')));
    }
    if (['in_progress','in_review','blocked'].includes(item.status))
      panel.append(disclosure('Return to queue',noteForm(item,'return_to_queue','Reason for returning to the queue','Return to queue')));
    panel.append(disclosure('Add follow-up',noteForm(item,'follow_up','Further instructions','Save follow-up')));
    panel.hidden = false;
  }

  async function initialize() {
    user = await request('/auth/me');
    if (user.role_id !== 1) { showMessage('Administrator access is required.',true); return; }
    for (const status of ['',...Object.keys(labels)]) {
      const filter = button(labels[status] || 'All',async ()=>{
        const previous = selectedStatus;
        selectedStatus = status;
        try { await loadQueue(); }
        catch (error) { selectedStatus = previous; throw error; }
      });
      filter.dataset.status = status;
      byId('build-filters').append(filter);
    }
    await loadQueue();
    byId('build-workspace').hidden = false;
    const form = byId('build-create');
    form.onsubmit = event => {
      event.preventDefault();
      perform(event.submitter,async ()=>{
        const item = await request('/build-requests','POST',Object.fromEntries(new FormData(form)));
        form.reset();
        await loadQueue();
        await openRequest(item.request_id);
        showMessage('Build request submitted.');
      });
    };
    byId('load-older').onclick = event => perform(event.currentTarget,()=>loadQueue(true));
    byId('refresh-queue').onclick = event => perform(event.currentTarget,async ()=>{
      await loadQueue();
      if (current) renderDetail(await request('/build-requests/'+current.request_id));
    });
    byId('claim-next').onclick = event => perform(event.currentTarget,async ()=>{
      let item;
      try {
        item = await request('/build-requests/claim-next','POST',{});
      } catch (error) {
        if (error.status !== 404) throw error;
        await loadQueue();
        showMessage('No queued requests were available. The queue has been refreshed.');
        return;
      }
      renderDetail(item);
      byId('build-detail-title').focus();
      await loadQueue();
      showMessage('Request picked up. Copy its prompt into Codex when ready.');
    });
  }

  initialize().catch(error=>showMessage(error.message,true));
})();
