/**
 * analyticsRoutes.js — v7.0  (replaces v6.0 version)
 * ════════════════════════════════════════════════════
 * All v6.0 routes preserved + new attrition endpoint.
 * Analytics responses are served from Redis cache (TTL per endpoint).
 *
 * GET /api/analytics/daily
 * GET /api/analytics/weekly
 * GET /api/analytics/monthly
 * GET /api/analytics/annual
 * GET /api/analytics/performers
 * GET /api/analytics/summary
 * GET /api/analytics/hr-summary
 * GET /api/analytics/attrition          ← NEW v7.0 (proxies Python service)
 * GET /api/analytics/attrition/:user_id ← NEW v7.0 (single employee)
 */

const router    = require('express').Router();
const analytics = require('../controllers/analyticsController');
const protect   = require('../middleware/authMiddleware');
const { adminOnly, staffOrAbove } = require('../middleware/authMiddleware');

// ── Existing v6.0 routes ──────────────────────────────────────────────
router.get('/daily',      protect, analytics.getDailyTrend);
router.get('/weekly',     protect, analytics.getWeeklyTrend);
router.get('/monthly',    protect, analytics.getMonthlyTrend);
router.get('/annual',     protect, analytics.getAnnualTrend);
router.get('/performers', protect, analytics.getTopPerformers);
router.get('/summary',    protect, analytics.getSummaryStats);
router.get('/hr-summary', protect, analytics.getHRSummaryStats);

// ── NEW v7.0: Attrition risk model (all employees) ────────────────────
// Requires Python service running: python attrition_model.py
router.get('/attrition',           protect, staffOrAbove, analytics.getAttritionRisk);
router.get('/attrition/:user_id',  protect, staffOrAbove, analytics.getAttritionRisk);

module.exports = router;
