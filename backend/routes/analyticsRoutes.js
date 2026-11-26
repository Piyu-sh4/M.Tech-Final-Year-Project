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
const { hrOrAbove, staffOrAbove } = require('../middleware/authMiddleware');

// ── Existingroutes ──────────────────────────────────────────────
router.get('/daily',      protect, staffOrAbove, analytics.getDailyTrend);
router.get('/weekly',     protect, staffOrAbove, analytics.getWeeklyTrend);
router.get('/monthly',    protect, staffOrAbove, analytics.getMonthlyTrend);
router.get('/annual',     protect, staffOrAbove, analytics.getAnnualTrend);
router.get('/performers', protect, staffOrAbove, analytics.getTopPerformers);
router.get('/summary',    protect, staffOrAbove, analytics.getSummaryStats);
router.get('/hr-summary', protect, hrOrAbove, analytics.getHRSummaryStats);

// ── NEW: Attrition risk model (all employees) ────────────────────
// Requires Python service running: python attrition_model.py
router.get('/attrition',           protect, hrOrAbove, analytics.getAttritionRisk);
router.get('/attrition/:user_id',  protect, hrOrAbove, analytics.getAttritionRisk);

module.exports = router;
