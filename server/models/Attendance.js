const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date
  },
  date: {
    type: String, // 'YYYY-MM-DD'
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  },
  workingHours: {
    type: Number, // in hours
    default: 0
  },
  lateLogin: {
    type: Boolean,
    default: false
  },
  shiftStart: {
    type: Date
  },
  shiftEnd: {
    type: Date
  },
  activityLogs: [{
    time: { type: Date, default: Date.now },
    action: String // e.g., 'check_in', 'check_out', 'offline', 'available'
  }]
}, { timestamps: true });

// Compound index for agent and date uniqueness
attendanceSchema.index({ agent: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
