const router  = require('express').Router();
const ctrl    = require('../controllers/gradesController');
const protect = require('../middleware/authMiddleware');
const { adminOnly, staffOrAbove, hrOrAbove } = require('../middleware/authMiddleware');
const audit   = require('../middleware/auditMiddleware');

// Grades
router.get('/my',                    protect, ctrl.getMyGrade);
router.get('/user/:userId',          protect, staffOrAbove, ctrl.getUserGrade);
router.get('/',                      protect, staffOrAbove, ctrl.getAllGrades);
router.post('/',                     protect, staffOrAbove, audit('ASSIGN_GRADE','employee_grades'), ctrl.assignGrade);
router.put('/:id',                   protect, staffOrAbove, audit('UPDATE_GRADE','employee_grades'), ctrl.updateGrade);

// Promotions
router.get('/promotions/my',         protect, ctrl.getMyPromotions);
router.get('/promotions',            protect, staffOrAbove, ctrl.getAllPromotions);
router.post('/promotions',           protect, staffOrAbove, audit('REQUEST_PROMOTION','promotions'), ctrl.requestPromotion);
router.patch('/promotions/:id/review', protect, hrOrAbove, audit('REVIEW_PROMOTION','promotions'), ctrl.reviewPromotion);

// Skills
router.get('/skills/all',            protect, ctrl.getAllSkills);
router.get('/skills/my',             protect, ctrl.getMySkills);
router.post('/skills',               protect, audit('UPSERT_SKILL','skill_assessments'), ctrl.upsertSkill);
router.patch('/skills/:id/verify',   protect, staffOrAbove, ctrl.verifySkill);

// Certifications
router.get('/certifications/my',     protect, ctrl.getMyCerts);
router.post('/certifications',       protect, audit('ADD_CERT','certifications'), ctrl.addCert);
router.delete('/certifications/:id', protect, ctrl.deleteCert);

module.exports = router;
