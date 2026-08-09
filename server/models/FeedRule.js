const mongoose = require('mongoose');

const feedRuleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cowCategory: {
    type: String, // 'Normal', 'Pregnant', 'Lactating', 'High-Yield', 'Special-Care'
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
  pregnancyMultiplier: {
    type: Number, // Additional kg of feed for pregnant cows
    default: 0
  },
  priorityLevel: {
    type: String,
    enum: ['Normal', 'Attention', 'High Priority', 'Critical'],
    default: 'Normal'
  }
}, { timestamps: true });

module.exports = mongoose.model('FeedRule', feedRuleSchema);
