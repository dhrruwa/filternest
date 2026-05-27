const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    category: {
      type: String,
      enum: ['billing', 'technical', 'filter_replacement', 'installation', 'other'],
      default: 'technical',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    subject: {
      type: String,
      required: true,
    },
    description: String,
    status: {
      type: String,
      enum: ['open', 'in_progress', 'closed'],
      default: 'open',
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ['customer', 'agent', 'admin', 'system'],
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        image: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
