const db = require('../config/db');
const { transaction } = require('../services/database');
const { fail, decisionId } = require('../services/workforceDecisions');

const activeStatuses = ['open', 'in_progress', 'pending_user'];
const serviceStatuses = [...activeStatuses, 'resolved', 'closed'];
const hasServiceAccess = (actor, ticket) => [1,4].includes(actor.role_id) ||
  (actor.role_id === 3 && ticket.assigned_to === actor.user_id);

const q = (sql,p)=>new Promise((r,j)=>db.query(sql,p||[],(e,res)=>e?j(e):r(res)));

exports.getMyTickets = async (req,res)=>{
  try {
    const rows=await q(`SELECT t.*,u.full_name AS assignee_name FROM helpdesk_tickets t
      LEFT JOIN users u ON u.user_id=t.assigned_to WHERE t.user_id=? ORDER BY t.created_at DESC`,[req.user.user_id]);
    res.json(rows);
  } catch(e){res.status(500).json({message:e.message});}
};

exports.getAllTickets = async (req,res)=>{
  try {
    const {status,category,priority}=req.query;
    let sql=`SELECT t.*,u.full_name,u.email,u2.full_name AS assignee_name FROM helpdesk_tickets t
      JOIN users u ON u.user_id=t.user_id LEFT JOIN users u2 ON u2.user_id=t.assigned_to WHERE 1=1`;
    const p=[];
    if (req.user.role_id === 3) { sql += ' AND t.assigned_to=?'; p.push(req.user.user_id); }
    if(status)  {sql+=' AND t.status=?';   p.push(status);}
    if(category){sql+=' AND t.category=?'; p.push(category);}
    if(priority){sql+=' AND t.priority=?'; p.push(priority);}
    sql+=' ORDER BY FIELD(t.priority,\"critical\",\"high\",\"medium\",\"low\"), t.created_at ASC';
    res.json(await q(sql,p));
  } catch(e){res.status(500).json({message:e.message});}
};

exports.create = async (req,res,next)=>{
  try {
    const {category,priority,subject,description}=req.body;
    if (!['it_hardware','it_software','access','hr_query','payroll','facilities','other'].includes(category) ||
        !['low','medium','high','critical'].includes(priority || 'medium') ||
        typeof subject !== 'string' || !subject.trim() || subject.length > 200 ||
        typeof description !== 'string' || !description.trim())
      return res.status(400).json({ message: 'Choose a listed category and priority, then enter a subject and description.' });
    const r=await q('INSERT INTO helpdesk_tickets (user_id,category,priority,subject,description) VALUES (?,?,?,?,?)',
      [req.user.user_id,category,priority||'medium',subject,description]);
    res.json({message:'Ticket raised',ticket_id:r.insertId});
  } catch(e){next(e);}
};

exports.closeMyTicket = async (request, response, next) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1)
    return response.status(400).json({ message: 'Choose a valid ticket.' });
  try {
    const userId = request.user.user_id;
    const result = await q(`UPDATE helpdesk_tickets SET status='closed'
      WHERE ticket_id=? AND user_id=? AND status IN ('open','in_progress','pending_user')`, [id, userId]);
    if (result.affectedRows) return response.json({ closed: true, message: 'Ticket closed.' });
    const [ticket] = await q('SELECT status FROM helpdesk_tickets WHERE ticket_id=? AND user_id=?', [id, userId]);
    if (!ticket) return response.status(404).json({ message: 'Ticket not found.' });
    if (ticket.status === 'closed') return response.json({ closed: true, message: 'Ticket is already closed.' });
    return response.status(409).json({ message: 'This ticket has already been resolved.' });
  } catch (error) {
    next(error);
  }
};

async function lockServiceTicket(run, actor, id) {
  const [ticket] = await run('SELECT * FROM helpdesk_tickets WHERE ticket_id=? FOR UPDATE', [id]);
  if (!ticket || !hasServiceAccess(actor, ticket)) fail(404, 'Ticket not found.');
  return ticket;
}

async function checkAssignee(run, assignee) {
  if (assignee === null) return null;
  const id = decisionId(assignee);
  const [staff] = await run("SELECT user_id FROM users WHERE user_id=? AND role_id IN (1,3,4) AND status='active'", [id]);
  if (!staff) fail(400, 'Choose an active staff assignee.');
  return id;
}

exports.update = async (req,res,next) => {
  try {
    const id = decisionId(req.params.id);
    const {status, assigned_to, resolution, satisfaction} = req.body;
    if (!serviceStatuses.includes(status) ||
        (resolution != null && (typeof resolution !== 'string' || resolution.length > 1500)) ||
        (satisfaction != null && (!Number.isInteger(satisfaction) || satisfaction < 1 || satisfaction > 5)))
      fail(400, 'Choose a valid ticket status, resolution or rating.');
    await transaction(async run => {
      const ticket = await lockServiceTicket(run,req.user,id);
      if (ticket.status === 'closed') fail(409, 'A closed ticket cannot be changed.');
      if (req.user.role_id === 3 && assigned_to !== undefined)
        fail(403, 'HR or an administrator can reassign a ticket.');
      const assignee = assigned_to === undefined ? ticket.assigned_to : await checkAssignee(run,assigned_to);
      const note = resolution === undefined ? ticket.resolution : resolution;
      if (status === 'resolved' && !note?.trim()) fail(400, 'Enter a resolution note.');
      await run(`UPDATE helpdesk_tickets SET status=?, assigned_at=IF(NOT (assigned_to <=> ?),IF(? IS NULL,NULL,NOW()),assigned_at),
        assigned_to=?, resolution=?, satisfaction=?, resolved_at=IF(?='resolved',COALESCE(resolved_at,NOW()),resolved_at)
        WHERE ticket_id=?`, [status,assignee,assignee,assignee,note || null,satisfaction ?? ticket.satisfaction,status,id]);
    });
    res.json({message:'Ticket updated'});
  } catch (error) { next(error); }
};

