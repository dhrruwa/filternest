const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: Date,
    items: [
      {
        description: String,
        quantity: Number,
        unitPrice: Number,
        total: Number,
      },
    ],
    subtotal: Number,
    tax: Number,
    taxPercentage: Number,
    discount: {
      type: Number,
      default: 0,
    },
    discountReason: String,
    total: Number,
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'overdue'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'wallet', 'cash', 'bank_transfer'],
    },
    paymentDate: Date,
    paymentReference: String,
    notes: String,
    pdfUrl: String,
    email: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
