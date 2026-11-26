const router=require('express').Router(),ctrl=require('../controllers/helpdeskController');
const protect=require('../middleware/authMiddleware');
const {staffOrAbove}=require('../middleware/authMiddleware');
const audit=require('../middleware/auditMiddleware');

// Static routes first (must be before /:id wildcard)
router.get('/stats',          protect, staffOrAbove, ctrl.getStats);
router.get('/sla',            protect, ctrl.getSLA);
router.get('/kb',             protect, ctrl.getKBArticles);
router.post('/kb',            protect, staffOrAbove, ctrl.createKBArticle);
router.post('/kb/:id/rate',   protect, ctrl.rateKBArticle);

// My tickets
router.get('/my',             protect, ctrl.getMyTickets);
router.post('/my/:id/close',  protect, audit('CLOSE_OWN_TICKET','helpdesk_tickets'), ctrl.closeMyTicket);

// CRUD
router.get('/',               protect, staffOrAbove, ctrl.getAllTickets);
router.post('/',              protect, audit('CREATE_TICKET','helpdesk_tickets'), ctrl.create);

// Wildcard /:id routes last
router.patch('/:id',          protect, staffOrAbove, audit('UPDATE_TICKET','helpdesk_tickets'), ctrl.update);
router.get('/:id/comments',   protect, ctrl.accessTicket, ctrl.getComments);
router.post('/:id/comments',  protect, ctrl.accessTicket, ctrl.addComment);
router.post('/:id/escalate',  protect, staffOrAbove, ctrl.escalateTicket);

module.exports=router;
