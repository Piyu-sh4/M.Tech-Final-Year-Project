/* ==========================================================
   Workforce Intelligence — Core Frontend Logic  v5.1
   All shared helpers live HERE. chat.js uses window.API etc
   so there is zero re-declaration.
   ========================================================== */

var API = '/api';   // var → no re-declare crash

/* ── Auth helpers ─────────────────────────────────────────── */
function getToken(){ return localStorage.getItem('token'); }
function getUser(){ var u=localStorage.getItem('user'); return u?JSON.parse(u):null; }
function authHeaders(extra){
  return Object.assign({'Content-Type':'application/json',Authorization:'Bearer '+getToken()},extra||{});
}
function logout(){ localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href='login.html'; }
function guardAuth(role){
  var t=getToken(), u=getUser();
  if(!t||!u){ window.location.href='login.html'; return false; }
  if(role&&u.role_id!=role&&![1,3,4].includes(u.role_id)){ window.location.href=[1,3,4].includes(u.role_id)?'admin-dashboard.html':'employee-dashboard.html'; return false; }
  return true;
}

/* ── UI helpers ───────────────────────────────────────────── */
function showMsg(id,txt,isErr){
  var el=document.getElementById(id); if(!el)return;
  el.innerHTML=txt; el.className='msg'+(isErr?' error':'');
}
function setInner(id,v){ var el=document.getElementById(id); if(el)el.textContent=v; }
function escHtml(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatDate(d){
  if(!d)return'—';
  return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
}
function formatDateTime(d){
  if(!d)return'—';
  return new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function statusTag(s){
  var m={'Pending':'tag-pending','In Progress':'tag-progress','Completed':'tag-completed','Overdue':'tag-overdue'};
  return '<span class="tag '+(m[s]||'tag-pending')+'">'+escHtml(s)+'</span>';
}
function priorityTag(p){
  var m={Low:'tag-low',Medium:'tag-medium',High:'tag-high'};
  return '<span class="tag '+(m[p]||'tag-medium')+'">'+escHtml(p)+'</span>';
}
function achievementBadge(lvl){
  var m={good:'🥉 Good',excellent:'🥈 Excellent',outstanding:'🏆 Outstanding'};
  return lvl&&lvl!=='none'?'<span class="tag tag-achievement">'+m[lvl]+'</span>':'';
}

/* ── Timer Countdown ──────────────────────────────────────── */
var _timers={};
function startCountdown(elId, deadlineISO){
  if(_timers[elId])clearInterval(_timers[elId]);
  function tick(){
    var el=document.getElementById(elId); if(!el){ clearInterval(_timers[elId]); return; }
    var diff=new Date(deadlineISO)-Date.now();
    if(diff<=0){ el.innerHTML='<span class="timer-expired">⏰ EXPIRED</span>'; clearInterval(_timers[elId]); return; }
    var h=Math.floor(diff/3600000), m=Math.floor((diff%3600000)/60000), s=Math.floor((diff%60000)/1000);
    var cls=diff<3600000?'timer-critical':diff<86400000?'timer-warn':'timer-ok';
    el.innerHTML='<span class="countdown '+cls+'">⏱ '+pad(h)+'h '+pad(m)+'m '+pad(s)+'s</span>';
  }
  tick(); _timers[elId]=setInterval(tick,1000);
}
function pad(n){ return n<10?'0'+n:n; }

/* ── Auth pages ───────────────────────────────────────────── */
async function register(){
  var fn  = document.getElementById('full_name').value.trim();
  var em  = document.getElementById('email').value.trim().toLowerCase();
  var pw  = document.getElementById('password').value;
  var cpw = document.getElementById('confirm_password') ? document.getElementById('confirm_password').value : pw;
  var ph  = document.getElementById('phone') ? document.getElementById('phone').value.trim() : null;
  var ri  = document.getElementById('role_id').value;

  if(!fn||!em||!pw) return showMsg('msg','Full name, email and password are required.',true);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return showMsg('msg','Enter a valid email address.',true);
  if(pw !== cpw) return showMsg('msg','Passwords do not match.',true);
  if(!/^(?=.*[A-Z])(?=.*[0-9]).{8,}$/.test(pw))
    return showMsg('msg','Password must be 8+ chars with 1 uppercase and 1 number. Example: P123/',true);

  var btn = document.getElementById('submitBtn') || document.querySelector('button[onclick="register()"]');
  if(btn){ btn.disabled=true; btn.textContent='Submitting…'; }

  try{
    var res = await fetch(API+'/auth/register',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({full_name:fn,email:em,password:pw,phone:ph||null,role_id:parseInt(ri)})
    });
    var d = await res.json();
    if(!res.ok){ showMsg('msg', d.message||'Registration failed. Try again.', true); return; }
    showMsg('msg', d.message||'Registration submitted!', false);
    // Hide form, show success message after 800ms
    setTimeout(function(){
      var form = document.getElementById('regForm');
      var succ = document.getElementById('successCard');
      if(form && succ){ form.style.display='none'; succ.style.display='block'; }
      else { window.location.href='login.html'; }
    }, 800);
  }catch(e){
    showMsg('msg','Cannot reach server. Try refreshing the page or check that the app is running.',true);
  }finally{
    if(btn){ btn.disabled=false; btn.textContent='Submit Registration →'; }
  }
}

async function login(){
  var em=document.getElementById('email').value.trim();
  var pw=document.getElementById('password').value;
  if(!em||!pw)return showMsg('msg','Enter email and password.',true);
  try{
    var res=await fetch(API+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:em,password:pw})});
    var d=await res.json();
    if(!res.ok)return showMsg('msg',d.message||'Login failed.',true);
    localStorage.setItem('token',d.token); localStorage.setItem('user',JSON.stringify(d.user));
    showMsg('msg','Login successful! Redirecting…');
    setTimeout(()=>window.location.href=[1,3,4].includes(d.user.role_id)?'admin-dashboard.html':'employee-dashboard.html',800);
  }catch(e){ showMsg('msg','Server unreachable.',true); }
}

