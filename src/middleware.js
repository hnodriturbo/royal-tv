/**
 * ========================= middleware.js =========================
 * 🛡️ Global auth, context & locale middleware (loop‑safe)
 * -----------------------------------------------------------------
 * - Locale: auto-detect + enforce /{locale} using next-intl middleware.
 * - Auth: allow all /[locale]/auth/* pages (and /auth/*) without redirect.
 * - Inject headers: x-user-id, x-owner-id, x-sender-id, x-user-role, x-locale.
 * - Keep NEXT_LOCALE cookie mirrored to the URL locale (and set on redirect).
 * - Keep payment webhooks bypass intact.
 */

import { NextResponse } from 'next/server'; // 📨 Low-level response tools
import { getToken } from 'next-auth/jwt'; // 🔐 Read session token from cookies
import createMiddleware from 'next-intl/middleware'; // 🌍 Locale detection/redirect
import logger from './lib/core/logger.js'; // 🪵 Central logger (English only)
import { routing } from 'i18n/routing.js'; // 🧭 Source of truth for locales/default

// 🧭 Build the next-intl locale middleware from our routing definition
const localeMiddleware = createMiddleware(routing);

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

// 🧪 Helpers: matchers that ignore optional leading locale (/en|/is/...)
const withOptionalLocale = (segment) =>
  new RegExp(`^/(?:${routing.locales.join('|')})?/${segment}(?:/|$)`, 'i');

const isAuthLikePath = (pathname) => withOptionalLocale('auth').test(pathname);

