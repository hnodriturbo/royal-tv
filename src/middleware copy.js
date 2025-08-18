/**
 * ========================= middleware.js =========================
 * 🛡️ Global auth, context & locale middleware (loop‑safe)
 * -----------------------------------------------------------------
 * - Locale: enforce /en|/is once, then trust URL as truth.
 * - Auth: allow all /[locale]/auth/* pages (and /auth/*) without redirect.
 * - Inject headers: x-user-id, x-user-role, x-locale.
 * - Keep NEXT_LOCALE cookie synced to URL locale.
 */

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import logger from './lib/core/logger.js';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from 'Storage_Files/i18n_storage/config.js';

// 🌳 Static assets and Next internals — never touch
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

  if (/\.(png|jpg|jpeg|webp|gif|svg|ico|txt|xml|json|mp4|webm|css|js)$/i.test(pathname)) {
    return true;
  }

  return false;
}

// 🧪 Helpers: matchers that ignore optional leading locale (/en|/is)
const withOptionalLocale = (segment) =>
  new RegExp(`^/(?:${SUPPORTED_LOCALES.join('|')})?/${segment}(?:/|$)`, 'i');

const isAuthLikePath = (pathname) => withOptionalLocale('auth').test(pathname);

export async function middleware(request) {
  const url = request.nextUrl;
  const { pathname } = url;

  // 🚧 Skip assets and Next internals
  if (isPublicAsset(pathname)) return NextResponse.next();

  // 🔐 Never enforce locale on /api/**, only inject headers there
  if (pathname.startsWith('/api/')) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token';
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName
    });

    const userRole = token?.role || 'guest';
    const userId = token?.user_id || null;

    const forwardedHeaders = new Headers(request.headers);
    if (userId) {
      forwardedHeaders.set('x-user-id', userId);
      forwardedHeaders.set('x-owner-id', userId);
      forwardedHeaders.set('x-sender-id', userId);
      logger.log('[Middleware] injected x-user-id:', userId);
    }
    forwardedHeaders.set('x-user-role', userRole);

    // 🌍 Best‑effort API locale from cookies (no URL locale on /api)
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value || '';
    const apiLocale = cookieLocale.toLowerCase().startsWith('is') ? 'is' : 'en';
    forwardedHeaders.set('x-locale', apiLocale);
    logger.log('[Middleware] injected x-locale (api):', apiLocale);

    return NextResponse.next({ request: { headers: forwardedHeaders } });
  }

  // 🌍 Locale prefix enforcement for pages
  const localeMatch = pathname.match(/^\/(en|is)(?=\/|$)/i);
  const pathLocale = localeMatch ? localeMatch[1].toLowerCase() : null;

  // 🧭 If no locale prefix → redirect once to DEFAULT_LOCALE + original path
  if (!pathLocale) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    const res = NextResponse.redirect(redirectUrl, { status: 307 });
    res.cookies.set('NEXT_LOCALE', DEFAULT_LOCALE, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  // 🔒 Auth header injection for page requests
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieName = isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token';
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName
  });

  const userRole = token?.role || 'guest';
  const userId = token?.user_id || null;

  const forwardedHeaders = new Headers(request.headers);
  if (userId) {
    forwardedHeaders.set('x-user-id', userId);
    forwardedHeaders.set('x-owner-id', userId);
    forwardedHeaders.set('x-sender-id', userId);
    logger.log('[Middleware] injected x-user-id:', userId);
  }
  forwardedHeaders.set('x-user-role', userRole);
  forwardedHeaders.set('x-locale', pathLocale);
  logger.log('[Middleware] injected x-locale:', pathLocale);

  // 🧁 Keep cookie mirrored to URL locale
  const response = NextResponse.next({ request: { headers: forwardedHeaders } });
  response.cookies.set('NEXT_LOCALE', pathLocale, { path: '/', maxAge: 60 * 60 * 24 * 365 });

  // 💳 Webhook bypass (unchanged)
  const isPaymentRoute =
    pathname.startsWith('/api/nowpayments/') || pathname.startsWith('/api/megaott/');
  if (isPaymentRoute) return response;

  // 🚦 Route protection (locale‑aware, loop‑safe)
  const onAuthPage = isAuthLikePath(pathname);

  // ❗️Fixes the loop: allow /[locale]/auth/* pages when unauthenticated
  if (!token && !onAuthPage) {
    const loginUrl = url.clone();
    loginUrl.pathname = `/${pathLocale}/auth/signin`; // ✅ keep locale
    loginUrl.searchParams.set('redirectTo', pathname + url.search);
    return NextResponse.redirect(loginUrl);
  }

  // 🛡️ Admin/user protected spaces (locale‑aware)
  const isAdmin = new RegExp(`^/(?:${SUPPORTED_LOCALES.join('|')})?/admin(?:/|$)`, 'i').test(
    pathname
  );
  const isUser = new RegExp(`^/(?:${SUPPORTED_LOCALES.join('|')})?/user(?:/|$)`, 'i').test(
    pathname
  );

  if (isAdmin && userRole !== 'admin') {
    const redirectUrl = url.clone();
    redirectUrl.pathname = `/${pathLocale}/auth/middlePage`;
    redirectUrl.searchParams.set('admin', 'false');
    redirectUrl.searchParams.set('redirectTo', pathname + url.search);
    return NextResponse.redirect(redirectUrl);
  }

  if (isUser && userRole !== 'user') {
    const redirectUrl = url.clone();
    redirectUrl.pathname = `/${pathLocale}/auth/middlePage`;
    redirectUrl.searchParams.set('user', 'false');
    redirectUrl.searchParams.set('redirectTo', pathname + url.search);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

// 🧩 Match all “page-like” requests; assets are filtered above
export const config = {
  matcher: [
    '/api/:path*', // headers only
    '/:path*' // pages (we guard assets in-code)
  ]
};
