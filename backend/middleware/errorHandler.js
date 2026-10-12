const config = require('../config/env');
const { MAX_UPLOAD_BYTES } = require('../utils/constants');

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Map known error shapes to client-safe responses; never leak internals on 5xx
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message;

  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = `File too large. The maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`;
  } else if (err.name === 'MulterError') {
    status = 400;
    message = 'Upload a single file in the "media" field.';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id.';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors || {})[0]?.message || 'Invalid data.';
  } else if (err.code === 11000) {
    status = 409;
    message = 'This record already exists.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large.';
  }

  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    if (!err.expose) message = 'Something went wrong on our side. Please try again.';
  }

  const body = { message };
  if (err.details) body.details = err.details;
  if (!config.isProd && status >= 500 && !err.expose) body.debug = err.message;
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
