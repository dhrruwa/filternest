const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    serviceType: {
      type: String,
      enum: ['general_service', 'prefilter_replacement', 'membrane_replacement', 'installation', 'repair'],
      required: true,
    },
    description: String,
    basePrice: {
      type: Number,
      required: true,
    },
    estimatedDuration: {
      type: Number,
      required: true, // in minutes
    },
    partsRequired: [
      {
        partName: String,
        quantity: Number,
        cost: Number,
      },
    ],
    tools: [String],
    precautions: [String],
    steps: [String],
    image: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
