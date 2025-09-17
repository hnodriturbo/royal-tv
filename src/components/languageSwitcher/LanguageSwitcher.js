'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';
import useSocketHub from '@/hooks/socket/useSocketHub';

const SUPPORTED = new Set(['en', 'is']);
const AUTH_FLAGS = new Set([
  'login',
  'logout',
  'admin',
  'user',
  'notLoggedIn',
  'error',
  'redirectTo',
  'paymentSuccess',
  'update',
  'passwordUpdate',
  'success'
]);

function stripLocale(pathname) {
  const parts = (pathname || '/').split('/');
  const maybe = (parts[1] || '').toLowerCase();
  if (SUPPORTED.has(maybe)) {
    const rest = '/' + parts.slice(2).join('/');
    return rest === '//' || rest === '/' ? '/' : rest;
  }
  return pathname || '/';
}

function sanitize(search) {
  if (!search) return '';
  const sp = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  AUTH_FLAGS.forEach((k) => sp.delete(k));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function withLocale(basePath, locale) {
  const p = basePath && basePath.startsWith('/') ? basePath : `/${basePath || ''}`;
  return `/${locale}${p === '/' ? '' : p}`;
}

function setLocaleCookies(nextLocale) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${oneYear}`;
  document.cookie = `locale=${nextLocale}; path=/; max-age=${oneYear}`;
}

function isCheckout(pathname) {
  return /\/packages\/[^/]+\/buyNow(?:\/|$)/i.test(pathname || '');
}

export default function LanguageSwitcher() {
  const locale = (useLocale() || 'en').toLowerCase();
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setLocale } = useSocketHub();

  // guard translations so missing/group keys never crash
  const ts = (key, fallback = '') => {
    try {
      const v = t(key);
      return typeof v === 'string' || typeof v === 'number' ? String(v) : fallback;
    } catch {
      return fallback;
    }
  };

  const disabled = isCheckout(pathname || '/');
  const base = stripLocale(pathname || '/');
  const searchRaw = searchParams?.toString() || '';
  const search = sanitize(searchRaw ? `?${searchRaw}` : '');
  const hrefBase = (base || '/') + (search || '');

  const enHref = useMemo(() => withLocale(hrefBase, 'en'), [hrefBase]);
  const isHref = useMemo(() => withLocale(hrefBase, 'is'), [hrefBase]);

  // keep socket aware of current locale
  useEffect(() => {
    try {
      setLocale(locale);
    } catch {}
  }, [locale, setLocale]);

  const cls = (off) =>
    `text-center px-2 py-1 rounded-full transition ${
      off
        ? 'ring-2 ring-white cursor-not-allowed opacity-60 pointer-events-none'
        : 'opacity-80 hover:opacity-100'
    }`;

  const onClick = (next) => {
    setLocaleCookies(next);
    try {
      setLocale(next);
    } catch {}
  };

  return (
    <div className="fixed top-3 right-3 z-[9999] flex items-center gap-2 rounded-full bg-black/50 backdrop-blur px-3 py-2 border border-white/10 shadow">
      <Link
        href={enHref}
        prefetch
        onClick={() => onClick('en')}
        aria-label={ts('app.languageSwitcher.english_label', 'English')}
        aria-current={locale === 'en' ? 'true' : undefined}
        aria-disabled={disabled || locale === 'en' ? 'true' : undefined}
        className={cls(disabled || locale === 'en')}
        title={
          disabled
            ? ts(
                'app.languageSwitcher.disabled_tooltip',
                'Language switching is unavailable on this page'
              )
            : ts('app.languageSwitcher.english_tooltip', 'Switch to English')
        }
      >
        <span aria-hidden="true">EN🇮🇸</span>
      </Link>

      <Link
        href={isHref}
        prefetch
        onClick={() => onClick('is')}
        aria-label={ts('app.languageSwitcher.icelandic_label', 'Íslenska')}
        aria-current={locale === 'is' ? 'true' : undefined}
        aria-disabled={disabled || locale === 'is' ? 'true' : undefined}
        className={cls(disabled || locale === 'is')}
        title={
          disabled
            ? ts(
                'app.languageSwitcher.disabled_tooltip',
                'Language switching is unavailable on this page'
              )
            : ts('app.languageSwitcher.icelandic_tooltip', 'Skipta í íslensku')
        }
      >
        <span aria-hidden="true">🇮🇸</span>
      </Link>
    </div>
  );
}
