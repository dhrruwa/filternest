const mongoose = require('mongoose');

const deviceTrackingSchema = new mongoose.Schema(
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
    deviceFingerprint: {
      type: String,
      required: true, // Unique string combining OS + Browser + DeviceType
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
    isTrusted: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to quickly fetch devices for a specific user
deviceTrackingSchema.index({ userId: 1, deviceFingerprint: 1 }, { unique: true });

module.exports = mongoose.model('DeviceTracking', deviceTrackingSchema);
