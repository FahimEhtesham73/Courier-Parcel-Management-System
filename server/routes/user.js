const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Assuming your protect middleware is in authMiddleware.js
const { getAllUsers, updateAgentLocation, getUserLocation } = require('../controllers/userController');
const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only initially, will add role check later)
router.get('/', protect, getAllUsers);

// @desc    Update agent's current location
// @route   PUT /api/users/location
// @access  Private (Delivery Agent only)
router.put('/location', protect, updateAgentLocation);

// @desc    Get user location by ID
// @route   GET /api/users/:id/location
// @access  Private
router.get('/:id/location', protect, getUserLocation);

module.exports = router;