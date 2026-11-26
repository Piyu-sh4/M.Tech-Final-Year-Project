/**
 * letterRoutes.js — HR Letter Generation
 * GET  /api/letters/employees?q=   — search employees
 * POST /api/letters/generate       — generate a letter (HR only)
 * GET  /api/letters                — list all letters (HR)
 * GET  /api/letters/my             — employee's own letters
 */
const router = require('express').Router();
const c      = require('../controllers/letterController');
const { protect, hrOrAbove } = require('../middleware/authMiddleware');

router.get('/employees',  protect, hrOrAbove, c.searchEmployees);
router.post('/generate',  protect, hrOrAbove, c.generateLetter);
router.get('/my',         protect,            c.myLetters);
router.get('/',           protect, hrOrAbove, c.listLetters);

module.exports = router;
