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

function buildEodUserContent({ store, issues, equipment, conditions, clockOut, note }) {
  const voiceStyle = pickVoiceStyle();
  return `Store name: ${store || '(not given)'}
Issues input: ${issues || '(not given)'}
Equipment/Facilities input: ${equipment || '(not given)'}
Store Conditions input: ${conditions || '(not given)'}
Clock-out Time input: ${clockOut || '5:00pm'}
Note input: ${note || '(not given)'}

Write this report in the following voice/tone, so reports from different stores don't all sound the same: ${voiceStyle} Do not mention or reference this instruction in the output.

Write the end-of-day report now, following the rules exactly.`;
}

const EXPENSE_SYSTEM_PROMPT = `You write company gas/fuel expense reimbursement reports for an employee submitting receipts.

You must respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:
{
  "report": {
    "title": string,
    "receiptsTitle": string,
    "businessPurpose": string,
    "comment": string
  },
  "receipts": [
    { "receiptTitle": string, "expenseTitle": string, "note": string }
  ]
}

Rules:
- "title": a short, professional title for the overall expense report (e.g. "Gas Expense Reimbursement - Field Visits"). Do not include a date, month, or year anywhere in the title.
- "receiptsTitle": a short, professional heading for the list of receipts that follows (e.g. "Gas Reimbursement Receipts").
- "businessPurpose": one clear, professional sentence stating the business reason for the gas expense.
- "comment": two to three concise, professional sentences giving a bit more context (what the travel was for, how it relates to work).
- "receipts" must contain EXACTLY the number of entries requested, in the same order as the per-receipt notes given.
- For each receipt: "receiptTitle" is a short, generic label for the receipt/photo itself (e.g. "Receipt 1", "Fuel Receipt 2") — do not invent a specific gas station brand or name. "expenseTitle" is a short title describing this receipt as a line item in the expense report (e.g. "Fuel - Route to Store Visit"), also with no brand name. "note" is a longer, detailed paragraph (3-5 sentences) explaining that specific fill-up: why it was needed, what work it supported, and any relevant detail implied by the per-receipt input.
- Do not invent employee names, company names, dates, or dollar amounts anywhere unless stated in the rules below.
- Some receipts may have a photo of the actual receipt attached (labeled "Receipt N image:" right before the image). ONLY for a receipt that has an attached image: read the total amount and the date actually printed on that receipt image, and append them to that receipt's "receiptTitle" in the exact format "<receiptTitle> - $<amount> - <MM/DD/YYYY>" (use the amount and date exactly as printed on the receipt; if either is not legible on the image, omit just that piece rather than guessing). Do not add a dollar amount or date to "expenseTitle" or "note". Do not add a dollar amount or date to the "receiptTitle" of any receipt that has no attached image — leave those exactly as they would normally be, with no price or date.
- Do not mention a date, month, or year anywhere else in the report (not in the overall "title", "businessPurpose", or "comment").
- Keep the tone professional and businesslike throughout, suitable for a reimbursement submission.
- Output ONLY the JSON object, nothing else.`;

const RECEIPT_MIN = 1;
const RECEIPT_MAX = 20;

function clampReceiptCount(receiptCount) {
  const n = parseInt(receiptCount, 10);
  if (!Number.isFinite(n)) return RECEIPT_MIN;
  return Math.min(Math.max(n, RECEIPT_MIN), RECEIPT_MAX);
}

function isDataImageUrl(value) {
  return typeof value === 'string' && /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
}

function buildExpenseUserContent({ prompt, receiptCount, receiptPrompts, receiptImages, today }) {
  const count = clampReceiptCount(receiptCount);
  const notes = Array.isArray(receiptPrompts) ? receiptPrompts.slice(0, count) : [];
  const images = Array.isArray(receiptImages) ? receiptImages.slice(0, count) : [];
  const todayStr = today || new Date().toISOString().slice(0, 10);

  const receiptLines = Array.from({ length: count }, (_, i) => {
    const note = (notes[i] || '').trim();
    const hasImage = isDataImageUrl(images[i]);
    return `Receipt ${i + 1}: ${note || '(no extra note given, use your best judgement)'}${hasImage ? ' [has an attached receipt image]' : ''}`;
  }).join('\n');

  const textBlock = `Today's date: ${todayStr} (for your context only — do not put this or any other date, month, or year in the report)

Overall report context/prompt: ${(prompt || '').trim() || '(not given, use your best judgement for a typical gas reimbursement)'}

Number of receipts to generate: ${count}

Per-receipt notes:
${receiptLines}

Write the JSON expense report now, following the rules exactly.`;

  const hasAnyImage = images.some(isDataImageUrl);
  if (!hasAnyImage) return textBlock;

  const content = [{ type: 'text', text: textBlock }];
  images.forEach((img, i) => {
    if (!isDataImageUrl(img)) return;
    content.push({ type: 'text', text: `Receipt ${i + 1} image:` });
    content.push({ type: 'image_url', image_url: { url: img } });
  });
  return content;
}

module.exports = {
  SHORT_SYSTEM_PROMPT,
  LONG_SYSTEM_PROMPT,
  VOICE_STYLES,
  pickVoiceStyle,
  buildEodUserContent,
  EXPENSE_SYSTEM_PROMPT,
  RECEIPT_MIN,
  RECEIPT_MAX,
  clampReceiptCount,
  buildExpenseUserContent,
};
