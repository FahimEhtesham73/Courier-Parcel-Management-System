const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const parcelRoutes = require('./routes/parcel');
const userRoutes = require('./routes/user'); // Assuming user routes exist
const adminRoutes = require('./routes/admin');
const agentVerificationRoutes = require('./routes/agentVerification');
const { errorHandler } = require('./middleware/errorMiddleware');
const { protect } = require('./middleware/authMiddleware');

dotenv.config(); // Load environment variables

const app = express();
const port = process.env.PORT || 5000;
const mongoURI = process.env.MONGO_URI;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: 'http://localhost:5173',
    credentials: true
  },
});

// Make io available to routes
app.set('socketio', io);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));

// Database connection
if (!mongoURI) {
  console.error('❌ MongoDB connection URI is not provided! Please set MONGO_URI in your .env file.');
  process.exit(1);
}

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parcels', protect, parcelRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/admin', protect, adminRoutes);
app.use('/api/agent-verification', agentVerificationRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Courier and Parcel Management System Backend');
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('🔌 A user connected');
  
  // Handle user joining role-based rooms
  socket.on('join-room', (data) => {
    const { userId, role } = data;
    
    // Join user-specific room
    if (role === 'Customer') {
      socket.join(`customer-${userId}`);
      console.log(`Customer ${userId} joined their room`);
    } else if (role === 'Delivery Agent') {
      socket.join(`agent-${userId}`);
      socket.join('delivery-agents'); // Join general delivery agents room
      console.log(`Agent ${userId} joined their room and delivery-agents room`);
    } else if (role === 'Admin') {
      socket.join('admins');
      console.log(`Admin ${userId} joined admins room`);
    }
  });
  
  // Handle new parcel notifications to all verified agents
  socket.on('notify-agents-new-parcel', (parcelData) => {
    console.log('Broadcasting new parcel to all verified agents:', parcelData.parcel._id);
    socket.to('delivery-agents').emit('newParcelAvailable', parcelData);
  });
  
  // Handle agent accepting parcel
  socket.on('accept-parcel', async (data) => {
    const { parcelId, agentId } = data;
    try {
      const Parcel = require('./models/Parcel');
      const User = require('./models/User');
      
      const parcel = await Parcel.findById(parcelId);
      const agent = await User.findById(agentId);
      
      if (parcel && agent && !parcel.assignedAgent && agent.isVerified) {
        // Check agent workload
        const activeStatuses = ['Pending', 'Picked Up', 'In Transit'];
        const currentWorkload = await Parcel.countDocuments({
          assignedAgent: agentId,
          status: { $in: activeStatuses }
        });

        if (currentWorkload >= 10) {
          socket.emit('error', { message: 'You have reached maximum workload (10 active parcels)' });
          return;
        }

        parcel.assignedAgent = agentId;
        await parcel.save();
        
        const populatedParcel = await Parcel.findById(parcel._id)
          .populate('customer', 'username email phone')
          .populate('assignedAgent', 'username email phone');
        
        // Notify customer about agent assignment
        io.to(`customer-${populatedParcel.customer._id}`).emit('agentAssigned', {
          parcel: populatedParcel,
          agent: {
            name: agent.username,
            phone: agent.phone
          }
        });
        
        // Notify other agents that parcel is taken
        socket.to('delivery-agents').emit('parcelTaken', { parcelId });
        
        // Confirm to the agent
        socket.emit('parcelAccepted', { parcel: populatedParcel });
        
        // Notify admins
        io.to('admins').emit('parcelAssigned', {
          parcel: populatedParcel,
          agent: agent
        });
      } else if (!agent.isVerified) {
        socket.emit('error', { message: 'You must be verified to accept parcels' });
      }
    } catch (error) {
      console.error('Error accepting parcel:', error);
      socket.emit('error', { message: 'Failed to accept parcel' });
    }
  });
  
  // Handle real-time location updates from agents
  socket.on('location-update', async (data) => {
    const { agentId, latitude, longitude } = data;
    try {
      const User = require('./models/User');
      const Parcel = require('./models/Parcel');
      
      const agent = await User.findById(agentId);
      if (agent && agent.role === 'Delivery Agent') {
        agent.currentLocation = { latitude, longitude };
        await agent.save();
        
        // Notify customers with parcels assigned to this agent
        const parcels = await Parcel.find({
          assignedAgent: agentId,
          status: { $in: ['Picked Up', 'In Transit'] }
        });
        
        parcels.forEach(parcel => {
          io.to(`customer-${parcel.customer}`).emit('agentLocationUpdate', {
            parcelId: parcel._id,
            agentId: agentId,
            agentLocation: { latitude, longitude }
          });
        });
        
        // Notify admins
        io.to('admins').emit('agentLocationUpdate', {
          agentId,
          location: { latitude, longitude }
        });
        
        console.log(`Agent ${agentId} location updated: ${latitude}, ${longitude}`);
      }
    } catch (error) {
      console.error('Error updating agent location:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });

  socket.on('error', (err) => {
    console.error('Socket.IO error:', err);
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
