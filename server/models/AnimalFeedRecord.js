const mongoose = require('mongoose');

const animalFeedRecordSchema = new mongoose.Schema({
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
    type: String, // E.g., 'Green Fodder', 'Dry Fodder', 'Concentrates'
    required: true
  },
  quantityKg: {
    type: Number,
    required: true
  },
  cost: {
    type: Number,
    required: true,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  }
}, { timestamps: true });

animalFeedRecordSchema.index({ user: 1, livestock: 1, date: -1 }); // Phase 4 index

module.exports = mongoose.model('AnimalFeedRecord', animalFeedRecordSchema);
