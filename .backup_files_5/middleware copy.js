// middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
// 👉 Our new locale config (JS/ESM)
import { LOCALES, DEFAULT_LOCALE, isLocale } from '../src/i18n/config.js';

/** Public asset detection (skip as early as possible) */
function isPublicAsset(pathname) {
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/.well-known') ||
    pathname === '/favicon.ico'
  )
    return true;
  return /\.(png|jpg|jpeg|webp|gif|svg|ico|txt|xml|json|mp4|webm|css|js)$/i.test(pathname);
}

const LOCALE_SEGMENT = new RegExp(`^/(${LOCALES.join('|')})(?=/|$)`, 'i');
const withOptionalLocale = (segment) =>
  new RegExp(`^/(?:${LOCALES.join('|')})?/${segment}(?:/|$)`, 'i');

function isAuthLikePath(pathname) {
  return withOptionalLocale('auth').test(pathname);
}
function isAdminPath(pathname) {
  return withOptionalLocale('admin').test(pathname);
}
function isUserPath(pathname) {
  return withOptionalLocale('user').test(pathname);
}

/** Infer locale: path > cookie > Accept-Language > default */
function inferLocale(request, pathname) {
  const m = pathname.match(LOCALE_SEGMENT);
  if (m?.[1] && isLocale(m[1])) return m[1].toLowerCase();
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value || '';
  if (isLocale(cookieLocale)) return cookieLocale;
  const accept = (request.headers.get('accept-language') || '').toLowerCase();
  if (accept.startsWith('is')) return 'is';
  return DEFAULT_LOCALE;
}

export const config = {
  // run on all pages and APIs except static files and NextAuth's own /api/auth
  matcher: ['/((?!_next|.*\\..*|api/auth).*)', '/api/:path*']
};

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

  // 0) Fast skip for static/public assets
  if (isPublicAsset(pathname)) return NextResponse.next();

  // 1) Dev tools pass-through
  if (pathname.startsWith('/dev') || withOptionalLocale('dev').test(pathname)) {
    return NextResponse.next();
  }

  // 2) API branch — inject headers, never redirect
  if (pathname.startsWith('/api/')) {
    const token = await getToken({ req: request, secret, cookieName }).catch(() => null);

    const userId = token?.user_id || null;
    const userRole = token?.role === 'admin' ? 'admin' : token?.user_id ? 'user' : 'guest';
    const apiLocale = inferLocale(request, pathname);

    const headers = new Headers(request.headers);
    if (userId) {
      headers.set('x-user-id', userId);
      headers.set('x-owner-id', userId);
      headers.set('x-sender-id', userId);
    }
    headers.set('x-user-role', userRole);
    headers.set('x-locale', apiLocale);

    // Bypass for specific external webhook/integration endpoints
    if (pathname.startsWith('/api/nowpayments/') || pathname.startsWith('/api/megaott/')) {
      return NextResponse.next({ request: { headers } });
    }

    console.log('[MW][API] x-user-id:', userId || '(none)');
    console.log('[MW][API] x-user-role:', userRole);
    console.log('[MW][API] x-locale:', apiLocale);

    return NextResponse.next({ request: { headers } });
  }

  // 3) PAGE branch — enforce /{locale} prefix
  const hasLocaleInPath = LOCALE_SEGMENT.test(pathname);
  const activeLocale = inferLocale(request, pathname);

  if (!hasLocaleInPath) {
    const url = request.nextUrl.clone();
    url.pathname = `/${activeLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Auth token for page gating
  const token = await getToken({ req: request, secret, cookieName }).catch(() => null);
  const userId = token?.user_id || null;
  const userRole = token?.role === 'admin' ? 'admin' : token?.user_id ? 'user' : 'guest';

  // Prepare headers we want to inject into the downstream request
  const headers = new Headers(request.headers);
  if (userId) {
    headers.set('x-user-id', userId);
    headers.set('x-owner-id', userId);
    headers.set('x-sender-id', userId);
  }
  headers.set('x-user-role', userRole);
  headers.set('x-locale', activeLocale);

  // 4) Route protection (loop-safe)
  const onAuthPage = isAuthLikePath(pathname);

  // Not authenticated → send to locale'd signin with redirectTo
  if (!token && !onAuthPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${activeLocale}/auth/signin`;
    loginUrl.searchParams.set('redirectTo', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Admin gate
  if (isAdminPath(pathname) && userRole !== 'admin') {
    const u = request.nextUrl.clone();
    u.pathname = `/${activeLocale}/auth/middlePage`;
    u.searchParams.set('admin', 'false');
    u.searchParams.set('redirectTo', pathname + search);
    return NextResponse.redirect(u);
  }

  // User gate (admins pass)
  if (isUserPath(pathname) && !(userRole === 'user' || userRole === 'admin')) {
    const u = request.nextUrl.clone();
    u.pathname = `/${activeLocale}/auth/middlePage`;
    u.searchParams.set('user', 'false');
    u.searchParams.set('redirectTo', pathname + search);
    return NextResponse.redirect(u);
  }

  // 5) Pass-through with injected headers + keep cookie in sync
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set('NEXT_LOCALE', activeLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: isProd
  });
  return res;
}
