const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'userModel',
      default: null,
    },
    userModel: {
      type: String,
      enum: ['Customer', 'Agent', 'Admin'],
      default: null,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    os: {
      type: String,
      default: 'Unknown OS',
    },
    browser: {
      type: String,
      default: 'Unknown Browser',
    },
    deviceType: {
      type: String,
      default: 'desktop',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    location: {
      type: String,
      default: 'Unknown Location',
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'suspicious'],
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for analytical security dashboards
loginHistorySchema.index({ email: 1, timestamp: -1 });
loginHistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
