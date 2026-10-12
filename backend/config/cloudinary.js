const cloudinary = require('cloudinary').v2;
const config = require('./env');

// Cloudinary credentials come from env
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

module.exports = cloudinary;
