const express = require('express');
const router = express.Router();
const { getDashboardMetrics, generateParcelReport, getAnalytics, getAssignmentMetrics, activateUser, deactivateUser, verifyUser, unverifyUser } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');

router.get('/dashboard/metrics', protect, isAdmin, getDashboardMetrics);
router.get('/reports/parcels', protect, isAdmin, generateParcelReport);
router.get('/analytics', protect, isAdmin, getAnalytics);
router.get('/assignment/metrics', protect, isAdmin, getAssignmentMetrics);
router.put('/users/:id/activate', protect, isAdmin, activateUser);
router.put('/users/:id/deactivate', protect, isAdmin, deactivateUser);
router.put('/users/:id/verify', protect, isAdmin, verifyUser);
router.put('/users/:id/unverify', protect, isAdmin, unverifyUser);

module.exports = router;