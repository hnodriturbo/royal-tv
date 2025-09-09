// middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';
import logger from '../../src/lib/core/logger.js';
import { routing } from '@/i18n/routing';

const localeMw = createMiddleware(routing);

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

function withOptionalLocale(segment) {
  return new RegExp(`^/(?:${routing.locales.join('|')})?/${segment}(?:/|$)`, 'i');
}
function isAuthLikePath(pathname) {
  return withOptionalLocale('auth').test(pathname);
}

export const config = {
  // Exclude Next internals + static + NextAuth auth endpoints
  matcher: ['/((?!_next|.*\\..*|api/auth).*)', '/api/:path*']
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 0) Fast-skip assets
  if (isPublicAsset(pathname)) return NextResponse.next();

  // 1) Dev tools bypass
  if (pathname.startsWith('/dev') || withOptionalLocale('dev').test(pathname)) {
    return NextResponse.next();
  }

  // 2) API branch: inject context headers only (no redirects here)
  if (pathname.startsWith('/api/')) {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      cookieName
    }).catch(() => null);

    let userRole = 'guest';
    let userId = null;

    if (token?.user_id) {
      userId = token.user_id;
      // convenience role; DO NOT trust for authZ in handlers
      userRole = token.role === 'admin' ? 'admin' : 'user';
    }

    // Locale best-effort from cookie (APIs have no path prefix)
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value || '';
    const apiLocale = routing.locales.includes(cookieLocale) ? cookieLocale : routing.defaultLocale;

    const headers = new Headers(request.headers);
    if (userId) {
      headers.set('x-user-id', userId);
      headers.set('x-owner-id', userId);
      headers.set('x-sender-id', userId);
    }
    headers.set('x-user-role', userRole);
    headers.set('x-locale', apiLocale);

    // Bypass for webhooks/external integrations
    if (pathname.startsWith('/api/nowpayments/') || pathname.startsWith('/api/megaott/')) {
      return NextResponse.next({ request: { headers } });
    }

    logger.log('[MW][API] x-user-id:', userId || '(none)');
    logger.log('[MW][API] x-user-role:', userRole);
    logger.log('[MW][API] x-locale:', apiLocale);

    return NextResponse.next({ request: { headers } });
  }

  // 3) PAGE branch: next-intl locale handling
  let intlResp = localeMw(request);

  // Extract or infer locale
  const match = pathname.match(new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`, 'i'));
  let effectiveLocale = (match?.[1] || routing.defaultLocale).toLowerCase();

  // Auth token (for page redirects)
  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET, cookieName }).catch(
    () => null
  );

  const userRole = token?.role || 'guest';
  const userId = token?.user_id || null;

  // If next-intl redirected, update locale from Location
  const loc = intlResp?.headers?.get('location');
  if (loc) {
    const m = loc.match(new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`, 'i'));
    effectiveLocale = (m?.[1] || routing.defaultLocale).toLowerCase();
  }

  // Prepare injected headers
  const headers = new Headers(request.headers);
  if (userId) {
    headers.set('x-user-id', userId);
    headers.set('x-owner-id', userId);
    headers.set('x-sender-id', userId);
  }
  headers.set('x-user-role', userRole);
  headers.set('x-locale', effectiveLocale);

  // If next-intl returned a response (redirect/rewrite), attach our headers & cookie
  if (intlResp) {
    for (const [k, v] of headers.entries()) intlResp.headers.set(k, v);
    intlResp.cookies.set('NEXT_LOCALE', effectiveLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: isProd
    });
    return intlResp;
  }

  // 4) Page route protection (loop-safe)
  const onAuthPage = isAuthLikePath(pathname);
  if (!token && !onAuthPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${effectiveLocale}/auth/signin`;
    loginUrl.searchParams.set('redirectTo', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminPage = new RegExp(`^/(?:${routing.locales.join('|')})?/admin(?:/|$)`, 'i').test(
    pathname
  );
  const isUserPage = new RegExp(`^/(?:${routing.locales.join('|')})?/user(?:/|$)`, 'i').test(
    pathname
  );

  if (isAdminPage && userRole !== 'admin') {
    const u = request.nextUrl.clone();
    u.pathname = `/${effectiveLocale}/auth/middlePage`;
    u.searchParams.set('admin', 'false');
    u.searchParams.set('redirectTo', pathname + request.nextUrl.search);
    return NextResponse.redirect(u);
  }
  if (isUserPage && userRole !== 'user' && userRole !== 'admin') {
    const u = request.nextUrl.clone();
    u.pathname = `/${effectiveLocale}/auth/middlePage`;
    u.searchParams.set('user', 'false');
    u.searchParams.set('redirectTo', pathname + request.nextUrl.search);
    return NextResponse.redirect(u);
  }

  const res = NextResponse.next({ request: { headers } });
  res.cookies.set('NEXT_LOCALE', effectiveLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: isProd
  });
  return res;
}
