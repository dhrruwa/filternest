const mongoose = require('mongoose');

const earningsSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['payout', 'incentive', 'bonus', 'withdrawal'],
    required: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'withdrawn', 'cancelled'],
    default: 'pending'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('AgentEarnings', earningsSchema);
