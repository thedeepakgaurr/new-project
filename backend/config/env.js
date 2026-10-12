// Validates environment variables once at boot so misconfiguration fails fast
// instead of surfacing later as a confusing 500 on the first request.

// Tests supply their own env and must never pick up real credentials
if (process.env.NODE_ENV !== 'test') require('dotenv').config();

const env = process.env;
const nodeEnv = env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);
const int = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const config = {
  nodeEnv,
  isProd,
  isTest,
  port: int(env.PORT, 5000),
  clientUrls: list(env.CLIENT_URL),
  // Number of reverse proxies in front of the app (Render, Railway, Nginx...) so
  // rate limiting sees the real client IP. 0 = trust none.
  trustProxy: int(env.TRUST_PROXY, 0),
  mongoUri: env.MONGO_URI || env.MONGODB_URI || '',
  jwtSecret: env.JWT_SECRET || '',
  jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
  gemini: {
    apiKey: env.GEMINI_API_KEY || '',
    model: env.GEMINI_MODEL || 'gemini-2.5-flash',
    timeoutMs: int(env.GEMINI_TIMEOUT_MS, 90_000),
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: env.CLOUDINARY_API_KEY || '',
    apiSecret: env.CLOUDINARY_API_SECRET || '',
    folder: env.CLOUDINARY_FOLDER || 'socialboost',
  },
  limits: {
    authPer15Min: int(env.RATE_LIMIT_AUTH_PER_15MIN, 20),
    aiPerHour: int(env.RATE_LIMIT_AI_PER_HOUR, 60),
    apiPer15Min: int(env.RATE_LIMIT_API_PER_15MIN, 600),
  },
};

function validate() {
  const missing = [];
  if (!config.mongoUri) missing.push('MONGO_URI');
  if (!config.jwtSecret) missing.push('JWT_SECRET');
  if (isProd) {
    if (!config.gemini.apiKey) missing.push('GEMINI_API_KEY');
    if (!config.cloudinary.cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!config.cloudinary.apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!config.cloudinary.apiSecret) missing.push('CLOUDINARY_API_SECRET');
    if (!config.clientUrls.length) missing.push('CLIENT_URL');
  }
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (isProd && config.jwtSecret.length < 32) {
    console.warn('[config] JWT_SECRET is shorter than 32 characters — use a long random value in production.');
  }
}

validate();

module.exports = config;
