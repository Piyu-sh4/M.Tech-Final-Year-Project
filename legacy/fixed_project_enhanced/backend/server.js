/**
 * server.js — Workforce Intelligence Platform v7.0 (FIXED)
 * ═══════════════════════════════════════════════════════════
 * FIXES:
 *  - Redis failure no longer spams console (stops after 3 retries)
 *  - Python attrition service start instructions shown at boot
 *  - Cleaner startup logs
 */
require('dotenv').config();

const http = require('http');
const app  = require('./app');
const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────────────
let io = null;
try {
  const { createSocketServer, startOverdueTaskPoller } = require('./socketServer');
  io = createSocketServer(httpServer);
  app.set('io', io);
  startOverdueTaskPoller();
  console.log('[BOOT] Socket.io + overdue poller ready');
} catch (e) {
  console.warn('[BOOT] Socket.io unavailable:', e.message);
}

// ── Redis cache (non-blocking — app works fine without it) ────
(async () => {
  try {
    const cache = require('./services/cacheService');
    await cache.connect();
  } catch (e) {
    console.warn('[BOOT] Cache service error — continuing without cache');
  }
})();

// ── Listen ────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  const hasJWT         = !!process.env.JWT_SECRET;
  const provider = (process.env.AI_PROVIDER||'openrouter').toLowerCase();
  const providerKeys = {
    openrouter: process.env.OPENROUTER_API_KEY,
    openai:     process.env.OPENAI_API_KEY,
    anthropic:  process.env.ANTHROPIC_API_KEY
  };
  const activeKey = providerKeys[provider] || '';
  const hasAI = activeKey && !activeKey.includes('your-key') && !activeKey.includes('paste-your');

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   ⚡  Workforce Intelligence Platform  v7.0  (4th Sem)   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`   HTTP API  : http://localhost:${PORT}`);
  console.log(`   WebSocket : ws://localhost:${PORT}   (Socket.io)`);
  console.log(`   Database  : ${process.env.DB_NAME || 'workforce_intelligence'} @ ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   JWT       : ${hasJWT  ? '✅ Set' : '❌ Missing — add JWT_SECRET to .env'}`);
  const providerLabel = {openrouter:'OpenRouter (FREE)',openai:'OpenAI',anthropic:'Claude'}[provider]||provider;
  const modelLabel = process.env.AI_MODEL || 'default';
  console.log(`   AI Chat   : ${hasAI ? '✅ '+providerLabel+' · '+modelLabel : '⚠️  Set AI_PROVIDER + API key in .env (see .env for setup)'}`);
  console.log(`   Redis     : Optional — start Redis to enable caching`);
  console.log('');
  console.log('   ┌─ Attrition Model (separate terminal needed) ─────────┐');
  console.log('   │  pip install flask scikit-learn pandas               │');
  console.log('   │       mysql-connector-python python-dotenv           │');
  console.log('   │  python attrition_model.py                           │');
  console.log('   │  → http://localhost:5050/health                      │');
  console.log('   └──────────────────────────────────────────────────────┘');
  console.log('');
  console.log('   Frontend: open frontend/login.html in your browser');
  console.log('   Demo credentials (after seeding DB):');
  console.log('     Admin   : admin@wip.com    / Admin@123');
  console.log('     Employee: piyush.sharma@wip.com / Piyush@123');
  console.log('');
});

// ── Graceful shutdown ─────────────────────────────────────────
function gracefulShutdown(signal) {
  console.log(`\n[SHUTDOWN] ${signal} received — closing server…`);
  httpServer.close(() => {
    console.log('[SHUTDOWN] HTTP server closed');
    try {
      const db = require('./config/db');
      db.end(() => { console.log('[SHUTDOWN] DB pool closed'); process.exit(0); });
    } catch(e) { process.exit(0); }
  });
  setTimeout(() => { process.exit(1); }, 10000);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
