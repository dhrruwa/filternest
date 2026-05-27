const mongoose = require('mongoose');

const maintenanceScheduleSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    scheduleType: {
      type: String,
      enum: ['prefilter', 'membrane', 'general'],
      required: true,
    },
    lastServiceDate: Date,
    nextServiceDate: {
      type: Date,
      required: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'reminded', 'completed', 'overdue'],
      default: 'pending',
    },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'biannual', 'annual'],
    },
    reminderDaysBefore: {
      type: Number,
      default: 7, // Remind 7 days before
    },
    notes: String,
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MaintenanceSchedule', maintenanceScheduleSchema);
