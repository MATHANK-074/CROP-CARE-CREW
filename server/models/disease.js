const mongoose = require('mongoose');

const DiseaseAlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  disease: String,
  description: String,
  // Bilingual support
  bilingualData: {
    english: {
      disease: String,
      description: String
    },
    tamil: {
      disease: String,
      description: String
    },
    // Optional: Hindi localization (frontend already checks for 'hindi')
    hindi: {
      disease: String,
      description: String
    }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  readAt: { type: Date }
});
// Geo index for proximity queries
DiseaseAlertSchema.index({ location: '2dsphere' });

// Bilingual data structure preserved but no auto-translation

module.exports = mongoose.model('DiseaseAlert', DiseaseAlertSchema);