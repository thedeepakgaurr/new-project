const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const config = require('../config/env');
const { deleteUserData } = require('../services/cleanup');

const router = express.Router();

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown so response time doesn't reveal it
const DUMMY_HASH = bcrypt.hashSync('timing-safe-placeholder', BCRYPT_ROUNDS);

function signToken(id) {
  return jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn, algorithm: 'HS256' });
}

const nameRule = () =>
  body('name')
    .trim()
    .notEmpty().withMessage('Please enter your name.')
    .isLength({ max: 80 }).withMessage('Name must be 80 characters or fewer.');

const newPasswordRule = (field) =>
  body(field)
    .isString()
    .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters.')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter.')
    .matches(/\d/).withMessage('Password must contain at least one number.');

// POST /api/auth/register — { name, email, password }
router.post(
  '/register',
  authLimiter,
  [
    nameRule(),
    body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    newPasswordRule('password'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      if (await User.exists({ email })) {
        return res.status(409).json({ message: 'An account with this email already exists. Try signing in.' });
      }
      const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const user = await User.create({ name, email, password: hashed });
      res.status(201).json({ token: signToken(user._id), user: user.toPublic() });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'An account with this email already exists. Try signing in.' });
      }
      next(err);
    }
  }
);

// POST /api/auth/login — { email, password }
router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('password').isString().notEmpty().withMessage('Please enter your password.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      const ok = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
      if (!user || !ok) return res.status(401).json({ message: 'Incorrect email or password.' });
      res.json({ token: signToken(user._id), user: user.toPublic() });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout — stateless JWT: client discards token
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/profile and /api/auth/me — protected
router.get(['/profile', '/me'], auth, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

// PATCH /api/auth/me — { name }
router.patch('/me', auth, [nameRule()], validate, async (req, res, next) => {
  try {
    req.user.name = req.body.name;
    await req.user.save();
    res.json({ user: req.user.toPublic() });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/password — { currentPassword, newPassword }; returns a fresh token
router.put(
  '/password',
  auth,
  authLimiter,
  [body('currentPassword').isString().notEmpty().withMessage('Please enter your current password.'), newPasswordRule('newPassword')],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.userId).select('+password');
      if (!(await bcrypt.compare(req.body.currentPassword, user.password))) {
        return res.status(400).json({ message: 'Your current password is incorrect.' });
      }
      user.password = await bcrypt.hash(req.body.newPassword, BCRYPT_ROUNDS);
      user.passwordChangedAt = new Date();
      await user.save();
      res.json({ message: 'Password updated.', token: signToken(user._id) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/auth/me — { password }; removes the account and everything it owns
router.delete(
  '/me',
  auth,
  authLimiter,
  [body('password').isString().notEmpty().withMessage('Please enter your password to confirm.')],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.userId).select('+password');
      if (!(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(400).json({ message: 'Incorrect password.' });
      }
      await deleteUserData(user._id);
      await user.deleteOne();
      res.json({ message: 'Your account has been deleted.' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
