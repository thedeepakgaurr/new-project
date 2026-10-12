const express = require('express');
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { aiLimiter } = require('../middleware/rateLimit');
const Media = require('../models/Media');
const MediaAnalysis = require('../models/MediaAnalysis');
const Content = require('../models/Content');
const ContentHistory = require('../models/ContentHistory');
const SavedContent = require('../models/SavedContent');
const { analyzeAndGenerate } = require('../services/aiService');
const { deleteContent } = require('../services/cleanup');
const { PLATFORMS, FIELD_LIMITS, MAX_TAGS } = require('../utils/constants');
const { paginationRules, readPagination, escapeRegex } = require('../utils/pagination');

const router = express.Router();
router.use(auth);

const MEDIA_FIELDS = 'fileUrl mediaType mimeType originalName';
const idRule = param('id').isMongoId().withMessage('Invalid content id.');

const textRule = (field, { required = false } = {}) => {
  const chain = body(field);
  if (required) chain.trim().notEmpty().withMessage(`${field} is required.`);
  else chain.optional({ values: 'null' });
  return chain
    .isString().withMessage(`${field} must be text.`)
    .isLength({ max: FIELD_LIMITS[field] }).withMessage(`${field} must be ${FIELD_LIMITS[field]} characters or fewer.`);
};

