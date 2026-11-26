/**
 * analyticsController.js — v7.0 (4th Semester) — with Redis caching
 * ════════════════════════════════════════════════════════════════════
 * Wraps every expensive analytics query with cache.wrap() so that
 * repeated dashboard loads serve from Redis instead of MySQL.
 *
 * Cache invalidation:
 *   - POST /api/tasks        → invalidate 'analytics:*'
 *   - PATCH /api/tasks/:id   → invalidate 'analytics:*'
 *   - POST /api/admin/salary/generate → invalidate 'analytics:hr_summary'
 *
 * Routes (unchanged from v6.0):
 *   GET /api/analytics/daily
 *   GET /api/analytics/weekly
 *   GET /api/analytics/monthly
 *   GET /api/analytics/annual
 *   GET /api/analytics/performers
 *   GET /api/analytics/summary
 *   GET /api/analytics/hr-summary
 *   GET /api/analytics/attrition   ← NEW (proxies Python microservice)
 */

const analytics = require('../services/analyticsService');
const cache     = require('../services/cacheService');

// ── Generic cached wrapper ─────────────────────────────────────────────
function cached(cacheKey, ttl, fn) {
  return async (req, res) => {
    try {
      // Allow ?refresh=1 to bypass cache (admin debugging)
      if (req.query.refresh === '1') await cache.del(cacheKey);

      const data = await cache.wrap(cacheKey, ttl, fn);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };
}

exports.getDailyTrend = cached(
  'analytics:daily',
  cache.TTL.KPI_TRENDS,
  () => analytics.getDailyTrend()
);

exports.getWeeklyTrend = cached(
  'analytics:weekly',
  cache.TTL.KPI_TRENDS,
  () => analytics.getWeeklyTrend()
);

exports.getMonthlyTrend = cached(
  'analytics:monthly',
  cache.TTL.KPI_TRENDS,
  () => analytics.getMonthlyTrend()
);

exports.getAnnualTrend = cached(
  'analytics:annual',
  cache.TTL.KPI_TRENDS,
  () => analytics.getAnnualTrend()
);

exports.getTopPerformers = cached(
  'analytics:performers',
  cache.TTL.TOP_PERFORMERS,
  () => analytics.getTopPerformers()
);

exports.getSummaryStats = cached(
  'analytics:summary',
  cache.TTL.HR_SUMMARY,
  () => analytics.getSummaryStats()
);

exports.getHRSummaryStats = cached(
  'analytics:hr_summary',
  cache.TTL.HR_SUMMARY,
  () => analytics.getHRSummaryStats()
);

// ── NEW: Attrition risk (proxies Python Flask microservice) ───────────
exports.getAttritionRisk = async (req, res) => {
  try {
    const userId   = req.params.user_id;
    const url      = userId
      ? `http://localhost:5050/attrition/${userId}`
      : `http://localhost:5050/attrition`;
    const cacheKey = userId ? `analytics:attrition:${userId}` : 'analytics:attrition';

    const data = await cache.wrap(cacheKey, cache.TTL.ATTRITION, async () => {
      // Use Node.js built-in http module for compatibility
      return new Promise((resolve, reject) => {
        const http = require('http');
        http.get(url, (resp) => {
          let raw = '';
          resp.on('data', d => raw += d);
          resp.on('end', () => {
            try { resolve(JSON.parse(raw)); }
            catch(e) { reject(new Error('Invalid JSON from attrition service')); }
          });
        }).on('error', reject);
      });
    });

    res.json(data);
  } catch (e) {
    res.status(503).json({
      error:  'Attrition model service unavailable',
      hint:   'Start Python microservice: python attrition_model.py',
      detail: e.message
    });
  }
};

// ── Cache invalidation helper (called from taskController, adminController) ──
exports.invalidateAnalyticsCache = async () => {
  await cache.invalidate('analytics:*');
};
