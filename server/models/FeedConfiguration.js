const mongoose = require('mongoose');

const feedConfigurationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lifeStage: {
    type: String, 
    // E.g., 'Calf/Growing', 'Heifer', 'Adult Non-Lactating', 'Pregnant', 'Lactating', 'Pregnant + Lactating', 'Dry Cow', 'Special Care', 'Bull'
    required: true
  },
  feedType: {
    type: String, // 'Green Fodder', 'Dry Fodder', 'Concentrates', etc.
    required: true
  },
  baseQuantityKg: {
    type: Number,
    required: true,
    default: 0
  },
  milkMultiplier: {
    type: Number, // Additional kg of feed per liter of milk produced
    default: 0
  },
  pregnancyTrimester1Multiplier: {
    type: Number,
    default: 0
  },
  pregnancyTrimester2Multiplier: {
    type: Number,
    default: 0
  },
  pregnancyTrimester3Multiplier: {
    type: Number,
    default: 0
  },
  goal: {
    type: String,
    default: 'Maintenance'
  },
  primaryFeeds: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// A user can only have one configuration per life stage and feed type combination
feedConfigurationSchema.index({ user: 1, lifeStage: 1, feedType: 1 }, { unique: true });

module.exports = mongoose.model('FeedConfiguration', feedConfigurationSchema);
