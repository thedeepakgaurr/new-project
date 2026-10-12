const { rateLimit } = require('express-rate-limit');
const config = require('../config/env');

const common = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => config.isTest,
};

// Login/register: slows down password guessing per IP
const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: config.limits.authPer15Min,
  skipSuccessfulRequests: true,
  message: { message: 'Too many sign-in attempts. Please wait a few minutes and try again.' },
});

// Uploads and AI calls cost money: limit per signed-in user (mount after auth)
const aiLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: config.limits.aiPerHour,
  keyGenerator: (req) => String(req.userId),
  message: { message: 'You have reached the hourly generation limit. Please try again later.' },
});

// Broad safety net for the whole API, per IP
const apiLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: config.limits.apiPer15Min,
  message: { message: 'Too many requests. Please slow down and try again shortly.' },
});

module.exports = { authLimiter, aiLimiter, apiLimiter };
