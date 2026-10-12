const mongoose = require('mongoose');

const contentHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true, index: true },
    action: { type: String, enum: ['created', 'regenerated', 'edited'], required: true },
  },
  { timestamps: true }
);

contentHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ContentHistory', contentHistorySchema);
