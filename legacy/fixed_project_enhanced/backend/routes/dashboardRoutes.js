/**
 * dashboardRoutes.js — v7.0 Role-Based Dashboard Routes
 * ═══════════════════════════════════════════════════════
 * GET /api/dashboard          → auto-routes by role (Admin/Employee/Manager/HR)
 * GET /api/dashboard/widgets  → returns widget layout config for this role
 */

const router     = require('express').Router();
const dashboard  = require('../controllers/dashboardController');
const protect    = require('../middleware/authMiddleware');

router.get('/',        protect, dashboard.getDashboard);
router.get('/widgets', protect, dashboard.getWidgetLayout);

module.exports = router;
