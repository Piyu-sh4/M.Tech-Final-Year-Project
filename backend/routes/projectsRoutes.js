const r = require('express').Router();
const c = require('../controllers/projectsController');
const p = require('../middleware/authMiddleware');
const { staffOrAbove, hrOrAbove } = require('../middleware/authMiddleware');
const audit = require('../middleware/auditMiddleware');

r.get('/stats',                         p,               c.getStats);
r.get('/my',                            p,               c.getMyProjects);
r.get('/',                              p,               c.getAll);
r.get('/:id',                           p,               c.getOne);
r.post('/',                             p, staffOrAbove, audit('CREATE_PROJECT','projects'), c.create);
r.patch('/:id',                         p, hrOrAbove, audit('UPDATE_PROJECT','projects'), c.update);
r.delete('/:id',                        p, hrOrAbove, c.remove);
r.post('/:id/members',                  p, staffOrAbove, c.addMember);
r.delete('/:id/members/:userId',        p, staffOrAbove, c.removeMember);
r.post('/:id/milestones',               p, staffOrAbove, c.addMilestone);
r.patch('/:id/milestones/:milestoneId', p, staffOrAbove, c.updateMilestone);
module.exports = r;
