/**
 * src/components/i18n/LanguageSwitcher.js
 * ---------------------------------------
 * 🇬🇧 / 🇮🇸 flags in the top-right corner
 * 🧭 Uses next-intl's locale-aware router to switch /en ↔ /is
 * 🔗 Preserves current path + query string when switching
 * 🍪 Mirrors NEXT_LOCALE + locale cookies for immediate client DX
 * ♻️ Client navigation triggers SSR re-render in target locale
 */

'use client';

// 🧭 Locale-aware router + pathname from next-intl wrapper
import { usePathname, useRouter } from '@/lib/language';

// 🌍 Active locale (single source of truth)
import { useLocale } from 'next-intl';

// 🔎 Query reading (next-intl doesn't wrap this)
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
// 🏳️ Flag icons (SVG)
import Flag from 'react-world-flags';

const SUPPORTED_LOCALES = ['en', 'is']; // 🧭 Visible language options

// 🧹 Helper: strip out locale prefix
function getPathWithoutLocale(incomingPath) {
  const safePath = typeof incomingPath === 'string' && incomingPath.length > 0 ? incomingPath : '/';
  const segments = safePath.split('/');
  const firstSegment = segments[1];

  if (SUPPORTED_LOCALES.includes(String(firstSegment).toLowerCase())) {
    const rebuilt = '/' + segments.slice(2).join('/');
    return rebuilt === '//' || rebuilt === '/' ? '/' : rebuilt;
  }
  return safePath;
}

export default function LanguageSwitcher() {
  const { data: session } = useSession();
  const currentPathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeLocale = (useLocale?.() || 'en').toLowerCase();

  // 🛒 Lock switching on BuyNow routes
  const isBuyNowPage =
    /^\/(en|is)\/packages\/[^/]+\/buyNow(?:\/|$)/i.test(currentPathname || '') ||
    /^\/packages\/[^/]+\/buyNow(?:\/|$)/i.test(currentPathname || '');

  // 🔁 Switch language handler
  const switchLocale = (chosenTargetLocale) => {
    if (chosenTargetLocale === activeLocale || isBuyNowPage) return;

    try {
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `NEXT_LOCALE=${chosenTargetLocale}; path=/; max-age=${oneYear}`;
      document.cookie = `locale=${chosenTargetLocale}; path=/; max-age=${oneYear}`;
    } catch {
      // 🤫 ignore cookie errors
    }

    const preservedQueryString = searchParams?.toString();
    const localeLessPath = getPathWithoutLocale(currentPathname);
    const targetHref = preservedQueryString
      ? `${localeLessPath}?${preservedQueryString}`
      : localeLessPath;

    router.push(targetHref, { locale: chosenTargetLocale });
    router.refresh();
  };

  return (
    <div
      className="fixed top-3 right-3 z-[9999] flex items-center gap-2 rounded-full
                 bg-black/50 backdrop-blur px-3 py-2 border border-white/10 shadow"
    >
      {/* 🇬🇧 English button */}
      <button
        type="button"
        aria-label="Switch language to English"
        aria-current={activeLocale === 'en' ? 'true' : undefined}
        onClick={() => switchLocale('en')}
        disabled={activeLocale === 'en' || isBuyNowPage}
        className={`px-2 py-1 rounded-full transition
          ${
            activeLocale === 'en' || isBuyNowPage
              ? 'ring-2 ring-white cursor-not-allowed opacity-60'
              : 'opacity-80 hover:opacity-100 cursor-pointer'
          }`}
        title={isBuyNowPage ? 'Language switching disabled on checkout' : 'English'}
      >
        <Flag code="GB" style={{ width: '1.5em', height: '1.5em' }} />
      </button>

      {/* 🇮🇸 Icelandic button */}
      <button
        type="button"
        aria-label="Skipta yfir á íslensku"
        aria-current={activeLocale === 'is' ? 'true' : undefined}
        onClick={() => switchLocale('is')}
        disabled={activeLocale === 'is' || isBuyNowPage}
        className={`px-2 py-1 rounded-full transition
          ${
            activeLocale === 'is' || isBuyNowPage
              ? 'ring-2 ring-white cursor-not-allowed opacity-60'
              : 'opacity-80 hover:opacity-100 cursor-pointer'
          }`}
        title={isBuyNowPage ? 'Ekki er hægt að skipta um tungumál á greiðslusíðu' : 'Íslenska'}
      >
        <Flag code="IS" style={{ width: '1.5em', height: '1.5em' }} />
      </button>
    </div>
  );
}
