/**
 * app.js — Express Application v6.0 FIXED
 * CORS fixed: allow all origins for local file:// development.
 * In production set CORS_ORIGIN env var to your domain.
 */
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const app     = express();

// ── CORS — allow all origins in dev, restrict in production ──
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: false
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // pre-flight for all routes

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', require('express').static(path.join(__dirname, 'uploads')));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/tasks',        require('./routes/taskRoutes'));
app.use('/api/reports',      require('./routes/reportRoutes'));
app.use('/api/chat',         require('./routes/chatRoutes'));
app.use('/api/upload',       require('./routes/uploadRoutes'));
app.use('/api/analytics',    require('./routes/analyticsRoutes'));
app.use('/api/achievements', require('./routes/achievementRoutes'));
app.use('/api/suggestions',  require('./routes/suggestionRoutes'));
app.use('/api/admin',        require('./routes/adminRoutes'));
app.use('/api/dashboard',    require('./routes/dashboardRoutes'));  // v7.0
app.use('/api/meetings',     require('./routes/meetingRoutes'));       // v7.0 meetings
app.use('/api/cab',          require('./routes/cabRoutes'));           // v7.0 cab booking

// ── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => res.json({
  message: 'Workforce Intelligence API v7.0 ✅',
  version: '7.0.0',
  status: 'running',
  new_in_v7: ['Socket.io real-time','Redis cache','Role dashboards','PDF payslips','Attrition AI']
}));

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

module.exports = app;
