const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  livestock: { type: mongoose.Schema.Types.ObjectId, ref: 'Livestock', required: true },
  type: { type: String, enum: ['Vaccine', 'Treatment', 'Vitamin', 'Other'], required: true },
  name: { type: String, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
