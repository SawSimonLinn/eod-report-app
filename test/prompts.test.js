const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  SHORT_SYSTEM_PROMPT,
  LONG_SYSTEM_PROMPT,
  buildEodUserContent,
  clampReceiptCount,
  buildExpenseUserContent,
} = require('../lib/prompts');

test('SHORT_SYSTEM_PROMPT mentions short, simple reports', () => {
  assert.match(SHORT_SYSTEM_PROMPT, /short, simple end-of-day store reports/);
});

test('LONG_SYSTEM_PROMPT mentions a longer, more natural update', () => {
  assert.match(LONG_SYSTEM_PROMPT, /longer, more natural update/);
});

test('buildEodUserContent defaults clock-out time to 5:00pm when not provided', () => {
  const content = buildEodUserContent({ store: 'FM186 LACEY' });
  assert.match(content, /Clock-out Time input: 5:00pm/);
});

test('buildEodUserContent passes through a provided clock-out time', () => {
  const content = buildEodUserContent({ store: 'FM186 LACEY', clockOut: '6:15pm, no break' });
  assert.match(content, /Clock-out Time input: 6:15pm, no break/);
});

test('buildEodUserContent marks missing fields as not given', () => {
  const content = buildEodUserContent({});
  assert.match(content, /Store name: \(not given\)/);
  assert.match(content, /Issues input: \(not given\)/);
});

test('clampReceiptCount clamps to the 1-20 range', () => {
  assert.equal(clampReceiptCount(0), 1);
  assert.equal(clampReceiptCount(-5), 1);
  assert.equal(clampReceiptCount(99), 20);
  assert.equal(clampReceiptCount(7), 7);
  assert.equal(clampReceiptCount('not-a-number'), 1);
});

test('buildExpenseUserContent includes the clamped receipt count and per-receipt notes', () => {
  const content = buildExpenseUserContent({
    prompt: 'gas for the week',
    receiptCount: 2,
    receiptPrompts: ['Shell fill-up', 'Costco fill-up'],
    today: '2026-07-28',
  });
  assert.match(content, /Number of receipts to generate: 2/);
  assert.match(content, /Receipt 1: Shell fill-up/);
  assert.match(content, /Receipt 2: Costco fill-up/);
  assert.match(content, /Today's date: 2026-07-28/);
});

test('buildExpenseUserContent falls back to a placeholder note when none is given', () => {
  const content = buildExpenseUserContent({ receiptCount: 1, receiptPrompts: [] });
  assert.match(content, /Receipt 1: \(no extra note given, use your best judgement\)/);
});
