/**
 * server.js — Workforce Intelligence Platform
 * Entry point — starts HTTP server, Socket.io, Redis cache
 */
require('dotenv').config();
if (!process.env.JWT_SECRET && process.env.DEMO_MODE === 'true') {
  process.env.JWT_SECRET = require('./services/privateSecrets').readOrCreate('jwt-key').toString('hex');
}

if(!process.env.JWT_SECRET)throw new Error('Configure JWT_SECRET before starting a non-demo deployment.');

// ── Logger (defined FIRST so it is available everywhere below) ──────
const logger = {
  log:   (...a) => process.env.NODE_ENV !== 'test' && console.log(...a),
  warn:  (...a) => console.warn(...a),
  error: (...a) => console.error(...a),
};

const http = require('http');
const app  = require('./app');
const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

async function start() {
  if (process.env.DEMO_MODE === 'true') {
    await require('./services/demoBootstrap').bootstrap();
  } else {
    const database=require('./config/db');
    await require('./services/financeSetup').ensureSchema(database);
    await require('./services/workforceDecisions').ensure(database);
    await require('./services/applicationPreferences').ensure(database);
    await require('./services/passkeys').ensure(database);
    await require('./services/bankingEncryption').ensure(database);
    await require('./services/buildRequests').ensure(database);
    await require('./services/meetingPasswords').ensure(database);
    await require('./services/cashAdvances').ensure(database);
    await require('./services/trainingSetup').ensure(database);
    await require('./services/signOutFeedback').ensure(database);
    await require('./services/passwordRecovery').ensure(database);

  }
  await require('./services/chatProviders').ensureSchema();

// ── Socket.io ───────────────────────────────────────────────────────
let io = null;
try {
  const { createSocketServer, startOverdueTaskPoller } = require('./socketServer');
  io = createSocketServer(httpServer);
  app.set('io', io);
  startOverdueTaskPoller();
  logger.log('[BOOT] Socket.io + overdue poller ready');
} catch (e) {
  logger.warn('[BOOT] Socket.io unavailable:', e.message);
}

// ── Redis cache (non-blocking — app works fine without it) ──────────
(async () => {
  try {
    const cache = require('./services/cacheService');
    await cache.connect();
  } catch (e) {
    logger.warn('[BOOT] Cache service unavailable — continuing without cache');
  }
})();

// ── Start HTTP server ───────────────────────────────────────────────
httpServer.listen(PORT, () => {
  const hasJWT  = !!(process.env.JWT_SECRET && !process.env.JWT_SECRET.includes('CHANGE_THIS'));
  const dbHost  = process.env.DB_HOST || 'localhost';
  const dbName  = process.env.DB_NAME || 'workforce_intelligence';

  logger.log('');
  logger.log('╔══════════════════════════════════════════════════════════╗');
  logger.log('║       ⚡  Workforce Intelligence Platform                ║');
  logger.log('║       Enterprise HRMS — DPDP 2023 · PoSH 2013           ║');
  logger.log('╚══════════════════════════════════════════════════════════╝');
  logger.log(`   URL       : http://localhost:${PORT}`);
  logger.log(`   Login     : http://localhost:${PORT}/login.html`);
  logger.log(`   WebSocket : ws://localhost:${PORT}`);
  logger.log(`   Database  : ${dbName} @ ${dbHost}:${process.env.DB_PORT || 3306}`);
  logger.log(`   JWT       : ${hasJWT  ? '✅ Configured' : '⚠️  Set JWT_SECRET in .env'}`);
  logger.log('   AI Chat   : Configure providers in AI Chat Settings');
  logger.log(`   Redis     : Optional — caching enabled if Redis is running`);
  logger.log('');
  if (process.env.DEMO_MODE === 'true') logger.log('   Demo mode enabled. See the README for setup.');
  logger.log('   Attrition AI (optional — separate terminal):');
  logger.log('     pip install flask scikit-learn pandas mysql-connector-python python-dotenv');
  logger.log('     python attrition_model.py  →  http://localhost:5050/health');
  logger.log('');
});

}
start().catch(error => {
  logger.error('[BOOT] Startup failed:', error.message);
  process.exit(1);
});

// ── Graceful shutdown ───────────────────────────────────────────────
function gracefulShutdown(signal) {
  logger.log(`\n[SHUTDOWN] ${signal} received — closing server…`);
  httpServer.close(() => {
    logger.log('[SHUTDOWN] HTTP server closed');
    try {
      const db = require('./config/db');
      db.end(() => { logger.log('[SHUTDOWN] DB pool closed'); process.exit(0); });
    } catch(e) { process.exit(0); }
  });
  setTimeout(() => { process.exit(1); }, 10000);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
