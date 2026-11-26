const express = require('express');
const router  = express.Router();
const protect = require('../middleware/authMiddleware');
const m = require('../controllers/meetingController');

router.get('/invitees', protect, async (request,response,next) => {
  try {
    const {query} = require('../services/database');
    response.json(await query(require('../config/db'),
      "SELECT colleague.user_id,colleague.full_name FROM users colleague JOIN users actor ON actor.user_id=? WHERE colleague.status='active' AND colleague.company_id <=> actor.company_id AND colleague.user_id<>actor.user_id ORDER BY colleague.full_name LIMIT 500",
      [request.user.user_id]));
  } catch (error) { next(error); }
});
router.get('/rooms',                   protect, m.getRooms);
router.get('/',                        protect, m.getMeetings);
router.post('/',                       protect, m.createMeeting);
router.post('/join-by-code',           protect, m.joinByCode);
const meetingAccess = require('../services/meetingAccess');
const { hostOnly } = meetingAccess;
router.use('/:id', protect, meetingAccess);
router.delete('/:id',                   hostOnly, m.cancelMeeting);
router.patch('/:id/reschedule',         hostOnly, m.rescheduleMeeting);
router.get('/:id',                     m.getMeeting);
router.patch('/:id',                   hostOnly, m.updateMeeting);
router.post('/:id/start',              hostOnly, m.startMeeting);
router.post('/:id/end',                hostOnly, m.endMeeting);
router.post('/:id/join',               m.joinMeeting);
router.post('/:id/leave',              m.leaveMeeting);
router.patch('/:id/media',             m.updateMedia);
router.get('/:id/messages',            m.getMessages);
router.post('/:id/messages',           m.sendMessage);
router.post('/:id/notes',              m.addNote);
router.get('/:id/report',              m.getReport);
router.post('/:id/report/regenerate',  hostOnly, m.regenerateReport);

module.exports = router;
