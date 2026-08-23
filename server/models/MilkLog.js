const mongoose = require('mongoose');

const milkLogSchema = new mongoose.Schema({
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
  session: {
    type: String,
    enum: ['Morning', 'Evening', 'Other'],
    default: 'Morning'
  },
  yieldLiters: {
    type: Number,
    required: true
  },
  fatPercentage: {
    type: Number
  },
  snfPercentage: {
    type: Number // Solid Not Fat
  },
  notes: {
    type: String
  }
}, { timestamps: true });

milkLogSchema.index({ user: 1, livestock: 1, date: -1 }); // Phase 4 index

module.exports = mongoose.model('MilkLog', milkLogSchema);
