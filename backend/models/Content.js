const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true, index: true },
    platform: { type: String, enum: ['instagram', 'youtube', 'facebook'], required: true },
    contentType: { type: String, required: true, trim: true },
    caption: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    hashtags: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    hook: { type: String, default: '' },
    cta: { type: String, default: '' },
    thumbnailText: { type: String, default: '' },
    tone: { type: String, default: '' },
    audience: { type: String, default: '' },
    goal: { type: String, default: '' },
  },
  { timestamps: true }
);

contentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Content', contentSchema);
