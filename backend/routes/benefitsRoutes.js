const router  = require('express').Router();
const ctrl    = require('../controllers/benefitsController');
const protect = require('../middleware/authMiddleware');
const { hrOrAbove } = require('../middleware/authMiddleware');
const audit   = require('../middleware/auditMiddleware');

// Insurance plans
router.get('/plans',                 protect, ctrl.getPlans);
router.post('/plans',                protect, hrOrAbove, audit('CREATE_PLAN','insurance_plans'), ctrl.createPlan);
router.put('/plans/:id',             protect, hrOrAbove, audit('UPDATE_PLAN','insurance_plans'), ctrl.updatePlan);

// Employee benefits
router.get('/summary',               protect, ctrl.getBenefitsSummary);
router.get('/my',                    protect, ctrl.getMyBenefits);
router.get('/user/:userId',          protect, hrOrAbove, ctrl.getUserBenefits);
router.get('/',                      protect, hrOrAbove, ctrl.getAllBenefits);
router.post('/enroll',               protect, audit('ENROLL_BENEFIT','employee_benefits'), ctrl.enrollBenefit);
router.put('/:id',                   protect, audit('UPDATE_BENEFIT','employee_benefits'), ctrl.updateBenefit);
router.patch('/:id/cancel',          protect, audit('CANCEL_BENEFIT','employee_benefits'), ctrl.cancelBenefit);

// Dependents
router.get('/dependents',            protect, ctrl.getMyDependents);
router.post('/dependents',           protect, audit('ADD_DEPENDENT','dependent_members'), ctrl.addDependent);
router.put('/dependents/:id',        protect, audit('UPDATE_DEPENDENT','dependent_members'), ctrl.updateDependent);
router.delete('/dependents/:id',     protect, ctrl.removeDependent);

module.exports = router;
