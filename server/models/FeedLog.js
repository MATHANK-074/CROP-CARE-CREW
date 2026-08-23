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
    enum: ['PURCHASE', 'RESTOCK', 'CONSUMPTION', 'ADJUSTMENT_ADD', 'ADJUSTMENT_REMOVE', 'WASTAGE', 'SPOILAGE', 'Consumed', 'Restocked', 'Adjustment'],
    required: true
  },
  quantity: {
    type: Number, // Amount added (+) or consumed (-)
    required: true
  },
  previousStock: {
    type: Number
  },
  newStock: {
    type: Number
  },
  date: {
    type: Date,
    default: Date.now
  },
  cost: {
    type: Number // Optional: Used if action is 'Restocked' to track financials
  },
  supplier: {
    type: String
  },
  batchNumber: {
    type: String
  },
  expiryDate: {
    type: Date
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('FeedLog', feedLogSchema);
