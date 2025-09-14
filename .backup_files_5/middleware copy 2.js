// middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// tune to your app
const LOCALES = ['en', 'is'];
const DEFAULT_LOCALE = 'en';

// helpers
const hasLocale = (pathname) => new RegExp(`^/(?:${LOCALES.join('|')})(?:/|$)`, 'i').test(pathname);
const withOptionalLocale = (seg) => new RegExp(`^/(?:${LOCALES.join('|')})?/${seg}(?:/|$)`, 'i');

const isPublicAsset = (pathname) =>
  pathname.startsWith('/_next') ||
  pathname.startsWith('/images') ||
  pathname.startsWith('/favicon') ||
  pathname.includes('.'); // static files

const isAuthPath = (p) => withOptionalLocale('auth').test(p);
const isAdminPath = (p) => withOptionalLocale('admin').test(p);
const isUserPath = (p) => withOptionalLocale('user').test(p);

const inferLocale = (req, pathname) => {
  // prefer URL segment, fallback to cookie NEXT_LOCALE, else default
  const seg = pathname.split('/')[1];
  if (LOCALES.includes(seg)) return seg;
  const cookie = req.cookies.get('NEXT_LOCALE')?.value;
  return LOCALES.includes(cookie) ? cookie : DEFAULT_LOCALE;
};

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/api/:path*']
};

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;
  if (isPublicAsset(pathname)) return NextResponse.next();

  // ensure locale prefix
  if (!hasLocale(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${inferLocale(req, pathname)}${pathname}`;
    return NextResponse.redirect(url);
  }

  // ✔ let middlePage through for both authed & unauth users
  if (/^\/(?:en|is)\/auth\/middlePage(?:\/|$)/i.test(pathname)) {
    return NextResponse.next();
  }

  // auth state
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';
  const token = await getToken({ req, secret, cookieName }).catch(() => null);
  const role = token?.role === 'admin' ? 'admin' : token?.user_id ? 'user' : 'guest';

  // ⛔ unauthenticated → send to signin WITH redirectTo (keep feature)
  if (!token) {
    // only redirect for protected areas; let public pages load as guest
    if (isAdminPath(pathname) || isUserPath(pathname)) {
      const url = req.nextUrl.clone();
      const locale = inferLocale(req, pathname);
      url.pathname = `/${locale}/auth/signin`;
      url.search = `?redirectTo=${encodeURIComponent(pathname + (search || ''))}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ✅ authenticated but on /auth/* (except middlePage) → send to a landing
  if (token && isAuthPath(pathname)) {
    const url = req.nextUrl.clone();
    const locale = inferLocale(req, pathname);
    url.pathname =
      role === 'admin'
        ? `/${locale}/admin/dashboard`
        : role === 'user'
          ? `/${locale}/user/dashboard`
          : `/${locale}/`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  // 🔐 role gates (no redirectTo rewrite here; MiddlePage can handle messages if you want)
  if (isAdminPath(pathname) && role !== 'admin') {
    const url = req.nextUrl.clone();
    const locale = inferLocale(req, pathname);
    url.pathname = `/${locale}/auth/signin`;
    url.search = `?redirectTo=${encodeURIComponent(`/${locale}/`)}`; // or drop if you prefer
    return NextResponse.redirect(url);
  }

  if (isUserPath(pathname) && role === 'guest') {
    const url = req.nextUrl.clone();
    const locale = inferLocale(req, pathname);
    url.pathname = `/${locale}/auth/signin`;
    url.search = `?redirectTo=${encodeURIComponent(pathname + (search || ''))}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
