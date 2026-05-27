const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    serviceType: {
      type: String,
      enum: ['general_service', 'prefilter_replacement', 'membrane_replacement', 'installation', 'repair'],
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    preferredTimeSlot: {
      start: Date,
      end: Date,
    },
    serviceLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: [Number], // [longitude, latitude]
      address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: String,
        landmark: String,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'agent_assigned', 'accepted', 'travelling', 'arrived', 'started', 'completed', 'cancelled'],
      default: 'pending',
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    assignmentExpiresAt: {
      type: Date
    },
    acceptedAt: {
      type: Date
    },
    rejectedAt: {
      type: Date
    },
    rejectedByAgents: [{
      agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
      reason: String,
      rejectedAt: { type: Date, default: Date.now }
    }],
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    estimatedDuration: Number, // in minutes
    actualDuration: Number,
    cost: {
      serviceFee: Number,
      partsCost: Number,
      tax: Number,
      totalCost: Number,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'wallet', 'cash'],
    },
    notes: String,
    agentNotes: String,
    photos: [String],
    completionProof: {
      photos: [String],
      signatureUrl: String,
      remarks: String,
      completedAt: Date
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    feedback: {
      rating: Number,
      review: String,
      submittedAt: Date,
    },
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
  },
  { timestamps: true }
);

// Index for geospatial queries
bookingSchema.index({ 'serviceLocation': '2dsphere' });

module.exports = mongoose.model('Booking', bookingSchema);
