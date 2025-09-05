const mongoose = require('mongoose');

const parcelSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pickupAddress: {
    type: String,
    required: true
  },
  pickupLocation: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  recipientPhone: {
    type: String,
    required: true
  },
  deliveryLocation: {
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    }
  },
  size: {
    type: String, // e.g., Small, Medium, Large
    required: true
  },
  type: {
    type: String, // e.g., Document, Package, fragile
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'prepaid'],
    required: true
  },
  codAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Picked Up', 'In Transit', 'Delivered', 'Failed'],
    default: 'Pending'
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  qrCode: {
    type: String
  },
  trackingNumber: {
    type: String,
    unique: true
  },
  estimatedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  failureReason: {
    type: String
  },
  deliveryNotes: {
    type: String
  }
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// Generate tracking number before saving
parcelSchema.pre('save', function(next) {
  if (!this.trackingNumber) {
    this.trackingNumber = 'CP' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

const Parcel = mongoose.model('Parcel', parcelSchema);

module.exports = Parcel;