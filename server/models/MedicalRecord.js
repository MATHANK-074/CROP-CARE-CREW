const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  livestock: { type: mongoose.Schema.Types.ObjectId, ref: 'Livestock', required: true },
  type: { type: String, enum: ['Vaccine', 'Treatment', 'Vitamin', 'Other'], required: true },
  name: { type: String, required: true },
  date: { type: Date, default: Date.now },
  cost: { type: Number, default: 0 },
  nextDueDate: { type: Date }, // For recurring treatments or vaccines
  administeredBy: { type: String },
  notes: { type: String }
}, { timestamps: true });

medicalRecordSchema.index({ user: 1, livestock: 1, date: -1 }); // Phase 4 index

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
