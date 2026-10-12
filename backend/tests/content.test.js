const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, calls, startDb, stopDb, createUser } = require('./helpers');

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

describe('content flow', () => {
  let alice;
  let bob;
  const as = (who) => (req) => req.set('Authorization', `Bearer ${who.token}`);

  before(async () => {
    await startDb();
    alice = await createUser(request);
    bob = await createUser(request);
  });
  after(stopDb);

  async function generate(who, platform = 'instagram') {
    const up = await as(who)(request(app).post('/api/media/upload')).attach('media', PNG, { filename: 'a.png', contentType: 'image/png' });
    assert.equal(up.status, 201, JSON.stringify(up.body));
    const gen = await as(who)(request(app).post('/api/content/generate')).send({
      mediaId: up.body.media._id,
      platform,
      contentType: 'Reel',
      tone: 'funny',
    });
    assert.equal(gen.status, 201, JSON.stringify(gen.body));
    return { media: up.body.media, content: gen.body.content };
  }

  it('rejects unsupported uploads and bad generate input', async () => {
    const txt = await as(alice)(request(app).post('/api/media/upload')).attach('media', Buffer.from('hi'), { filename: 'a.txt', contentType: 'text/plain' });
    assert.equal(txt.status, 415);
    const none = await as(alice)(request(app).post('/api/media/upload'));
    assert.equal(none.status, 400);
    const bad = await as(alice)(request(app).post('/api/content/generate')).send({ mediaId: 'x', platform: 'tiktok', contentType: '' });
    assert.equal(bad.status, 400);
  });

  it('uploads, generates with the real MIME type, and reports saved state', async () => {
    const { media, content } = await generate(alice);
    assert.equal(media.mimeType, 'image/png');
    assert.equal(calls.generations.at(-1).mimeType, 'image/png');
    assert.equal(content.platform, 'instagram');

    const one = await as(alice)(request(app).get(`/api/content/${content._id}`));
    assert.equal(one.status, 200);
    assert.equal(one.body.savedId, null);
    assert.equal(one.body.analysis.mood, 'cozy');
    assert.equal(one.body.content.mediaId.fileUrl, media.fileUrl);

    const save = await as(alice)(request(app).post('/api/saved')).send({ contentId: content._id });
    assert.equal(save.status, 201);
    const again = await as(alice)(request(app).post('/api/saved')).send({ contentId: content._id });
    assert.equal(again.status, 200);
    assert.equal(again.body.saved._id, save.body.saved._id);

    const after = await as(alice)(request(app).get(`/api/content/${content._id}`));
    assert.equal(after.body.savedId, save.body.saved._id);
  });

  it('parses edited hashtags/keywords from free text into clean lists', async () => {
    const { content } = await generate(alice);
    const res = await as(alice)(request(app).put(`/api/content/${content._id}`)).send({
      hashtags: '#coffee #LatteArt, #coffee  morning',
      keywords: 'coffee shop, latte art\nbarista',
      caption: 'Edited caption',
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body.content.hashtags, ['coffee', 'LatteArt', 'morning']);
    assert.deepEqual(res.body.content.keywords, ['coffee shop', 'latte art', 'barista']);
    assert.equal(res.body.content.caption, 'Edited caption');

    const invalid = await as(alice)(request(app).put(`/api/content/${content._id}`)).send({ platform: 'myspace' });
    assert.equal(invalid.status, 400);
  });

  it('regenerates with the previous output as context', async () => {
    const { content } = await generate(alice);
    const res = await as(alice)(request(app).post(`/api/content/${content._id}/regenerate`)).send({ tone: 'professional' });
    assert.equal(res.status, 200);
    assert.equal(res.body.content.tone, 'professional');
    assert.equal(calls.generations.at(-1).cfg.previous.hook, content.hook);
    assert.notEqual(res.body.content.hook, content.hook);
  });

  it('isolates users from each other', async () => {
    const { content, media } = await generate(alice);
    const get = await as(bob)(request(app).get(`/api/content/${content._id}`));
    assert.equal(get.status, 404);
    const save = await as(bob)(request(app).post('/api/saved')).send({ contentId: content._id });
    assert.equal(save.status, 404);
    const put = await as(bob)(request(app).put(`/api/content/${content._id}`)).send({ caption: 'hacked' });
    assert.equal(put.status, 404);
    const del = await as(bob)(request(app).delete(`/api/content/${content._id}`));
    assert.equal(del.status, 404);
    const gen = await as(bob)(request(app).post('/api/content/generate')).send({ mediaId: media._id, platform: 'instagram', contentType: 'Post' });
    assert.equal(gen.status, 404);
    const list = await as(bob)(request(app).get('/api/saved'));
    assert.equal(list.body.saved.length, 0);
  });

  it('returns 400 instead of 500 for malformed ids', async () => {
    const res = await as(alice)(request(app).get('/api/content/not-an-id'));
    assert.equal(res.status, 400);
    const del = await as(alice)(request(app).delete('/api/saved/123'));
    assert.equal(del.status, 400);
  });

  it('lists with pagination, filters and stats', async () => {
    const carol = await createUser(request);
    await generate(carol, 'youtube');
    await generate(carol, 'instagram');
    await generate(carol, 'instagram');

    const page = await as(carol)(request(app).get('/api/content?limit=2'));
    assert.equal(page.body.content.length, 2);
    assert.equal(page.body.total, 3);
    assert.equal(page.body.hasMore, true);

    const yt = await as(carol)(request(app).get('/api/content?platform=youtube'));
    assert.equal(yt.body.total, 1);

    const search = await as(carol)(request(app).get('/api/content?q=for youtube'));
    assert.equal(search.body.total, 1);

    const stats = await as(carol)(request(app).get('/api/content/stats'));
    assert.deepEqual(stats.body.byPlatform, { instagram: 2, youtube: 1, facebook: 0 });
    assert.equal(stats.body.total, 3);
    assert.equal(stats.body.lastWeek, 3);

    const history = await as(carol)(request(app).get('/api/history?limit=2'));
    assert.equal(history.body.history.length, 2);
    assert.equal(history.body.total, 3);
    assert.ok(history.body.history[0].contentId.mediaId.fileUrl);
  });

  it('deleting content cascades to saved, history and unused media', async () => {
    const dave = await createUser(request);
    const { content, media } = await generate(dave);
    await as(dave)(request(app).post('/api/saved')).send({ contentId: content._id });

    const del = await as(dave)(request(app).delete(`/api/content/${content._id}`));
    assert.equal(del.status, 200);

    const saved = await as(dave)(request(app).get('/api/saved'));
    assert.equal(saved.body.saved.length, 0);
    const history = await as(dave)(request(app).get('/api/history'));
    assert.equal(history.body.total, 0);
    const m = await as(dave)(request(app).get(`/api/media/${media._id}`));
    assert.equal(m.status, 404);
    assert.ok(calls.destroys.includes(media.cloudinaryId));
  });
});
