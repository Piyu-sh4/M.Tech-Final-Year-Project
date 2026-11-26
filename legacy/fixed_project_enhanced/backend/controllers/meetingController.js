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
    res.json(await q(sql, vals));
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
    res.json({...mtg, participants, notes, messages, report: report||null});
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.createMeeting = async (req,res) => {
  const hostId = req.user.user_id;
  const { title, description, meeting_type, room_id, scheduled_at, duration_mins,
          agenda, password, allow_guests, client_name, client_email,
          participant_user_ids } = req.body;
  if(!title||!scheduled_at) return res.status(400).json({message:'Title and scheduled_at required.'});
  try {
    let code = genCode();
    // Ensure unique
    while((await q(`SELECT meeting_id FROM meetings WHERE room_code=?`,[code])).length) code = genCode();

    const result = await q(`
      INSERT INTO meetings
        (title,description,meeting_type,host_id,room_id,room_code,scheduled_at,
         duration_mins,agenda,password,allow_guests,client_name,client_email,status)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'scheduled')`,
      [title,description||null,meeting_type||'internal',hostId,room_id||null,code,
       scheduled_at,duration_mins||60,agenda||null,password||null,
       allow_guests?1:0,client_name||null,client_email||null]);
    const mid = result.insertId;
    // Add host
    await q(`INSERT INTO meeting_participants(meeting_id,user_id,role,status) VALUES(?,?,'host','accepted')`,[mid,hostId]);
    // Add invitees
    if(Array.isArray(participant_user_ids)) {
      for(const uid of participant_user_ids) {
        if(uid && uid!==hostId)
          await q(`INSERT IGNORE INTO meeting_participants(meeting_id,user_id,role,status) VALUES(?,?,'participant','invited')`,[mid,uid]);
      }
    }
    res.status(201).json({message:'✅ Meeting scheduled.', meeting_id:mid, room_code:code});
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.updateMeeting = async (req,res) => {
  const allowed = ['title','description','scheduled_at','duration_mins','agenda','status',
                   'room_id','password','allow_guests','client_name','client_email','meeting_type'];
  const sets=[]; const vals=[];
  allowed.forEach(k=>{ if(req.body[k]!==undefined){sets.push(`${k}=?`);vals.push(req.body[k]);} });
  if(!sets.length) return res.status(400).json({message:'Nothing to update.'});
  vals.push(req.params.id);
  try {
    await q(`UPDATE meetings SET ${sets.join(',')} WHERE meeting_id=?`,vals);
    res.json({message:'Meeting updated.'});
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.startMeeting = async (req,res) => {
  try {
    await q(`UPDATE meetings SET status='active' WHERE meeting_id=?`,[req.params.id]);
    res.json({message:'🟢 Meeting started.'});
  } catch(e){ res.status(500).json({message:e.message}); }
};

exports.endMeeting = async (req,res) => {
  try {
    const [mtg] = await q(`SELECT * FROM meetings WHERE meeting_id=?`,[req.params.id]);
    if(!mtg) return res.status(404).json({message:'Not found.'});
    const startedAt = new Date(mtg.scheduled_at);
    const actualMins = Math.round((Date.now()-startedAt)/60000);
    await q(`UPDATE meetings SET status='ended', ended_at=NOW() WHERE meeting_id=?`,[req.params.id]);
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
    if(mtg.password && mtg.password!==password) return res.status(403).json({message:'❌ Wrong meeting password.'});

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
    res.json({message:'Joined.',meeting:mtg});
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
  const {content, msg_type} = req.body;
  if(!content) return res.status(400).json({message:'Content required.'});
  try {
    const [usr] = await q(`SELECT full_name FROM users WHERE user_id=?`,[req.user.user_id]);
    const result = await q(
      `INSERT INTO meeting_messages(meeting_id,sender_id,sender_name,content,msg_type) VALUES(?,?,?,?,?)`,
      [req.params.id,req.user.user_id,usr?.full_name||'User',content,msg_type||'chat']);
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
      const prompt = `You are an AI meeting assistant for WorkforceIQ. Analyze this meeting and generate a structured report.

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
    if(mtg.password && mtg.password!==password) return res.status(403).json({message:'❌ Wrong password.'});
    res.json({meeting_id:mtg.meeting_id, title:mtg.title, status:mtg.status, host_id:mtg.host_id});
  } catch(e){ res.status(500).json({message:e.message}); }
};
