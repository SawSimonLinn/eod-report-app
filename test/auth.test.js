const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { createSessionToken, verifySessionToken } = require('../lib/auth');

const originalSecret = process.env.SESSION_SECRET;
const originalPin = process.env.SITE_PIN;

beforeEach(() => {
  process.env.SESSION_SECRET = 'test-secret';
});

afterEach(() => {
  if (originalSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = originalSecret;
  if (originalPin === undefined) delete process.env.SITE_PIN;
  else process.env.SITE_PIN = originalPin;
});

test('a freshly created token verifies as valid', async () => {
  const token = await createSessionToken();
  assert.equal(await verifySessionToken(token), true);
});

test('rejects a missing token', async () => {
  assert.equal(await verifySessionToken(undefined), false);
  assert.equal(await verifySessionToken(''), false);
});

test('rejects a malformed token', async () => {
  assert.equal(await verifySessionToken('not-a-valid-token'), false);
});

test('rejects a tampered signature', async () => {
  const token = await createSessionToken();
  const [expiry] = token.split('.');
  const tampered = `${expiry}.deadbeef`;
  assert.equal(await verifySessionToken(tampered), false);
});

test('rejects an expired token', async () => {
  const expiry = Date.now() - 1000;
  const { verifySessionToken: verify } = require('../lib/auth');
  // Build an expired token with a correctly computed signature by temporarily
  // forging the payload through the same signing path createSessionToken uses.
  const pastToken = await forgeExpiredToken(expiry);
  assert.equal(await verify(pastToken), false);
});

test('a token signed with a different secret does not verify', async () => {
  const token = await createSessionToken();
  process.env.SESSION_SECRET = 'a-different-secret';
  assert.equal(await verifySessionToken(token), false);
});

async function forgeExpiredToken(expiry) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(process.env.SESSION_SECRET || process.env.SITE_PIN || 'insecure-dev-secret'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(expiry)));
  const signature = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${expiry}.${signature}`;
}
