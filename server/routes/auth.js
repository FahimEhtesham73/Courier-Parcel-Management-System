const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have this middleware
const { check } = require('express-validator');

// @route POST /api/auth/register
// @desc Register user
// @access Public
router.post('/register', [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role is required').not().isEmpty(),
    check('role').isIn(['Admin', 'Delivery Agent', 'Customer']).withMessage('Invalid role'),
], authController.register);

// @route POST /api/auth/login
// @desc Authenticate user and get token
// @access Public
router.post('/login', [
    check('email', 'Please include a valid email').isEmail().notEmpty(),
    check('password', 'Password is required').notEmpty()
], authController.login);

// @route GET /api/auth/me
// @desc Get current user profile
// @access Private
router.get('/me', protect, authController.getMe);

// @route PUT /api/auth/updatedetails
// @desc Update user profile
// @access Private
router.put('/updatedetails', protect, authController.updateDetails);

// @route DELETE /api/auth/delete
// @desc Delete user account
// @access Private
router.delete('/delete', protect, authController.deleteUser);

module.exports = router;
