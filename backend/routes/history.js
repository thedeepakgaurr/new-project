const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const ContentHistory = require('../models/ContentHistory');
const { paginationRules, readPagination } = require('../utils/pagination');

const router = express.Router();
router.use(auth);

// GET /api/history?page&limit — newest first
router.get('/', paginationRules, validate, async (req, res, next) => {
  try {
    const { page, limit, skip } = readPagination(req, 30);
    const [rows, total] = await Promise.all([
      ContentHistory.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'contentId',
          select: 'platform contentType title caption hook createdAt mediaId',
          populate: { path: 'mediaId', select: 'fileUrl mediaType' },
        }),
      ContentHistory.countDocuments({ userId: req.userId }),
    ]);
    res.json({
      history: rows.filter((h) => h.contentId),
      page,
      limit,
      total,
      hasMore: skip + rows.length < total,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
