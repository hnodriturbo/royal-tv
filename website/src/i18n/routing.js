import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE } from './config';

export function localeHref(locale, path = '/') {
  return `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function getRequestLocale() {
  const h = await headers();
  const c = await cookies();
  const hinted =
    h.get('x-locale') || c.get('NEXT_LOCALE')?.value || h.get('accept-language') || DEFAULT_LOCALE;
  const lower = String(hinted).toLowerCase();
  return lower.startsWith('is') ? 'is' : 'en';
}
