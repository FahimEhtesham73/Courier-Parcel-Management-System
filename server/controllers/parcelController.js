const Parcel = require('../models/Parcel');
const User = require('../models/User'); // Assuming you might need this for checking admin role
const QRCode = require('qrcode');
const sendSMS = require('../utils/sendSMS'); // Import the sendSMS utility
const sendEmail = require('../utils/sendEmail'); // Import the sendEmail utility
const { autoAssignAgent } = require('../utils/agentAssignment');
const { sendParcelStatusNotification, sendBookingConfirmation, sendAgentAssignmentNotification } = require('../utils/notifications');
const { generateParcelLabel: generatePDF } = require('../utils/generatePDF');

exports.getAvailableParcels = async (req, res) => {
  // @route GET /api/parcels/available
  // @desc Get available parcels for delivery agents to accept
  // @access Private (Delivery Agent only)
  try {
    if (req.user.role !== 'Delivery Agent') {
      return res.status(403).json({ message: 'Only delivery agents can view available parcels' });
    }

    // Get unassigned parcels that are pending
    const availableParcels = await Parcel.find({
      assignedAgent: { $exists: false },
      status: 'Pending'
    })
    .populate('customer', 'username email phone')
    .sort({ createdAt: -1 });

    res.status(200).json({
      parcels: availableParcels,
      count: availableParcels.length
    });
  } catch (error) {
    console.error('Error fetching available parcels:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.acceptParcelAssignment = async (req, res) => {
  // @route PUT /api/parcels/:id/accept
  // @desc Agent accepts a parcel for delivery
  // @access Private (Delivery Agent only)
  try {
    if (req.user.role !== 'Delivery Agent') {
      return res.status(403).json({ message: 'Only delivery agents can accept parcels' });
    }

    // Check if agent is verified
    if (!req.user.isVerified) {
      return res.status(403).json({ message: 'You must be verified to accept parcels' });
    }

    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    if (parcel.assignedAgent) {
      return res.status(400).json({ message: 'Parcel already assigned to another agent' });
    }

    if (parcel.status !== 'Pending') {
      return res.status(400).json({ message: 'Parcel is not available for assignment' });
    }

    // Check agent workload (max 10 active parcels)
    const activeStatuses = ['Pending', 'Picked Up', 'In Transit'];
    const currentWorkload = await Parcel.countDocuments({
      assignedAgent: req.user._id,
      status: { $in: activeStatuses }
    });

    if (currentWorkload >= 10) {
      return res.status(400).json({ message: 'You have reached maximum workload (10 active parcels)' });
    }

    // Assign agent to parcel
    parcel.assignedAgent = req.user._id;
    await parcel.save();

    const updatedParcel = await Parcel.findById(parcel._id)
      .populate('customer', 'username email phone')
      .populate('assignedAgent', 'username email phone');

    // Emit Socket.IO events
    if (req.app.get('socketio')) {
      // Notify customer about agent assignment
      req.app.get('socketio').to(`customer-${parcel.customer}`).emit('agentAssigned', {
        parcel: updatedParcel,
        agent: {
          name: req.user.username,
          phone: req.user.phone
        }
      });

      // Notify other agents that parcel is taken
      req.app.get('socketio').to('delivery-agents').emit('parcelTaken', { 
        parcelId: parcel._id 
      });

      // Notify admins
      req.app.get('socketio').to('admins').emit('parcelAssigned', {
        parcel: updatedParcel,
        agent: req.user
      });
    }

    // Send notification to customer
    try {
      const customer = await User.findById(parcel.customer);
      if (customer) {
        await sendAgentAssignmentNotification(req.user, updatedParcel, req.headers['accept-language'] || 'en');
      }
    } catch (emailError) {
      console.error('Error sending assignment notification:', emailError);
    }

    res.status(200).json({
      message: 'Parcel accepted successfully',
      parcel: updatedParcel
    });
  } catch (error) {
    console.error('Error accepting parcel:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllParcels = async (req, res) => {
  // @route GET /api/parcels
  // @desc Get all parcels (Admin) or user's parcels (Customer)
  // @access Private
  try {
    const { page = 1, limit = 10, status, search, unassigned } = req.query;
    let query = {};
    
    // If user is not admin, only show their parcels or assigned parcels
    if (req.user.role === 'Customer') {
      query.customer = req.user._id;
    } else if (req.user.role === 'Delivery Agent') {
      if (unassigned === 'true') {
        // Show unassigned parcels for agents to accept
        query.assignedAgent = { $exists: false };
        query.status = 'Pending';
      } else {
        // Show assigned parcels
        query.assignedAgent = req.user._id;
      }
    }
    // Admin can see all parcels (no query filter)
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { pickupAddress: { $regex: search, $options: 'i' } },
        { deliveryAddress: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Parcel query for user role', req.user.role, ':', query);
    
    const skip = (page - 1) * limit;
    
    const parcels = await Parcel.find(query)
      .populate('customer', 'username email')
      .populate('assignedAgent', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Parcel.countDocuments(query);
    
    console.log(`Found ${parcels.length} parcels for user ${req.user.username} (${req.user.role})`);
    
    res.status(200).json({
      parcels,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching parcels:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.generateParcelQRCode = async (req, res) => {
  // @route GET /api/parcels/:id/qrcode
  // @desc Generate QR code for a parcel
  // @access Private
  try {
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    // Generate QR code with parcel ID
    const qrCodeData = JSON.stringify({
      id: parcel._id,
      trackingNumber: parcel.trackingNumber,
      status: parcel.status,
      pickup: parcel.pickupAddress,
      delivery: parcel.deliveryAddress
    });
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);

    // Save QR code to parcel
    parcel.qrCode = qrCodeImage;
    await parcel.save();

    res.status(200).json(qrCodeImage); // Send the QR code image as a data URL
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateParcelStatus = async (req, res) => {
  // @route PUT /api/parcels/:id/status
  // @desc Update parcel status by ID
  // @access Private (Admin or Assigned Delivery Agent)
  try {
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    // Check if user is admin or the assigned and verified delivery agent
    const isAssignedAgent = parcel.assignedAgent && parcel.assignedAgent.toString() === req.user._id.toString();

    if (req.user.role !== 'Admin' && !isAssignedAgent) {
 return res.status(401).json({ message: 'Not authorized to update the status of this parcel' });
    }
    if (req.user.role === 'Delivery Agent' && !req.user.isVerified) {
      return res.status(401).json({ message: 'Not authorized to update the status of this parcel' });
    }

    const { status, pickupLocation, deliveryLocation, failureReason, deliveryNotes } = req.body;
    const validStatuses = ['Pending', 'Picked Up', 'In Transit', 'Delivered', 'Failed']; // Define your valid statuses

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid or missing status' });
    }

    parcel.status = status;
    
    // Set delivery timestamp for delivered parcels
    if (status === 'Delivered') {
      parcel.actualDelivery = new Date();
    }
    
    // Set failure reason for failed deliveries
    if (status === 'Failed' && failureReason) {
      parcel.failureReason = failureReason;
    }
    
    // Add delivery notes
    if (deliveryNotes) {
      parcel.deliveryNotes = deliveryNotes;
    }
    
    // Allow updating locations, potentially only by agent/admin at certain statuses
    if (pickupLocation) parcel.pickupLocation = pickupLocation;
    if (deliveryLocation) parcel.deliveryLocation = deliveryLocation;

    const updatedParcel = await parcel.save();
    
    // Emit Socket.IO event if available
    if (req.app.get('socketio')) {
      // Notify customer about status update
      req.app.get('socketio').to(`customer-${parcel.customer}`).emit('parcelStatusUpdated', updatedParcel);
      
      // Notify admin about status update
      req.app.get('socketio').to('admins').emit('parcelStatusUpdated', updatedParcel);
      
      // If agent is assigned, notify them too
      if (parcel.assignedAgent) {
        req.app.get('socketio').to(`agent-${parcel.assignedAgent}`).emit('parcelStatusUpdated', updatedParcel);
      }
      
      // Broadcast agent location update if status is being updated by agent
      if (req.user.role === 'Delivery Agent' && req.user.currentLocation) {
        req.app.get('socketio').emit('agentLocationUpdate', {
          agentId: req.user._id,
          parcelId: parcel._id,
          agentLocation: req.user.currentLocation
        });
      }
    }
    
    res.status(200).json(updatedParcel);

    // Send email notification to the customer
    try {
      const customer = await User.findById(updatedParcel.customer);
      if (customer) {
        await sendParcelStatusNotification(customer, updatedParcel, req.headers['accept-language'] || 'en');
      }
    } catch (emailError) {
      console.error(`Error sending email notification for parcel ${updatedParcel.trackingNumber}:`, emailError);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.trackParcel = async (req, res) => {
  // @route GET /api/parcels/track/:trackingNumber
  // @desc Track parcel by tracking number (public)
  // @access Public
  try {
    const { trackingNumber } = req.params;
    
    const parcel = await Parcel.findOne({ trackingNumber })
      .populate('customer', 'username')
      .populate('assignedAgent', 'username currentLocation')
      .select('-__v');

    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    // Return tracking information
    const trackingInfo = {
      trackingNumber: parcel.trackingNumber,
      status: parcel.status,
      pickupAddress: parcel.pickupAddress,
      pickupContactName: parcel.pickupContactName,
      deliveryAddress: parcel.deliveryAddress,
      recipientName: parcel.recipientName,
      estimatedDelivery: parcel.estimatedDelivery,
      actualDelivery: parcel.actualDelivery,
      createdAt: parcel.createdAt,
      updatedAt: parcel.updatedAt,
      specialInstructions: parcel.specialInstructions,
      fragile: parcel.fragile,
      urgent: parcel.urgent,
      assignedAgent: parcel.assignedAgent ? {
        name: parcel.assignedAgent.username,
        currentLocation: parcel.assignedAgent.currentLocation
      } : null,
      timeline: [
        { status: 'Pending', timestamp: parcel.createdAt, completed: true },
        { status: 'Picked Up', timestamp: parcel.status === 'Picked Up' || parcel.status === 'In Transit' || parcel.status === 'Delivered' ? parcel.updatedAt : null, completed: ['Picked Up', 'In Transit', 'Delivered'].includes(parcel.status) },
        { status: 'In Transit', timestamp: parcel.status === 'In Transit' || parcel.status === 'Delivered' ? parcel.updatedAt : null, completed: ['In Transit', 'Delivered'].includes(parcel.status) },
        { status: 'Delivered', timestamp: parcel.actualDelivery, completed: parcel.status === 'Delivered' }
      ]
    };

    res.status(200).json(trackingInfo);
  } catch (error) {
    console.error('Error tracking parcel:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getParcelById = async (req, res) => {
  // @route GET /api/parcels/:id
  // @desc Get single parcel by ID
  // @access Private
  try {
    const parcel = await Parcel.findById(req.params.id)
      .populate('customer', 'username email')
      .populate('assignedAgent', 'username email');

    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    // Check authorization
    if (req.user.role === 'Customer' && parcel.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this parcel' });
    }
    
    if (req.user.role === 'Delivery Agent' && 
        (!parcel.assignedAgent || parcel.assignedAgent._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this parcel' });
    }
    
    res.status(200).json(parcel);
  } catch (error) {
    console.error('Error fetching parcel:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createParcel = async (req, res) => {
  // @route POST /api/parcels
  // @desc Create new parcel
  // @access Private (Customer)
  try {
    const {
      pickupAddress, pickupContactName, pickupContactPhone, pickupLocation,
      deliveryAddress, recipientName, recipientPhone, deliveryLocation,
      size, type, weight, description, paymentMethod, codAmount,
      specialInstructions, fragile, urgent
    } = req.body; // Added location fields

    // Validate required fields
    if (!pickupAddress || !pickupContactName || !pickupContactPhone || 
        !deliveryAddress || !recipientName || !recipientPhone || 
        !size || !type || !paymentMethod) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate COD amount if payment method is COD
    if (paymentMethod === 'COD' && (!codAmount || codAmount <= 0)) {
      return res.status(400).json({ message: 'COD amount must be greater than 0' });
    }
    
    const parcel = new Parcel({
      customer: req.user._id, // Set customer to the logged-in user
      pickupAddress,
      pickupContactName,
      pickupContactPhone,
      deliveryAddress,
      recipientName,
      recipientPhone,
      size,
      type,
      weight: weight || null,
      description: description || null,
      paymentMethod,
      codAmount: paymentMethod === 'COD' ? codAmount || 0 : 0,
      specialInstructions: specialInstructions || null,
      fragile: fragile || false,
      urgent: urgent || false,
      status: 'Pending' // Default status
    });

    // Assign locations if provided
    if (pickupLocation) parcel.pickupLocation = pickupLocation;
    if (deliveryLocation) parcel.deliveryLocation = deliveryLocation;
    
    // Set estimated delivery (3-5 business days from now)
    const estimatedDays = Math.floor(Math.random() * 3) + 3; // 3-5 days
    parcel.estimatedDelivery = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);

    const createdParcel = await parcel.save();
    
     // Populate the created parcel with customer and agent info
     const populatedParcel = await Parcel.findById(createdParcel._id)
       .populate('customer', 'username email')
       .populate('assignedAgent', 'username email');
     
    // Emit Socket.IO event to notify all verified agents about new parcel
    if (req.app.get('socketio')) {
      // Notify all verified delivery agents about new parcel
      const parcelNotification = {
        parcel: populatedParcel,
        customer: {
          username: req.user.username,
          phone: req.user.phone
        },
        location: populatedParcel.pickupLocation
      };
      
      // Broadcast to all verified delivery agents
      req.app.get('socketio').emit('notify-agents-new-parcel', parcelNotification);
      
      console.log('New parcel notification sent to all verified agents:', populatedParcel._id);
    }
    
    // Auto-assign agent if pickup location is provided
    if (populatedParcel.pickupLocation?.latitude && populatedParcel.pickupLocation?.longitude) {
      try {
        const assignedAgent = await autoAssignAgent(populatedParcel._id);
        if (assignedAgent) {
          // Reload parcel with assigned agent
          const updatedParcel = await Parcel.findById(populatedParcel._id)
            .populate('assignedAgent', 'username email');
          
          // Emit Socket.IO event for agent assignment
          if (req.app.get('socketio')) {
            req.app.get('socketio').to(`agent-${assignedAgent._id}`).emit('parcelAssigned', {
              parcel: updatedParcel,
              agent: assignedAgent
            });
            
            // Also notify customer about agent assignment
            req.app.get('socketio').to(`customer-${req.user._id}`).emit('agentAssigned', {
              parcel: updatedParcel,
              agent: {
                name: assignedAgent.username,
                phone: assignedAgent.phone
              }
            });
          }
        }
      } catch (autoAssignError) {
        console.error('Auto-assignment failed:', autoAssignError);
        // Don't fail the parcel creation if auto-assignment fails
      }
    }
    
    // Send confirmation email
    try {
      const customer = await User.findById(req.user._id);
      if (customer) {
        await sendBookingConfirmation(customer, populatedParcel, req.headers['accept-language'] || 'en');
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }
    
    res.status(201).json(populatedParcel);
  } catch (error) {
    console.error('Error creating parcel:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.updateParcel = async (req, res) => {
  // @route PUT /api/parcels/:id
  // @desc Update parcel by ID
  // @access Private (Admin or Parcel Owner)
  try {
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    // Check if user is admin or the parcel owner
    if (req.user.role !== 'Admin' && parcel.customer.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this parcel' });
    }

    const {
      pickupAddress, deliveryAddress, size, type, paymentMethod, assignedAgent, status, codAmount,
      pickupLocation, deliveryLocation // Added location fields
    } = req.body;

    // Allow updating certain fields for the customer (and admin)
    if (pickupAddress) parcel.pickupAddress = pickupAddress;
    if (deliveryAddress) parcel.deliveryAddress = deliveryAddress;

    if (size) parcel.size = size;
    if (type) parcel.type = type;
    if (paymentMethod) {
      parcel.paymentMethod = paymentMethod;
      if (paymentMethod === 'COD' && codAmount !== undefined) {
        parcel.codAmount = codAmount;
      } else if (paymentMethod === 'prepaid') {
        parcel.codAmount = 0;
      }
    }

    // Allow admin to assign an agent and update status
    if (req.user.role === 'Admin') {
      if (assignedAgent !== undefined) { // Allow unassigning agent by sending null or empty
        if (assignedAgent) {
          const agent = await User.findById(assignedAgent);
          if (!agent || agent.role !== 'Delivery Agent') {
            return res.status(400).json({ message: 'Invalid assigned agent ID or user is not a delivery agent' });
          }
        }
        parcel.assignedAgent = assignedAgent;
      }
      if (status) parcel.status = status;

      // Admin can update location fields
      if (pickupLocation) parcel.pickupLocation = pickupLocation;
      if (deliveryLocation) parcel.deliveryLocation = deliveryLocation;
    }

    const updatedParcel = await parcel.save();
    res.status(200).json(updatedParcel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteParcel = async (req, res) => {
  // @route DELETE /api/parcels/:id
  // @desc Delete parcel by ID
  // @access Private (Admin or Parcel Owner)
  try {
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    // Check if user is admin or the parcel owner
    if (req.user.role !== 'Admin' && parcel.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this parcel' });
    }

    await Parcel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Parcel deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting parcel:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getOptimizedRoute = async (req, res) => {
  // @route GET /api/parcels/route/:agentId
  // @desc Get optimized delivery route for agent
  // @access Private (Agent or Admin)
  try {
    const { agentId } = req.params;
    
    // Check authorization
    if (req.user.role !== 'Admin' && req.user._id.toString() !== agentId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const parcels = await Parcel.find({
      assignedAgent: agentId,
      status: { $in: ['Pending', 'Picked Up', 'In Transit'] }
    }).select('pickupAddress deliveryAddress pickupLocation deliveryLocation status');
    
    // Simple route optimization (in real app, use Google Maps Directions API)
    const route = parcels.map(parcel => ({
      parcelId: parcel._id,
      address: parcel.status === 'Pending' ? parcel.pickupAddress : parcel.deliveryAddress,
      location: parcel.status === 'Pending' ? parcel.pickupLocation : parcel.deliveryLocation,
      type: parcel.status === 'Pending' ? 'pickup' : 'delivery'
    }));
    
    res.status(200).json({ route });
  } catch (error) {
    console.error('Error getting route:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.generateParcelLabel = async (req, res) => {
  // @route GET /api/parcels/:id/label
  // @desc Generate shipping label PDF for a parcel
  // @access Private
  try {
    const parcel = await Parcel.findById(req.params.id)
      .populate('customer', 'username email')
      .populate('assignedAgent', 'username email');

    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    // Check authorization
    if (req.user.role === 'Customer' && parcel.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to generate label for this parcel' });
    }
    
    if (req.user.role === 'Delivery Agent' && 
        (!parcel.assignedAgent || parcel.assignedAgent._id.toString() !== req.user._id.toString())) {
      return res.status(4_3).json({ message: 'Not authorized to generate label for this parcel' });
    }

    const pdfDoc = generatePDF(parcel);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="label-${parcel.trackingNumber}.pdf"`);
    
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error('Error generating parcel label:', error);
    res.status(500).json({ message: error.message });
  }
};