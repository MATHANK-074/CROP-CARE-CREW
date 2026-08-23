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
  species: {
    type: String,
    enum: ['Cattle', 'Poultry', 'Goat', 'Sheep'],
    default: 'Cattle'
  },
  trackingType: {
    type: String,
    enum: ['Individual', 'Flock'],
    default: 'Individual'
  },
  flockSize: {
    type: Number,
    default: 1
  },
  category: {
    type: String,
    enum: ['Cow', 'Buffalo', 'Calf', 'Bull', 'Goat', 'Sheep', 'Chicken (Layers)', 'Chicken (Broilers)', 'Ducks', 'Turkeys'],
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
    enum: ['Male', 'Female', 'Mixed'],
    default: 'Female'
  },
  status: {
    type: String,
    enum: ['Milking', 'Pregnant', 'Dry', 'Heifer', 'Growing', 'Sold', 'Deceased', 'Laying', 'Brooding', 'Molting'],
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
  },
  profile_img: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Ensure a user cannot have duplicate tag IDs
livestockSchema.index({ user: 1, tagId: 1 }, { unique: true });
livestockSchema.index({ user: 1, status: 1 }); // Phase 4 index

module.exports = mongoose.model('Livestock', livestockSchema);
