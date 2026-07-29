const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { isRateLimited, resetRateLimit, RATE_LIMIT_MAX } = require('../lib/rateLimit');

beforeEach(() => {
  resetRateLimit();
});

test('allows requests under the limit', () => {
  for (let i = 0; i < RATE_LIMIT_MAX; i++) {
    assert.equal(isRateLimited('token-a'), false, `request ${i + 1} should be allowed`);
  }
});

test('blocks the request after the limit is reached', () => {
  for (let i = 0; i < RATE_LIMIT_MAX; i++) isRateLimited('token-b');
  assert.equal(isRateLimited('token-b'), true);
});

test('tracks separate keys independently', () => {
  for (let i = 0; i < RATE_LIMIT_MAX; i++) isRateLimited('token-c');
  assert.equal(isRateLimited('token-c'), true);
  assert.equal(isRateLimited('token-d'), false);
});
