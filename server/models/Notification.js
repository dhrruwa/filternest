const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'recipientModel',
    },
    recipientModel: {
      type: String,
      enum: ['Customer', 'Agent', 'Admin'],
      required: true,
    },
    type: {
      type: String,
      enum: ['booking_confirmed', 'booking_completed', 'reminder', 'status_update', 'payment_confirmation', 'new_assignment', 'message', 'alert'],
      required: true,
    },
    title: String,
    message: {
      type: String,
      required: true,
    },
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    relatedMaintenance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceSchedule',
    },
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
    },
    sentStatus: {
      inApp: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    actionUrl: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
