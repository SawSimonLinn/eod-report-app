# End of Day Report App

A Next.js (App Router) app for store staff to generate two kinds of reports from a few rough notes, ready to paste elsewhere:

- **End of Day Report** — a store update for the group chat.
- **Gas Expense Report** — a company gas/fuel reimbursement report, with a main summary plus one entry per receipt.

Uses the OpenAI API from server-side Route Handlers, so the API key never reaches the browser.

## Setup

1. Install [Node.js](https://nodejs.org) (v18.18+; the app is developed against v22).
2. Open a terminal in this folder and run:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
4. Open `.env` and fill in:
   - `OPENAI_API_KEY` — your real OpenAI API key.
   - `SITE_PIN` — the PIN staff enter to unlock the app.
   - `SESSION_SECRET` — optional; used to sign session cookies. Falls back to `SITE_PIN` if unset. Set a long random value in production.
5. Start the app in development:
   ```
   npm run dev
   ```
6. Open `http://localhost:3000` in a browser.

For a production-like run:
```
npm run build
npm start
```

## Deploying so all 10+ stores can use it

Host it anywhere that runs Node (Render, Railway, a VPS, Vercel, etc.) and set `OPENAI_API_KEY`, `SITE_PIN`, and `SESSION_SECRET` as environment variables there (not in a committed `.env` file). Then share the live URL with the stores.

## How it works

- **Access:** a `proxy.js` (Next.js's Route Handler-adjacent request gate, formerly called "middleware") checks for a signed session cookie on every request. Missing/invalid → redirected to `/pin` for pages, or a `401` for API routes. `POST /api/pin` checks the entered PIN against `SITE_PIN` and issues a stateless, HMAC-signed cookie (no server-side session store, so it works the same in the Edge-run proxy and the Node-run API routes).
- **End of Day Report** (`/`): staff fill in Store Name, Issues, Equipment/Facilities, Store Conditions, Clock-out Time, and Note. All fields except Store Name are optional. `POST /api/generate` asks OpenAI to write the report in simple English, in the group-chat bullet format, filling in a varied "nothing to report" line for any blank field.
- **Gas Expense Report** (`/expense`): staff describe the expense, choose how many receipts they have, and optionally add a note per receipt. `POST /api/generate-expense` asks OpenAI (in JSON mode) for a main report (Title / Business Purpose / Details) plus one entry per receipt (Title / Date / Price / Note), each with its own copy button.
- **History** (`/history`): the last 30 generated EOD reports are kept in the browser's `localStorage` — nothing is sent anywhere else.
- Both generation endpoints are rate-limited to 10 requests/hour per session.

## Project structure

```
app/                Next.js App Router pages, layouts, and API routes
  api/pin/          POST /api/pin — PIN check, issues the session cookie
  api/generate/     POST /api/generate — EOD report generation
  api/generate-expense/  POST /api/generate-expense — gas expense report generation
  page.js           Generate (EOD) page
  expense/page.js   Gas Expense page
  history/page.js   History page
  about/page.js     About page
  pin/page.js       PIN entry page
components/         Shared React components (Header, Footer, icons, ...)
lib/                Pure/testable logic: auth (signed cookies), rate limiting,
                     prompt building, the OpenAI client wrapper
proxy.js            Session gate, runs before every request
public/             Static assets: icons, manifest.json, sw.js
test/               node:test unit tests (lib/) and a full-stack integration
                     test that boots a real dev server against a mock OpenAI endpoint
```

Run `npm test` to run the whole suite (fast unit tests plus the integration test, which briefly starts a real Next.js dev server).
