const PLATFORMS = ['instagram', 'youtube', 'facebook'];

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB per SRS

const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
]);

// Upper bounds for user-editable content fields
const FIELD_LIMITS = {
  caption: 5000,
  title: 150,
  description: 5000,
  hook: 500,
  cta: 500,
  thumbnailText: 100,
  tone: 100,
  audience: 200,
  goal: 200,
  contentType: 40,
};

const MAX_TAGS = 30;

module.exports = { PLATFORMS, MAX_UPLOAD_BYTES, ALLOWED_MIMES, FIELD_LIMITS, MAX_TAGS };
