/**
 * hiringRoutes.js — v12.0
 * Full Hiring Pipeline Routes
 */
const router  = require('express').Router();
const ctrl    = require('../controllers/hiringController');
const protect = require('../middleware/authMiddleware');
const { adminOnly, hrOrAbove, staffOrAbove } = require('../middleware/authMiddleware');
const audit   = require('../middleware/auditMiddleware');

/* ── Hiring Stats Dashboard ──────────────────────── */
router.get('/stats',                      protect, staffOrAbove, ctrl.getHiringStats);

/* ── Job Postings ────────────────────────────────── */
router.get('/jobs',                       protect, ctrl.getJobs);
router.get('/jobs/:id',                   protect, ctrl.getJob);
router.post('/jobs',                      protect, hrOrAbove, audit('CREATE_JOB','job_postings'), ctrl.createJob);
router.patch('/jobs/:id',                 protect, hrOrAbove, audit('UPDATE_JOB','job_postings'), ctrl.updateJob);
router.delete('/jobs/:id',                protect, hrOrAbove, audit('DELETE_JOB','job_postings'), ctrl.deleteJob);

/* ── Candidates ──────────────────────────────────── */
router.get('/candidates',                 protect, staffOrAbove, ctrl.getCandidates);
router.get('/candidates/:id',             protect, staffOrAbove, ctrl.getCandidate);
router.post('/candidates',                protect, staffOrAbove, audit('ADD_CANDIDATE','candidates'), ctrl.addCandidate);
router.patch('/candidates/:id/status',    protect, staffOrAbove, audit('UPDATE_CANDIDATE_STATUS','candidates'), ctrl.updateCandidateStatus);

/* ── Interviews ──────────────────────────────────── */
router.get('/interviews',                 protect, ctrl.getInterviews);
router.post('/interviews',                protect, staffOrAbove, audit('SCHEDULE_INTERVIEW','interview_rounds'), ctrl.scheduleInterview);
router.patch('/interviews/:id/feedback',  protect, audit('SUBMIT_FEEDBACK','interview_rounds'), ctrl.submitInterviewFeedback);

/* ── Offer Letters ───────────────────────────────── */
router.get('/offers',                     protect, hrOrAbove, ctrl.getOffers);
router.post('/offers',                    protect, hrOrAbove, audit('GENERATE_OFFER','offer_letters'), ctrl.generateOffer);
router.patch('/offers/:id/status',        protect, hrOrAbove, audit('UPDATE_OFFER','offer_letters'), ctrl.updateOfferStatus);

/* ── Employee Referrals ──────────────────────────── */
router.get('/referrals/my',               protect, ctrl.getMyReferrals);
router.get('/referrals',                  protect, staffOrAbove, ctrl.getAllReferrals);
router.post('/referrals',                 protect, audit('SUBMIT_REFERRAL','employee_referrals'), ctrl.submitReferral);

/* ── Candidate Documents ─────────────────────────── */
router.get('/candidates/:id/documents',   protect, staffOrAbove, ctrl.getCandidateDocs);
router.post('/documents',                 protect, staffOrAbove, ctrl.uploadDoc);
router.patch('/documents/:docId/verify',  protect, hrOrAbove, ctrl.verifyDoc);

module.exports = router;
