const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, startDb, stopDb, createUser } = require('./helpers');

describe('auth', () => {
  before(startDb);
  after(stopDb);

  it('rejects weak passwords with a readable message', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'a@example.com', password: 'short' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /8 and 128 characters/);
    assert.equal(res.body.errors[0].field, 'password');
  });

  it('registers, never returns the password hash, and blocks duplicates', async () => {
    const body = { name: 'Asha', email: 'asha@example.com', password: 'secret123' };
    const res = await request(app).post('/api/auth/register').send(body);
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'asha@example.com');
    assert.equal(res.body.user.password, undefined);

    const dup = await request(app).post('/api/auth/register').send(body);
    assert.equal(dup.status, 409);
  });

  it('logs in with correct credentials only', async () => {
    const { email, password } = await createUser(request);
    const bad = await request(app).post('/api/auth/login').send({ email, password: 'wrong-pass1' });
    assert.equal(bad.status, 401);
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'x1yyyyyy' });
    assert.equal(unknown.status, 401);
    assert.equal(unknown.body.message, bad.body.message);
    const ok = await request(app).post('/api/auth/login').send({ email, password });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);
  });

  it('protects /me and accepts a valid token', async () => {
    const none = await request(app).get('/api/auth/me');
    assert.equal(none.status, 401);
    const junk = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-token');
    assert.equal(junk.status, 401);
    const { token, user } = await createUser(request);
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert.equal(me.status, 200);
    assert.equal(me.body.user._id, user._id);
  });

  it('updates the profile name', async () => {
    const { token } = await createUser(request);
    const res = await request(app).patch('/api/auth/me').set('Authorization', `Bearer ${token}`).send({ name: '  New Name ' });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, 'New Name');
  });

  it('changes the password and invalidates older tokens', async () => {
    const { token, user, password, email } = await createUser(request);
    const wrong = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'nope12345', newPassword: 'brandnew99' });
    assert.equal(wrong.status, 400);

    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword: 'brandnew99' });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);

    const stale = jwt.sign({ id: user._id, iat: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);
    const old = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${stale}`);
    assert.equal(old.status, 401);

    const login = await request(app).post('/api/auth/login').send({ email, password: 'brandnew99' });
    assert.equal(login.status, 200);
  });

  it('deletes the account only with the right password', async () => {
    const { token, password, email } = await createUser(request);
    const wrong = await request(app).delete('/api/auth/me').set('Authorization', `Bearer ${token}`).send({ password: 'nope' });
    assert.equal(wrong.status, 400);
    const ok = await request(app).delete('/api/auth/me').set('Authorization', `Bearer ${token}`).send({ password });
    assert.equal(ok.status, 200);
    const login = await request(app).post('/api/auth/login').send({ email, password });
    assert.equal(login.status, 401);
  });

  it('returns JSON 404s for unknown routes and 400 for malformed JSON', async () => {
    const res = await request(app).get('/api/nope');
    assert.equal(res.status, 404);
    assert.match(res.body.message, /Route not found/);
    const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    assert.equal(bad.status, 400);
  });
});