/* ── Admin: Create Task (with timer + written note) ───────── */
async function createTask(){
  var title      = document.getElementById('title').value.trim();
  var desc       = document.getElementById('description').value.trim();
  var note       = (document.getElementById('written_note')||{}).value||'';
  var assigned   = parseInt(document.getElementById('assigned_to').value);
  var priority   = document.getElementById('priority').value;
  var due_date   = document.getElementById('due_date').value;
  var timerHours = parseInt((document.getElementById('timer_hours')||{}).value||0)||null;

  if(!title||!assigned)return showMsg('taskMsg','Title and employee ID are required.',true);

  /* Handle file upload first if present */
  var fileInput  = document.getElementById('task_file');
  var voice_note_path = null;
  if(fileInput&&fileInput.files[0]){
    var fd=new FormData(); fd.append('file',fileInput.files[0]);
    try{
      var ur=await fetch(API+'/upload',{method:'POST',headers:{Authorization:'Bearer '+getToken()},body:fd});
      var ud=await ur.json(); voice_note_path=ud.filename||null;
    }catch(_){}
  }

  var body={title,description:desc,written_note:note||null,assigned_to:assigned,priority,status:'Pending',due_date:due_date||null,timer_hours:timerHours,voice_note_path};

  try{
    var res=await fetch(API+'/tasks',{method:'POST',headers:authHeaders(),body:JSON.stringify(body)});
    var d=await res.json(); showMsg('taskMsg',d.message||'Done',!res.ok);
    if(res.ok){
      ['title','description','written_note','assigned_to','due_date'].forEach(id=>{var el=document.getElementById(id);if(el)el.value='';});
      loadTasks(); loadAlerts();
    }
  }catch(e){ showMsg('taskMsg','Could not create task.',true); }
}

/* ── Admin: Load All Tasks ────────────────────────────────── */
async function loadTasks(){
  var c=document.getElementById('taskList'); if(!c)return;
  try{
    var res=await fetch(API+'/tasks',{headers:authHeaders()});
    var tasks=await res.json();
    if(!Array.isArray(tasks)||!tasks.length){ c.innerHTML='<p class="empty-msg">No tasks yet.</p>'; return; }
    setInner('statTotal',tasks.length);
    setInner('statCompleted',tasks.filter(t=>t.status==='Completed').length);
    setInner('statPending',tasks.filter(t=>t.status==='Pending').length);
    setInner('statOverdue',tasks.filter(t=>t.status==='Overdue').length);
    c.innerHTML=tasks.map(t=>taskCard(t,'admin')).join('');
    tasks.forEach(t=>{ if(t.timer_deadline) startCountdown('timer-'+t.task_id,t.timer_deadline); });
  }catch(e){ c.innerHTML='<p class="empty-msg">Could not load tasks.</p>'; }
}

