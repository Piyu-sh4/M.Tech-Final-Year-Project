/**
 * app.js — Express Application
 * The UI uses the same origin as the API. Set CORS_ORIGIN for a separate frontend.
 */
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const security = require('./middleware/securityMiddleware');

const app = express();
app.disable('x-powered-by');
app.use(require('compression')());

// ── CORS ────────────────────────────────────────────────────────────
const corsOptions = {
  origin:         process.env.CORS_ORIGIN || false,
  methods:        ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials:    false,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Middleware ──────────────────────────────────────────────────────
app.use(security.securityHeaders);
app.use(require('./middleware/demoAccess').middleware);
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use(security.sanitizeInputs);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', (request, response) =>
  response.status(401).json({ message: 'Use an authenticated download action.' }));

// ── Serve frontend HTML at root ─────────────────────────────────────
// http://localhost:5000/login.html works directly
const frontend = path.join(__dirname, '../frontend');
const catalog = require('./config/moduleCatalog');
app.get('/showcase.html', (req,res) => res.redirect('/modules.html'));
app.get(['/modules.html', ...Object.keys(catalog).map(slug => '/' + slug + '.html')], (req, res) =>
  res.sendFile(path.join(frontend, 'modules.html')));
// Serve the bundled spreadsheet writer only when a user chooses Excel export.
app.get('/vendor/xlsx.js', (request, response) =>
  response.sendFile(require.resolve('xlsx/dist/xlsx.mini.min.js')));
app.use(express.static(frontend));

// ── API Routes ──────────────────────────────────────────────────────
app.use('/api/manager',require('./routes/managerRoutes'));
app.use('/api/record-pdf', require('./routes/recordPdfRoutes'));
app.use('/api/modules', require('./routes/moduleRoutes'));
app.use('/api/passkeys', require('./routes/passkeyRoutes'));
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/tasks',         require('./routes/taskRoutes'));
app.use('/api/reports',       require('./routes/reportRoutes'));
app.use('/api/chat',          require('./routes/chatRoutes'));
app.use('/api/upload',        require('./routes/uploadRoutes'));
app.use('/api/analytics',     require('./routes/analyticsRoutes'));
app.use('/api/achievements',  require('./routes/achievementRoutes'));
app.use('/api/suggestions',   require('./routes/suggestionRoutes'));
app.use('/api/build-requests', require('./routes/buildRequestRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));
app.use('/api/dashboard',     require('./routes/dashboardRoutes'));
app.use('/api/meetings',      require('./routes/meetingRoutes'));
app.use('/api/cab',           require('./routes/cabRoutes'));
app.use('/api/settings',      require('./routes/settingsRoutes'));
app.use('/api/tax',           require('./routes/taxRoutes'));
app.use('/api/loans',         require('./routes/loanRoutes'));
app.use('/api/safety',        require('./routes/safetyRoutes'));
app.use('/api/grades',        require('./routes/gradesRoutes'));
app.use('/api/transfers',     require('./routes/transferRoutes'));
app.use('/api/benefits',      require('./routes/benefitsRoutes'));
app.use('/api/banking',       require('./routes/bankingRoutes'));
app.use('/api/announcements', require('./routes/announcementsRoutes'));
app.use('/api/performance',   require('./routes/performanceRoutes'));
app.use('/api/helpdesk',      require('./routes/helpdeskRoutes'));
app.use('/api/assets',        require('./routes/assetsRoutes'));
app.use('/api/training',      require('./routes/trainingRoutes'));
app.use('/api/onboarding',    require('./routes/onboardingRoutes'));
app.use('/api/hiring',        require('./routes/hiringRoutes'));
app.use('/api/compliance',    require('./routes/complianceRoutes'));
app.use('/api/ai',            require('./routes/aiRoutes'));
app.use('/api/exit',          require('./routes/exitRoutes'));
app.use('/api/travel',        require('./routes/travelRoutes'));
app.use('/api/dependents',    require('./routes/dependentRoutes'));
app.use('/api/recruitment',   require('./routes/recruitmentRoutes'));
app.use('/api/cab-safety',    require('./routes/cabSafetyRoutes'));
app.use('/api/location',      require('./routes/locationRoutes'));
app.use('/api/projects',      require('./routes/projectsRoutes'));
app.use('/api/notifications', require('./routes/notificationsRoutes'));
app.use('/api/documents',     require('./routes/documentsRoutes'));
app.use('/api/policies',      require('./routes/policiesRoutes'));
app.use('/api/letters',       require('./routes/letterRoutes'));

// ── Health check ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const pool = require('./config/db');
  pool.query('SELECT 1', (error) => {
    if (error) {
      console.error('Database health check failed:', error.code);
      return res.status(503).json({ status: 'unhealthy' });
    }
    res.json({ status: 'healthy' });
  });
});

// ── Root info ───────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    message:   'Workforce Intelligence API ✅',
    status:    'running',
    docs:      'http://localhost:5000/login.html',
    health:    'http://localhost:5000/api/health',
    timestamp: new Date().toISOString(),
  });
});

// ── Global error handler (must be LAST) ────────────────────────────
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({message:err.message});
  if (err.status >= 400 && err.status < 500) return res.status(err.status).json({ message: err.message });
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

module.exports = app;
