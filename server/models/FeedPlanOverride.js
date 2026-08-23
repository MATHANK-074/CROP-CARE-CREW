const mongoose = require('mongoose');

const feedPlanOverrideSchema = new mongoose.Schema({
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
  feedStock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedStock'
  },
  feedType: {
    type: String,
    required: true
  },
  originalAIQty: {
    type: Number,
    required: true
  },
  modifiedQty: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  modifiedBy: {
    type: String, // E.g., 'Farmer', 'Veterinarian', 'Admin'
    default: 'Farmer'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

feedPlanOverrideSchema.index({ user: 1, livestock: 1, date: -1 });

module.exports = mongoose.model('FeedPlanOverride', feedPlanOverrideSchema);