function taskCard(t, role){
  var extBadge='';
  if(t.extension_status==='pending')  extBadge='<span class="tag tag-ext-pending">⏳ Ext Requested</span>';
  if(t.extension_status==='approved') extBadge='<span class="tag tag-ext-ok">✅ Ext Approved</span>';
  if(t.extension_status==='rejected') extBadge='<span class="tag tag-ext-no">❌ Ext Rejected</span>';

  var adminActions='';
  if(role==='admin'&&t.extension_status==='pending'){
    adminActions='<div class="ext-actions" style="margin-top:8px;display:flex;gap:6px">'
      +'<button class="btn btn-sm wfi-success-action" onclick="reviewExtension('+t.task_id+',\'approved\')">✅ Approve +'+t.extension_hours+'h</button>'
      +'<button class="btn btn-sm" style="background:#dc2626" onclick="reviewExtension('+t.task_id+',\'rejected\')">❌ Reject</button>'
      +'</div>';
  }

  return '<div class="task-item">'
    +'<div style="flex:1">'
      +'<div class="task-title">'+escHtml(t.title)+'</div>'
      +'<div class="task-meta">ID:'+t.task_id+' | To:#'+escHtml(t.assigned_to_name||t.assigned_to)+' | Due:'+formatDate(t.due_date)+(t.timer_hours?' | ⏱'+t.timer_hours+'h':'')+'</div>'
      +(t.written_note?'<div class="task-note">📝 '+escHtml(t.written_note)+'</div>':'')
      +(t.description?'<div class="task-meta">'+escHtml(t.description)+'</div>':'')
      +(t.timer_deadline?'<div id="timer-'+t.task_id+'"></div>':'')
      +extBadge+adminActions
      +(t.achievement_level&&t.achievement_level!=='none'?'<div style="margin-top:6px">'+achievementBadge(t.achievement_level)+'</div>':'')
    +'</div>'
    +'<div class="task-badges">'+priorityTag(t.priority)+statusTag(t.status)+'</div>'
  +'</div>';
}

/* ── Admin: Alerts ────────────────────────────────────────── */
async function loadAlerts(){
  var c=document.getElementById('alertList'); if(!c)return;
  try{
    var res=await fetch(API+'/tasks/alerts/all',{headers:authHeaders()});
    var tasks=await res.json();
    if(!Array.isArray(tasks)||!tasks.length){ c.innerHTML='<p class="empty-msg">✅ No overdue tasks.</p>'; return; }
    c.innerHTML=tasks.map(t=>'<div class="alert-item"><b>⚠ '+escHtml(t.title)+'</b><div class="meta">Task #'+t.task_id+' | Due:'+formatDate(t.due_date)+' | #'+t.assigned_to+'</div></div>').join('');
  }catch(e){ c.innerHTML='<p class="empty-msg">Could not load alerts.</p>'; }
}

/* ── Admin: Extension review ─────────────────────────────── */
async function reviewExtension(task_id, decision){
  try{
    var res=await fetch(API+'/tasks/'+task_id+'/extension',{method:'PUT',headers:authHeaders(),body:JSON.stringify({extension_status:decision})});
    var d=await res.json(); showMsg('taskMsg',d.message||'Done',!res.ok);
    if(res.ok)loadTasks();
  }catch(e){ showMsg('taskMsg','Could not update extension.',true); }
}

/* ── Admin: Award achievement ────────────────────────────── */
async function awardAchievement(task_id, level){
  try{
    var res=await fetch(API+'/tasks/'+task_id+'/achievement',{method:'POST',headers:authHeaders(),body:JSON.stringify({level})});
    var d=await res.json(); alert(d.message||'Awarded!');
    loadTasks();
  }catch(e){ alert('Could not award.'); }
}

/* ── Admin: Reports (quick-generate) ────────────────────── */
async function quickReport(type,period){
  var labels={daily:'Daily',weekly:'Weekly',monthly:'Monthly',annual:'Annual',all:'All Time'};
  var title=type+' Report — '+(labels[period]||period)+' '+new Date().toLocaleDateString('en-IN',{month:'short',year:'numeric'});
  showMsg('reportMsg','⏳ Generating '+type+' report…');
  try{
    var res=await fetch(API+'/reports',{method:'POST',headers:authHeaders(),body:JSON.stringify({report_title:title,report_type:type,period,auto_generate:true})});
    var d=await res.json(); if(!res.ok)throw new Error(d.message);
    var el=document.getElementById('reportMsg');
    if(el)el.innerHTML='✅ Report saved — <a href="reports.html" style="color:#2563eb;font-weight:600;text-decoration:none">Open Report Centre →</a>';
    loadReports();
  }catch(e){ showMsg('reportMsg','Error: '+e.message,true); }
}

