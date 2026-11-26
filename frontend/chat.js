/* ==========================================================
   Workforce Intelligence — AI Chat  v5.1
   Uses API, getToken, getUser, authHeaders, escHtml from
   app.js (declared as var, so safe to reference here).
   ========================================================== */

var chatHistory  = [];
var dbContext    = null;
var uploadedFile = null;
var isStreaming  = false;

/* ── Markdown renderer ───────────────────────────────────── */
function renderMarkdown(text){
  return String(text||'')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/^#{1,3}\s(.+)$/gm,'<h4>$1</h4>')
    .replace(/^[-•]\s(.+)$/gm,'<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)/g,'<ul>$1</ul>')
    .replace(/\n\n/g,'</p><p>')
    .replace(/\n/g,'<br>');
}

function renderWorkspaceGuide() {
  const search = document.getElementById('assistantModuleSearch');
  const list = document.getElementById('assistantModules');
  if (!search || !list) return;
  const modules = dbContext?.modules;
  const query = search.value.trim().toLowerCase();
  const matches = modules?.filter(item => (item.title + ' ' + item.group).toLowerCase().includes(query)) || [];
  list.replaceChildren(...matches.slice(0, 12).map(item => {
    const entry = document.createElement('li');
    const link = document.createElement('a');
    link.href = item.path;
    link.textContent = item.title;
    entry.append(link);
    return entry;
  }));
  setText('assistantModuleStatus', !modules ? 'Workspace modules are unavailable.' :
    matches.length ? 'Showing ' + Math.min(matches.length, 12) + ' of ' + matches.length + ' modules.' : 'No matching modules.');
}

function renderRoleTools(tools) {
  const container = document.getElementById('assistant-tools');
  if (!container) return;
  container.querySelectorAll('[data-role-tool]').forEach(control => control.remove());
  for (const tool of tools || []) {
    const control = document.createElement('button');
    control.type = 'button';
    control.className = 'chip';
    control.dataset.roleTool = '';
    control.textContent = tool.label;
    control.addEventListener('click', () => sendQuick(tool.question));
    container.append(control);
  }
}

function renderRecentActivity() {
  const list = document.getElementById('assistantActivity');
  if (!list) return;
  const activity = dbContext?.activity;
  list.replaceChildren(...(activity || []).map(item => {
    const entry = document.createElement('li');
    const action = item.action.toLowerCase().replaceAll('_', ' ');
    const entity = item.entity_type.replaceAll('_', ' ');
    entry.textContent = action + ' · ' + entity + ' · ' + new Date(item.created_at).toLocaleString();
    return entry;
  }));
  setText('assistantActivityStatus', !activity ? 'Activity is unavailable.' :
    activity.length ? '' : 'No recent activity to show.');
}

/* ── Fetch live DB context ───────────────────────────────── */
async function fetchContext(){
  try{
    var res=await fetch(API+'/chat/context',{headers:authHeaders()});
    if(!res.ok) throw new Error('Chat context is unavailable.');
    dbContext=await res.json();
    setText('ctxTasks',(dbContext.summary&&dbContext.summary.total_tasks||0)+' tasks');
    setText('ctxEmployees',(dbContext.summary&&dbContext.summary.total_employees||0)+' employees');
    setText('ctxProjects',(dbContext.summary?.total_projects || 0)+' projects');
    setText('ctxReports',(dbContext.summary&&dbContext.summary.total_reports||0)+' reports');
    showProvider(dbContext.ai_provider,dbContext.ai_model);
    if(dbContext.summary?.total_employees==null) setText('ctxEmployees','Your records');
    renderWorkspaceGuide();
    renderRoleTools(dbContext.tools);
    renderRecentActivity();
    return dbContext;
  }catch(_){ renderWorkspaceGuide(); renderRecentActivity(); return null; }
}

async function callChatProvider(userMsg, maxTok, includeContext){
  var messages=chatHistory.slice(-40).concat({role:'user',content:userMsg});
  var res=await fetch(API+'/chat/send',{
    method:'POST',
    headers:authHeaders(),
    body:JSON.stringify({
      max_tokens:maxTok||1000,
      include_context:includeContext===true,
      document_id:includeContext&&uploadedFile ? uploadedFile.documentId : undefined,
      messages:messages
    })
  });
  var data=await res.json();
  if(!res.ok) throw new Error(data.message||'Chat request failed.');
  var reply=(data.content||[]).map(function(b){return b.type==='text'?b.text:'';}).join('');
  if (data.source === 'workforce') {
    // A later provider-backed turn must not automatically include these records.
    chatHistory = [];
    showProvider('workforce');
    return 'Source: Workforce database\n\n' + reply;
  }
  chatHistory=messages.concat({role:'assistant',content:reply}).slice(-40);
  showProvider(data.provider,data.model);
  return reply;
}

function showProvider(provider, model){
  var badge=document.getElementById('aiProviderBadge');
  if(!badge)return;
  var labels={openrouter:'OpenRouter',openai:'OpenAI',anthropic:'Anthropic',gemini:'Google Gemini'};
  badge.textContent=provider === 'workforce' ? 'Workforce database' : provider ? (labels[provider]||provider)+' · '+model : 'No active chat provider';
  badge.style.display='inline-block';
}

/* ── Full chat page messages ─────────────────────────────── */
function appendMessage(role,content,isHTML){
  var c=document.getElementById('chatMessages'); if(!c)return null;
  var wrap=document.createElement('div'); wrap.className='chat-msg chat-msg-'+role;
  var bubble=document.createElement('div'); bubble.className='msg-bubble msg-bubble-'+role;
  if(isHTML){ bubble.innerHTML=content; }
  else{ bubble.innerHTML='<p>'+renderMarkdown(escHtml(content))+'</p>'; }
  if(role==='assistant'){
    var meta=document.createElement('div'); meta.className='msg-meta';
    meta.textContent=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    wrap.appendChild(bubble); wrap.appendChild(meta);
  }else{ wrap.appendChild(bubble); }
  c.appendChild(wrap); c.scrollTop=c.scrollHeight;
  return bubble;
}

function appendTypingIndicator(){
  var c=document.getElementById('chatMessages'); if(!c)return null;
  var wrap=document.createElement('div'); wrap.className='chat-msg chat-msg-assistant'; wrap.id='typingInd';
  wrap.innerHTML='<div class="msg-bubble msg-bubble-assistant"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
  c.appendChild(wrap); c.scrollTop=c.scrollHeight;
  return wrap;
}

async function sendMessage(){
  if(isStreaming)return;
  var inp=document.getElementById('chatInput');
  var text=(inp&&inp.value||'').trim(); if(!text)return;
  inp.value=''; autoResize(inp);
  await dispatchChat(text);
}

async function sendQuick(text){ await dispatchChat(text); }

async function dispatchChat(text){
  if(isStreaming)return; isStreaming=true;
  if(!dbContext)await fetchContext();
  var btn=document.getElementById('sendBtn'); if(btn)btn.disabled=true;
  appendMessage('user',text);
  var typing=appendTypingIndicator();
  try{
    var reply=await callChatProvider(text,1000,document.getElementById('includeChatContext')?.checked);
    if(typing)typing.remove(); appendMessage('assistant',reply);
  }catch(e){
    if(typing)typing.remove();
    appendMessage('assistant','⚠ '+e.message);
  }finally{
    isStreaming=false; if(btn)btn.disabled=false;
  }
}

function handleKey(e){ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} }
function autoResize(el){ el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,160)+'px'; }
function setText(id,v){ var el=document.getElementById(id); if(el)el.textContent=v; }
function refreshContext(){ fetchContext(); }

