const mongoose = require('mongoose');

// General activity schema for tracking any type of crop activity
const activitySchema = new mongoose.Schema({
  crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  activityType: {
    type: String,
    required: true,
    enum: ['general', 'inspection', 'maintenance', 'training', 'pruning', 'thinning', 'mulching', 'other']
  },
  date: { type: Date, required: true, default: Date.now },
  duration: { type: Number, comment: "Duration in minutes" },
  personnel: [String],
  images: [String], // URLs to images
  tags: [String], // For categorization and filtering
  weather: {
    temperature: Number,
    humidity: Number,
    conditions: String
  },
  location: {
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    description: String
  }
}, { timestamps: true });

// Create indexes for better querying performance
activitySchema.index({ crop: 1, date: -1 });
activitySchema.index({ activityType: 1 });
activitySchema.index({ tags: 1 });

module.exports = mongoose.model('Activity', activitySchema);