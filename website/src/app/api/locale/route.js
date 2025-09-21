// /api/locale
import { NextResponse } from 'next/server';

const ONE_YEAR = 60 * 60 * 24 * 365;

function normalize(input) {
  const v = String(input || '').toLowerCase();
  return v.startsWith('is') ? 'is' : 'en';
}

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    // Ensure non-empty catch without changing behavior
    body = {};
  }
  const locale = normalize(body.locale);
  const res = NextResponse.json({ ok: true, locale });
  res.cookies.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: ONE_YEAR,
    httpOnly: false, // readable by client for axios header
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  // help downstream services
  res.headers.set('x-locale', locale);
  return res;
}

export async function GET(req) {
  const cookie = req.cookies.get('NEXT_LOCALE')?.value;
  const hinted = req.headers.get('x-locale');
  const accept = (req.headers.get('accept-language') || '').toLowerCase();
  const locale = normalize(cookie || hinted || accept);
  return NextResponse.json({ locale });
}
