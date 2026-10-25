const mongoose = require('mongoose');
const { LocalizedText } = require('./shared');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['recommendation_ready', 'review_completed', 'new_review_item', 'reminder', 'system'],
      required: true,
    },
    title: { type: LocalizedText, required: true },
    body: { type: LocalizedText, default: () => ({}) },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
