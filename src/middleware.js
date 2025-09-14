// middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const LOCALES = ['en', 'is'];
const DEFAULT_LOCALE = 'en';

const hasLocale = (p) => new RegExp(`^/(?:${LOCALES.join('|')})(?:/|$)`, 'i').test(p);
const inferLocale = (req, pathname) => {
  const seg = pathname.split('/')[1];
  if (LOCALES.includes(seg)) return seg;
  const cookie = req.cookies.get('NEXT_LOCALE')?.value;
  return LOCALES.includes(cookie) ? cookie : DEFAULT_LOCALE;
};

const withOptionalLocale = (seg) => new RegExp(`^/(?:${LOCALES.join('|')})?/${seg}(?:/|$)`, 'i');
const isAuthPath = (p) => withOptionalLocale('auth').test(p);
const isAdminPath = (p) => withOptionalLocale('admin').test(p);
const isUserPath = (p) => withOptionalLocale('user').test(p);
const isMiddle = (p) => withOptionalLocale('auth/middlePage').test(p);

// ⛔ Do NOT match /api/* at all (esp. /api/auth/*)
export const config = {
  matcher: [
    // everything except _next, static assets, and api
    '/((?!_next|.*\\..*|api).*)'
  ]
};

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // Locale prefix
  if (!hasLocale(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${inferLocale(req, pathname)}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Always allow the middlePage
  if (isMiddle(pathname)) return NextResponse.next();

  // Auth state (let getToken pick the correct cookie name)
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token = (await getToken({ req, secret }).catch(() => null)) || null;

  const hasValidSession = Boolean(token && (token.user_id || token.email || token.sub));
  const role = hasValidSession ? (token.role === 'admin' ? 'admin' : 'user') : 'guest';
  const locale = inferLocale(req, pathname);

  // Guests can view /auth/*
  if (!hasValidSession && isAuthPath(pathname)) return NextResponse.next();

  // Logged-in users should not see /auth/* (except middlePage above)
  if (hasValidSession && isAuthPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname =
      role === 'admin'
        ? `/${locale}/admin/dashboard`
        : role === 'user'
          ? `/${locale}/user/dashboard`
          : `/${locale}/`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Gate protected areas for guests, preserving redirectTo
  if (!hasValidSession && (isAdminPath(pathname) || isUserPath(pathname))) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/auth/signin`;
    url.search = `?redirectTo=${encodeURIComponent(pathname + (search || ''))}`;
    return NextResponse.redirect(url);
  }

  // Admin-only gate
  if (hasValidSession && isAdminPath(pathname) && role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/auth/signin`;
    url.search = `?redirectTo=${encodeURIComponent(`/${locale}/`)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
