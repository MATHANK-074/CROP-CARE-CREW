const mongoose = require('mongoose');

const livestockSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tagId: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Cow', 'Buffalo', 'Calf', 'Bull', 'Goat', 'Sheep'],
    required: true
  },
  breed: {
    type: String,
    trim: true
  },
  birthDate: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  status: {
    type: String,
    enum: ['Milking', 'Pregnant', 'Dry', 'Heifer', 'Growing', 'Sold', 'Deceased'],
    default: 'Growing'
  },
  weight: {
    type: Number // in kg
  },
  buyingPrice: {
    type: Number // in currency
  },
  ageString: {
    type: String // e.g. "3 years 2 months"
  },
  vaccinations: [{ name: String, date: Date, nextDueDate: Date }],
  aiHealthEvaluation: {
    recommendation: { type: String, enum: ['Keep', 'Monitor', 'Sell/Cull'], default: 'Monitor' },
    healthScore: { type: Number, min: 0, max: 100 },
    reasoning: { type: String },
    lastEvaluated: { type: Date }
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Ensure a user cannot have duplicate tag IDs
livestockSchema.index({ user: 1, tagId: 1 }, { unique: true });

module.exports = mongoose.model('Livestock', livestockSchema);
