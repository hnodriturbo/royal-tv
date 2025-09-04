/**
 * src/components/languageSwitcher/LanguageSwitcher.js
 * --------------------------------------------------
 * 🌍 Switch between English / Icelandic
 * 🧭 Preserves path + query (works in admin & user sections)
 * 🍪 Updates NEXT_LOCALE + locale cookies
 * 📡 Notifies Socket.IO (so notifications/emails localize)
 * 🚫 Disabled on checkout (/packages/[slug]/buyNow)
 * 🧼 Buttons: explicit type, children wrapped, no fragments.
 */

'use client';

import { usePathname, useRouter, useSearchParams } from '@/i18n'; // 🧭 locale-aware routing
import { useLocale, useTranslations } from 'next-intl'; // 🗣️ active locale + translator
import useSocketHub from '@/hooks/socket/useSocketHub'; // 📡 socket bridge
import Flag from 'react-world-flags'; // 🚩 flags
import { SafeString } from '@/lib/ui/SafeString';

// ✅ Supported locales
const SUPPORTED_LOCALES = ['en', 'is'];

// 🧹 Remove locale segment (/en or /is) from a path
function getPathWithoutLocale(incomingPath) {
  const safePath = typeof incomingPath === 'string' && incomingPath.length > 0 ? incomingPath : '/';
  const [, possibleLocale, ...restSegments] = safePath.split('/');
  if (SUPPORTED_LOCALES.includes(String(possibleLocale).toLowerCase())) {
    const rebuilt = '/' + restSegments.join('/');
    return rebuilt === '//' || rebuilt === '/' ? '/' : rebuilt;
  }
  return safePath;
}

// 🍪 Write both NEXT_LOCALE + locale cookies
function writeLocaleCookies(targetLocale) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=${oneYear}`;
  document.cookie = `locale=${targetLocale}; path=/; max-age=${oneYear}`;
}

// 💳 Detect if we’re on a checkout page
function isCheckoutPath(currentPathname) {
  return /\/packages\/[^/]+\/buyNow(?:\/|$)/i.test(currentPathname || '');
}

export default function LanguageSwitcher() {
  // 🗣️ current locale
  const activeLocale = useLocale();

  // 🗣️ translations (full key usage)
  const t = useTranslations();

  // 🧭 path + query
  const currentPathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // 📡 socket bridge
  const { setLocale } = useSocketHub();

  // 🚦 disable if checkout
  const isLanguageSwitchingDisabled = isCheckoutPath(currentPathname);

  // 🎨 shared styles
  const getButtonClasses = (isActiveOrDisabled) =>
    `px-2 py-1 rounded-full transition ${
      isActiveOrDisabled
        ? 'ring-2 ring-white cursor-not-allowed opacity-60'
        : 'opacity-80 hover:opacity-100 cursor-pointer'
    }`;

  // 🔁 perform the switch
  const performLocaleSwitch = (targetLocale) => {
    if (targetLocale === activeLocale || isLanguageSwitchingDisabled) return;

    try {
      writeLocaleCookies(targetLocale);
    } catch {
      // 🤫 ignore cookie errors
    }

    const localeLessPath = getPathWithoutLocale(currentPathname);
    const preservedQueryString = searchParams?.toString();
    const targetHref = preservedQueryString
      ? `${localeLessPath}?${preservedQueryString}`
      : localeLessPath;

    router.push(targetHref, { locale: targetLocale });
    router.refresh(); // 🔄 re-render with correct dictionary

    setLocale(targetLocale); // 📡 inform socket server
  };

  return (
    <div
      className="fixed top-3 right-3 z-[9999] flex items-center gap-2 rounded-full
                 bg-black/50 backdrop-blur px-3 py-2 border border-white/10 shadow"
    >
      {/* 🇬🇧 English */}
      <button
        type="button"
        aria-label={SafeString(t('app.languageSwitcher.english_label'))}
        aria-current={activeLocale === 'en' ? 'true' : undefined}
        onClick={() => performLocaleSwitch('en')}
        disabled={activeLocale === 'en' || isLanguageSwitchingDisabled}
        className={getButtonClasses(activeLocale === 'en' || isLanguageSwitchingDisabled)}
        title={
          isLanguageSwitchingDisabled
            ? SafeString(t('app.languageSwitcher.disabled_tooltip'))
            : SafeString(t('app.languageSwitcher.english_tooltip'))
        }
      >
        <span className="inline-flex items-center" aria-hidden="true">
          <Flag code="GB" style={{ width: '1.5em', height: '1.5em' }} />
        </span>
      </button>

      {/* 🇮🇸 Icelandic */}
      <button
        type="button"
        aria-label={SafeString(t('app.languageSwitcher.icelandic_label'))}
        aria-current={activeLocale === 'is' ? 'true' : undefined}
        onClick={() => performLocaleSwitch('is')}
        disabled={activeLocale === 'is' || isLanguageSwitchingDisabled}
        className={getButtonClasses(activeLocale === 'is' || isLanguageSwitchingDisabled)}
        title={
          isLanguageSwitchingDisabled
            ? SafeString(t('app.languageSwitcher.disabled_tooltip'))
            : SafeString(t('app.languageSwitcher.icelandic_tooltip'))
        }
      >
        <span className="inline-flex items-center" aria-hidden="true">
          <Flag code="IS" style={{ width: '1.5em', height: '1.5em' }} />
        </span>
      </button>
    </div>
  );
}
