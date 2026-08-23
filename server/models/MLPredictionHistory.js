const mongoose = require('mongoose');

const mlPredictionHistorySchema = new mongoose.Schema({
  animal_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Livestock',
    required: true
  },
  prediction_timestamp: {
    type: Date,
    default: Date.now
  },
  predicted_yield: {
    type: Number,
    required: true
  },
  actual_yield: {
    type: Number // Populated later when real data comes in
  },
  prediction_error: {
    type: Number
  },
  model_name: {
    type: String,
    required: true
  },
  model_version: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('MLPredictionHistory', mlPredictionHistorySchema);
