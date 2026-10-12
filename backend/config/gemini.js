const { GoogleGenAI } = require('@google/genai');
const config = require('./env');
const HttpError = require('../utils/httpError');

let client = null;

// Lazily create the client so a missing key fails only when AI is called
function getGenAI() {
  if (client) return client;
  if (!config.gemini.apiKey) {
    throw new HttpError(503, 'AI generation is not configured on the server.');
  }
  client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return client;
}

module.exports = { getGenAI };
