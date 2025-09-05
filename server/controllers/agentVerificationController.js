const AgentVerification = require('../models/AgentVerification');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { sendAgentVerificationNotification } = require('../utils/notifications');

// @desc    Submit agent verification documents
// @route   POST /api/agent-verification/submit
// @access  Private (Delivery Agent only)
const submitVerification = asyncHandler(async (req, res) => {
  // Check if user is a delivery agent
  if (req.user.role !== 'Delivery Agent') {
    res.status(403);
    throw new Error('Only delivery agents can submit verification documents');
  }

  // Check if verification already exists
  const existingVerification = await AgentVerification.findOne({ agent: req.user._id });
  if (existingVerification) {
    // Allow resubmission if previously rejected
    if (existingVerification.status !== 'Rejected') {
      res.status(400);
      throw new Error('Verification documents already submitted and under review');
    }
    // Delete existing rejected verification to allow resubmission
    await AgentVerification.findByIdAndDelete(existingVerification._id);
  }

  // Get documents from multer upload (files are converted to base64 by middleware)
  const documents = {};
  
  // Handle file uploads from multer
  if (req.files) {
    if (req.files.nidFront && req.files.nidFront[0]) {
      documents.nidFront = `data:${req.files.nidFront[0].mimetype};base64,${req.files.nidFront[0].buffer.toString('base64')}`;
    }
    if (req.files.nidBack && req.files.nidBack[0]) {
      documents.nidBack = `data:${req.files.nidBack[0].mimetype};base64,${req.files.nidBack[0].buffer.toString('base64')}`;
    }
    if (req.files.photo && req.files.photo[0]) {
      documents.photo = `data:${req.files.photo[0].mimetype};base64,${req.files.photo[0].buffer.toString('base64')}`;
    }
    if (req.files.drivingLicense && req.files.drivingLicense[0]) {
      documents.drivingLicense = `data:${req.files.drivingLicense[0].mimetype};base64,${req.files.drivingLicense[0].buffer.toString('base64')}`;
    }
  }
  
  // Parse personal info from JSON string
  let personalInfo;
  try {
    // Check if personalInfo is already an object or if individual fields are sent
    if (req.body.personalInfo) {
      personalInfo = typeof req.body.personalInfo === 'string' 
        ? JSON.parse(req.body.personalInfo) 
        : req.body.personalInfo;
    } else {
      // Handle individual fields sent directly from form
      personalInfo = {
        fullName: req.body.fullName || '',
        nidNumber: req.body.nidNumber || '',
        address: req.body.address || '',
        emergencyContact: {
          name: req.body.emergencyName || '',
          phone: req.body.emergencyPhone || '',
          relation: req.body.emergencyRelation || ''
        }
      };
    }
  } catch (error) {
    // Fallback to direct object structure
    personalInfo = {
      fullName: req.body.fullName || '',
      nidNumber: req.body.nidNumber || '',
      address: req.body.address || '',
      emergencyContact: {
        name: req.body.emergencyName || '',
        phone: req.body.emergencyPhone || '',
        relation: req.body.emergencyRelation || ''
      }
    };
  }

  // Validate required fields
  if (!documents.nidFront || !documents.nidBack || !documents.photo) {
    res.status(400);
    throw new Error('NID front, back, and photo are required');
  }

  if (!personalInfo.fullName || !personalInfo.nidNumber || !personalInfo.address) {
    res.status(400);
    throw new Error('Full name, NID number, and address are required');
  }

  // Validate base64 image format
  const validateBase64Image = (base64String) => {
    return base64String && base64String.startsWith('data:image/');
  };

  if (!validateBase64Image(documents.nidFront) || 
      !validateBase64Image(documents.nidBack) || 
      !validateBase64Image(documents.photo)) {
    res.status(400);
    throw new Error('Invalid image format. Please upload valid image files.');
  }
  
  console.log('Creating verification with documents:', Object.keys(documents));
  console.log('Personal info:', personalInfo);
  
  const verification = await AgentVerification.create({
    agent: req.user._id,
    documents,
    personalInfo,
    status: 'Pending'
  });

  // Notify admins about new verification request
  try {
    const admins = await User.find({ role: 'Admin' });
    for (const admin of admins) {
      await sendAgentVerificationNotification(admin, req.user, 'submitted');
    }
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }

  res.status(201).json({
    message: 'Verification documents submitted successfully',
    verification: {
      _id: verification._id,
      status: verification.status,
      submittedAt: verification.submittedAt
    }
  });
});

