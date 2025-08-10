/**
 *   ========================= middleware.js =========================
 * 🛡️  ROYAL TV – GLOBAL AUTH & CONTEXT MIDDLEWARE
 * ------------------------------------------------------------------
 * • Validates the user’s JWT (NextAuth) on every **matched** request.
 * • Injects server-trusted identity headers:
 *     ‣ x-user-id   –  primary key for DB relations
 *     ‣ x-owner-id  –  same as user-id (used by sockets & logs)
 *     ‣ x-sender-id –  same as user-id (used by chat)
 *     ‣ x-user-role –  “admin” | “user”
 * • Protects role-scoped pages & APIs:
 *     ‣ /admin*      → admin-only
 *     ‣ /user*       → user-only
 * • Smart redirects:
 *     ‣ Un-authed users are sent to auth/signin with ?redirectTo={origin}.
 * • Payment-provider bypass:
 *     ‣ All routes under -- /api/nowpayments/ -- & -- api/megaott/ -- skip the
 *       auth check so external webhooks/IPNs aren’t blocked, but they still
 *       receive the injected headers for internal calls.
 * • Everything else that matches continues with the updated headers.
 * ===================================================================
 */

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import logger from './lib/core/logger.js';

export async function middleware(request) {
  // 🍪 Figure out cookie name based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieName = isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token';

  // 🕵️‍♂️ Debug: Log all cookies present
  const cookieList = Array.from(request.cookies?.keys?.() || []);

  // 🔑 Get JWT token using correct cookie and secret
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName // 🏷️ Force correct cookie for dev/prod!
  });

  const userRole = token?.role;
  const userId = token?.user_id;

  // ✉️ Clone headers to add identity info for downstream use
  const forwardedHeaders = new Headers(request.headers);

  if (userId) {
    // 🆔 Attach user/admin IDs for backend tracking
    forwardedHeaders.set('x-user-id', userId);
    forwardedHeaders.set('x-owner-id', userId);
    forwardedHeaders.set('x-sender-id', userId);
    forwardedHeaders.set('x-user-role', userRole);

    logger.log('[Middleware] injected x-user-role:', userRole);
    logger.log('[Middleware] injected x-user-id:', userId);
  }

  // 💳 PAYMENT CALLBACK BYPASS
  const isPaymentRoute =
    request.nextUrl.pathname.startsWith('/api/nowpayments/') ||
    request.nextUrl.pathname.startsWith('/api/megaott/');

  if (isPaymentRoute) {
    // 📌 Let the payment route through without interuption but include the headers
    return NextResponse.next({ request: { headers: forwardedHeaders } });
  }

  // 🚦 Block: If NOT logged in and NOT already on an /auth page...
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  if (!token && !isAuthRoute) {
    // 🧭 Save attempted path for after login
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/signin';
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // 🛑 Protect admin pages: Only allow admins!
  if (request.nextUrl.pathname.startsWith('/admin') && userRole !== 'admin') {
    const redirectUrl = new URL(`/auth/middlePage?admin=false`, request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  // 👮‍♂️ Protect admin APIs: Only allow admins!
  if (request.nextUrl.pathname.startsWith('/api/admin') && userRole !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  // 🛡️ Protect user pages: Only allow users!
  if (request.nextUrl.pathname.startsWith('/user') && userRole !== 'user') {
    const redirectUrl = new URL(`/auth/middlePage?user=false`, request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  // 🔐 Protect user APIs: Only allow users!
  if (request.nextUrl.pathname.startsWith('/api/user') && userRole !== 'user') {
    return NextResponse.json({ error: 'User only' }, { status: 403 });
  }

  // 🟢 If authenticated, allow request to proceed with updated headers!
  return NextResponse.next({
    request: {
      headers: forwardedHeaders
    }
  });
}

// 🗂️ Only run on these routes (admin/user API, pages & payment callbacks)
export const config = {
  matcher: [
    '/api/admin/:path*', // 🛡️ Admin APIs
    '/admin/:path*', // 🛡️ Admin pages
    '/api/user/:path*', // 🛡️ User APIs
    '/user/:path*', // 🛡️ User pages
    '/api/liveChat/:path*', // 📡 LiveChat sockets
    '/api/nowpayments/:path*', // 📡 NowPayments webhooks & callbacks
    '/api/megaott/:path*' // 📡 MegaOTT webhooks & callbacks
  ]
};
