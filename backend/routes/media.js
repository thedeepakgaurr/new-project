const express = require('express');
const { param } = require('express-validator');
const cloudinary = require('../config/cloudinary');
const config = require('../config/env');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { aiLimiter } = require('../middleware/rateLimit');
const Media = require('../models/Media');
const HttpError = require('../utils/httpError');
const { deleteMedia } = require('../services/cleanup');

const router = express.Router();
router.use(auth);

const idRule = param('id').isMongoId().withMessage('Invalid media id.');

// Upload a buffer to Cloudinary (memoryStorage -> upload_stream). An explicit
// resource_type makes Cloudinary reject files that aren't really images/videos.
function uploadBuffer(buffer, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: config.cloudinary.folder, resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// POST /api/media/upload — single file field "media"
router.post('/upload', aiLimiter, upload.single('media'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please choose an image or video to upload.' });
    const mediaType = req.file.mimetype.startsWith('image') ? 'image' : 'video';
    let result;
    try {
      result = await uploadBuffer(req.file.buffer, mediaType);
    } catch (err) {
      console.error('Cloudinary upload failed:', err.message || err);
      throw new HttpError(
        err.http_code === 400 ? 422 : 502,
        err.http_code === 400
          ? 'This file could not be processed. It may be corrupted or not a real image/video.'
          : 'Upload failed. Please try again.'
      );
    }
    const media = await Media.create({
      userId: req.userId,
      fileUrl: result.secure_url,
      mediaType,
      mimeType: req.file.mimetype,
      size: req.file.size,
      originalName: req.file.originalname.slice(0, 200),
      cloudinaryId: result.public_id,
    });
    res.status(201).json({ media });
  } catch (err) {
    next(err);
  }
});

// GET /api/media — current user's uploads
router.get('/', async (req, res, next) => {
  try {
    const items = await Media.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(100);
    res.json({ media: items });
  } catch (err) {
    next(err);
  }
});

// GET /api/media/:id
router.get('/:id', [idRule], validate, async (req, res, next) => {
  try {
    const item = await Media.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) return res.status(404).json({ message: 'Media not found' });
    res.json({ media: item });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/media/:id
router.delete('/:id', [idRule], validate, async (req, res, next) => {
  try {
    const item = await Media.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) return res.status(404).json({ message: 'Media not found' });
    await deleteMedia(item);
    res.json({ message: 'Media deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
