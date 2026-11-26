/**
 * chatController.js — v7.0 MULTI-AI
 * ════════════════════════════════════════════════════════════════
 * Supports BOTH providers — configured via .env AI_PROVIDER:
 *
 *   AI_PROVIDER=openrouter   → FREE via OpenRouter (no credit card)
 *   AI_PROVIDER=anthropic    → Claude Sonnet (paid, original)
 *
 * FREE models on OpenRouter (change AI_MODEL in .env):
 *   meta-llama/llama-3.1-8b-instruct:free
 *   mistralai/mistral-7b-instruct:free
 *   google/gemma-2-9b-it:free
 *   microsoft/phi-3-mini-128k-instruct:free
 *   openchat/openchat-7b:free
 *
 * Sign up FREE at: https://openrouter.ai
 * Get key at:      https://openrouter.ai/keys
 * ════════════════════════════════════════════════════════════════
 */

const db = require('../config/db');
function query(sql, params=[]) {
  return new Promise((r,j)=>db.query(sql,params,(e,res)=>e?j(e):r(res)));
}

// ── Which provider + model to use ────────────────────────────────
const PROVIDER = (process.env.AI_PROVIDER || 'openrouter').toLowerCase();
const MODEL    = process.env.AI_MODEL     || 'meta-llama/llama-3.1-8b-instruct:free';

// ── Unified AI caller (OpenAI-compatible format) ──────────────────
async function callAI(messages, systemPrompt, maxTokens=1000) {
  const provider = PROVIDER;

  // ── OpenRouter (FREE) ─────────────────────────────────────────
  if(provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if(!apiKey || apiKey.includes('your-key'))
      throw new Error('OPENROUTER_API_KEY not set. Get a FREE key at https://openrouter.ai/keys');

    const payload = {
      model: MODEL,
      max_tokens: maxTokens,
      messages: systemPrompt
        ? [{ role:'system', content: systemPrompt }, ...messages]
        : messages
    };

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'WorkforceIQ'
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if(!resp.ok) throw new Error(data.error?.message || 'OpenRouter error: ' + resp.status);
    // Return in Anthropic-style format so frontend stays compatible
    return {
      provider: 'openrouter',
      model: data.model || MODEL,
      content: [{ type:'text', text: data.choices?.[0]?.message?.content || '' }],
      usage: data.usage
    };
  }

  // ── OpenAI direct (GPT-3.5-turbo free tier / API key) ────────
  if(provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if(!apiKey || apiKey.includes('your-key'))
      throw new Error('OPENAI_API_KEY not set.');

    const oaiModel = process.env.AI_MODEL || 'gpt-3.5-turbo';
    const payload = {
      model: oaiModel,
      max_tokens: maxTokens,
      messages: systemPrompt
        ? [{ role:'system', content: systemPrompt }, ...messages]
        : messages
    };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+apiKey },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if(!resp.ok) throw new Error(data.error?.message || 'OpenAI error');
    return {
      provider: 'openai',
      model: oaiModel,
      content: [{ type:'text', text: data.choices?.[0]?.message?.content || '' }],
      usage: data.usage
    };
  }

  // ── Anthropic Claude (original / paid) ────────────────────────
  if(provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if(!apiKey || apiKey.includes('your-key'))
      throw new Error('ANTHROPIC_API_KEY not set.');

    const claudeModel = process.env.AI_MODEL || 'claude-haiku-4-5-20251001';
    const payload = { model:claudeModel, max_tokens:maxTokens, messages };
    if(systemPrompt) payload.system = systemPrompt;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'x-api-key': apiKey,
        'anthropic-version':'2023-06-01'
      },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if(!resp.ok) throw new Error(data.error?.message || 'Anthropic error');
    return { provider:'anthropic', model:claudeModel, ...data };
  }

  throw new Error('Unknown AI_PROVIDER: '+provider+'. Use openrouter, openai, or anthropic.');
}

