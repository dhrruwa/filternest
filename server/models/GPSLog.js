const mongoose = require('mongoose');

const gpsLogSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking' // Associated active booking if travelling or on a job
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

gpsLogSchema.index({ location: '2dsphere' });
gpsLogSchema.index({ agent: 1, timestamp: -1 });

module.exports = mongoose.model('GPSLog', gpsLogSchema);
