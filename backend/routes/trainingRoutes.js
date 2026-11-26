const router = require('express').Router();
const training = require('../controllers/trainingController');
const certificates = require('../services/certificateRegister');
const { protect, hrOrAbove } = require('../middleware/authMiddleware');
const audit = require('../middleware/auditMiddleware');

const handle = handler => (request, response, next) => handler(request, response).catch(next);

router.use(protect);
router.get('/stats', hrOrAbove, handle(training.getStats));
router.get('/skills', hrOrAbove, handle(training.getSkills));
router.get('/courses', handle(training.getCourses));
router.get('/courses/:courseId/study-guide', handle(training.downloadStudyGuide));
router.get('/my', handle(training.getMyEnrollments));
router.get('/all-enrollments', hrOrAbove, handle(training.getAllEnrollments));
router.post('/courses', hrOrAbove, audit('CREATE_COURSE', 'training_courses'), handle(training.createCourse));
router.patch('/courses/:courseId', hrOrAbove, audit('UPDATE_COURSE', 'training_courses'), handle(training.updateCourse));
router.put('/courses/:courseId/assessment', hrOrAbove, handle(training.publishAssessment));
router.get('/my/:courseId/assessment', handle(training.getAssessment));
router.post('/my/:courseId/assessment', handle(training.submitAssessment));
router.post('/enroll', audit('ENROLL_COURSE', 'training_enrollments'), handle(training.enroll));
router.patch('/progress/:courseId', handle(training.updateProgress));
router.delete('/my/:courseId', handle(training.withdraw));
router.get('/certificate-register/my', handle(certificates.listOwn));
router.get('/certificate-register/review', hrOrAbove, handle(certificates.listForReview));
router.get('/certificate-register/review/:enrollmentId/pdf', hrOrAbove, handle(training.downloadReviewedCertificate));
router.post('/certificate-register/my/:enrollmentId/correction', handle(certificates.requestCorrection));
router.patch('/certificate-register/review/:enrollmentId', hrOrAbove, handle(certificates.decide));
router.post('/certificates/:enrollmentId', hrOrAbove, handle(training.issueCertificate));
router.get('/certificates/:enrollmentId', handle(training.downloadCertificate));

module.exports = router;
