const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../server');

const originalFetch = global.fetch;
const originalKey = process.env.OPENAI_API_KEY;
const originalPin = process.env.SITE_PIN;

function mockOpenAI(handler) {
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    return handler(body);
  };
}

function okResponse(reportText) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: reportText } }] }),
  };
}

// Each call gets a brand new session (and therefore a fresh rate-limit bucket).
async function authedCookie() {
  const res = await request(app).post('/api/pin').send({ pin: 'test-pin' });
  const setCookie = res.headers['set-cookie'];
  return setCookie[0].split(';')[0];
}

beforeEach(() => {
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.SITE_PIN = 'test-pin';
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
  if (originalPin === undefined) delete process.env.SITE_PIN;
  else process.env.SITE_PIN = originalPin;
});

test('returns 500 when OPENAI_API_KEY is missing', async () => {
  const cookie = await authedCookie();
  delete process.env.OPENAI_API_KEY;

  const res = await request(app).post('/api/generate').set('Cookie', cookie).send({ store: 'FM265 PUYALLUP' });

  assert.equal(res.status, 500);
  assert.match(res.body.error, /OPENAI_API_KEY/);
});

test('returns the generated report on success', async () => {
  const cookie = await authedCookie();
  mockOpenAI(() => okResponse('Store: FM265 PUYALLUP\n• Issues: No issues today.'));

  const res = await request(app).post('/api/generate').set('Cookie', cookie).send({
    store: 'FM265 PUYALLUP',
    issues: 'busy today',
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.report, 'Store: FM265 PUYALLUP\n• Issues: No issues today.');
});

test('defaults to the short system prompt when length is not "long"', async () => {
  const cookie = await authedCookie();
  let sentMessages;
  mockOpenAI((body) => {
    sentMessages = body.messages;
    return okResponse('report text');
  });

  await request(app).post('/api/generate').set('Cookie', cookie).send({ store: 'FM041 BONNEY LAKE' });

  assert.match(sentMessages[0].content, /short, simple end-of-day store reports/);
});

test('uses the long system prompt when length is "long"', async () => {
  const cookie = await authedCookie();
  let sentMessages;
  mockOpenAI((body) => {
    sentMessages = body.messages;
    return okResponse('report text');
  });

  await request(app).post('/api/generate').set('Cookie', cookie).send({ store: 'FM041 BONNEY LAKE', length: 'long' });

  assert.match(sentMessages[0].content, /longer, more natural update/);
});

test('defaults clock-out time to 5:00pm when not provided', async () => {
  const cookie = await authedCookie();
  let sentMessages;
  mockOpenAI((body) => {
    sentMessages = body.messages;
    return okResponse('report text');
  });

  await request(app).post('/api/generate').set('Cookie', cookie).send({ store: 'FM186 LACEY' });

  assert.match(sentMessages[1].content, /Clock-out Time input: 5:00pm/);
});

test('passes through a provided clock-out time instead of the default', async () => {
  const cookie = await authedCookie();
  let sentMessages;
  mockOpenAI((body) => {
    sentMessages = body.messages;
    return okResponse('report text');
  });

  await request(app).post('/api/generate').set('Cookie', cookie).send({ store: 'FM186 LACEY', clockOut: '6:15pm, no break' });

  assert.match(sentMessages[1].content, /Clock-out Time input: 6:15pm, no break/);
});

test('surfaces the OpenAI error message and status when the request fails', async () => {
  const cookie = await authedCookie();
  global.fetch = async () => ({
    ok: false,
    status: 429,
    json: async () => ({ error: { message: 'Rate limit exceeded' } }),
  });

  const res = await request(app).post('/api/generate').set('Cookie', cookie).send({ store: 'FM603 SHELTON' });

  assert.equal(res.status, 429);
  assert.equal(res.body.error, 'Rate limit exceeded');
});

test('returns 500 when OpenAI responds with no text content', async () => {
  const cookie = await authedCookie();
  mockOpenAI(() => ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: '' } }] }),
  }));

  const res = await request(app).post('/api/generate').set('Cookie', cookie).send({ store: 'FM604 SPANAWAY' });

  assert.equal(res.status, 500);
  assert.match(res.body.error, /No text came back/);
});

test('returns 500 when fetch itself throws', async () => {
  const cookie = await authedCookie();
  global.fetch = async () => {
    throw new Error('network down');
  };

  const res = await request(app).post('/api/generate').set('Cookie', cookie).send({ store: 'FM615 UNIVERSITY PLACE' });

  assert.equal(res.status, 500);
  assert.match(res.body.error, /Something went wrong/);
});

test('rejects /api/generate with no session cookie', async () => {
  const res = await request(app).post('/api/generate').send({ store: 'FM665 SUMNER' });

  assert.equal(res.status, 401);
  assert.match(res.body.error, /PIN required/);
});

test('allows exactly 10 generations per hour then blocks the 11th', async () => {
  const cookie = await authedCookie();
  mockOpenAI(() => okResponse('report text'));

  for (let i = 0; i < 10; i++) {
    const res = await request(app).post('/api/generate').set('Cookie', cookie).send({ store: 'FM691 GIG HARBOR' });
    assert.equal(res.status, 200, `request ${i + 1} should succeed`);
  }

  const blocked = await request(app).post('/api/generate').set('Cookie', cookie).send({ store: 'FM691 GIG HARBOR' });
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.error, /10 reports per hour/);
});
