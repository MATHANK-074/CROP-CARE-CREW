const mongoose = require('mongoose');

const breedingRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  livestock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Livestock',
    required: true
  },
  eventType: {
    type: String,
    enum: ['Artificial Insemination', 'Natural Mating', 'Heat Observation', 'Pregnancy Check'],
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  expectedDeliveryDate: {
    type: Date // Auto-calculated based on eventDate + ~283 days for AI
  },
  actualDeliveryDate: {
    type: Date
  },
  nextHeatPredictionDate: {
    type: Date // Auto-calculated after delivery (+45 days)
  },
  semenDetails: {
    type: String // For AI, to track bull semen used
  },
  outcome: {
    type: String,
    enum: ['Pending', 'Confirmed Pregnant', 'Failed', 'Delivered Calf', 'Abortion'],
    default: 'Pending'
  },
  notes: {
    type: String
  },
  cost: {
    type: Number,
    default: 0
  },
  aiTechnician: {
    type: String
  }
}, { timestamps: true });

breedingRecordSchema.index({ user: 1, livestock: 1, eventDate: -1 }); // Phase 4 index

module.exports = mongoose.model('BreedingRecord', breedingRecordSchema);
