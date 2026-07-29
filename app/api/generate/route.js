import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '../../../lib/auth';
import { isRateLimited } from '../../../lib/rateLimit';
import { getClientIp } from '../../../lib/net';
import { SHORT_SYSTEM_PROMPT, LONG_SYSTEM_PROMPT, buildEodUserContent } from '../../../lib/prompts';
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
    const { store, issues, equipment, conditions, clockOut, note, length } = body || {};
    const isLong = length === 'long';
    const userContent = buildEodUserContent({ store, issues, equipment, conditions, clockOut, note });

    const { ok, status, data } = await callOpenAIChat({
      apiKey: OPENAI_API_KEY,
      systemPrompt: isLong ? LONG_SYSTEM_PROMPT : SHORT_SYSTEM_PROMPT,
      userContent,
    });

    if (!ok) {
      const message = data?.error?.message || 'OpenAI request failed.';
      return NextResponse.json({ error: message }, { status });
    }

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ error: 'No text came back from OpenAI.' }, { status: 500 });
    }

    return NextResponse.json({ report: text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong generating the report.' }, { status: 500 });
  }
}
