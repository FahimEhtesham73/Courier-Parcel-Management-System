const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming your User model is in ../models/User

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const isDeliveryAgent = (req, res, next) => {
  if (req.user && req.user.role === 'Delivery Agent') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a delivery agent' });
  }
};

const isCustomer = (req, res, next) => {
  if (req.user && req.user.role === 'Customer') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a customer' });
  }
};

module.exports = { protect, isAdmin, isDeliveryAgent, isCustomer };