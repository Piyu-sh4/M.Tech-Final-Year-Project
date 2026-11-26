const { hashPassword, matchesPassword } = require('../services/meetingPasswords');
/**
 * meetingController.js — Full Meeting System v7.0
 * Handles: scheduling, participants, chat, notes, AI report generation
 */
const db = require('../config/db');
const q  = (sql, v) => new Promise((res,rej) => db.query(sql, v||[], (e,r) => e?rej(e):res(r)));

// ── Generate unique room code ─────────────────────────────────────
function genCode() {
  return 'WIP-' + Math.random().toString(36).substr(2,6).toUpperCase();
}

/* ═══════════════ ROOMS ═══════════════ */
exports.getRooms = async (req,res) => {
  try { res.json(await q(`SELECT * FROM meeting_rooms WHERE is_active=1 ORDER BY room_id`)); }
  catch(e){ res.status(500).json({message:e.message}); }
};

/* ═══════════════ MEETINGS CRUD ═══════════════ */
exports.getMeetings = async (req,res) => {
  const userId = req.user.user_id;
  const { status, type, from, to } = req.query;
  try {
    let sql = `
      SELECT m.*, u.full_name AS host_name, r.room_name,
             COUNT(DISTINCT mp.id) AS participant_count
      FROM meetings m
      JOIN users u ON m.host_id = u.user_id
      LEFT JOIN meeting_rooms r ON m.room_id = r.room_id
      LEFT JOIN meeting_participants mp ON m.meeting_id = mp.meeting_id
        AND mp.status NOT IN ('declined')
      WHERE (m.host_id=? OR m.meeting_id IN (
        SELECT meeting_id FROM meeting_participants WHERE user_id=? AND status NOT IN('declined')
      ))`;
    const vals = [userId, userId];
    if(status){ sql += ` AND m.status=?`; vals.push(status); }
    if(type)  { sql += ` AND m.meeting_type=?`; vals.push(type); }
    if(from)  { sql += ` AND m.scheduled_at >= ?`; vals.push(from); }
    if(to)    { sql += ` AND m.scheduled_at <= ?`; vals.push(to); }
    sql += ` GROUP BY m.meeting_id ORDER BY m.scheduled_at DESC LIMIT 100`;
    res.json((await q(sql, vals)).map(({password,...meeting})=>meeting));
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.getMeeting = async (req,res) => {
  try {
    const [mtg] = await q(`
      SELECT m.*, u.full_name AS host_name, u.email AS host_email,
             r.room_name, r.location AS room_location
      FROM meetings m
      JOIN users u ON m.host_id=u.user_id
      LEFT JOIN meeting_rooms r ON m.room_id=r.room_id
      WHERE m.meeting_id=?`,[req.params.id]);
    if(!mtg) return res.status(404).json({message:'Meeting not found.'});
    const participants = await q(`
      SELECT mp.*, u.full_name, u.email, u.role_id
      FROM meeting_participants mp
      LEFT JOIN users u ON mp.user_id=u.user_id
      WHERE mp.meeting_id=? ORDER BY mp.role`,[req.params.id]);
    const notes = await q(`
      SELECT mn.*, u.full_name AS author_name, au.full_name AS assigned_name
      FROM meeting_notes mn
      LEFT JOIN users u ON mn.author_id=u.user_id
      LEFT JOIN users au ON mn.assigned_to=au.user_id
      WHERE mn.meeting_id=? ORDER BY mn.created_at`,[req.params.id]);
    const messages = await q(
      `SELECT * FROM meeting_messages WHERE meeting_id=? ORDER BY created_at LIMIT 200`,[req.params.id]);
    const [report] = await q(`SELECT * FROM meeting_reports WHERE meeting_id=?`,[req.params.id]);
    const {password,...meeting}=mtg;
    res.json({...meeting,participants,notes,messages,report:report||null});
  } catch(e){ res.status(500).json({message:e.message}); }
};

/** Schedule the meeting and invitations atomically so invalid invitees leave no partial meeting. */
exports.createMeeting=async(request,response,next)=>{
 const body=request.body;
 if(body.participant_user_ids!==undefined && (!Array.isArray(body.participant_user_ids)||body.participant_user_ids.length>100))return response.status(400).json({message:'Choose up to 100 invitees.'});
 if(typeof body.title!=='string'||!body.title.trim()||body.title.length>200||!body.scheduled_at||Number.isNaN(Date.parse(body.scheduled_at))||!Number.isInteger(Number(body.duration_mins || 60))||Number(body.duration_mins || 60)<1||Number(body.duration_mins || 60)>1440||!['internal','client','interview','standup','review','training','emergency'].includes(body.meeting_type || 'internal')||!validMeetingLink(body))return response.status(400).json({message:'Enter a title, valid date, duration and HTTPS link for external meetings.'});
 try{
 const passwordHash = await hashPassword(body.password);
 const result=await require('../services/database').transaction(async run=>{
  const code='WIP-'+require('node:crypto').randomBytes(6).toString('hex').toUpperCase();
  const meeting=await run('INSERT INTO meetings SET ?',[{title:body.title.trim(),description:body.description || null,meeting_type:body.meeting_type || 'internal',host_id:request.user.user_id,room_id:body.room_id || null,room_code:code,scheduled_at:body.scheduled_at,duration_mins:Number(body.duration_mins || 60),agenda:body.agenda || null,password:passwordHash,allow_guests:body.allow_guests?1:0,client_name:body.client_name || null,client_email:body.client_email || null,meeting_provider:body.meeting_provider || 'internal',meeting_url:body.meeting_url || null,status:'scheduled'}]);
  await run("INSERT INTO meeting_participants(meeting_id,user_id,role,status) VALUES (?,?,'host','accepted')",[meeting.insertId,request.user.user_id]);
  for (const userId of new Set(body.participant_user_ids || [])) {
    if (userId === request.user.user_id) continue;
    if (!Number.isSafeInteger(userId) || userId < 1)
      throw Object.assign(new Error('Choose valid invitees.'),{status:400});
    const [invitee] = await run("SELECT colleague.user_id FROM users colleague JOIN users actor ON actor.user_id=? WHERE colleague.user_id=? AND colleague.status='active' AND colleague.company_id <=> actor.company_id",[request.user.user_id,userId]);
    if (!invitee) throw Object.assign(new Error('Choose active colleagues from your company.'),{status:400});
    await run("INSERT INTO meeting_participants(meeting_id,user_id,role,status) VALUES (?,?,'participant','invited')",[meeting.insertId,userId]);
  }
  return {meeting_id:meeting.insertId,room_code:code};
 });response.status(201).json({message:'Meeting scheduled.',...result});
 }catch(error){if(error.code==='ER_NO_REFERENCED_ROW_2')error=Object.assign(new Error('Choose existing invitees and a meeting room.'),{status:400});next(error);}
};

exports.updateMeeting = async (req,res,next) => {
  if(!validMeetingLink({...req.meeting,...req.body}))return res.status(400).json({message:'Enter a valid HTTPS meeting URL.'});
  if(['ended','cancelled'].includes(req.meeting.status))return res.status(409).json({message:'Completed meetings retain their recorded details.'});
  if(req.body.scheduled_at !== undefined && new Date(req.body.scheduled_at).getTime() !== new Date(req.meeting.scheduled_at).getTime()) return res.status(400).json({message:'Use Reschedule meeting to change the date.'});
  if(req.body.status!==undefined)return res.status(400).json({message:'Use the start, end or cancel action to change meeting status.'});
  if(req.body.scheduled_at && Number.isNaN(Date.parse(req.body.scheduled_at)) || req.body.duration_mins!==undefined && (!Number.isInteger(Number(req.body.duration_mins)) || Number(req.body.duration_mins)<1 || Number(req.body.duration_mins)>1440))return res.status(400).json({message:'Enter a valid date and duration.'});
  const allowed = ['title','description','duration_mins','agenda',
                   'room_id','password','allow_guests','client_name','client_email','meeting_type','meeting_provider','meeting_url'];
  const sets=[]; const vals=[];
  try {
    for (const field of allowed) {
      if (req.body[field] === undefined) continue;
      sets.push(`${field}=?`);
      vals.push(field === 'password' ? await hashPassword(req.body[field]) : req.body[field]);
    }
    if (!sets.length) return res.status(400).json({message:'Nothing to update.'});
    vals.push(req.params.id);
    await q(`UPDATE meetings SET ${sets.join(',')} WHERE meeting_id=?`,vals);
    res.json({message:'Meeting updated.'});
  } catch (error) { next(error); }
};

exports.startMeeting = async (req,res) => {
  try {
    const started = await q("UPDATE meetings SET status='active' WHERE meeting_id=? AND status='scheduled'",[req.params.id]);
    if (!started.affectedRows) return res.status(409).json({message:'Only a scheduled meeting can start.'});
    res.json({message:'🟢 Meeting started.'});
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.endMeeting = async (req,res) => {
  try {
    const [mtg] = await q(`SELECT * FROM meetings WHERE meeting_id=?`,[req.params.id]);
    if(!mtg) return res.status(404).json({message:'Not found.'});
    const startedAt = new Date(mtg.scheduled_at);
    const actualMins = Math.round((Date.now()-startedAt)/60000);
    const ended = await q("UPDATE meetings SET status='ended', ended_at=NOW() WHERE meeting_id=? AND status='active'",[req.params.id]);
    if (!ended.affectedRows) return res.status(409).json({message:'Only an active meeting can end.'});
    // Auto-generate report
    const report = await generateReport(req.params.id, actualMins, req.user);
    res.json({message:'Meeting ended. Report generated.', report});
  } catch(e){ res.status(500).json({message:e.message}); }
};

/* ═══════════════ PARTICIPANTS ═══════════════ */
exports.joinMeeting = async (req,res) => {
  const userId = req.user.user_id;
  const { password } = req.body;
  try {
    const [mtg] = await q(`SELECT * FROM meetings WHERE meeting_id=?`,[req.params.id]);
    if(!mtg) return res.status(404).json({message:'Meeting not found.'});
    if(mtg.status==='cancelled') return res.status(400).json({message:'Meeting cancelled.'});
    if(mtg.status==='ended')     return res.status(400).json({message:'Meeting has ended.'});
    if(!(await matchesPassword(password, mtg.password))) return res.status(403).json({message:'❌ Wrong meeting password.'});

    // Upsert participant
    const [existing] = await q(`SELECT * FROM meeting_participants WHERE meeting_id=? AND user_id=?`,[req.params.id,userId]);
    if(existing) {
      await q(`UPDATE meeting_participants SET status='joined',joined_at=NOW() WHERE meeting_id=? AND user_id=?`,[req.params.id,userId]);
    } else {
      await q(`INSERT INTO meeting_participants(meeting_id,user_id,role,status,joined_at) VALUES(?,?,'participant','joined',NOW())`,[req.params.id,userId]);
    }
    // System message
    const [usr] = await q(`SELECT full_name FROM users WHERE user_id=?`,[userId]);
    await q(`INSERT INTO meeting_messages(meeting_id,sender_id,sender_name,content,msg_type) VALUES(?,?,?,'joined the meeting','system')`,
      [req.params.id,userId,usr?.full_name||'User']);
    const { password: storedHash, ...meeting } = mtg;
    res.json({ message: 'Joined.', meeting });
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.leaveMeeting = async (req,res) => {
  const userId = req.user.user_id;
  try {
    await q(`UPDATE meeting_participants SET status='left',left_at=NOW() WHERE meeting_id=? AND user_id=?`,[req.params.id,userId]);
    const [usr] = await q(`SELECT full_name FROM users WHERE user_id=?`,[userId]);
    await q(`INSERT INTO meeting_messages(meeting_id,sender_id,sender_name,content,msg_type) VALUES(?,?,?,'left the meeting','system')`,
      [req.params.id,userId,usr?.full_name||'User']);
    res.json({message:'Left meeting.'});
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.updateMedia = async (req,res) => {
  const {mic_on, video_on, hand_raised} = req.body;
  const sets=[]; const vals=[];
  if(mic_on!==undefined){sets.push('mic_on=?');vals.push(mic_on?1:0);}
  if(video_on!==undefined){sets.push('video_on=?');vals.push(video_on?1:0);}
  if(hand_raised!==undefined){sets.push('hand_raised=?');vals.push(hand_raised?1:0);}
  if(!sets.length) return res.status(400).json({message:'Nothing to update.'});
  vals.push(req.params.id, req.user.user_id);
  try {
    await q(`UPDATE meeting_participants SET ${sets.join(',')} WHERE meeting_id=? AND user_id=?`,vals);
    res.json({message:'Updated.'});
  } catch(e){ res.status(500).json({message:e.message}); }
};

/* ═══════════════ CHAT ═══════════════ */
exports.sendMessage = async (req,res) => {
  const {content} = req.body;
  if(!content) return res.status(400).json({message:'Content required.'});
  try {
    const [usr] = await q(`SELECT full_name FROM users WHERE user_id=?`,[req.user.user_id]);
    const result = await q(
      `INSERT INTO meeting_messages(meeting_id,sender_id,sender_name,content,msg_type) VALUES(?,?,?,?,?)`,
      [req.params.id,req.user.user_id,usr?.full_name||'User',content,'chat']);
    res.status(201).json({message:'Sent.',msg_id:result.insertId});
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.getMessages = async (req,res) => {
  try { res.json(await q(`SELECT * FROM meeting_messages WHERE meeting_id=? ORDER BY created_at LIMIT 300`,[req.params.id])); }
  catch(e){ res.status(500).json({message:e.message}); }
};

/* ═══════════════ NOTES ═══════════════ */
exports.addNote = async (req,res) => {
  const {content, note_type, assigned_to, due_date} = req.body;
  if(!content) return res.status(400).json({message:'Content required.'});
  try {
    const result = await q(
      `INSERT INTO meeting_notes(meeting_id,author_id,content,note_type,assigned_to,due_date) VALUES(?,?,?,?,?,?)`,
      [req.params.id,req.user.user_id,content,note_type||'note',assigned_to||null,due_date||null]);
    res.status(201).json({message:'Note added.',note_id:result.insertId});
  } catch(e){ res.status(500).json({message:e.message}); }
};

/* ═══════════════ AI REPORT ═══════════════ */
async function generateReport(meetingId, actualMins, user) {
  try {
    const [mtg]         = await q(`SELECT * FROM meetings WHERE meeting_id=?`,[meetingId]);
    const participants  = await q(`SELECT mp.*, u.full_name, u.email FROM meeting_participants mp LEFT JOIN users u ON mp.user_id=u.user_id WHERE mp.meeting_id=?`,[meetingId]);
    const notes         = await q(`SELECT mn.*, u.full_name AS author FROM meeting_notes mn LEFT JOIN users u ON mn.author_id=u.user_id WHERE mn.meeting_id=? ORDER BY mn.created_at`,[meetingId]);
    const messages      = await q(`SELECT * FROM meeting_messages WHERE meeting_id=? AND msg_type='chat' ORDER BY created_at LIMIT 100`,[meetingId]);

    // Build context for AI
    const noteText  = notes.map(n=>`[${n.note_type.toUpperCase()}] ${n.content}${n.assigned_to?' (→ '+n.author+')':''}`).join('\n');
    const chatText  = messages.slice(-40).map(m=>`${m.sender_name}: ${m.content}`).join('\n');
    const attList   = participants.filter(p=>p.status==='joined'||p.status==='left').map(p=>p.full_name||p.guest_name||'Guest');

    // Call AI via shared provider (OpenRouter/OpenAI/Anthropic — set in .env)
    let aiSummary='', keyPoints=[], actionItems=[], decisions=[];
    try {
      const { callAI } = require('./chatController');
      const prompt = `You are an AI meeting assistant for Workforce Intelligence. Analyze this meeting and generate a structured report.

Meeting: "${mtg.title}" (${mtg.meeting_type})
Date: ${mtg.scheduled_at}
Duration: ${actualMins} minutes
Attendees: ${attList.join(', ')||'N/A'}
Agenda: ${mtg.agenda||'Not specified'}
Client: ${mtg.client_name||'N/A'}

Meeting Notes:
${noteText||'No notes recorded.'}

Chat Log (last 40 messages):
${chatText||'No chat messages.'}

Generate a JSON response ONLY (no markdown, no explanation, no backticks) with this exact structure:
{"summary":"2-3 sentence executive summary","key_points":["point 1","point 2"],"action_items":[{"task":"description","owner":"name or TBD","due":"YYYY-MM-DD or TBD"}],"decisions":["decision 1"],"sentiment":"positive","follow_up_required":true}`;

      const result = await callAI([{role:'user', content:prompt}], null, 1200);
      const raw    = result?.content?.[0]?.text || '{}';
      const clean  = raw.replace(/```json|```/g,'').trim();
      const parsed = JSON.parse(clean);
      aiSummary   = parsed.summary       || '';
      keyPoints   = parsed.key_points    || [];
      actionItems = parsed.action_items  || [];
      decisions   = parsed.decisions     || [];
    } catch(aiErr){
      console.warn('[MEETING REPORT AI]', aiErr.message);
      aiSummary = 'Meeting report generated. AI summary unavailable — configure AI_PROVIDER and API key in .env to enable full AI summaries.';
    }

    // Save report
    await q(`INSERT INTO meeting_reports
      (meeting_id,summary,key_points,action_items,decisions,attendee_list,duration_actual,generated_by)
      VALUES(?,?,?,?,?,?,?,'ai')
      ON DUPLICATE KEY UPDATE summary=VALUES(summary),key_points=VALUES(key_points),
        action_items=VALUES(action_items),decisions=VALUES(decisions),
        attendee_list=VALUES(attendee_list),duration_actual=VALUES(duration_actual),
        generated_at=NOW()`,
      [meetingId,aiSummary,JSON.stringify(keyPoints),JSON.stringify(actionItems),
       JSON.stringify(decisions),JSON.stringify(attList),actualMins]);

    // Mark meeting as report generated
    await q(`UPDATE meetings SET report_generated=1 WHERE meeting_id=?`,[meetingId]);

    // Auto-create tasks for action items
    for(const item of actionItems) {
      if(item.task) {
        await q(`INSERT INTO meeting_notes(meeting_id,author_id,content,note_type,due_date) VALUES(?,?,?,'action',?)`,
          [meetingId, user.user_id, item.task+(item.owner?' → '+item.owner:''), item.due&&item.due!=='TBD'?item.due:null]);
      }
    }

    return { summary:aiSummary, key_points:keyPoints, action_items:actionItems, decisions, attendees:attList, duration_actual:actualMins };
  } catch(e){ console.error('[MEETING REPORT]',e.message); return null; }
}

exports.getReport = async (req,res) => {
  try {
    const [report] = await q(`SELECT * FROM meeting_reports WHERE meeting_id=?`,[req.params.id]);
    if(!report) return res.status(404).json({message:'Report not yet generated.'});
    ['key_points','action_items','decisions','attendee_list'].forEach(k=>{
      try{ if(typeof report[k]==='string') report[k]=JSON.parse(report[k]); }catch(_){}
    });
    res.json(report);
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.regenerateReport = async (req,res) => {
  try {
    const [mtg] = await q(`SELECT * FROM meetings WHERE meeting_id=?`,[req.params.id]);
    if(!mtg) return res.status(404).json({message:'Not found.'});
    const mins = mtg.ended_at ? Math.round((new Date(mtg.ended_at)-new Date(mtg.scheduled_at))/60000) : mtg.duration_mins;
    const report = await generateReport(req.params.id, mins, req.user);
    res.json({message:'Report regenerated.', report});
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.joinByCode = async (req,res) => {
  const {room_code, password} = req.body;
  if(!room_code) return res.status(400).json({message:'room_code required.'});
  try {
    const [mtg] = await q(`SELECT * FROM meetings WHERE room_code=?`,[room_code.toUpperCase()]);
    if(!mtg) return res.status(404).json({message:'Meeting not found. Check the code.'});
    if(!(await matchesPassword(password, mtg.password))) return res.status(403).json({message:'❌ Wrong password.'});
    res.json({meeting_id:mtg.meeting_id, title:mtg.title, status:mtg.status, host_id:mtg.host_id});
  } catch(e){ res.status(500).json({message:e.message}); }
};

/** External links are stored for joining; the application does not create a provider meeting. */
function validMeetingLink(value){
 const provider=value.meeting_provider || 'internal';
 if(!['internal','zoom','google_meet','teams','other'].includes(provider))return false;
 if(!value.meeting_url)return provider==='internal';
 try{const url=new URL(value.meeting_url);return url.protocol==='https:' && !url.username && !url.password && value.meeting_url.length<=1000;}catch{return false;}
}

// Change the schedule and create participant alerts in the same transaction.
function changeMeeting(action) {
  return async (request, response, next) => {
    const { reason, scheduled_at } = request.body || {};
    const cancelling = action === 'cancelled';
    if (reason !== undefined && (typeof reason !== 'string' || reason.trim().length > 500))
      return response.status(400).json({message:'Enter a reason up to 500 characters.'});
    const date = typeof scheduled_at === 'string' && scheduled_at.length <= 35 ? new Date(scheduled_at) : null;
    if (!cancelling && (!date || !Number.isFinite(date.getTime()) || date <= new Date()))
      return response.status(400).json({message:'Choose a future meeting date and time.'});
    try {
      const recipients = await require('../services/database').transaction(async run => {
        const [meeting] = await run('SELECT title, status, scheduled_at FROM meetings WHERE meeting_id=? FOR UPDATE',[request.params.id]);
        if (!meeting || !['scheduled','active'].includes(meeting.status) || (!cancelling && meeting.status !== 'scheduled'))
          throw Object.assign(new Error('This meeting cannot be changed in its current state.'),{status:409});
        if (!cancelling && new Date(meeting.scheduled_at).getTime() === date.getTime()) return [];
        if (cancelling) {
          await run("UPDATE meetings SET status='cancelled',cancellation_reason=? WHERE meeting_id=?", [reason?.trim() || null,request.params.id]);
        } else {
          await run('UPDATE meetings SET scheduled_at=? WHERE meeting_id=?',[date,request.params.id]);
        }
        const message = 'Meeting '+action+': '+meeting.title + (cancelling ? (reason?.trim() ? ' · '+reason.trim() : '') : ' · '+date.toISOString()+(reason?.trim()?' · '+reason.trim():''));
        const participants = await run("SELECT DISTINCT user_id FROM meeting_participants WHERE meeting_id=? AND user_id IS NOT NULL AND status<>'declined'",[request.params.id]);
        for (const participant of participants) {
          await run('INSERT INTO alerts(user_id,alert_type,alert_message) VALUES (?,?,?)',[participant.user_id,'meeting_'+action,message]);
          await run('INSERT INTO notifications(user_id,type,title,message,action_url) VALUES (?,?,?,?,?)',
            [participant.user_id,'meeting_'+action,'Meeting '+action,message,'/meetings.html']);
        }
        return participants.map(participant => participant.user_id);
      });
      for (const userId of recipients) require('../socketServer').emitToUser(userId,'wip:meeting_changed',{meeting_id:Number(request.params.id),action});
      response.json({message:'Meeting '+action+'.'});
    } catch (error) { next(error); }
  };
}
exports.cancelMeeting = changeMeeting('cancelled');
exports.rescheduleMeeting = changeMeeting('rescheduled');
