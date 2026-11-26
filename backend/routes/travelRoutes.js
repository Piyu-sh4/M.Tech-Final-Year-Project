const r = require('express').Router(), c = require('../controllers/travelController');
const p = require('../middleware/authMiddleware');
const { staffOrAbove, hrOrAbove } = require('../middleware/authMiddleware');

// Travel Requests
r.get('/requests/my',            p,               c.getMyTravelRequests);
r.get('/requests',               p, staffOrAbove, c.getAllTravelRequests);
r.post('/requests',              p,               c.createTravelRequest);
r.post('/requests/:id/cancel',   p,               c.cancelTravelRequest);
r.patch('/requests/:id',         p, staffOrAbove, c.reviewTravelRequest);

// Expense Claims — static routes BEFORE dynamic /:id
r.get('/expenses/my',            p,               c.getMyExpenses);
r.get('/expenses/summary',       p, hrOrAbove, c.getExpenseSummary);   // ← moved up
r.get('/expenses',               p, staffOrAbove, c.getAllExpenses);
r.post('/expenses',              p,               c.submitExpenseClaim);
r.patch('/expenses/:id',         p, staffOrAbove, c.reviewExpenseClaim);

// Reimbursement Batches
r.get('/batches',                p, hrOrAbove, c.getReimbursementBatches);
r.post('/batches',               p, hrOrAbove, c.createReimbursementBatch);
r.post('/batches/:id/process',   p, hrOrAbove, c.processBatch);

module.exports = r;
