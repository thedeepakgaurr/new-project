const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    // Real MIME type of the upload, sent to Gemini as-is (older docs fall back by mediaType)
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    originalName: { type: String, default: '' },
    cloudinaryId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Media', mediaSchema);
