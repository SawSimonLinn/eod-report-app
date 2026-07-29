import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from './lib/auth';

const PUBLIC_PAGE_PATHS = new Set(['/pin']);
const PUBLIC_API_PATHS = new Set(['/api/pin']);

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PAGE_PATHS.has(pathname) || PUBLIC_API_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = await verifySessionToken(token);
  if (valid) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'PIN required.' }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/pin';
  url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|favicon-32.png|favicon-192.png|apple-touch-icon.png|icon-512.png|manifest.json|sw.js).*)',
  ],
};
