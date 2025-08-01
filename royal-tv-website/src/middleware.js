/**
 *   ========================= middleware.js =========================
 * 🛡️
 * AUTH MIDDLEWARE — Royal TV
 * - Protects admin/user API and pages.
 * - Adds user/admin headers for requests.
 * - Handles "redirect to login" and "role mismatch" with original destination!
 * ===================================================================
 */

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import logger from '@/lib/logger';

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

  // 🚦 Block: If NOT logged in and NOT already on an /auth page...
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  if (!token && !isAuthRoute) {
    // 🧭 Save attempted path for after login
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/signin';
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // 👮‍♂️ Protect admin APIs: Only allow admins!
  if (request.nextUrl.pathname.startsWith('/api/admin') && userRole !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  // 🛑 Protect admin pages: Only allow admins!
  if (request.nextUrl.pathname.startsWith('/admin') && userRole !== 'admin') {
    const redirectUrl = new URL(`/auth/middlePage?admin=false`, request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
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

// 🗂️ Only run on these routes (admin/user API & pages)
export const config = {
  matcher: [
    '/api/admin/:path*',
    '/admin/:path*',
    '/api/user/:path*',
    '/user/:path*',
    '/api/liveChat/:path*'
  ]
};
