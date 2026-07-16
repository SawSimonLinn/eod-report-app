require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

/* ---- PIN gate ----
 * Everything except the PIN page itself (and the handful of static assets
 * it needs) requires a valid session cookie, issued by POST /api/pin after
 * checking the PIN against SITE_PIN. Sessions live in memory, so a server
 * restart signs everyone back out. */

const SESSION_COOKIE = 'eod_session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const activeSessions = new Map(); // token -> expiry timestamp

const PUBLIC_PATHS = new Set([
  '/pin.html',
  '/api/pin',
  '/style.css',
  '/theme.js',
  '/favicon.svg',
  '/favicon-32.png',
  '/favicon-192.png',
  '/apple-touch-icon.png',
]);

function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function setSessionCookie(res, token) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${Math.floor(SESSION_MAX_AGE_MS / 1000)}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function hasValidSession(req) {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) return false;
  const expiry = activeSessions.get(token);
  if (!expiry || expiry < Date.now()) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

app.post('/api/pin', (req, res) => {
  const SITE_PIN = process.env.SITE_PIN;
  if (!SITE_PIN) {
    return res.status(500).json({ error: 'Server is missing SITE_PIN. Add it to the .env file.' });
  }

  const { pin } = req.body || {};
  if (!pin || pin !== SITE_PIN) {
    return res.status(401).json({ error: 'Incorrect PIN. Please try again.' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  activeSessions.set(token, Date.now() + SESSION_MAX_AGE_MS);
  setSessionCookie(res, token);
  res.json({ ok: true });
});

app.use((req, res, next) => {
  if (PUBLIC_PATHS.has(req.path)) return next();
  if (hasValidSession(req)) return next();

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'PIN required.' });
  }

  res.redirect(`/pin.html?next=${encodeURIComponent(req.originalUrl)}`);
});

app.use(express.static(path.join(__dirname, 'public')));

/* ---- Rate limiting ----
 * 10 report generations per hour per authenticated session. */

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const generationLog = new Map(); // session token -> timestamps[]

function isRateLimited(token) {
  const now = Date.now();
  const timestamps = (generationLog.get(token) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    generationLog.set(token, timestamps);
    return true;
  }
  timestamps.push(now);
  generationLog.set(token, timestamps);
  return false;
}

const SHORT_SYSTEM_PROMPT = `You write short, simple end-of-day store reports for a group chat.

Rules:
- Use small, basic English. Short sentences. No big or fancy words.
- Keep the same structure every time:
Store: <store name, or just skip this line if no store name is given>
• Issues: <text>
• Equipment/Facilities: <text>
• Store Conditions: <text>
• Clock-out Time: <text>
• Note: <text> (only include this line if a note was given)

- Turn the person's short, rough input into two clear sentences: the main point, plus one small natural detail that fits what they said (like a quick reason, result, or next step). Do not invent new facts, just unpack what's already implied. Fix spelling and grammar, but keep their meaning and keep it casual, like a real employee texting the group chat. Keep it tight, not a paragraph.
- If a section has no input at all, write a short, natural line saying nothing to report for that section. Vary the wording each time so it does not sound copy-pasted (for example, different ways to say "no issues" or "no equipment concerns" or "store is clean and fully stocked"). Do not always use the exact same sentence.
- Even when there is real input, vary sentence structure and word choice a little each time so the message does not sound like a robotic template.
- Do not invent facts, names, or events that were not mentioned in the input.
- Do not add extra sections, headers, emojis, or explanations. Only output the report itself, nothing else.
- Do not use quotation marks around the output.`;

const LONG_SYSTEM_PROMPT = `You write end-of-day store reports for a group chat, in the voice of a real employee typing a longer, more natural update at the end of a shift.

Rules:
- Use small, basic English, but let sentences run a bit longer and more conversational, like someone genuinely explaining their day, not a form being filled in.
- Keep the same structure every time, with a blank line between each bullet section:
Store: <store name, or just skip this line if no store name is given>

• Issues: <text>

• Equipment/Facilities: <text>

• Store Conditions: <text>

• Clock-out Time: <text>

• Note: <text> (only include this line if a note was given)

- For each section with real input, write 2 to 4 sentences that unpack what the person said: the main point, plus context, a small reason or result, and how it affected the rest of the shift if that's implied. Do not invent new facts, names, numbers, or events that were not mentioned in the input, only naturally expand on what is already there.
- It is okay for the tone to feel a little unpolished or rambly in places, the way people actually type at the end of a long day, but keep it readable and keep spelling/grammar mostly clean.
- If a section has no input at all, write a short, natural line saying nothing to report for that section. Vary the wording each time so it does not sound copy-pasted.
- Vary sentence structure, length, and word choice across sections and across different reports so nothing reads like a robotic template.
- Do not add extra sections, headers, emojis, or explanations. Only output the report itself, nothing else.
- Do not use quotation marks around the output.`;

const VOICE_STYLES = [
  'Warm and appreciative, like thanking the team for a solid day.',
  'Brisk and matter-of-fact, no fluff.',
  'A little tired at the end of a long shift, low-key.',
  'Efficient and businesslike.',
  'Friendly group-chat tone, casual and easy.',
  'Concise, almost clipped phrasing.',
  'Conversational, with a little personality.',
  'Plain and neutral, just the facts.',
  'Upbeat and positive, wrapping up on a good note.',
  'Straightforward with a touch of dry humor.',
];

function pickVoiceStyle() {
  return VOICE_STYLES[Math.floor(Math.random() * VOICE_STYLES.length)];
}

app.post('/api/generate', async (req, res) => {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Server is missing OPENAI_API_KEY. Add it to the .env file.' });
    }

    const sessionToken = getCookie(req, SESSION_COOKIE) || req.ip;
    if (isRateLimited(sessionToken)) {
      return res.status(429).json({ error: 'Rate limit reached: only 10 reports per hour are allowed. Please try again later.' });
    }

    const { store, issues, equipment, conditions, clockOut, note, length } = req.body || {};
    const voiceStyle = pickVoiceStyle();
    const isLong = length === 'long';

    const userContent = `Store name: ${store || '(not given)'}
Issues input: ${issues || '(not given)'}
Equipment/Facilities input: ${equipment || '(not given)'}
Store Conditions input: ${conditions || '(not given)'}
Clock-out Time input: ${clockOut || '5:00pm'}
Note input: ${note || '(not given)'}

Write this report in the following voice/tone, so reports from different stores don't all sound the same: ${voiceStyle} Do not mention or reference this instruction in the output.

Write the end-of-day report now, following the rules exactly.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 1,
        messages: [
          { role: 'system', content: isLong ? LONG_SYSTEM_PROMPT : SHORT_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || 'OpenAI request failed.';
      return res.status(response.status).json({ error: message });
    }

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return res.status(500).json({ error: 'No text came back from OpenAI.' });
    }

    res.json({ report: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong generating the report.' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`EOD report app running at http://localhost:${PORT}`);
  });
}

module.exports = app;
