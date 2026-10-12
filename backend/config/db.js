const mongoose = require('mongoose');
const config = require('./env');

// Connect to MongoDB; rejects if the cluster can't be reached within the timeout
async function connectDB(uri = config.mongoUri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  if (!config.isTest) console.log('MongoDB connected');
}

module.exports = connectDB;
