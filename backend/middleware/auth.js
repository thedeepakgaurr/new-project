const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

// Verify "Authorization: Bearer <token>", attach user to req
async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Please sign in to continue.' });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    } catch {
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    }
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    // Tokens issued before a password change are no longer valid
    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    }
    req.user = user;
    req.userId = user._id;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = auth;
