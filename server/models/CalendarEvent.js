const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  livestock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Livestock' // Optional, event might be farm-wide
  },
  eventType: {
    type: String,
    enum: ['Calving', 'Vet Visit', 'Vaccination', 'Heat Check', 'General Task'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

calendarEventSchema.index({ user: 1, eventDate: 1 }); // Phase 4 index
calendarEventSchema.index({ user: 1, livestock: 1 }); // Phase 4 index

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
