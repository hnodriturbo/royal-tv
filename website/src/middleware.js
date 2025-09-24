/**
 * ========== middleware.js ==========
 * 🧱 Global middleware — ensure a sticky public identity cookie for the widget
 * ---------------------------------------------------------------------------
 * 🧠 Purpose:
 *   • Guarantee each visitor has a durable "public_identity_id" cookie (UUIDv4) 🪪
 *   • This survives refreshes/redirects and lets sockets preserve chat threads
 * ---------------------------------------------------------------------------
 * 🔒 Cookie details:
 *   • Name: public_identity_id
 *   • Scope: all routes (matcher: '/')
 *   • HttpOnly, SameSite=Lax, Path=/, (Secure in prod), Max-Age ~ 180 days
 * ---------------------------------------------------------------------------
 */

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const LOCALES = ['en', 'is'];
const DEFAULT_LOCALE = 'en';

// ---------- helpers ----------
const hasLocale = (p) => new RegExp(`^/(?:${LOCALES.join('|')})(?:/|$)`, 'i').test(p);
const withOptionalLocale = (seg) => new RegExp(`^/(?:${LOCALES.join('|')})?/${seg}(?:/|$)`, 'i');

const isMiddle = (p) => withOptionalLocale('auth/middlePage').test(p);
// exclude middlePage from auth check so it’s always allowed
const isAuthPath = (p) => withOptionalLocale('auth').test(p) && !isMiddle(p);
const isAdminPath = (p) => withOptionalLocale('admin').test(p);
const isUserPath = (p) => withOptionalLocale('user').test(p);

const inferLocale = (req, pathname) => {
  const seg = pathname.split('/')[1];
  if (LOCALES.includes(seg)) return seg;
  const cookie = req.cookies.get('NEXT_LOCALE')?.value;
  return LOCALES.includes(cookie) ? cookie : DEFAULT_LOCALE;
};

const isPublicAsset = (p) =>
  p.startsWith('/_next') || p.startsWith('/images') || p.startsWith('/favicon') || p.includes('.');

// 🧩 role policy: allow admins to access /user/* by default (set env to 'false' for strict)
const allowAdminOnUserPath =
  (process.env.ALLOW_ADMIN_ON_USER_PATH ?? 'true').toLowerCase() !== 'false';

// 🚫 Never run on NextAuth API (but run on other APIs) + pages
export const config = {
  matcher: ['/((?!_next|.*\\..*|api/auth).*)', '/api/:path*']
};

// ---------- public_identity_id cookie helpers ----------
const HALF_YEAR = 60 * 60 * 24 * 180; // 180 days
const genId = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random()}-gid`;

// 🧁 Attach cookie to any response we return from this middleware (next() or redirect)
const attachPublicIdentityCookie = (req, res) => {
  const existing = req.cookies.get('public_identity_id')?.value;
  if (existing && typeof existing === 'string' && existing.length >= 16) return res;

  const public_id = genId();
  res.cookies.set({
    name: 'public_identity_id',
    value: public_id,
    httpOnly: true, // ✅ server-only
    sameSite: 'lax', // ✅ same-site
    path: '/', // ✅ site-wide
    maxAge: HALF_YEAR, // ✅ long-lived
    secure: process.env.NODE_ENV === 'production' // ✅ HTTPS only in prod
  });
  return res;
};

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // let APIs pass (especially /api/auth/* which we excluded in matcher, but keep this guard)
  if (pathname.startsWith('/api/')) return NextResponse.next();
  if (isPublicAsset(pathname)) return NextResponse.next();

  // locale prefix
  if (!hasLocale(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${inferLocale(req, pathname)}${pathname}`;
    return attachPublicIdentityCookie(req, NextResponse.redirect(url));
  }

  // always allow middlePage
  if (isMiddle(pathname)) {
    return attachPublicIdentityCookie(req, NextResponse.next());
  }

  // ---------- auth state ----------
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  // Use explicit cookie names (fast path). Try both v5 and v4 variants.
  const isProd = process.env.NODE_ENV === 'production';
  const cookieCandidates = isProd
    ? ['__Secure-authjs.session-token', '__Secure-next-auth.session-token']
    : ['authjs.session-token', 'next-auth.session-token'];

  let token = null;
  for (const cookieName of cookieCandidates) {
    try {
      token = await getToken({ req, secret, cookieName });
      if (token) break;
    } catch {
      /* ignore and try next */
    }
  }

  const hasValidSession = Boolean(token && (token.user_id || token.email || token.sub));
  const role = hasValidSession ? (token.role === 'admin' ? 'admin' : 'user') : 'guest';
  const locale = inferLocale(req, pathname);

  // ---------- routing rules ----------
  // Guests may view /auth/* pages
  if (!hasValidSession && isAuthPath(pathname)) return NextResponse.next();

  // Logged-in users should not see /auth/* (middlePage already excluded)
  if (hasValidSession && isAuthPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname =
      role === 'admin'
        ? `/${locale}/admin/dashboard`
        : role === 'user'
          ? `/${locale}/user/dashboard`
          : `/${locale}/`;
    url.search = '';
    return attachPublicIdentityCookie(req, NextResponse.redirect(url));
  }

  // --- Not logged in but hit protected (admin/user) → MiddlePage with notLoggedIn flag
  if (!hasValidSession && (isAdminPath(pathname) || isUserPath(pathname))) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/auth/middlePage`;
    url.search = `?notLoggedIn=true&redirectTo=${encodeURIComponent(pathname + (search || ''))}`;
    return attachPublicIdentityCookie(req, NextResponse.redirect(url));
  }

  // --- Logged in but not admin on /admin/* → MiddlePage with admin=false
  if (hasValidSession && isAdminPath(pathname) && role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/auth/middlePage`;
    url.search = `?admin=false&redirectTo=${encodeURIComponent(`/${locale}/`)}`;
    return attachPublicIdentityCookie(req, NextResponse.redirect(url));
  }

  // --- Logged in but not allowed on /user/* (only if strict mode) → user=false
  if (hasValidSession && isUserPath(pathname) && !allowAdminOnUserPath && role !== 'user') {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/auth/middlePage`;
    url.search = `?user=false&redirectTo=${encodeURIComponent(`/${locale}/`)}`;
    return attachPublicIdentityCookie(req, NextResponse.redirect(url));
  }

  // default allow
  return attachPublicIdentityCookie(req, NextResponse.next());
}