/* ── File upload (chat page) ─────────────────────────────── */
function setupDropZone(){
  var z=document.getElementById('uploadZone'); if(!z)return;
  z.addEventListener('dragover',function(e){e.preventDefault();z.classList.add('dragover');});
  z.addEventListener('dragleave',function(){z.classList.remove('dragover');});
  z.addEventListener('drop',function(e){e.preventDefault();z.classList.remove('dragover');var f=e.dataTransfer&&e.dataTransfer.files[0];if(f)processFileUpload(f);});
}

async function handleFileUpload(ev){ var f=ev.target.files&&ev.target.files[0]; if(f)await processFileUpload(f); }

async function processFileUpload(file){
  var st=document.getElementById('uploadStatus');
  var fe=document.getElementById('ctxFile');
  if(st)st.innerHTML='<span class="upload-progress">⏳ Uploading '+escHtml(file.name)+'…</span>';
  var fd=new FormData(); fd.append('file',file);
  try{
    var res=await fetch(API+'/upload',{method:'POST',headers:{Authorization:'Bearer '+getToken()},body:fd});
    var d=await res.json();
    if(!res.ok)throw new Error(d.error||'Upload failed');
    uploadedFile={...d,name:file.name};
    if(st)st.innerHTML='<div class="upload-success">✅ <strong>'+escHtml(file.name)+'</strong><br>'+d.ragChunks+' chunks · '+(d.totalRows||0)+' rows'+(d.rows?.length?'<br><button class="btn btn-sm" onclick="offerImport()" style="margin-top:6px">⬆ Import '+d.importable.count+' '+d.importable.type+'</button>':'')+'</div>';
    if(fe)fe.textContent='📄 '+file.name;
  }catch(e){ if(st)st.innerHTML='<span class="upload-error">❌ '+escHtml(e.message)+'</span>'; }
}

