const { query } = require('express-validator');

const paginationRules = [
  query('page').optional().isInt({ min: 1, max: 10_000 }).withMessage('page must be a positive number.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50.').toInt(),
];

function readPagination(req, defaultLimit = 20) {
  const page = req.query.page || 1;
  const limit = req.query.limit || defaultLimit;
  return { page, limit, skip: (page - 1) * limit };
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { paginationRules, readPagination, escapeRegex };
