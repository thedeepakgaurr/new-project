const multer = require('multer');
const HttpError = require('../utils/httpError');
const { ALLOWED_MIMES, MAX_UPLOAD_BYTES } = require('../utils/constants');

// In-memory storage: file buffer is streamed to Cloudinary, nothing saved to disk
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (ALLOWED_MIMES.has(file.mimetype)) return cb(null, true);
  cb(new HttpError(415, 'Unsupported file type. Upload a JPG, PNG, WEBP, GIF, MP4, MOV, AVI or WEBM file.'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

module.exports = upload;