// Accept arrays or free text ("#a #b, c") and store clean, de-duplicated lists
const tagListRule = (field, { hashtags = false } = {}) =>
  body(field)
    .optional({ values: 'null' })
    .customSanitizer((v) => {
      const parts = Array.isArray(v) ? v : String(v).split(hashtags ? /[\s,]+/ : /[,\n]+/);
      const seen = new Set();
      return parts
        .map((s) => String(s).trim())
        .map((s) => (hashtags ? s.replace(/^#+/, '') : s))
        .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()))
        .map((s) => s.slice(0, 100));
    })
    .custom((v) => v.length <= MAX_TAGS).withMessage(`${field}: up to ${MAX_TAGS} entries.`);

const configRules = (prefix = '') => [
  body(`${prefix}platform`).optional().isIn(PLATFORMS).withMessage('Platform must be Instagram, YouTube or Facebook.'),
  textRule('contentType'),
  textRule('audience'),
  textRule('tone'),
  textRule('goal'),
];

async function logHistory(userId, contentId, action) {
  return ContentHistory.create({ userId, contentId, action });
}

function mediaMime(media) {
  return media.mimeType || (media.mediaType === 'video' ? 'video/mp4' : 'image/jpeg');
}

const pickGenerated = (gen) => ({
  caption: gen.caption,
  title: gen.title,
  description: gen.description,
  hashtags: gen.hashtags,
  keywords: gen.keywords,
  hook: gen.hook,
  cta: gen.cta,
  thumbnailText: gen.thumbnailText,
});

// POST /api/content/generate — analyse media + generate content via Gemini
router.post(
  '/generate',
  aiLimiter,
  [
    body('mediaId').isMongoId().withMessage('Please upload a file first.'),
    body('platform').isIn(PLATFORMS).withMessage('Platform must be Instagram, YouTube or Facebook.'),
    textRule('contentType', { required: true }),
    textRule('audience'),
    textRule('tone'),
    textRule('goal'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { mediaId, platform, contentType, audience = '', tone = '', goal = '' } = req.body;
      const media = await Media.findOne({ _id: mediaId, userId: req.userId });
      if (!media) return res.status(404).json({ message: 'Media not found. Please upload the file again.' });

      const gen = await analyzeAndGenerate(media.fileUrl, mediaMime(media), { platform, contentType, audience, tone, goal });

      const analysis = await MediaAnalysis.create({ mediaId: media._id, ...gen.analysis });
      const content = await Content.create({
        userId: req.userId,
        mediaId: media._id,
        platform,
        contentType,
        ...pickGenerated(gen),
        tone,
        audience,
        goal,
      });
      await logHistory(req.userId, content._id, 'created');
      res.status(201).json({ content, analysis });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/content/stats — dashboard counters
router.get('/stats', async (req, res, next) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [byPlatform, saved, lastWeek] = await Promise.all([
      Content.aggregate([{ $match: { userId: req.userId } }, { $group: { _id: '$platform', count: { $sum: 1 } } }]),
      SavedContent.countDocuments({ userId: req.userId }),
      Content.countDocuments({ userId: req.userId, createdAt: { $gte: weekAgo } }),
    ]);
    const counts = Object.fromEntries(PLATFORMS.map((p) => [p, 0]));
    byPlatform.forEach((row) => { counts[row._id] = row.count; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    res.json({ total, saved, lastWeek, byPlatform: counts });
  } catch (err) {
    next(err);
  }
});

// GET /api/content/history/mine — must be declared before /:id
router.get('/history/mine', paginationRules, validate, async (req, res, next) => {
  try {
    const { limit, skip } = readPagination(req);
    const history = await ContentHistory.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('contentId');
    res.json({ history });
  } catch (err) {
    next(err);
  }
});

// GET /api/content?page&limit&platform&q — current user's content
router.get(
  '/',
  [...paginationRules, query('platform').optional().isIn(PLATFORMS), query('q').optional().isString().isLength({ max: 100 })],
  validate,
  async (req, res, next) => {
    try {
      const { page, limit, skip } = readPagination(req);
      const filter = { userId: req.userId };
      if (req.query.platform) filter.platform = req.query.platform;
      if (req.query.q) {
        const rx = new RegExp(escapeRegex(req.query.q.trim()), 'i');
        filter.$or = [{ caption: rx }, { title: rx }, { hook: rx }, { contentType: rx }];
      }
      const [items, total] = await Promise.all([
        Content.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('mediaId', MEDIA_FIELDS),
        Content.countDocuments(filter),
      ]);
      res.json({ content: items, page, limit, total, hasMore: skip + items.length < total });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/content/:id — includes the latest analysis and saved state
router.get('/:id', [idRule], validate, async (req, res, next) => {
  try {
    const item = await Content.findOne({ _id: req.params.id, userId: req.userId }).populate('mediaId', MEDIA_FIELDS);
    if (!item) return res.status(404).json({ message: 'Content not found' });
    const [analysis, saved] = await Promise.all([
      MediaAnalysis.findOne({ mediaId: item.mediaId?._id || item.mediaId }).sort({ createdAt: -1 }),
      SavedContent.findOne({ userId: req.userId, contentId: item._id }).select('_id'),
    ]);
    res.json({ content: item, analysis, savedId: saved?._id || null });
  } catch (err) {
    next(err);
  }
});

// PUT /api/content/:id — manual edit
router.put(
  '/:id',
  [
    idRule,
    ...configRules(),
    ...['caption', 'title', 'description', 'hook', 'cta', 'thumbnailText'].map((f) => textRule(f)),
    tagListRule('hashtags', { hashtags: true }),
    tagListRule('keywords'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const item = await Content.findOne({ _id: req.params.id, userId: req.userId });
      if (!item) return res.status(404).json({ message: 'Content not found' });
      const fields = [
        'caption', 'title', 'description', 'hashtags', 'keywords',
        'hook', 'cta', 'thumbnailText', 'tone', 'audience', 'goal',
        'platform', 'contentType',
      ];
      fields.forEach((f) => {
        if (req.body[f] !== undefined && req.body[f] !== null) item[f] = req.body[f];
      });
      await item.save();
      await logHistory(req.userId, item._id, 'edited');
      await item.populate('mediaId', MEDIA_FIELDS);
      res.json({ content: item });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/content/:id — also removes saved/history rows and unused media
router.delete('/:id', [idRule], validate, async (req, res, next) => {
  try {
    const item = await Content.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) return res.status(404).json({ message: 'Content not found' });
    await deleteContent(item);
    res.json({ message: 'Content deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/content/:id/regenerate — re-call Gemini with same media + config
router.post('/:id/regenerate', aiLimiter, [idRule, ...configRules()], validate, async (req, res, next) => {
  try {
    const item = await Content.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) return res.status(404).json({ message: 'Content not found' });
    const media = await Media.findOne({ _id: item.mediaId, userId: req.userId });
    if (!media) return res.status(404).json({ message: 'The original media for this content no longer exists.' });

    const cfg = {
      platform: req.body.platform || item.platform,
      contentType: req.body.contentType || item.contentType,
      audience: req.body.audience ?? item.audience,
      tone: req.body.tone || item.tone,
      goal: req.body.goal ?? item.goal,
    };
    const gen = await analyzeAndGenerate(media.fileUrl, mediaMime(media), {
      ...cfg,
      previous: { caption: item.caption, hook: item.hook },
    });

    Object.assign(item, cfg, pickGenerated(gen));
    await item.save();
    const analysis = await MediaAnalysis.create({ mediaId: media._id, ...gen.analysis });
    await logHistory(req.userId, item._id, 'regenerated');
    await item.populate('mediaId', MEDIA_FIELDS);
    res.json({ content: item, analysis });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
