'use client';
/**
 * ===========================================
 * 📄 /packages/[slug]/seeMore/page.js
 * -------------------------------------------
 * 🧭 One-package details with add-ons (Client)
 * • Finds selected package by [slug]
 * • Locale-aware links via `useLocale()` — all internal <Link> hrefs are
 *   prefixed with /{locale} (including the Buy Now URL with query params)
 * • All strings translated with next-intl’s `useTranslations()`
 * • Renders the central <Guide /> component below the package card
 * • ✅ Keeps your custom Tailwind classes untouched
 * ===========================================
 */

import Link from 'next/link';
import { SafeString } from '@/lib/ui/SafeString';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl'; // 🌍 root i18n
import { paymentPackages, featuresKeys } from '@/components/packages/data/packages';
import Guide from '@/components/packages/data/guide'; // 📘 default export

export default function PackageSeeMorePage() {
  // 🔐 auth state (for CTA)
  const { data: session, status } = useSession();
  const isAuthenticatedUser = status === 'authenticated' && Boolean(session?.user);

  // 🧩 add-on toggles
  const [isAdultSelected, setIsAdultSelected] = useState(false);
  const [isVpnSelected, setIsVpnSelected] = useState(false);
  const [isExtraDeviceSelected, setIsExtraDeviceSelected] = useState(false);

  // 🌍 locale + translator
  const locale = useLocale();
  const t = useTranslations();

  // 🔎 dynamic route param
  const { slug } = useParams();

  // 🧭 select package by slug
  const selectedPackage = useMemo(
    () => paymentPackages.find((p) => p.slug === slug) || null,
    [slug]
  );

  // 👯 sibling: same package_id with 2 devices (if current isn’t already 2)
  const twoDeviceSibling = useMemo(() => {
    if (!selectedPackage || selectedPackage.devices === 2) return null;
    return (
      paymentPackages.find(
        (candidate) =>
          candidate.package_id === selectedPackage.package_id &&
          candidate.devices === 2 &&
          candidate.slug !== selectedPackage.slug
      ) || null
    );
  }, [selectedPackage]);

  // 🛑 invalid slug → localized Not Found UX
  if (!selectedPackage) {
    return (
      <div className="container-style text-center py-16">
        <h1 className="text-4xl font-bold text-red-400 mb-2">
          {t('app.packages.grid.not_found_title')}
        </h1>
        <p className="mt-4 text-lg text-cyan-100">{t('app.packages.grid.not_found_desc')}</p>
        <Link href={`/${locale}/packages`}>
          <button className="btn-primary mt-8 px-8 py-3 rounded-full text-xl shadow-xl hover:scale-105 transition">
            ← {SafeString(t('app.packages.grid.back_to_packages'), '')}
          </button>
        </Link>
      </div>
    );
  }

  // 🔀 resolve effective package when “Extra device” is toggled
  const effectivePackage =
    isExtraDeviceSelected && twoDeviceSibling ? twoDeviceSibling : selectedPackage;

  // 💰 computed total (base + add-ons)
  const totalPrice =
    (effectivePackage.price ?? 0) + (isAdultSelected ? 10 : 0) + (isVpnSelected ? 10 : 0);

  // 🏷️ devices label
  const effectiveDevicesLabel =
    effectivePackage.devices === 2
      ? t('app.packages.grid.two_devices')
      : t('app.packages.grid.single_device');

  // 🔗 build *internal* Buy Now URL with params — locale-prefixed
  const buyNowUrlWithParams = `/${locale}${effectivePackage.buyNowUrl}?adult=${
    isAdultSelected ? 1 : 0
  }&vpn=${isVpnSelected ? 1 : 0}&price=${totalPrice}`;

  return (
    <div className="flex flex-col items-center w-full min-h-screen lg:mt-0 mt-12">
      {/* 💳 package card */}
      <div className="container-style max-w-2xl w-full border-2 rounded-3xl shadow-2xl backdrop-blur-lg px-8 py-12 mb-10 relative">
        {/* 🏷️ device badge */}
        <div className="absolute top-6 right-6 bg-wonderful-2 border border-black text-black px-4 py-1 rounded-full text-xs font-bold shadow-lg uppercase tracking-widest">
          {effectiveDevicesLabel}
        </div>

        {/* 🏆 headline (translation fallback) */}
        <h1 className="text-4xl md:text-5xl font-black text-yellow-300 drop-shadow-xl mb-3 tracking-tight text-center">
          {t(
            `app.packages.products.${selectedPackage.slug}.order_description`,
            selectedPackage.order_description
          )}
        </h1>

        {/* 💵 price line */}
        <div className="mb-2 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-extrabold drop-shadow-lg">
              {t('app.packages.grid.only')} {totalPrice} {t('app.packages.grid.usd')}
            </span>
          </div>
        </div>

        {/* 🧰 features */}
        <div className="mb-4 w-full">
          <ul className="list-disc list-inside text-lg text-cyan-100 space-y-1 mb-6 max-w-xs mx-auto text-left">
            {featuresKeys.map((translationKey, idx) => (
              <li key={idx} className="flex gap-2 items-center">
                <span className="text-2xl">✔️</span> {t(translationKey)}
              </li>
            ))}
          </ul>
        </div>

        {/* 🖥️ device hint */}
        <div className="mb-6 text-cyan-200 text-lg text-center">
          {effectivePackage.devices === 2
            ? t('app.packages.grid.watch_two_devices')
            : t('app.packages.grid.watch_single_device')}
        </div>

        {/* 🗳️ Add-ons */}
        <div className="flex flex-col max-w-md text-center w-full mx-auto bg-black/50 rounded-2xl p-6 shadow-xl mb-6">
          {/* 🔞 Adult */}
          <label className="flex flex-col items-center gap-1 text-pink-200">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAdultSelected}
                onChange={() => setIsAdultSelected(!isAdultSelected)}
              />
              {t('app.packages.grid.feature_adult_addon')}
            </span>
            {isAdultSelected && (
              <div className="text-sm text-pink-300 mt-1">
                {t('app.packages.grid.adult_addon_details')}
              </div>
            )}
          </label>

          {/* 🛡️ VPN */}
          <label className="flex items-center justify-center gap-2 text-cyan-200 mt-2">
            <input
              type="checkbox"
              checked={isVpnSelected}
              onChange={() => setIsVpnSelected(!isVpnSelected)}
            />
            {t('app.packages.grid.vpn_addon_label')}
          </label>
        </div>

        {/* 🚀 CTAs */}
        <div className="flex flex-col gap-3 w-full mt-6 justify-center items-center">
          {isAuthenticatedUser ? (
            <Link
              href={buyNowUrlWithParams /* ✅ internal link with locale prefix */}
              className="btn-success btn-lg btn-glow w-2/3 rounded-xl text-xl font-bold shadow-xl transition"
            >
              {t('app.packages.grid.buy_now')}
            </Link>
          ) : (
            <Link
              href={`/${locale}/auth/signup`}
              className="btn-secondary btn-lg btn-glow w-2/3 rounded-xl text-xl font-bold shadow-xl transition"
            >
              {t('app.packages.grid.register_to_buy')}
            </Link>
          )}
        </div>
      </div>

      {/* 📘 guide (uses app.packages.guide.* keys internally) */}
      <Guide />

      {/* 🔙 back to packages */}
      <div className="container-style w-fit mb-12">
        <Link
          href={`/${locale}/packages`}
          className="btn-info btn-lg px-8 py-3 rounded-full shadow-xl hover:scale-110 transition"
        >
          ← {t('app.packages.grid.back_to_packages')}
        </Link>
      </div>
    </div>
  );
}
