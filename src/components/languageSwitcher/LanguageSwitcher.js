/**
 * src/components/i18n/LanguageSwitcher.js
 * ---------------------------------------
 * 🇬🇧 / 🇮🇸 flags in the top-right corner
 * 🧭 Locale-aware router (preserve path + query)
 * 🍪 Mirrors NEXT_LOCALE + locale
 * 📡 Notifies Socket.IO via setLocale
 * 🚫 Disables switching on checkout to avoid mid-payment changes
 */

'use client';

import { usePathname, useRouter } from '@/i18n'; // 🌍 locale-aware router + pathname
import { useLocale } from 'next-intl'; // 🗣️ current active locale
import { useSearchParams } from 'next/navigation'; // 🔎 query preservation
import useSocketHub from '@/hooks/socket/useSocketHub'; // 📡 socket bridge
import Flag from 'react-world-flags'; // 🚩 flags

// ✅ Supported locales live here
const SUPPORTED_LOCALES = ['en', 'is'];

// 🧹 Strip `/en` or `/is` from the front of a path
function getPathWithoutLocale(incomingPath) {
  // 🛡️ sanitize unexpected values
  const safePath = typeof incomingPath === 'string' && incomingPath.length > 0 ? incomingPath : '/';
  const [, possibleLocale, ...restSegments] = safePath.split('/'); // ['', maybe-locale, ...rest]
  if (SUPPORTED_LOCALES.includes(String(possibleLocale).toLowerCase())) {
    const rebuilt = '/' + restSegments.join('/');
    return rebuilt === '//' || rebuilt === '/' ? '/' : rebuilt;
  }
  return safePath;
}

// 🧾 One place to set both cookies
function writeLocaleCookies(targetLocale) {
  // 🍪 one-year lifetime
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=${oneYear}`;
  document.cookie = `locale=${targetLocale}; path=/; max-age=${oneYear}`;
}

// 🧭 Simple, resilient “is checkout” check
function isCheckoutPath(currentPathname) {
  // 💳 lock language on BuyNow to avoid changing amounts mid-payment
  return /\/packages\/[^/]+\/buyNow(?:\/|$)/i.test(currentPathname || '');
}

export default function LanguageSwitcher() {
  // 🗣️ current locale (authoritative)
  const activeLocale = useLocale();

  // 🧭 path + query from Next
  const currentPathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // 📡 socket locale bridge
  const { setLocale } = useSocketHub();

  // 🚦 determine if switching should be blocked
  const isLanguageSwitchingDisabled = isCheckoutPath(currentPathname);

  // 🧯 Shared button classes
  const getButtonClasses = (isActiveOrDisabled) =>
    // 🎨 subtle ring when active/disabled, hover feedback when allowed
    `px-2 py-1 rounded-full transition ${
      isActiveOrDisabled
        ? 'ring-2 ring-white cursor-not-allowed opacity-60'
        : 'opacity-80 hover:opacity-100 cursor-pointer'
    }`;

  // 🔁 Perform the actual switch
  const performLocaleSwitch = (targetLocale) => {
    // 🚫 no-op if same locale or switching currently disabled
    if (targetLocale === activeLocale || isLanguageSwitchingDisabled) return;

    // 🍪 store preference
    try {
      writeLocaleCookies(targetLocale);
    } catch {
      // 🤫 ignore cookie errors
    }

    // 🔗 keep same route + query, only swap locale segment
    const localeLessPath = getPathWithoutLocale(currentPathname);
    const preservedQueryString = searchParams?.toString();
    const targetHref = preservedQueryString
      ? `${localeLessPath}?${preservedQueryString}`
      : localeLessPath;

    // 🧭 Navigate with locale
    router.push(targetHref, { locale: targetLocale });
    router.refresh(); // 🔄 ensure translations/UI update

    // 📡 Inform Socket.IO server so runtime notifications/emails localize correctly
    setLocale(targetLocale);
  };

  return (
    <div
      className="fixed top-3 right-3 z-[9999] flex items-center gap-2 rounded-full
                 bg-black/50 backdrop-blur px-3 py-2 border border-white/10 shadow"
    >
      {/* 🇬🇧 English */}
      <button
        type="button"
        aria-label="Switch language to English"
        aria-current={activeLocale === 'en' ? 'true' : undefined}
        onClick={() => performLocaleSwitch('en')}
        disabled={activeLocale === 'en' || isLanguageSwitchingDisabled}
        className={getButtonClasses(activeLocale === 'en' || isLanguageSwitchingDisabled)}
        title={isLanguageSwitchingDisabled ? 'Language switching disabled on checkout' : 'English'}
      >
        {/* 🏳️ render GB flag */}
        <Flag code="GB" style={{ width: '1.5em', height: '1.5em' }} />
      </button>

      {/* 🇮🇸 Icelandic */}
      <button
        type="button"
        aria-label="Skipta yfir á íslensku"
        aria-current={activeLocale === 'is' ? 'true' : undefined}
        onClick={() => performLocaleSwitch('is')}
        disabled={activeLocale === 'is' || isLanguageSwitchingDisabled}
        className={getButtonClasses(activeLocale === 'is' || isLanguageSwitchingDisabled)}
        title={
          isLanguageSwitchingDisabled
            ? 'Ekki er hægt að skipta um tungumál á greiðslusíðu'
            : 'Íslenska'
        }
      >
        {/* 🏳️ render IS flag */}
        <Flag code="IS" style={{ width: '1.5em', height: '1.5em' }} />
      </button>
    </div>
  );
}
