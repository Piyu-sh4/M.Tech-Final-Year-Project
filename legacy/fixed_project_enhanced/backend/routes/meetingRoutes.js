const express = require('express');
const router  = express.Router();
const protect = require('../middleware/authMiddleware');
const m = require('../controllers/meetingController');

router.get('/rooms',                   protect, m.getRooms);
router.get('/',                        protect, m.getMeetings);
router.post('/',                       protect, m.createMeeting);
router.post('/join-by-code',           protect, m.joinByCode);
router.get('/:id',                     protect, m.getMeeting);
router.patch('/:id',                   protect, m.updateMeeting);
router.post('/:id/start',              protect, m.startMeeting);
router.post('/:id/end',                protect, m.endMeeting);
router.post('/:id/join',               protect, m.joinMeeting);
router.post('/:id/leave',              protect, m.leaveMeeting);
router.patch('/:id/media',             protect, m.updateMedia);
router.get('/:id/messages',            protect, m.getMessages);
router.post('/:id/messages',           protect, m.sendMessage);
router.post('/:id/notes',              protect, m.addNote);
router.get('/:id/report',              protect, m.getReport);
router.post('/:id/report/regenerate',  protect, m.regenerateReport);

module.exports = router;