// @desc    Get agent's verification status
// @route   GET /api/agent-verification/status
// @access  Private (Delivery Agent only)
const getAgentVerification = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Delivery Agent') {
    res.status(403);
    throw new Error('Only delivery agents can check verification status');
  }

  const verification = await AgentVerification.findOne({ agent: req.user._id })
    .populate('reviewedBy', 'username email');

  if (!verification) {
    return res.status(404).json({
      message: 'No verification documents found',
      hasSubmitted: false
    });
  }

  res.json({
    hasSubmitted: true,
    verification: {
      _id: verification._id,
      status: verification.status,
      submittedAt: verification.submittedAt,
      reviewedAt: verification.reviewedAt,
      reviewedBy: verification.reviewedBy,
      rejectionReason: verification.rejectionReason
    }
  });
});

// @desc    Get all verification requests
// @route   GET /api/agent-verification/all
// @access  Private (Admin only)
const getAllVerifications = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let filter = {};
  
  if (status && status.trim() !== '') {
    filter.status = status;
  }

  console.log('Fetching verifications with filter:', filter);
  
  const verifications = await AgentVerification.find(filter)
    .populate('agent', 'username email phone')
    .populate('reviewedBy', 'username email')
    .sort({ submittedAt: -1 });

  console.log('Found verifications:', verifications.length);
  res.json(verifications);
});

// @desc    Review verification request
// @route   PUT /api/agent-verification/review/:id
// @access  Private (Admin only)
const reviewVerification = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    res.status(400);
    throw new Error('Status must be either Approved or Rejected');
  }

  if (status === 'Rejected' && !rejectionReason) {
    res.status(400);
    throw new Error('Rejection reason is required when rejecting');
  }

  const verification = await AgentVerification.findById(req.params.id)
    .populate('agent', 'username email');

  if (!verification) {
    res.status(404);
    throw new Error('Verification request not found');
  }

  if (verification.status !== 'Pending') {
    res.status(400);
    throw new Error('This verification request has already been reviewed');
  }

  verification.status = status;
  verification.reviewedBy = req.user._id;
  verification.reviewedAt = new Date();
  
  if (status === 'Rejected') {
    verification.rejectionReason = rejectionReason;
  }

  await verification.save();

  // Update agent's verification status in User model
  await User.findByIdAndUpdate(verification.agent._id, {
    isVerified: status === 'Approved'
  });

  // Notify agent about the decision
  try {
    await sendAgentVerificationNotification(verification.agent, req.user, status.toLowerCase());
  } catch (error) {
    console.error('Error sending agent notification:', error);
  }

  // Emit Socket.IO event
  if (req.app.get('socketio')) {
    // Emit to specific agent room
    req.app.get('socketio').to(`agent-${verification.agent._id}`).emit('verificationReviewed', {
      agentId: verification.agent._id,
      status: status,
      reviewedBy: req.user.username
    });
    
    // Also emit to general delivery agents room in case agent is online
    req.app.get('socketio').to('delivery-agents').emit('verificationReviewed', {
      agentId: verification.agent._id,
      status: status,
      reviewedBy: req.user.username
    });
  }

  res.json({
    message: `Verification ${status.toLowerCase()} successfully`,
    verification
  });
});

module.exports = {
  submitVerification,
  getAgentVerification,
  getAllVerifications,
  reviewVerification
};