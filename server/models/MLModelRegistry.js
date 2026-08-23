const mongoose = require('mongoose');

const mlModelRegistrySchema = new mongoose.Schema({
  model_name: {
    type: String,
    required: true
  },
  model_version: {
    type: String,
    required: true
  },
  model_type: {
    type: String,
    required: true
  },
  training_dataset_size: {
    type: Number,
    required: true
  },
  feature_version: {
    type: String,
    default: '1.0'
  },
  validation_method: {
    type: String,
    default: 'Rolling-Origin Time-Series Validation'
  },
  baseline_mae: {
    type: Number
  },
  baseline_rmse: {
    type: Number
  },
  model_mae: {
    type: Number
  },
  model_rmse: {
    type: Number
  },
  improvement_percentage: {
    type: Number
  },
  status: {
    type: String,
    enum: ['EXPERIMENTAL', 'VALIDATED', 'PRODUCTION', 'RETIRED'],
    default: 'EXPERIMENTAL'
  },
  training_duration: {
    type: Number // in seconds
  },
  feature_list: [{ type: String }],
  created_by: {
    type: String,
    default: 'System'
  },
  retired_at: {
    type: Date
  }
}, { timestamps: true });

// Ensure only one model per type is PRODUCTION
mlModelRegistrySchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'PRODUCTION') {
    await this.constructor.updateMany(
      { model_type: this.model_type, status: 'PRODUCTION', _id: { $ne: this._id } },
      { $set: { status: 'RETIRED', retired_at: new Date() } }
    );
  }
  next();
});

module.exports = mongoose.model('MLModelRegistry', mlModelRegistrySchema);
