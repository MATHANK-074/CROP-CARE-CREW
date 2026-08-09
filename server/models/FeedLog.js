const mongoose = require('mongoose');

const feedLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feedStock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedStock',
    required: true
  },
  action: {
    type: String,
    enum: ['Consumed', 'Restocked', 'Adjustment'],
    required: true
  },
  quantity: {
    type: Number, // Amount added (+) or consumed (-)
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  cost: {
    type: Number // Optional: Used if action is 'Restocked' to track financials
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('FeedLog', feedLogSchema);
