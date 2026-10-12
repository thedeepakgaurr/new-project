const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');
const config = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const mediaRoutes = require('./routes/media');
const contentRoutes = require('./routes/content');
const savedRoutes = require('./routes/saved');
const historyRoutes = require('./routes/history');

const app = express();

if (config.trustProxy) app.set('trust proxy', config.trustProxy);

app.use(helmet());
// Bearer tokens, not cookies, so no credentials. Unset CLIENT_URL allows any origin (dev only).
app.use(cors({ origin: config.clientUrls.length ? config.clientUrls : true }));
app.use(compression());
if (!config.isTest) app.use(morgan(config.isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '200kb' }));

// Liveness + DB readiness for load balancers / uptime monitors
const health = (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'up' : 'down' });
};
app.get('/health', health);
app.get('/api/health', health);

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/history', historyRoutes);

app.use(notFound);
// Central error handler (incl. multer fileSize / fileFilter errors)
app.use(errorHandler);

module.exports = app;
