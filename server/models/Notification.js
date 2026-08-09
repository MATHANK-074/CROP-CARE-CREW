const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Heat Alert', 'Breeding Alert', 'Pregnancy Alert', 'Follow-up Alert', 'Calving Reminder', 'System'],
    required: true
  },
  priority: {
    type: String,
    enum: ['High Priority', 'Attention Required', 'Reminder', 'Information'],
    default: 'Information'
  },
  relatedLivestock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Livestock'
  },
  read: {
    type: Boolean,
    default: false
  },
  reviewed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
