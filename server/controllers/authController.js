require('dotenv').config(); // Load environment variables from .env
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password, role, phone } = req.body;
    
    // Accessing admin email from environment variables (for demonstration and initial setup, NOT for direct authentication)
    const adminEmail = process.env.ADMIN_EMAIL;
    console.log(`Admin Email from .env: ${adminEmail}`);

    // Check if user already exists by email or username
    let existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'A user with this username already exists' });
      }
    }

    const user = new User({
      username,
      email,
      password, // Password hashing is handled in the User model's pre-save hook
      role,
      phone,
    });

    await user.save();

    // Generate JWT token for immediate login after registration
    const payload = {
      id: user.id,
      role: user.role,
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        } 
      });
    });
  } catch (err) {
    console.error(err.message);
    
    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const message = field === 'email' 
        ? 'A user with this email already exists'
        : field === 'username'
        ? 'A user with this username already exists'
        : 'User already exists';
      return res.status(400).json({ message });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let user = await User.findOne({ email });

    if (!user) {
      const error = new Error('Invalid Credentials');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Throw an error instead of sending a direct response
      const error = new Error('Invalid Credentials');
      error.statusCode = 400;
      throw error;
    }

    const payload = {
      id: user.id,
      role: user.role,
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateDetails = async (req, res) => {
  const { username, email, phone } = req.body;
  const userFields = { username, email, phone };

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    await user.remove();

    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};