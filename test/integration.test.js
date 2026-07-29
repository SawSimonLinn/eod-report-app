const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

/*
 * Full-stack integration test: builds and boots a real Next.js production
 * server (so middleware, route handlers, and cookies all run for real)
 * against a local mock OpenAI server, instead of unit-testing route handlers
 * in isolation.
 *
 * This uses `next start` rather than `next dev` because Next.js 16's dev
 * server refuses to run a second instance in the same project directory
 * (even on a different port) when one is already running -- which would
 * conflict with a developer's own `npm run dev` session.
 */

const MOCK_PORT = 3911;
const APP_PORT = 3912;
const BASE_URL = `http://127.0.0.1:${APP_PORT}`;
const PROJECT_ROOT = path.join(__dirname, '..');

let mockServer;
let nextProcess;
let mockResponder = () => ({ choices: [{ message: { content: 'mock report text' } }] });

before(async () => {
  mockServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      let parsed = {};
      try {
        parsed = JSON.parse(body || '{}');
      } catch (err) {
        // ignore
      }
      const result = mockResponder(parsed);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    });
  });
  await new Promise((resolve) => mockServer.listen(MOCK_PORT, resolve));

  const nextBin = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'next');
  // A dedicated distDir keeps this build isolated from a developer's own
  // `npm run dev` session, which uses the default .next directory.
  const testEnv = {
    ...process.env,
    OPENAI_API_KEY: 'test-key',
    OPENAI_API_BASE: `http://127.0.0.1:${MOCK_PORT}`,
    SITE_PIN: 'test-pin',
    SESSION_SECRET: 'test-secret',
    NEXT_DIST_DIR: '.next-test',
  };

  const build = spawnSync(nextBin, ['build'], { cwd: PROJECT_ROOT, env: testEnv, stdio: 'pipe' });
  if (build.status !== 0) {
    throw new Error(`next build failed:\n${build.stdout}\n${build.stderr}`);
  }

  nextProcess = spawn(nextBin, ['start', '-p', String(APP_PORT)], {
    cwd: PROJECT_ROOT,
    env: testEnv,
    stdio: 'ignore',
  });

  await waitForServer(`${BASE_URL}/pin`);
});

after(async () => {
  if (nextProcess) nextProcess.kill('SIGTERM');
  if (mockServer) await new Promise((resolve) => mockServer.close(resolve));
});

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch (err) {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${url} did not start in time`);
}

async function login() {
  const res = await fetch(`${BASE_URL}/api/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: 'test-pin' }),
  });
  const setCookie = res.headers.get('set-cookie');
  return setCookie.split(';')[0];
}

test('redirects an unauthenticated page request to the pin page', async () => {
  const res = await fetch(`${BASE_URL}/`, { redirect: 'manual' });
  assert.equal(res.status, 307);
  assert.match(res.headers.get('location'), /\/pin\?next=/);
});

test('rejects an unauthenticated API request with 401', async () => {
  const res = await fetch(`${BASE_URL}/api/generate`, { method: 'POST', body: '{}' });
  assert.equal(res.status, 401);
});

test('rejects the wrong PIN', async () => {
  const res = await fetch(`${BASE_URL}/api/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: 'wrong' }),
  });
  assert.equal(res.status, 401);
});

test('accepts the correct PIN and unlocks subsequent requests', async () => {
  const cookie = await login();
  const res = await fetch(`${BASE_URL}/`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
});

test('POST /api/generate returns the EOD report from the (mocked) model', async () => {
  mockResponder = () => ({ choices: [{ message: { content: 'Store: FM265 PUYALLUP\n• Issues: none' } }] });
  const cookie = await login();

  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ store: 'FM265 PUYALLUP', issues: 'busy today' }),
  });
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.report, 'Store: FM265 PUYALLUP\n• Issues: none');
});

test('POST /api/generate-expense returns the parsed report and receipts from the (mocked) model', async () => {
  const sample = {
    report: {
      title: 'Gas Reimbursement',
      receiptsTitle: 'Gas Reimbursement Receipts',
      businessPurpose: 'Driving between stores.',
      comment: 'Comment.',
    },
    receipts: [
      { receiptTitle: 'Receipt 1', expenseTitle: 'Fuel - Weekly Route', note: 'Fill-up for the weekly driving route between stores.' },
    ],
  };
  mockResponder = () => ({ choices: [{ message: { content: JSON.stringify(sample) } }] });
  const cookie = await login();

  const res = await fetch(`${BASE_URL}/api/generate-expense`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ prompt: 'gas for the week', receiptCount: 1, receiptPrompts: ['Shell fill-up'] }),
  });
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.deepEqual(data, sample);
});

test('returns 500 when the model response is not valid JSON for the expense route', async () => {
  mockResponder = () => ({ choices: [{ message: { content: 'not json' } }] });
  const cookie = await login();

  const res = await fetch(`${BASE_URL}/api/generate-expense`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ prompt: 'test', receiptCount: 1 }),
  });
  const data = await res.json();

  assert.equal(res.status, 500);
  assert.match(data.error, /Could not parse/);
});
