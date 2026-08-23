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
    enum: ['Milking', 'Pregnant', 'Dry', 'Heifer', 'Growing', 'Sold', 'Deceased', 'Laying', 'Brooding', 'Molting', 'Lactating', 'Dry Cow'],
    default: 'Growing'
  },
  weight: {
    type: Number // in kg
  },
  birthWeight: {
    type: Number // in kg
  },
  currentWeight: {
    type: Number // in kg
  },
  source: {
    type: String,
    enum: ['Farm-born', 'Purchased', 'Other'],
    default: 'Purchased'
  },
  motherTagId: {
    type: String,
    trim: true
  },
  fatherTagId: {
    type: String,
    trim: true
  },
  lifeStage: {
    type: String,
    enum: ['Calf', 'Growing Heifer', 'Growing Bull', 'Adult', 'Adult Non-Lactating', 'Special Care'],
    default: 'Adult'
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
