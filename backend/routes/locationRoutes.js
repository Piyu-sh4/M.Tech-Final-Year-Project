const router = require('express').Router();
const ctrl   = require('../controllers/locationController');
const protect = require('../middleware/authMiddleware');
const { staffOrAbove,hrOrAbove } = require('../middleware/authMiddleware');

// Session recording (called after login)
router.post('/session',          protect, ctrl.recordLoginLocation);
router.post('/logout',           protect, ctrl.recordLogout);

// Weather & location data
router.get('/me',                protect, ctrl.getMyLocation);
router.get('/live',              protect, ctrl.getLiveWeather);
router.get('/weather-widget',    protect, ctrl.getWeatherWidget);

// Preferences (on/off, manual override, temp unit)
router.patch('/preferences',     protect, ctrl.updatePreferences);

// Session history — MUST be before /sessions (which has no :id param)
router.get('/sessions/all',      protect, hrOrAbove, ctrl.getAllSessions);
router.get('/sessions',          protect, ctrl.getMySessions);

// Office detection
router.get('/offices',           protect, ctrl.getOffices);
router.post('/detect-office',    protect, ctrl.detectOffice);

module.exports = router;
