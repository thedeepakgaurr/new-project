const mongoose = require('mongoose');
const config = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

async function start() {
  await connectDB();
  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} (${config.nodeEnv})`);
  });
  // Long AI generations must not be cut off by Node's default timeouts
  server.requestTimeout = 5 * 60 * 1000;
  server.headersTimeout = 65 * 1000;
  server.keepAliveTimeout = 61 * 1000;

  // Finish in-flight requests, then close the DB, on deploy/restart signals
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 15_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
