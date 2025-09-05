const mongoose = require('mongoose');

const agentVerificationSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  documents: {
    nidFront: {
      type: String, // URL or base64 string
      required: true
    },
    nidBack: {
      type: String,
      required: true
    },
    drivingLicense: {
      type: String,
      required: false
    },
    photo: {
      type: String,
      required: true
    }
  },
  personalInfo: {
    fullName: {
      type: String,
      required: true
    },
    nidNumber: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const AgentVerification = mongoose.model('AgentVerification', agentVerificationSchema);

module.exports = AgentVerification;