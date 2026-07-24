const mongoose = require('mongoose');

const cropPriceSchema = new mongoose.Schema({
  crop_name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  market: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index to prevent duplicates based on crop, city, and date
cropPriceSchema.index({ crop_name: 1, city: 1, date: 1 }, { unique: true });

const CropPrice = mongoose.model('CropPrice', cropPriceSchema);

module.exports = CropPrice;