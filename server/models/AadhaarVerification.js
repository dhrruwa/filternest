const mongoose = require('mongoose');

const aadhaarVerificationSchema = new mongoose.Schema(
  {
    aadharNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    otp: {
      type: String,
      required: false,
    },
    clientId: {
      type: String,
      trim: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    cooldownUntil: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Auto-delete entries after they expire (using index TTL or manual fallback, keeping index as a safety net)
aadhaarVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AadhaarVerification', aadhaarVerificationSchema);
