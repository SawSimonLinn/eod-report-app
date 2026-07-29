import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '../../../lib/auth';
import { isRateLimited } from '../../../lib/rateLimit';
import { getClientIp } from '../../../lib/net';
import { EXPENSE_SYSTEM_PROMPT, buildExpenseUserContent } from '../../../lib/prompts';
import { callOpenAIChat } from '../../../lib/openai';

export async function POST(request) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Server is missing OPENAI_API_KEY. Add it to the .env file.' }, { status: 500 });
    }

    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value || getClientIp(request);
    if (isRateLimited(sessionToken)) {
      return NextResponse.json(
        { error: 'Rate limit reached: only 10 reports per hour are allowed. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { prompt, receiptCount, receiptPrompts, receiptImages } = body || {};

    if (Array.isArray(receiptImages)) {
      const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
      for (const img of receiptImages) {
        if (img == null) continue;
        if (typeof img !== 'string' || !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(img)) {
          return NextResponse.json({ error: 'One of the receipt images is invalid.' }, { status: 400 });
        }
        if (img.length > MAX_IMAGE_BYTES * 1.4) {
          return NextResponse.json({ error: 'A receipt image is too large. Please upload a smaller image (under 8MB).' }, { status: 400 });
        }
      }
    }

    const userContent = buildExpenseUserContent({ prompt, receiptCount, receiptPrompts, receiptImages });

    const { ok, status, data } = await callOpenAIChat({
      apiKey: OPENAI_API_KEY,
      systemPrompt: EXPENSE_SYSTEM_PROMPT,
      userContent,
      jsonMode: true,
    });

    if (!ok) {
      const message = data?.error?.message || 'OpenAI request failed.';
      return NextResponse.json({ error: message }, { status });
    }

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ error: 'No text came back from OpenAI.' }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      return NextResponse.json({ error: 'Could not parse the report from OpenAI.' }, { status: 500 });
    }

    if (!parsed?.report || !Array.isArray(parsed?.receipts)) {
      return NextResponse.json({ error: 'Report from OpenAI was missing expected fields.' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong generating the report.' }, { status: 500 });
  }
}
