const SESSION_COOKIE = 'eod_session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/*
 * Sessions are stateless signed cookies (expiry + HMAC-SHA256 signature)
 * instead of a server-side session store, so verification works the same
 * way in both the Node runtime (API routes) and the Edge runtime
 * (middleware) without sharing in-memory state between them.
 */

function getSecret() {
  return process.env.SESSION_SECRET || process.env.SITE_PIN || 'insecure-dev-secret';
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function signPayload(payload) {
  const key = await getHmacKey(getSecret());
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toHex(sigBuffer);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function createSessionToken() {
  const expiry = Date.now() + SESSION_MAX_AGE_MS;
  const payload = String(expiry);
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

async function verifySessionToken(token) {
  if (!token) return false;
  const [expiryStr, signature] = token.split('.');
  if (!expiryStr || !signature) return false;

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  const expectedSignature = await signPayload(expiryStr);
  return timingSafeEqual(expectedSignature, signature);
}

module.exports = {
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  createSessionToken,
  verifySessionToken,
};