exports.accessTicket = async (request, response, next) => {
  try {
    const actor = request.user;
    const [ticket] = await q('SELECT user_id,assigned_to FROM helpdesk_tickets WHERE ticket_id=?', [request.params.id]);
    if (!ticket) return response.status(404).json({ message: 'Ticket not found.' });
    const staff = hasServiceAccess(actor,ticket);
    if (!staff && ticket.user_id !== actor.user_id)
      return response.status(404).json({ message: 'Ticket not found.' });
    request.ticketStaff = staff;
    next();
  } catch (error) { next(error); }
};

exports.addComment = async (req,res)=>{
  try {
    const {message,is_internal}=req.body;
    if(!message) return res.status(400).json({message:'Message required'});
    await q('INSERT INTO helpdesk_comments (ticket_id,user_id,message,is_internal) VALUES (?,?,?,?)',
      [req.params.id,req.user.user_id,message,req.ticketStaff && is_internal === true ? 1 : 0]);
    res.json({message:'Comment added'});
  } catch(e){res.status(500).json({message:e.message});}
};

exports.getComments = async (req,res)=>{
  try {
    const rows=await q(`SELECT c.*,u.full_name,u.role_id FROM helpdesk_comments c
      JOIN users u ON u.user_id=c.user_id WHERE c.ticket_id=? AND (c.is_internal=0 OR ?) ORDER BY c.created_at ASC`,[req.params.id, req.ticketStaff]);
    res.json(rows);
  } catch(e){res.status(500).json({message:e.message});}
};

exports.getStats = async (req,res,next) => {
  try {
    const managed = req.user.role_id === 3;
    const [stats] = await q(`SELECT COUNT(*) AS total,SUM(status='open') AS open_count,
      SUM(status='in_progress') AS in_progress,SUM(status='resolved') AS resolved,
      SUM(priority='critical') AS critical,AVG(satisfaction) AS avg_satisfaction FROM helpdesk_tickets
      ${managed ? 'WHERE assigned_to=?' : ''}`, managed ? [req.user.user_id] : []);
    res.json(stats);
  } catch (error) { next(error); }
};

// ─── Knowledge Base ──────────────────────────────────────────────────────
exports.getKBArticles = async (req,res)=>{
  try {
    const {category,search}=req.query;
    let sql=`SELECT * FROM helpdesk_kb WHERE is_published=1`;
    const p=[];
    if(category){sql+=' AND category=?';p.push(category);}
    if(search){sql+=' AND (title LIKE ? OR tags LIKE ?)';p.push(`%${search}%`,`%${search}%`);}
    sql+=' ORDER BY helpful_count DESC';
    res.json(await q(sql,p));
  } catch(e){res.status(500).json({message:e.message});}
};

exports.createKBArticle = async (req,res)=>{
  try {
    const {category,title,content,tags}=req.body;
    if(!category||!title||!content) return res.status(400).json({message:'category, title, content required'});
    const r=await q(`INSERT INTO helpdesk_kb (category,title,content,tags,created_by) VALUES (?,?,?,?,?)`,
      [category,title,content,tags||null,req.user.user_id]);
    res.json({message:'Article created',kb_id:r.insertId});
  } catch(e){res.status(500).json({message:e.message});}
};

exports.rateKBArticle = async (req,res)=>{
  try {
    const {helpful}=req.body;
    const field=helpful?'helpful_count':'not_helpful_count';
    await q(`UPDATE helpdesk_kb SET ${field}=${field}+1 WHERE kb_id=?`,[req.params.id]);
    res.json({message:'Rated'});
  } catch(e){res.status(500).json({message:e.message});}
};

exports.escalateTicket = async (req,res,next) => {
  try {
    const id = decisionId(req.params.id);
    const { escalated_to, reason } = req.body;
    if (typeof reason !== 'string' || !reason.trim() || reason.length > 1500)
      fail(400, 'Enter a reason for escalation.');
    await transaction(async run => {
      const ticket = await lockServiceTicket(run,req.user,id);
      if (!activeStatuses.includes(ticket.status)) fail(409, 'Only active tickets can be escalated.');
      if (req.user.role_id === 3 && escalated_to !== undefined)
        fail(403, 'HR or an administrator can reassign a ticket.');
      const assignee = escalated_to === undefined ? ticket.assigned_to : await checkAssignee(run,escalated_to);
      await run('INSERT INTO helpdesk_escalations (ticket_id,escalated_by,escalated_to,reason) VALUES (?,?,?,?)',
        [id,req.user.user_id,assignee,reason.trim()]);
      await run(`UPDATE helpdesk_tickets SET status='in_progress',
        assigned_at=IF(NOT (assigned_to <=> ?),IF(? IS NULL,NULL,NOW()),assigned_at),assigned_to=? WHERE ticket_id=?`,
      [assignee,assignee,assignee,id]);
    });
    res.json({message:'Ticket escalated'});
  } catch (error) { next(error); }
};

exports.getSLA = async (req,res)=>{
  try { res.json(await q('SELECT * FROM helpdesk_sla ORDER BY resolve_hours')); }
  catch(e){res.status(500).json({message:e.message});}
};
