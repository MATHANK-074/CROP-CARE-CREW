const mongoose = require('mongoose');

const feedStockSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feedType: {
    type: String, // e.g., 'Silage', 'Dry Fodder', 'Concentrates', 'Mineral Mixture'
    required: true
  },
  feedName: {
    type: String, // e.g., 'Corn Silage', 'Alfalfa Hay'
    required: true
  },
  quantity: {
    type: Number, // Current stock available
    required: true,
    default: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'tons', 'bags', 'liters'],
    default: 'kg'
  },
  costPerUnit: {
    type: Number,
    default: 0
  },
  supplier: {
    type: String,
    default: ''
  },
  suitableAnimalCategories: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lowStockThreshold: {
    type: Number, // Warning trigger level
    default: 50
  },
  safetyStockLevel: {
    type: Number, // Absolute minimum stock before crisis
    default: 20
  },
  supplierLeadTimeDays: {
    type: Number, // How many days it takes to get new stock
    default: 2
  },
  averageDailyConsumption: {
    type: Number, // Calculated rolling average or fixed baseline
    default: 0
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('FeedStock', feedStockSchema);
