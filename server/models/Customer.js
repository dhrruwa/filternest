const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
      landmark: String,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    profileImage: String,
    alternatePhone: String,
    role: {
      type: String,
      enum: ['customer', 'agent', 'admin'],
      default: 'customer',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationOTP: String,
    verificationOTPExpire: Date,
    loginOTP: String,
    loginOTPExpire: Date,
    otpAttempts: {
      type: Number,
      default: 0,
    },
    verificationToken: String,
    verificationTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpire: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    biometrics: {
      publicKey: String,
      credentialId: String,
      deviceId: String,
      isActive: { type: Boolean, default: false },
    },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      preferredLanguage: { type: String, default: 'en' },
    },
    purifierDetails: {
      modelName: {
        type: String,
        default: 'FilterNest Premium Classic',
      },
      serialNumber: {
        type: String,
        default: 'FN-RO-8829-X',
      },
      installationDate: {
        type: Date,
        default: Date.now,
      },
      waterHealthScore: {
        type: Number,
        default: 98,
      },
      filterHealthScore: {
        type: Number,
        default: 94,
      },
    },
    membershipStatus: {
      type: String,
      enum: ['standard', 'premium', 'gold', 'platinum'],
      default: 'premium',
    },
    preferredServiceTimings: {
      day: {
        type: String,
        default: 'Anyday',
      },
      timeSlot: {
        type: String,
        default: '10:00 AM - 01:00 PM',
      },
    },
  },
  { timestamps: true }
);

// Index for geospatial queries (sparse to allow documents without coordinates)
customerSchema.index({ 'location': '2dsphere' }, { sparse: true });
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });

// Hash password before saving
customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
customerSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to remove password from response
customerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordTokenExpire;
  delete obj.verificationToken;
  delete obj.verificationTokenExpire;
  delete obj.verificationOTP;
  delete obj.verificationOTPExpire;
  delete obj.otpAttempts;
  return obj;
};

module.exports = mongoose.model('Customer', customerSchema);
