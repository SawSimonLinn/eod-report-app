# End of Day Report App

A small web form for store staff to type quick updates and get a clean, ready-to-copy end-of-day report for the group chat. Uses the OpenAI API on the backend so the API key stays hidden from users.

## Setup

1. Install [Node.js](https://nodejs.org) (v18 or newer) if you don't have it.
2. Open a terminal in this folder and run:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
4. Open `.env` and paste your real OpenAI API key after `OPENAI_API_KEY=`.
5. Start the app:
   ```
   npm start
   ```
6. Open `http://localhost:3000` in a browser.

## Deploying so all 10+ stores can use it

Right now this only runs on your own computer at `localhost`. To let all stores use it from their phones, host it somewhere like Render, Railway, or a VPS, and set `OPENAI_API_KEY` as an environment variable there (not in a committed `.env` file). Then share the live URL with the stores.

## How it works

- Staff fill in Store Name, Issues, Equipment/Facilities, Store Conditions, Clock-out Time, and Note. All fields except Store Name are optional.
- Clicking "Generate Report" sends the input to the server, which asks OpenAI to write the report in simple English, in the same bullet format used in the group chat.
- If a field is left blank, the app fills in a short "nothing to report" line — worded a little differently each time so reports don't look copy-pasted.
- The "Copy to Clipboard" button copies the finished report so it can be pasted straight into the group chat.