async function offerImport(){
  if(!uploadedFile?.rows?.length)return;
  var t=uploadedFile.importable.type; var count=uploadedFile.importable.count;
  appendMessage('user','Import '+count+' '+t+' from the uploaded file.');
  var typ=appendTypingIndicator();
  try{
    var ep=t==='employees'?API+'/upload/import/employees':API+'/upload/import/tasks';
    var res=await fetch(ep,{method:'POST',headers:authHeaders(),body:JSON.stringify({rows:uploadedFile.rows||[],assigned_by:getUser()&&getUser().user_id})});
    var d=await res.json(); if(typ)typ.remove();
    appendMessage('assistant',res.ok?'✅ Import complete: **'+d.imported+'** '+t+' added.'+(d.errors&&d.errors.length?'\n⚠ '+d.errors.length+' rows had issues.':''):'❌ Import failed: '+(d.error||'unknown'));
    await fetchContext();
  }catch(e){ if(typ)typ.remove(); appendMessage('assistant','❌ Import error: '+e.message); }
}

/* ── Floating bubble (injected on all authenticated pages) ── */
/* Fix: expose callChatProvider globally for other pages */
window.callChatProvider = callChatProvider;

function injectFloatingBubble(){
  if(document.getElementById('floatChatBubble'))return;
  var bubble=document.createElement('div'); bubble.id='floatChatBubble';
  bubble.innerHTML=
    '<button class="float-bubble-btn" onclick="toggleFloatChat()" title="Workforce Intelligence Assistant">'
      +'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
      +'<span class="bubble-pulse"></span>'
    +'</button>'
    +'<div class="float-chat-panel" id="floatChatPanel">'
      +'<div class="float-panel-header">'
        +'<div class="float-panel-title"><span class="wfi-header-mark" aria-hidden="true">W</span> Workforce Intelligence Assistant</div>'
        +'<div class="float-panel-actions"><a href="chat.html" style="font-size:.8rem;color:#93c5fd;text-decoration:none">Open full ↗</a>'
        +'<button class="float-close-btn" onclick="toggleFloatChat()">✕</button></div>'
      +'</div>'
      +'<div class="float-messages" id="floatMessages">'
        +'<div class="float-msg-ai">👋 Hi! Ask me about tasks, productivity, or your team.<br><br>'
          +'<button class="float-chip" onclick="floatQuick(\'Show overdue tasks summary\')">⚠ Overdue</button> '
          +'<button class="float-chip" onclick="floatQuick(\'Who is the top performer?\')">🏆 Top Performer</button> '
          +'<button class="float-chip" onclick="floatQuick(\'Weekly productivity trend\')">📈 Trend</button>'
        +'</div>'
      +'</div>'
      +'<div class="float-upload-row" id="floatUploadRow">'
        +'<input type="file" id="floatFileInput" accept=".csv,.xlsx,.xls,.pdf,.txt,.json,.docx,.mp3,.wav,.m4a" style="display:none" onchange="handleFloatFile(event)">'
        +'<button class="float-upload-btn" onclick="document.getElementById(\'floatFileInput\').click()" title="Upload file">📎</button>'
        +'<input type="text" id="floatInput" placeholder="Ask anything…" onkeydown="handleFloatKey(event)">'
        +'<button class="float-send-btn" aria-label="Send chat message" onclick="floatSend()">'
          +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'
        +'</button>'
      +'</div>'
    +'</div>';
  document.body.appendChild(bubble);
  if(!document.querySelector('link[href*="chat.css"]')){
    var l=document.createElement('link'); l.rel='stylesheet'; l.href='chat.css'; document.head.appendChild(l);
  }
}

