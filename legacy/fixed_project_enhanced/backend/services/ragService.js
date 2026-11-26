/**
 * ragService.js — RAG Service v5.1
 * Builds rich context from DB data + uploaded files
 * for accurate AI assistant responses.
 */

const db = require('../config/db');

// In-memory store for uploaded file chunks
const fileChunks = [];

// ── Add file content to the in-memory RAG store ──────────
function indexFileContent(filename, content, mimeHint) {
  // Chunk large content into ~800-char segments
  const size   = 800;
  const chunks = [];
  for (let i = 0; i < content.length; i += size) {
    chunks.push({
      source:  filename,
      mime:    mimeHint,
      text:    content.slice(i, i + size),
      indexed: new Date().toISOString()
    });
  }
  fileChunks.push(...chunks);
  // Keep only last 200 chunks to avoid prompt bloat
  if (fileChunks.length > 200) fileChunks.splice(0, fileChunks.length - 200);
  return chunks.length;
}

// ── Simple keyword relevance scorer ──────────────────────
function scoreChunk(chunk, query) {
  const q     = query.toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length > 2);
  const text  = chunk.text.toLowerCase();
  return words.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
}

// ── Retrieve top-k relevant file chunks for a query ──────
function retrieveRelevantChunks(query, topK = 6) {
  if (!fileChunks.length) return [];
  return fileChunks
    .map(c => ({ ...c, score: scoreChunk(c, query) }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ── Fetch live DB context ─────────────────────────────────
function fetchDBContext() {
  return new Promise((resolve, reject) => {
    const ctx = {};

    db.query(
      `SELECT u.user_id, u.full_name, u.email, r.role_name, u.created_at
       FROM users u JOIN roles r ON u.role_id = r.role_id`,
      (err, users) => {
        if (err) return reject(err);
        ctx.users = users;

        db.query(
          `SELECT t.*, 
                  u1.full_name AS assigned_by_name,
                  u2.full_name AS assigned_to_name
           FROM tasks t
           LEFT JOIN users u1 ON t.assigned_by = u1.user_id
           LEFT JOIN users u2 ON t.assigned_to = u2.user_id
           ORDER BY t.created_at DESC LIMIT 100`,
          (err2, tasks) => {
            if (err2) return reject(err2);
            ctx.tasks = tasks;

            db.query(
              `SELECT * FROM reports ORDER BY report_date DESC LIMIT 20`,
              (err3, reports) => {
                if (err3) return reject(err3);
                ctx.reports = reports;
                resolve(ctx);
              }
            );
          }
        );
      }
    );
  });
}

// ── Build the full system prompt for the AI ──────────────
async function buildSystemPrompt(userQuery) {
  let dbCtx;
  try {
    dbCtx = await fetchDBContext();
  } catch (e) {
    dbCtx = { users: [], tasks: [], reports: [] };
  }

  const relevantChunks = retrieveRelevantChunks(userQuery);

  const taskSummary = dbCtx.tasks.slice(0, 40).map(t =>
    `[#${t.task_id}] "${t.title}" | Status:${t.status} | Priority:${t.priority} | AssignedTo:${t.assigned_to_name || t.assigned_to} | Due:${t.due_date ? new Date(t.due_date).toDateString() : 'N/A'}`
  ).join('\n');

  const userSummary = dbCtx.users.map(u =>
    `[ID:${u.user_id}] ${u.full_name} <${u.email}> | Role:${u.role_name}`
  ).join('\n');

  const reportSummary = dbCtx.reports.map(r =>
    `[#${r.report_id}] "${r.report_title}" | Type:${r.report_type} | Date:${new Date(r.report_date).toDateString()}`
  ).join('\n');

  const fileContext = relevantChunks.length
    ? `\n\n=== UPLOADED FILE CONTEXT (most relevant excerpts) ===\n` +
      relevantChunks.map(c => `[Source: ${c.source}]\n${c.text}`).join('\n---\n')
    : '';

  return `You are an intelligent Workforce Analytics Assistant for a task management platform.
You have real-time access to the following live data from the system database.

=== EMPLOYEES (${dbCtx.users.length} total) ===
${userSummary || 'None yet.'}

=== TASKS (latest ${Math.min(dbCtx.tasks.length, 40)} of ${dbCtx.tasks.length} total) ===
${taskSummary || 'No tasks yet.'}

=== REPORTS (latest ${dbCtx.reports.length}) ===
${reportSummary || 'No reports yet.'}
${fileContext}

=== YOUR CAPABILITIES ===
- Answer questions about employees, tasks, productivity, and deadlines
- Analyze work trends: daily, weekly, monthly, annually
- Summarize uploaded file data (CSV, Excel, PDF)
- Spot overdue tasks, bottlenecks, high performers, and risks
- Generate report summaries and recommendations
- Import suggestions: tell the user which rows from uploaded files can be imported

Always be specific, use the data provided, cite task IDs and names. Be concise but insightful.
Today's date: ${new Date().toDateString()}.`;
}

module.exports = { buildSystemPrompt, indexFileContent, retrieveRelevantChunks, fileChunks };