async function loadReports(){
  var c=document.getElementById('reportList'); if(!c)return;
  var icons={Productivity:'📊','Task Summary':'📋','Employee Performance':'👥','Overdue Alert':'⚠️',Custom:'📄'};
  try{
    var res=await fetch(API+'/reports',{headers:authHeaders()});
    var reps=await res.json();
    if(!Array.isArray(reps)||!reps.length){ c.innerHTML='<p class="empty-msg">No reports yet.</p>'; return; }
    c.innerHTML=reps.slice(0,5).map(r=>
      '<div class="report-item" style="cursor:pointer" onclick="window.location.href=\'reports.html\'">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
          +'<span>'+(icons[r.report_type]||'📄')+'</span>'
          +'<b>'+escHtml(r.report_title)+'</b>'
          +'<span class="tag tag-progress">'+escHtml(r.report_type)+'</span>'
        +'</div>'
        +'<div class="meta">'+formatDate(r.report_date)+(r.period?' · '+r.period:'')+'</div>'
      +'</div>'
    ).join('');
  }catch(e){ c.innerHTML='<p class="empty-msg">Could not load reports.</p>'; }
}

/* ── Employee: My Tasks ───────────────────────────────────── */
async function loadMyTasks(){
  var c=document.getElementById('myTasks'); if(!c)return;
  try{
    var res=await fetch(API+'/tasks/my',{headers:authHeaders()});
    var tasks=await res.json();
    if(!Array.isArray(tasks)||!tasks.length){ c.innerHTML='<p class="empty-msg">No tasks assigned yet.</p>'; return; }
    c.innerHTML=tasks.map(t=>taskCard(t,'employee')).join('');
    tasks.forEach(t=>{ if(t.timer_deadline) startCountdown('timer-'+t.task_id,t.timer_deadline); });
    loadSuggestions();
  }catch(e){ c.innerHTML='<p class="empty-msg">Could not load tasks.</p>'; }
}

/* ── Employee: Update Status ──────────────────────────────── */
async function updateMyTask(){
  var task_id=document.getElementById('updateTaskId').value;
  var status =document.getElementById('newStatus').value;
  var remarks=(document.getElementById('remarks').value||'').trim();
  if(!task_id)return showMsg('updateMsg','Enter a task ID.',true);
  try{
    var res=await fetch(API+'/tasks/'+task_id,{method:'PUT',headers:authHeaders(),body:JSON.stringify({status,remarks})});
    var d=await res.json(); showMsg('updateMsg',d.message||'Done',!res.ok);
    if(res.ok){ loadMyTasks(); if(status==='Completed')checkAchievement(task_id); }
  }catch(e){ showMsg('updateMsg','Could not update.',true); }
}

/* ── Employee: Request extension ─────────────────────────── */
async function requestExtension(){
  var task_id=(document.getElementById('extTaskId')||{}).value;
  var hours  =parseInt((document.getElementById('extHours')||{}).value)||24;
  var reason =(document.getElementById('extReason')||{}).value||'';
  if(!task_id)return showMsg('extMsg','Enter a task ID.',true);
  try{
    var res=await fetch(API+'/tasks/'+task_id+'/extension',{method:'POST',headers:authHeaders(),body:JSON.stringify({extension_hours:hours,extension_reason:reason})});
    var d=await res.json(); showMsg('extMsg',d.message||'Done',!res.ok);
    if(res.ok)loadMyTasks();
  }catch(e){ showMsg('extMsg','Could not submit.',true); }
}

/* ── Employee: Productivity ───────────────────────────────── */
async function loadProductivity(user_id){
  try{
    var res=await fetch(API+'/tasks/productivity/'+user_id,{headers:authHeaders()});
    var d=await res.json();
    setInner('pTotal',d.total_tasks); setInner('pCompleted',d.completed_tasks);
    setInner('pOverdue',d.overdue_tasks); setInner('pScore',(d.productivity_score||0)+'%');
  }catch(e){ console.warn('productivity error'); }
}

