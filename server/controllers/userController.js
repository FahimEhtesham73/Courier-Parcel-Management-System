const User = require('../models/User'); // CommonJS
const asyncHandler = require('express-async-handler');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }

  try {
    const { role } = req.query;
    let filter = {};
    if (role) {
      filter = { role };
    }
    const users = await User.find(filter).select('-password'); // Exclude password
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Update delivery agent current location
// @route   PUT /api/users/location
// @access  Private (Delivery Agent only)
const updateAgentLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;

  // Ensure the logged-in user is a Delivery Agent
  if (req.user.role !== 'Delivery Agent') {
    res.status(403);
    throw new Error('Not authorized to update location');
  }

  const user = await User.findById(req.user._id);

  if (user) {
    user.currentLocation = { latitude, longitude };
    await user.save();

    // Emit Socket.IO event with the updated location (if socket.io is available)
    if (req.app.get('socketio')) {
      // Notify customers with parcels assigned to this agent
      const Parcel = require('../models/Parcel');
      const parcels = await Parcel.find({
        assignedAgent: user._id,
        status: { $in: ['Picked Up', 'In Transit'] }
      });
      
      parcels.forEach(parcel => {
        req.app.get('socketio').to(`customer-${parcel.customer}`).emit('agentLocationUpdate', {
          parcelId: parcel._id,
          agentId: user._id,
          agentLocation: user.currentLocation
        });
      });
      
      // Notify admins
      req.app.get('socketio').to('admins').emit('agentLocationUpdate', {
        agentId: user._id,
        location: user.currentLocation
      });
    }

    res.json({ 
      message: 'Location updated successfully',
      currentLocation: user.currentLocation,
      _id: user._id
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user location by ID
// @route   GET /api/users/:id/location
// @access  Private
const getUserLocation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('currentLocation username email role');

  if (user) {
    res.json({
      currentLocation: user.currentLocation,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = { getAllUsers, updateAgentLocation, getUserLocation };
