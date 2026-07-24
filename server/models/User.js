const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true }, 
  profile_img: { type: String, required: false }, 
  preferred_language: { type: String, required: false, default: 'en' },
  notifications_enabled: { type: Boolean, required: false, default: true },
  farm_size:{type: Number, required: false, default: 0}, // in acres
  soilType: { type: String, required: false, default: 'Loam' },
  primaryCrop: { type: String, required: false, default: 'Corn' },
  farmingExperience: { type: String, required: false, default: 'Beginner' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  }
});

userSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('User', userSchema);