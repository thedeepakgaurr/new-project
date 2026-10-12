// Shared test bootstrap: isolated env, in-memory MongoDB, and stubs for the
// two paid external services (Cloudinary, Gemini) so tests never hit them.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-signing';
process.env.MONGO_URI = 'mongodb://placeholder-overridden-in-tests';

const { Writable } = require('node:stream');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

function stub(relPath, exports) {
  const id = require.resolve(relPath);
  require.cache[id] = { id, filename: id, loaded: true, exports, children: [], paths: [] };
}

const calls = { uploads: 0, destroys: [], generations: [] };

stub('../config/cloudinary', {
  uploader: {
    upload_stream(opts, cb) {
      return new Writable({
        write(chunk, enc, done) { done(); },
        final(done) {
          calls.uploads += 1;
          cb(null, {
            secure_url: `https://res.cloudinary.test/${opts.resource_type}/${calls.uploads}.bin`,
            public_id: `socialboost/test-${calls.uploads}`,
          });
          done();
        },
      });
    },
    async destroy(publicId) {
      calls.destroys.push(publicId);
      return { result: 'ok' };
    },
  },
});

stub('../services/aiService', {
  async analyzeAndGenerate(url, mimeType, cfg) {
    calls.generations.push({ url, mimeType, cfg });
    const n = calls.generations.length;
    return {
      analysis: { objects: ['coffee cup'], scene: 'cafe', mood: 'cozy', category: 'food', keywords: ['latte'], detectedText: '' },
      caption: `Caption v${n} for ${cfg.platform}`,
      title: cfg.platform === 'youtube' ? 'A title' : '',
      description: 'Description',
      hashtags: ['coffee', 'latteart'],
      keywords: ['coffee shop'],
      hook: `Hook v${n}`,
      cta: 'Save this for later',
      thumbnailText: 'Best latte',
    };
  },
});

const connectDB = require('../config/db');
const app = require('../app');

let mongo;
async function startDb() {
  mongo = await MongoMemoryServer.create();
  await connectDB(mongo.getUri());
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

async function stopDb() {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}

let userSeq = 0;
async function createUser(request, overrides = {}) {
  userSeq += 1;
  const body = { name: `User ${userSeq}`, email: `user${userSeq}-${Date.now()}@example.com`, password: 'passw0rd!', ...overrides };
  const res = await request(app).post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { token: res.body.token, user: res.body.user, password: body.password, email: body.email };
}

module.exports = { app, calls, startDb, stopDb, createUser };
