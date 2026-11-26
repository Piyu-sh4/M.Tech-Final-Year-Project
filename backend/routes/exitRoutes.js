const { userScope } = require('../middleware/userScope');
const r = require('express').Router(), c = require('../controllers/exitController');
const p = require('../middleware/authMiddleware');
const { staffOrAbove, hrOrAbove } = require('../middleware/authMiddleware');
const audit = require('../middleware/auditMiddleware');

// Employee self-service
r.post('/resign',                    p,               c.submitResignation);
r.get('/my-resignation',             p,               c.getMyResignation);
r.post('/withdraw',                  p,               c.withdrawResignation);
r.post('/exit-interview',            p,               c.submitExitInterview);

// Checklist  ← static before dynamic
r.get('/checklist/my',               p,               (req,res) => { req.params.user_id = req.user.user_id; c.getChecklist(req,res); });
r.patch('/checklist/item',           p,               c.completeChecklistItem);
r.get('/checklist/:user_id',         p, userScope('user_id', { allowStaff: true }), c.getChecklist);

// FnF  ← static before dynamic
r.post('/fnf/approve',               p, hrOrAbove,    c.approveFnF);
r.post('/fnf/disburse',              p, hrOrAbove,    c.disburseFnF);
r.get('/fnf/:user_id',               p, hrOrAbove,    c.calculateFnF);

// BGV  ← /bgv/ID/consent before /bgv
r.post('/bgv/:id/consent',           p,               c.consentBGV);
r.patch('/bgv/:id/complete',         p, hrOrAbove,    c.completeBGV);
r.post('/bgv',                       p, hrOrAbove,    c.submitBGVRequest);

// Documents & Dashboard  ← static before dynamic
r.post('/document',                  p, hrOrAbove,    c.generateExitDocument);
r.get('/dashboard',                  p, hrOrAbove, c.getExitDashboard);
r.get('/all',                        p, staffOrAbove, c.getAllResignations);

// HR actions
r.post('/manager-acknowledge',       p, staffOrAbove, c.managerAcknowledge);
r.post('/hr-approve',                p, hrOrAbove,    c.hrApprove);

module.exports = r;
