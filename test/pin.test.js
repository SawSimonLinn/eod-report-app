const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../server');

const originalPin = process.env.SITE_PIN;

beforeEach(() => {
  process.env.SITE_PIN = 'test-pin';
});

afterEach(() => {
  if (originalPin === undefined) delete process.env.SITE_PIN;
  else process.env.SITE_PIN = originalPin;
});

test('redirects an unauthenticated page request to pin.html', async () => {
  const res = await request(app).get('/history.html');

  assert.equal(res.status, 302);
  assert.match(res.headers.location, /^\/pin\.html\?next=/);
});

test('rejects the wrong PIN', async () => {
  const res = await request(app).post('/api/pin').send({ pin: 'wrong' });

  assert.equal(res.status, 401);
  assert.match(res.body.error, /Incorrect PIN/);
});

test('rejects when SITE_PIN is not configured', async () => {
  delete process.env.SITE_PIN;

  const res = await request(app).post('/api/pin').send({ pin: 'anything' });

  assert.equal(res.status, 500);
  assert.match(res.body.error, /SITE_PIN/);
});

test('accepts the correct PIN and unlocks subsequent requests', async () => {
  const pinRes = await request(app).post('/api/pin').send({ pin: 'test-pin' });
  assert.equal(pinRes.status, 200);
  const cookie = pinRes.headers['set-cookie'][0].split(';')[0];

  const pageRes = await request(app).get('/history.html').set('Cookie', cookie);
  assert.equal(pageRes.status, 200);
});

test('pin.html itself is reachable without a session', async () => {
  const res = await request(app).get('/pin.html');
  assert.equal(res.status, 200);
});
