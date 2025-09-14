// LanguageSwitcher.js (patched)
'use client';

import { useEffect, useState } from 'react';
import { onNavigate } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import useSocketHub from '@/hooks/socket/useSocketHub';
import Flag from 'react-world-flags';
import { SafeString } from '@/lib/ui/SafeString';
import Link from 'next/link';

const SUPPORTED_LOCALES = ['en', 'is'];
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

function getPathWithoutLocale(incomingPath) {
  const safePath = typeof incomingPath === 'string' && incomingPath.length > 0 ? incomingPath : '/';
  const [, possibleLocale, ...rest] = safePath.split('/');
  if (SUPPORTED_LOCALES.includes(String(possibleLocale).toLowerCase())) {
    const rebuilt = '/' + rest.join('/');
    return rebuilt === '//' || rebuilt === '/' ? '/' : rebuilt;
  }
  return safePath;
}

function sanitizeSearch(search) {
  if (!search) return '';
  const sp = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  AUTH_FLAGS.forEach((k) => sp.delete(k));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function writeLocaleCookies(targetLocale) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=${oneYear}`;
  document.cookie = `locale=${targetLocale}; path=/; max-age=${oneYear}`;
}

function isCheckoutPath(currentPathname) {
  return /\/packages\/[^/]+\/buyNow(?:\/|$)/i.test(currentPathname || '');
}

function withLocale(basePath, locale) {
  const path = basePath?.startsWith('/') ? basePath : `/${basePath || ''}`;
  return `/${locale}${path === '/' ? '' : path}`;
}

export default function LanguageSwitcher() {
  const activeLocale = useLocale();
  const t = useTranslations();
  const { setLocale } = useSocketHub();
  const [url, setUrl] = useState({ pathname: '/', search: '' });

  useEffect(() => {
    const update = () =>
      setUrl({ pathname: window.location.pathname, search: window.location.search });
    update();
    let unsubscribe = () => {};
    try {
      unsubscribe = onNavigate(() => update());
    } catch {}
    window.addEventListener('popstate', update);
    return () => {
      window.removeEventListener('popstate', update);
      unsubscribe && unsubscribe();
    };
  }, []);

  const disabled = isCheckoutPath(url.pathname);
  const base = getPathWithoutLocale(url.pathname);
  const hrefBase = sanitizeSearch(url.search) ? `${base}${sanitizeSearch(url.search)}` : base;

  const englishHref = withLocale(hrefBase, 'en');
  const icelandicHref = withLocale(hrefBase, 'is');

  const classes = (off) =>
    `px-2 py-1 rounded-full transition ${
      off
        ? 'ring-2 ring-white cursor-not-allowed opacity-60 pointer-events-none'
        : 'opacity-80 hover:opacity-100'
    }`;

  const handleClick = (locale) => {
    try {
      writeLocaleCookies(locale);
      setLocale(locale);
    } catch {}
  };

  return (
    <div className="fixed top-3 right-3 z-[9999] flex items-center gap-2 rounded-full bg-black/50 backdrop-blur px-3 py-2 border border-white/10 shadow">
      <Link
        href={englishHref}
        prefetch
        onClick={() => handleClick('en')}
        aria-label={SafeString(t('app.languageSwitcher.english_label'))}
        aria-current={activeLocale === 'en' ? 'true' : undefined}
        aria-disabled={disabled || activeLocale === 'en' ? 'true' : undefined}
        className={classes(disabled || activeLocale === 'en')}
        title={
          disabled
            ? SafeString(t('app.languageSwitcher.disabled_tooltip'))
            : SafeString(t('app.languageSwitcher.english_tooltip'))
        }
      >
        <span className="inline-flex items-center" aria-hidden="true">
          <Flag code="GB" style={{ width: '1.5em', height: '1.5em' }} />
        </span>
      </Link>

      <Link
        href={icelandicHref}
        prefetch
        onClick={() => handleClick('is')}
        aria-label={SafeString(t('app.languageSwitcher.icelandic_label'))}
        aria-current={activeLocale === 'is' ? 'true' : undefined}
        aria-disabled={disabled || activeLocale === 'is' ? 'true' : undefined}
        className={classes(disabled || activeLocale === 'is')}
        title={
          disabled
            ? SafeString(t('app.languageSwitcher.disabled_tooltip'))
            : SafeString(t('app.languageSwitcher.icelandic_tooltip'))
        }
      >
        <span className="inline-flex items-center" aria-hidden="true">
          <Flag code="IS" style={{ width: '1.5em', height: '1.5em' }} />
        </span>
      </Link>
    </div>
  );
}