/* ═══════════════════════════════════════════════════════════
   CONTEXT — same as before
═══════════════════════════════════════════════════════════ */
exports.getContext = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const perms = await query('SELECT * FROM user_permissions WHERE user_id=?', [userId]);
    const perm  = perms[0] || {};
    const canViewSalary = req.user.role_id === 1 || perm.can_view_salary;

    const [tasks, users, reports, productivity, daily, weekly, monthly, annual, leaveStats, attendanceToday] = await Promise.all([
      query(`SELECT t.task_id, t.title, t.description, t.priority, t.status, t.due_date, t.created_at,
                    u1.full_name AS assigned_by_name, u2.full_name AS assigned_to_name
             FROM tasks t
             LEFT JOIN users u1 ON t.assigned_by=u1.user_id
             LEFT JOIN users u2 ON t.assigned_to=u2.user_id
             ORDER BY t.created_at DESC LIMIT 200`),
      query(`SELECT u.user_id, u.full_name, u.email, u.designation, r.role_name, u.created_at
             FROM users u JOIN roles r ON u.role_id=r.role_id WHERE u.status='active'`),
      query(`SELECT report_title, report_type, summary, report_date FROM reports ORDER BY report_date DESC LIMIT 50`),
      query(`SELECT u.full_name,
               COUNT(t.task_id) AS total,
               SUM(t.status='Completed') AS completed,
               SUM(t.status='Overdue') AS overdue,
               ROUND(SUM(t.status='Completed')/NULLIF(COUNT(t.task_id),0)*100,1) AS completion_rate
             FROM users u LEFT JOIN tasks t ON t.assigned_to=u.user_id
             WHERE u.role_id=2 GROUP BY u.user_id, u.full_name`),
      query(`SELECT DATE(created_at) AS day, COUNT(*) AS created, SUM(status='Completed') AS completed, SUM(status='Overdue') AS overdue
             FROM tasks WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY DATE(created_at) ORDER BY day DESC`),
      query(`SELECT YEARWEEK(created_at,1) AS week, MIN(DATE(created_at)) AS week_start, COUNT(*) AS created, SUM(status='Completed') AS completed
             FROM tasks WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
             GROUP BY YEARWEEK(created_at,1) ORDER BY week DESC`),
      query(`SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS created, SUM(status='Completed') AS completed
             FROM tasks WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
             GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month DESC`),
      query(`SELECT YEAR(created_at) AS year, COUNT(*) AS created, SUM(status='Completed') AS completed
             FROM tasks GROUP BY YEAR(created_at) ORDER BY year DESC`),
      query(`SELECT status, COUNT(*) AS count FROM leave_requests GROUP BY status`),
      query(`SELECT COUNT(*) AS clocked_in FROM attendance WHERE work_date=CURDATE() AND clock_in IS NOT NULL AND clock_out IS NULL`)
    ]);

    const leaveMap = {};
    leaveStats.forEach(r => { leaveMap[r.status] = Number(r.count); });

    const context = {
      generated_at: new Date().toISOString(),
      ai_provider: PROVIDER,
      ai_model: MODEL,
      summary: {
        total_tasks:     tasks.length,
        total_employees: users.filter(u => u.role_name === 'Employee').length,
        total_reports:   reports.length,
        clocked_in_now:  attendanceToday[0]?.clocked_in || 0,
        pending_leaves:  leaveMap['pending'] || 0
      },
      tasks, users, reports,
      productivity_by_employee: productivity,
      trends: { daily, weekly, monthly, annual },
      leave_summary: leaveMap
    };

    if(canViewSalary) {
      context.salary_summary = await query(
        `SELECT payment_status, COUNT(*) AS count, COALESCE(SUM(net_salary),0) AS total
         FROM salary_records WHERE year=YEAR(CURDATE()) AND month=MONTH(CURDATE())
         GROUP BY payment_status`);
    }

    res.json(context);
  } catch(err) {
    res.status(500).json({ message: 'Context fetch failed', error: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   IMPORT — unchanged
═══════════════════════════════════════════════════════════ */
exports.importData = async (req, res) => {
  const { type, rows } = req.body;
  const imported_by = req.user.user_id;
  if(!type || !Array.isArray(rows) || !rows.length)
    return res.status(400).json({ message: 'type and rows[] required' });
  let inserted=0; const errors=[];
  try {
    if(type==='tasks') {
      for(const row of rows) {
        try {
          await query(
            `INSERT INTO tasks (title,description,assigned_by,assigned_to,priority,status,due_date) VALUES (?,?,?,?,?,?,?)`,
            [row.title||'Untitled', row.description||null, row.assigned_by||imported_by, row.assigned_to||imported_by,
             ['Low','Medium','High'].includes(row.priority)?row.priority:'Medium',
             ['Pending','In Progress','Completed','Overdue'].includes(row.status)?row.status:'Pending', row.due_date||null]);
          inserted++;
        } catch(e){ errors.push(`Row ${inserted+errors.length+1}: ${e.message}`); }
      }
    }
    if(type==='users') {
      const bcrypt = require('bcryptjs');
      for(const row of rows) {
        try {
          const hash = bcrypt.hashSync(row.password||'Welcome@123',10);
          await query(
            `INSERT IGNORE INTO users (full_name,email,password_hash,role_id,designation,department_id) VALUES (?,?,?,?,?,?)`,
            [row.full_name||row.name||'Unknown', row.email, hash, row.role_id||2, row.designation||null, row.department_id||null]);
          inserted++;
        } catch(e){ errors.push(`Row ${inserted+errors.length+1}: ${e.message}`); }
      }
    }
    res.json({ message: `Imported ${inserted} ${type}`, inserted, errors });
  } catch(err) { res.status(500).json({ message: 'Import failed', error: err.message }); }
};

/* ═══════════════════════════════════════════════════════════
   SEND MESSAGE — unified proxy
═══════════════════════════════════════════════════════════ */
exports.sendMessage = async (req, res) => {
  try {
    const { messages, system, max_tokens } = req.body;
    if(!messages || !Array.isArray(messages) || !messages.length)
      return res.status(400).json({ message: 'messages[] required' });

    const result = await callAI(messages, system, max_tokens||1000);
    res.json(result);
  } catch(err) {
    console.error('[AI PROXY ERROR]', err.message);
    // Return a helpful setup message instead of crashing
    res.status(503).json({
      message: err.message,
      setup_help: {
        free_option: 'Use OpenRouter for FREE AI. Steps: 1) Visit https://openrouter.ai 2) Sign up FREE 3) Get API key at openrouter.ai/keys 4) Add OPENROUTER_API_KEY=sk-or-... to .env 5) Set AI_PROVIDER=openrouter in .env 6) Restart server',
        models: ['meta-llama/llama-3.1-8b-instruct:free','mistralai/mistral-7b-instruct:free','google/gemma-2-9b-it:free','microsoft/phi-3-mini-128k-instruct:free']
      }
    });
  }
};

// Export callAI for meeting report generation
exports.callAI = callAI;
