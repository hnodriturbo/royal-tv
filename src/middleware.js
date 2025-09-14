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

const isPublicAsset = (p) =>
  p.startsWith('/_next') || p.startsWith('/images') || p.startsWith('/favicon') || p.includes('.');

// 🚫 Never run on NextAuth API
export const config = {
  matcher: ['/((?!_next|.*\\..*|api/auth).*)', '/api/:path*']
};

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // Let all /api/* pass (esp. /api/auth/*)
  if (pathname.startsWith('/api/')) return NextResponse.next();
  if (isPublicAsset(pathname)) return NextResponse.next();

  // Ensure locale prefix for pages
  if (!hasLocale(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${inferLocale(req, pathname)}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Always allow middlePage
  if (isMiddle(pathname)) return NextResponse.next();

  // Auth state
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';
  const token = await getToken({ req, secret, cookieName }).catch(() => null);

  // consider a session "valid" only if it has a user identity
  const hasValidSession = Boolean(token && (token.user_id || token.email || token.sub));
  const role = hasValidSession ? (token.role === 'admin' ? 'admin' : 'user') : 'guest';
  const locale = inferLocale(req, pathname);

  // 🔓 If NOT logged in and on /auth/* (signin/signup/etc.), let it render
  if (!hasValidSession && isAuthPath(pathname)) return NextResponse.next();

  // 🔐 If logged in and on /auth/* (except middlePage), redirect to a landing
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

  // Gate protected areas when not logged in (keep redirectTo feature)
  if (!hasValidSession && (isAdminPath(pathname) || isUserPath(pathname))) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/auth/signin`;
    url.search = `?redirectTo=${encodeURIComponent(pathname + (search || ''))}`;
    return NextResponse.redirect(url);
  }

  // Admin-only gate for logged-in non-admins (choose where you want to send them)
  if (hasValidSession && isAdminPath(pathname) && role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/auth/signin`;
    url.search = `?redirectTo=${encodeURIComponent(`/${locale}/`)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
