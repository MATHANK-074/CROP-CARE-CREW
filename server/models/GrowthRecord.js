const mongoose = require('mongoose');

const growthRecordSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  weight: {
    type: Number, // in kg
    required: true
  },
  notes: {
    type: String
  }
}, { timestamps: true });

growthRecordSchema.index({ user: 1, livestock: 1, date: -1 });

module.exports = mongoose.model('GrowthRecord', growthRecordSchema);
