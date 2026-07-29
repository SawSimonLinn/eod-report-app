import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_MAX_AGE_MS, createSessionToken } from '../../../lib/auth';

export async function POST(request) {
  const SITE_PIN = process.env.SITE_PIN;
  if (!SITE_PIN) {
    return NextResponse.json({ error: 'Server is missing SITE_PIN. Add it to the .env file.' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const { pin } = body || {};
  if (!pin || pin !== SITE_PIN) {
    return NextResponse.json({ error: 'Incorrect PIN. Please try again.' }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    path: '/',
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
