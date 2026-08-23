const mongoose = require('mongoose');

const farmSettingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  milkSellingPricePerLitre: {
    type: Number,
    required: false
  },
  currency: {
    type: String,
    default: 'INR'
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  priceHistory: [
    {
      price: { type: Number, required: true },
      effectiveFrom: { type: Date, required: true },
      effectiveTo: { type: Date },
      updatedBy: { type: String, default: 'Admin' }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('FarmSetting', farmSettingSchema);
