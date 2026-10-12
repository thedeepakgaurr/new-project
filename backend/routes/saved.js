const express = require('express');
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const SavedContent = require('../models/SavedContent');
const Content = require('../models/Content');

const router = express.Router();
router.use(auth);

const populateContent = {
  path: 'contentId',
  populate: { path: 'mediaId', select: 'fileUrl mediaType' },
};

// POST /api/saved — { contentId }; idempotent
router.post(
  '/',
  [body('contentId').isMongoId().withMessage('Invalid content id.')],
  validate,
  async (req, res, next) => {
    try {
      const { contentId } = req.body;
      // Only the owner may save their content — otherwise /saved would leak it
      const content = await Content.exists({ _id: contentId, userId: req.userId });
      if (!content) return res.status(404).json({ message: 'Content not found' });
      const existing = await SavedContent.findOne({ userId: req.userId, contentId });
      if (existing) return res.json({ saved: existing });
      const saved = await SavedContent.create({ userId: req.userId, contentId });
      res.status(201).json({ saved });
    } catch (err) {
      // Duplicate key (double click race) -> return the existing row
      if (err.code === 11000) {
        const saved = await SavedContent.findOne({ userId: req.userId, contentId: req.body.contentId });
        return res.json({ saved });
      }
      next(err);
    }
  }
);

// GET /api/saved
router.get('/', async (req, res, next) => {
  try {
    const items = await SavedContent.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(500)
      .populate(populateContent);
    res.json({ saved: items.filter((s) => s.contentId) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/saved/:id — :id is the savedId
router.delete('/:id', [param('id').isMongoId().withMessage('Invalid id.')], validate, async (req, res, next) => {
  try {
    const item = await SavedContent.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!item) return res.status(404).json({ message: 'Saved item not found' });
    res.json({ message: 'Removed from saved' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
