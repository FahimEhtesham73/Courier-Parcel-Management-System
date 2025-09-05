const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { upload, convertToBase64 } = require('../middleware/upload');
const {
  submitVerification,
  getVerificationStatus,
  getAllVerifications,
  reviewVerification,
  getAgentVerification
} = require('../controllers/agentVerificationController');

// @desc    Submit agent verification documents
// @route   POST /api/agent-verification/submit
// @access  Private (Delivery Agent only)
router.post('/submit', protect, upload.fields([
  { name: 'nidFront', maxCount: 1 },
  { name: 'nidBack', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'drivingLicense', maxCount: 1 }
]), convertToBase64, submitVerification);

// @desc    Get agent's verification status
// @route   GET /api/agent-verification/status
// @access  Private (Delivery Agent only)
router.get('/status', protect, getAgentVerification);

// @desc    Get all verification requests (Admin only)
// @route   GET /api/agent-verification/all
// @access  Private (Admin only)
router.get('/all', protect, isAdmin, getAllVerifications);

// @desc    Review verification request (Admin only)
// @route   PUT /api/agent-verification/review/:id
// @access  Private (Admin only)
router.put('/review/:id', protect, isAdmin, reviewVerification);

module.exports = router;