const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'userModel',
    },
    userModel: {
      type: String,
      required: true,
      enum: ['Customer', 'Agent', 'Admin'],
    },
    refreshTokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RefreshToken',
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
      default: 'desktop', // desktop, mobile, tablet
    },
    deviceName: {
      type: String,
      default: 'Unknown Device',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    location: {
      type: String,
      default: 'Unknown Location',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Create compound index for querying user sessions
sessionSchema.index({ userId: 1, isActive: 1 });

// TTL index to automatically remove expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);