var floatOpen=false, floatStreaming=false;
function toggleFloatChat(){
  var p=document.getElementById('floatChatPanel'); if(!p)return;
  floatOpen=!floatOpen; p.classList.toggle('open',floatOpen);
  if(floatOpen&&!dbContext)fetchContext();
}
function handleFloatKey(e){ if(e.key==='Enter'){e.preventDefault();floatSend();} }
function floatQuick(t){ floatDispatch(t); }

async function floatSend(){
  var inp=document.getElementById('floatInput');
  var t=(inp&&inp.value||'').trim(); if(!t||floatStreaming)return;
  inp.value=''; floatDispatch(t);
}

async function floatDispatch(text){
  if(floatStreaming)return; floatStreaming=true;
  if(!dbContext)await fetchContext();
  appendFloatMsg('user',text);
  var typEl=appendFloatMsg('ai','<span class="float-typing">●●●</span>',true);
  try{
    var reply=await callChatProvider(text,500,false);
    if(typEl)typEl.innerHTML=renderMarkdown(escHtml(reply));
  }catch(e){ if(typEl)typEl.innerHTML='⚠ '+escHtml(e.message); }
  finally{ floatStreaming=false; }
}

function appendFloatMsg(role,content,isHTML){
  var c=document.getElementById('floatMessages'); if(!c)return null;
  var el=document.createElement('div'); el.className='float-msg-'+role;
  if(isHTML){el.innerHTML=content;}else{el.textContent=content;}
  c.appendChild(el); c.scrollTop=c.scrollHeight; return el;
}

async function handleFloatFile(ev){
  var f=ev.target&&ev.target.files&&ev.target.files[0]; if(!f)return;
  appendFloatMsg('user','📎 '+f.name);
  var typEl=appendFloatMsg('ai','<span class="float-typing">Parsing…</span>',true);
  var fd=new FormData(); fd.append('file',f);
  try{
    var res=await fetch(API+'/upload',{method:'POST',headers:{Authorization:'Bearer '+getToken()},body:fd});
    var d=await res.json(); if(!res.ok)throw new Error(d.error||'Upload failed');
    uploadedFile={...d,name:f.name};
    if(typEl)typEl.innerHTML='✅ <strong>'+escHtml(f.name)+'</strong> — '+d.ragChunks+' chunks indexed.';
  }catch(e){ if(typEl)typEl.innerHTML='❌ '+escHtml(e.message); }
}

var aiSettingsLink=document.getElementById('aiChatSettingsLink');
if(aiSettingsLink && getUser()?.role_id===1)aiSettingsLink.hidden=false;

/* ── Page init (IIFE — safe alongside DOMContentLoaded) ───── */
(function init(){
  var page=window.location.pathname.split('/').pop()||'index.html';
  var user=getUser();

  if(page==='chat.html'){
    if(!getToken()){ window.location.href='login.html'; return; }
    setText('chatUserName',user&&user.full_name||'');
    var dl=document.getElementById('dashLink');
    if(dl&&user)dl.href=user.role_id==1?'admin-dashboard.html':'employee-dashboard.html';
    setupDropZone();
    document.getElementById('assistantModuleSearch')?.addEventListener('input', renderWorkspaceGuide);
    fetchContext();
  }

  /* Inject bubble on every authenticated page except chat.html */
  if(page!=='login.html'&&page!=='register.html'&&page!=='index.html'&&getToken()){
    if(typeof injectFloatingBubble==='function') injectFloatingBubble();
  }
})();
