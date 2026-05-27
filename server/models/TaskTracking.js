const mongoose = require('mongoose');

const taskTrackingSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'accepted', 'travelling', 'arrived', 'started', 'completed', 'rejected'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude] at the time of status transition
  },
  remarks: String
}, { timestamps: true });

module.exports = mongoose.model('TaskTracking', taskTrackingSchema);