export async function middleware(request) {
  const url = request.nextUrl;
  const { pathname } = url;

  // 🚧 Skip assets and Next internals
  if (isPublicAsset(pathname)) return NextResponse.next();

  // ========== 1) API: inject headers only, never enforce locale ==========
  if (pathname.startsWith('/api/')) {
    // 🍪 Pick the correct Auth.js cookie name for prod/dev
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token';

    // 🔑 Token → role & id (defaults)
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      cookieName
    });

    // Default role
    let userRole = 'guest';
    let userId = null;

    if (token?.user_id) {
      userId = token.user_id;

      // Only allow "admin" if ID matches ADMIN_USER_ID
      if (token.role === 'admin' && userId === process.env.ADMIN_USER_ID) {
        userRole = 'admin';
      } else {
        userRole = 'user'; // everyone else is a user
      }
    }

    // 📨 Forward all incoming headers + inject ours
    const forwardedHeaders = new Headers(request.headers);

    if (userId) {
      forwardedHeaders.set('x-user-id', userId);
      forwardedHeaders.set('x-owner-id', userId);
      forwardedHeaders.set('x-sender-id', userId);
    }
    forwardedHeaders.set('x-user-role', userRole);

    // 🌍 API locale: best effort from NEXT_LOCALE cookie (no URL prefix on /api)
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value || '';
    const apiLocale = cookieLocale.toLowerCase().startsWith('is') ? 'is' : routing.defaultLocale;
    forwardedHeaders.set('x-locale', apiLocale);

    // 🪵 Log injected headers
    logger.log('[Middleware][API] injected x-user-id:', userId || '(none)');
    logger.log('[Middleware][API] injected x-user-role:', userRole);
    logger.log('[Middleware][API] injected x-locale:', apiLocale);

    return NextResponse.next({ request: { headers: forwardedHeaders } });
  }

  // ========== 2) PAGES: locale handling, auth redirects, header injection ==========

  // 🧭 Let next-intl decide locale redirects for prefix-less URLs (e.g. "/" → "/en")
  //     This returns a NextResponse on redirect/rewrite, or undefined to continue.
  const intlResponse = localeMiddleware(request);

  // 🧩 Figure out the path locale considering our routing.locales
  const pathLocaleMatch = pathname.match(
    new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`, 'i')
  );
  const pathLocale = pathLocaleMatch ? pathLocaleMatch[1].toLowerCase() : null;

  // 🔒 Auth headers for page requests (regardless of intl redirect)
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieName = isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token';
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName
  });

  const userRole = token?.role || 'guest';
  const userId = token?.user_id || null;

  // 📨 Prepare forwarded headers and inject ours
  const forwardedHeaders = new Headers(request.headers);
  if (userId) {
    forwardedHeaders.set('x-user-id', userId);
    forwardedHeaders.set('x-owner-id', userId);
    forwardedHeaders.set('x-sender-id', userId);
  }
  forwardedHeaders.set('x-user-role', userRole);

  // 🌍 Choose the effective locale for headers/cookie:
  //     - If next-intl is redirecting (no prefix), use its detected target locale.
  //     - Else use the path locale we already have.
  let effectiveLocale = pathLocale;
  if (intlResponse?.headers?.get('location')) {
    // 📍 Parse locale from the redirect location (e.g. "/en/..." or "/is")
    const location = intlResponse.headers.get('location');
    const match = location.match(new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`, 'i'));
    effectiveLocale = (match ? match[1] : routing.defaultLocale).toLowerCase();
  }
  if (!effectiveLocale) effectiveLocale = routing.defaultLocale;

  forwardedHeaders.set('x-locale', effectiveLocale);

  // 🪵 Log injected headers (pages)
  logger.log('[Middleware][PAGE] injected x-user-id:', userId || '(none)');
  logger.log('[Middleware][PAGE] injected x-user-role:', userRole);
  logger.log('[Middleware][PAGE] injected x-locale:', effectiveLocale);

  // 🔁 If next-intl produced a redirect/rewrite, attach our headers/cookie and return it
  if (intlResponse) {
    // 🔗 Copy our injected headers onto the intl response
    for (const [key, value] of forwardedHeaders.entries()) {
      intlResponse.headers.set(key, value);
    }
    // 🧁 Mirror cookie to chosen locale
    intlResponse.cookies.set('NEXT_LOCALE', effectiveLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    });
    return intlResponse;
  }

  // 🧁 If there was no redirect, continue normally with our headers and cookie
  const response = NextResponse.next({ request: { headers: forwardedHeaders } });
  response.cookies.set('NEXT_LOCALE', effectiveLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  });

  // 💳 Webhook bypass (unchanged)
  const isPaymentRoute =
    pathname.startsWith('/api/nowpayments/') || pathname.startsWith('/api/megaott/');
  if (isPaymentRoute) return response;

  // 🚦 Route protection (locale‑aware, loop‑safe)
  const onAuthPage = isAuthLikePath(pathname);

  // ❗️Allow /[locale]/auth/* pages when unauthenticated; otherwise redirect to signin
  if (!token && !onAuthPage) {
    const loginUrl = url.clone();
    loginUrl.pathname = `/${effectiveLocale}/auth/signin`;
    loginUrl.searchParams.set('redirectTo', pathname + url.search);
    return NextResponse.redirect(loginUrl);
  }

  // 🛡️ Admin/user protected spaces (locale‑aware)
  const isAdmin = new RegExp(`^/(?:${routing.locales.join('|')})?/admin(?:/|$)`, 'i').test(
    pathname
  );
  const isUser = new RegExp(`^/(?:${routing.locales.join('|')})?/user(?:/|$)`, 'i').test(pathname);

  if (isAdmin && userRole !== 'admin') {
    const redirectUrl = url.clone();
    redirectUrl.pathname = `/${effectiveLocale}/auth/middlePage`;
    redirectUrl.searchParams.set('admin', 'false');
    redirectUrl.searchParams.set('redirectTo', pathname + url.search);
    return NextResponse.redirect(redirectUrl);
  }

  if (isUser && userRole !== 'user') {
    const redirectUrl = url.clone();
    redirectUrl.pathname = `/${effectiveLocale}/auth/middlePage`;
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