/* ── Employee: Achievements ───────────────────────────────── */
async function loadAchievements(){
  var c=document.getElementById('achievementList'); if(!c)return;
  try{
    var u=getUser();
    var res=await fetch(API+'/achievements/'+u.user_id,{headers:authHeaders()});
    var data=await res.json();
    if(!Array.isArray(data)||!data.length){ c.innerHTML='<p class="empty-msg">No achievements yet — complete tasks to earn them!</p>'; return; }
    c.innerHTML=data.map(a=>
      '<div class="achievement-item">'
        +'<div class="ach-icon">'+{good:'🥉',excellent:'🥈',outstanding:'🏆'}[a.level]+'</div>'
        +'<div><b>'+escHtml(a.message||a.achievement_type)+'</b>'
        +'<div class="meta">'+formatDate(a.created_at)+' · +'+a.points+' pts</div></div>'
      +'</div>'
    ).join('');
  }catch(e){ c.innerHTML='<p class="empty-msg">Could not load achievements.</p>'; }
}

async function checkAchievement(task_id){
  try{
    var res=await fetch(API+'/achievements/check/'+task_id,{method:'POST',headers:authHeaders()});
    var d=await res.json();
    if(d.awarded) showCelebration(d.level, d.message);
  }catch(_){}
}

function showCelebration(level, message){
  var overlay=document.createElement('div');
  overlay.className='celebration-overlay';
  var icons={good:'🥉',excellent:'🥈',outstanding:'🏆'};
  var colors={good:'#16a34a',excellent:'#2563eb',outstanding:'#7c3aed'};
  overlay.innerHTML=`
    <div class="celebration-box" style="border-color:${colors[level]||'#2563eb'}">
      <div class="celebration-icon">${icons[level]||'🎉'}</div>
      <h2>Achievement Unlocked!</h2>
      <div class="celebration-level" style="color:${colors[level]}">${(level||'').toUpperCase()}</div>
      <p>${escHtml(message||'Great job completing your task!')}</p>
      <div class="confetti-row">🎊 🎉 🥳 🎁 🎈 🎊</div>
      <button class="btn" onclick="this.closest('.celebration-overlay').remove()">Awesome! 🎉</button>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(()=>overlay.remove(),8000);
}

/* ── Employee: Suggestions ────────────────────────────────── */
async function loadSuggestions(){
  var c=document.getElementById('suggestionList'); if(!c)return;
  try{
    var u=getUser();
    var res=await fetch(API+'/suggestions/'+u.user_id,{headers:authHeaders()});
    var data=await res.json();
    if(!Array.isArray(data)||!data.length){ c.innerHTML='<p class="empty-msg">No suggestions right now.</p>'; return; }
    c.innerHTML=data.map(s=>
      '<div class="suggestion-item'+(s.is_read?'':' suggestion-unread')+'">'
        +'<div class="sug-source">'+{ai:'🤖 AI',manager:'👔 Manager',system:'⚙️ System'}[s.source]+'</div>'
        +'<div class="sug-text">'+escHtml(s.suggestion)+'</div>'
        +(s.task_title?'<div class="meta">Re: '+escHtml(s.task_title)+'</div>':'')
      +'</div>'
    ).join('');
  }catch(_){ c.innerHTML=''; }
}

/* ── File Upload for task (all formats) ───────────────────── */
async function uploadTaskFile(inputId, statusId){
  var fi=document.getElementById(inputId); if(!fi||!fi.files[0])return null;
  var fd=new FormData(); fd.append('file',fi.files[0]);
  var st=document.getElementById(statusId);
  if(st)st.textContent='⏳ Uploading…';
  try{
    var res=await fetch(API+'/upload',{method:'POST',headers:{Authorization:'Bearer '+getToken()},body:fd});
    var d=await res.json();
    if(st)st.textContent='✅ '+d.filename+' uploaded';
    return d;
  }catch(e){ if(st)st.textContent='❌ Upload failed'; return null; }
}

/* ── Page Init (DOMContentLoaded — no window.onload conflict) */
document.addEventListener('DOMContentLoaded',function(){
  var page=window.location.pathname.split('/').pop()||'index.html';

  if(page==='admin-dashboard.html'){
    if(!guardAuth(1))return;
    setInner('adminName',getUser().full_name);
    loadTasks(); loadAlerts(); loadReports();
  }

  if(page==='employee-dashboard.html'){
    if(!guardAuth(2))return;
    var u=getUser();
    setInner('empName',u.full_name);
    loadMyTasks(); loadProductivity(u.user_id); loadAchievements();
  }
});

/* ══════════════════════════════════════════════════════
   CAB TRAVEL COMPLETE — Real-time notification listener
   Fires on: wip:cab_travel_complete socket event
   Shows a toast to the logged-in user automatically
══════════════════════════════════════════════════════ */
(function(){
  function initCabTravelListener(){
    if(typeof io === 'undefined') return;   // socket.io not loaded on this page
    var token = getToken();
    if(!token) return;
    try {
      var sock = io(window.location.origin, {
        auth:{ token: token },
        transports:['websocket','polling']
      });
      sock.on('wip:cab_travel_complete', function(data){
        showCabTravelToast(data);
      });
      sock.on('wip:cab_driver_acknowledged', function(data){
        showCabAckToast(data);
      });
    } catch(e){ /* socket unavailable — silent */ }
  }

  function showCabTravelToast(data){
    var toast = document.createElement('div');
    toast.style.cssText = [
      'position:fixed','bottom:24px','right:24px','z-index:9999',
      'background:linear-gradient(135deg,#16a34a,#0891b2)',
      'color:#fff','border-radius:16px','padding:16px 20px',
      'max-width:340px','box-shadow:0 8px 32px rgba(0,0,0,.25)',
      'animation:slideInToast .4s ease','font-family:Segoe UI,Arial,sans-serif',
      'cursor:pointer'
    ].join(';');
    toast.innerHTML =
      '<div style="display:flex;align-items:flex-start;gap:12px">'+
        '<span style="font-size:1.8rem;line-height:1">🏁</span>'+
        '<div>'+
          '<div style="font-weight:800;font-size:.95rem;margin-bottom:3px">Travel Complete!</div>'+
          '<div style="font-size:.8rem;opacity:.9;line-height:1.5">'+
            escHtml(data.message||('Journey on '+( data.route_name||'your route')+' is complete.'))+
          '</div>'+
          (data.travel_km?'<div style="font-size:.75rem;margin-top:5px;opacity:.8">📏 '+data.travel_km+' km covered</div>':'')+
          (data.driver_name?'<div style="font-size:.75rem;opacity:.8">🧑‍✈️ Driver: '+escHtml(data.driver_name)+'</div>':'')+
          '<div style="font-size:.7rem;margin-top:6px;opacity:.7">'+new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})+'</div>'+
        '</div>'+
      '</span>'+
    '</div>';
    // Add slide-in animation
    if(!document.getElementById('toastStyles')){
      var st = document.createElement('style');
      st.id = 'toastStyles';
      st.textContent = '@keyframes slideInToast{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';
      document.head.appendChild(st);
    }
    toast.onclick = function(){ document.body.removeChild(toast); };
    document.body.appendChild(toast);
    setTimeout(function(){ if(toast.parentNode) document.body.removeChild(toast); }, 8000);
  }

  function showCabAckToast(data){
    var toast = document.createElement('div');
    toast.style.cssText = [
      'position:fixed','bottom:24px','right:24px','z-index:9999',
      'background:linear-gradient(135deg,#1e3a8a,#2563eb)',
      'color:#fff','border-radius:16px','padding:14px 18px',
      'max-width:320px','box-shadow:0 8px 32px rgba(0,0,0,.25)',
      'animation:slideInToast .4s ease','font-family:Segoe UI,Arial,sans-serif'
    ].join(';');
    toast.innerHTML =
      '<div style="display:flex;gap:10px;align-items:flex-start">'+
        '<span style="font-size:1.5rem">🚗</span>'+
        '<div>'+
          '<div style="font-weight:800;font-size:.88rem;margin-bottom:2px">Driver Acknowledged</div>'+
          '<div style="font-size:.78rem;opacity:.9">'+escHtml(data.message||'Your driver has accepted your booking.')+'</div>'+
          (data.pickup_stop?'<div style="font-size:.72rem;margin-top:4px;opacity:.8">📍 '+escHtml(data.pickup_stop)+'</div>':'')+
        '</div>'+
      '</div>';
    toast.onclick = function(){ if(toast.parentNode) document.body.removeChild(toast); };
    document.body.appendChild(toast);
    setTimeout(function(){ if(toast.parentNode) document.body.removeChild(toast); }, 6000);
  }

  // Init after DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initCabTravelListener);
  } else {
    initCabTravelListener();
  }
})();
