require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Server is missing OPENAI_API_KEY. Add it to the .env file.' });
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

app.listen(PORT, () => {
  console.log(`EOD report app running at http://localhost:${PORT}`);
});
