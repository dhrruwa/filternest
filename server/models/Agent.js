const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const agentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^[0-9]{10}$/,
        'Phone number must be exactly 10 digits',
      ],
    },

    password: {
      type: String,
      required: false,
      minlength: 6,
    },

    agentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },

    serviceArea: {
      type: {
        type: String,
        enum: ['Point', 'Polygon'],
      },

      coordinates: {
        type: [Number],
      },
    },

    profileImage: {
      type: String,
      default: '',
    },

    certifications: [String],

    skills: [
      {
        skill: String,
        yearsOfExperience: Number,
      },
    ],

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    totalRatings: {
      type: Number,
      default: 0,
    },

    completedJobs: {
      type: Number,
      default: 0,
    },

    role: {
      type: String,
      enum: ['agent', 'admin', 'customer'],
      default: 'agent',
    },

    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'offline',
    },

    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },

      coordinates: {
        type: [Number],
      },

      updatedAt: Date,
    },

    isVerified: {
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

    resetPasswordToken: String,

    resetPasswordTokenExpire: Date,

    lastLogin: Date,

    isActive: {
      type: Boolean,
      default: true,
    },

    bankDetails: {
      accountHolderName: String,

      accountNumber: String,

      bankName: String,

      ifscCode: {
        type: String,
        uppercase: true,

        match: [
          /^[A-Z]{4}0[A-Z0-9]{6}$/,

          'Invalid IFSC code format',
        ],
      },
    },

    documents: {
      aadhar: {
        type: String,

        match: [
          /^[0-9]{12}$/,

          'Aadhaar number must be exactly 12 digits',
        ],
      },

      panCard: {
        type: String,

        uppercase: true,

        trim: true,

        match: [
          /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,

          'PAN format must be ABCDE1234F',
        ],
      },

      drivingLicense: String,
    },
    biometrics: {
      publicKey: String,
      credentialId: String,
      deviceId: String,
      isActive: { type: Boolean, default: false },
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvalDate: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    registrationStatus: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'suspended'],
      default: 'pending',
    },
    temporaryPasscodeSent: {
      type: Boolean,
      default: false,
    },
    rejectedReason: {
      type: String,
      default: '',
    },
    profileCompletion: {
      type: Number,
      default: 0,
    },
    accountActivatedAt: {
      type: Date,
    },
  },

  {
    timestamps: true,
  }
);

// =====================================
// GEO INDEXES
// =====================================

agentSchema.index(
  { currentLocation: '2dsphere' },

  { sparse: true }
);

agentSchema.index(
  { serviceArea: '2dsphere' },

  { sparse: true }
);

agentSchema.index({ email: 1 });
agentSchema.index({ phone: 1 });

// =====================================
// CLEAN & VALIDATE DATA
// =====================================

agentSchema.pre('save', function (next) {
  try {
    // -------------------------
    // Clean serviceArea
    // -------------------------

    if (this.serviceArea) {
      const coords = this.serviceArea.coordinates;

      if (
        !Array.isArray(coords) ||
        coords.length === 0 ||
        coords.some(
          (c) =>
            c === null ||
            c === undefined
        )
      ) {
        this.serviceArea = undefined;
      }
    }

    // -------------------------
    // Clean currentLocation
    // -------------------------

    if (this.currentLocation) {
      const coords =
        this.currentLocation.coordinates;

      if (
        !Array.isArray(coords) ||
        coords.length === 0 ||
        coords.some(
          (c) =>
            c === null ||
            c === undefined
        )
      ) {
        this.currentLocation = undefined;
      }
    }

    // -------------------------
    // Auto lowercase email
    // -------------------------

    if (this.email) {
      this.email =
        this.email.toLowerCase().trim();
    }

    // -------------------------
    // Auto uppercase PAN
    // -------------------------

    if (this.documents?.panCard) {
      this.documents.panCard =
        this.documents.panCard
          .toUpperCase()
          .trim();
    }

    // -------------------------
    // Validate PAN Strictly
    // -------------------------

    if (this.documents?.panCard) {
      const panRegex =
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

      if (
        !panRegex.test(
          this.documents.panCard
        )
      ) {
        return next(
          new Error(
            'PAN format must be exactly ABCDE1234F'
          )
        );
      }
    }

    // -------------------------
    // Validate Aadhaar
    // -------------------------

    if (this.documents?.aadhar) {
      const aadhaarRegex =
        /^[0-9]{12}$/;

      if (
        !aadhaarRegex.test(
          this.documents.aadhar
        )
      ) {
        return next(
          new Error(
            'Aadhaar must contain exactly 12 digits'
          )
        );
      }
    }

    // -------------------------
    // Validate Phone
    // -------------------------

    if (this.phone) {
      const phoneRegex =
        /^[0-9]{10}$/;

      if (
        !phoneRegex.test(this.phone)
      ) {
        return next(
          new Error(
            'Phone number must contain exactly 10 digits'
          )
        );
      }
    }
  } catch (err) {
    this.serviceArea = undefined;
    this.currentLocation = undefined;

    return next(err);
  }

  next();
});

// =====================================
// HASH PASSWORD
// =====================================

agentSchema.pre(
  'save',

  async function (next) {
    if (!this.isModified('password')) {
      return next();
    }

    try {
      const salt =
        await bcrypt.genSalt(10);

      this.password =
        await bcrypt.hash(
          this.password,
          salt
        );

      next();
    } catch (error) {
      next(error);
    }
  }
);

// =====================================
// COMPARE PASSWORD
// =====================================

agentSchema.methods.comparePassword =
  async function (enteredPassword) {
    return await bcrypt.compare(
      enteredPassword,
      this.password
    );
  };

// =====================================
// REMOVE SENSITIVE DATA
// =====================================

agentSchema.methods.toJSON =
  function () {
    const obj = this.toObject();

    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordTokenExpire;
    delete obj.verificationOTP;
    delete obj.verificationOTPExpire;
    delete obj.loginOTP;
    delete obj.loginOTPExpire;
    delete obj.otpAttempts;

    return obj;
  };

module.exports = mongoose.model(
  'Agent',
  agentSchema
);