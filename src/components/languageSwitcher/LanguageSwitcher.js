'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import useSocketHub from '@/hooks/socket/useSocketHub';
import Flag from 'react-world-flags';
import { SafeString } from '@/lib/ui/SafeString';
import Link from 'next/link';

const SUPPORTED_LOCALES = ['en', 'is'];

function getPathWithoutLocale(incomingPath) {
  const safePath = typeof incomingPath === 'string' && incomingPath.length > 0 ? incomingPath : '/';
  const [, possibleLocale, ...restSegments] = safePath.split('/');
  if (SUPPORTED_LOCALES.includes(String(possibleLocale).toLowerCase())) {
    const rebuilt = '/' + restSegments.join('/');
    return rebuilt === '//' || rebuilt === '/' ? '/' : rebuilt;
  }
  return safePath;
}

function writeLocaleCookies(targetLocale) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=${oneYear}`;
  document.cookie = `locale=${targetLocale}; path=/; max-age=${oneYear}`;
}

function isCheckoutPath(currentPathname) {
  return /\/packages\/[^/]+\/buyNow(?:\/|$)/i.test(currentPathname || '');
}

export default function LanguageSwitcher() {
  const activeLocale = useLocale();
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setLocale } = useSocketHub();

  const disabled = isCheckoutPath(pathname);

  // Build a locale-less href + carry query string
  const base = getPathWithoutLocale(pathname);
  const query = searchParams?.toString();
  const hrefBase = query ? `${base}?${query}` : base;

  const classes = (off) =>
    `px-2 py-1 rounded-full transition ${
      off ? 'ring-2 ring-white cursor-not-allowed opacity-60' : 'opacity-80 hover:opacity-100'
    }`;

  // When using Link, use aria-disabled instead of disabled
  const handleClick = (locale) => {
    try {
      writeLocaleCookies(locale);
      setLocale(locale);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      className="fixed top-3 right-3 z-[9999] flex items-center gap-2 rounded-full
                 bg-black/50 backdrop-blur px-3 py-2 border border-white/10 shadow"
    >
      {/* 🇬🇧 English */}
      <Link
        href={hrefBase}
        locale="en"
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

      {/* 🇮🇸 Icelandic */}
      <Link
        href={hrefBase}
        locale="is"
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
