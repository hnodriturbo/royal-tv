/**
 * ===========================================
 * 📄 /packages/[slug]/seeMore/page.js
 * -------------------------------------------
 * One-package details with add-ons.
 * - Finds package by slug
 * - Localizes all strings with useTranslations(root)
 * - Uses central <GuideComponent /> (default export)
 * ===========================================
 */

'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n';
import { useTranslations } from 'next-intl'; // 🌍 root i18n
import { paymentPackages, featuresKeys } from '@/components/packages/data/packages';
import Guide from '@/components/packages/data/guide'; // 📘 default export (aliased to avoid import/no-named-as-default)

export default function PackageSeeMorePage() {
  // 🔐 auth state (for CTA)
  const { data: session, status } = useSession(); // 🔐 read auth status
  const isAuthenticatedUser = status === 'authenticated' && Boolean(session?.user); // ✅ authenticated flag

  // 🧩 add-on states
  const [isAdultSelected, setIsAdultSelected] = useState(false); // 🔞 adult channels toggle
  const [isVpnSelected, setIsVpnSelected] = useState(false); // 🛡️ vpn add-on toggle
  const [isExtraDeviceSelected, setIsExtraDeviceSelected] = useState(false); // 📱 extra device toggle

  // 🏷️ translations (root) — use fully-qualified keys like 'app.packages.grid.only'
  const t = useTranslations(); // 🗣️ translator function

  // 🔎 get dynamic slug from the URL
  const { slug } = useParams(); // 🧭 slug parameter from route

  // 🧭 find the selected package object by slug (always call hook)
  const selectedPackage = useMemo(() => {
    // 🔍 search for exact slug match among known packages
    return paymentPackages.find((singlePackage) => singlePackage.slug === slug) || null;
  }, [slug]);

  // 👯 compute sibling “2 devices” variant (always call hook; defend against null)
  const twoDeviceSibling = useMemo(() => {
    // 🛡️ if package not ready yet, skip
    if (!selectedPackage) return null;

    // 🚫 if current already 2 devices, there is no upgrade sibling
    if (selectedPackage.devices === 2) return null;

    // 🔎 find same package_id with 2 devices and different slug
    return (
      paymentPackages.find(
        (candidate) =>
          candidate.package_id === selectedPackage.package_id &&
          candidate.devices === 2 &&
          candidate.slug !== selectedPackage.slug
      ) || null
    );
  }, [selectedPackage]);

  // 🚫 invalid slug guard — render “not found” after hooks are called
  if (!selectedPackage) {
    return (
      <div className="container-style text-center py-16">
        {/* 🛑 Title */}
        <h1 className="text-4xl font-bold text-red-400 mb-2">
          {t('app.packages.grid.not_found_title')}
        </h1>

        {/* ℹ️ Description */}
        <p className="mt-4 text-lg text-cyan-100">{t('app.packages.grid.not_found_desc')}</p>

        {/* 🔙 Back to packages */}
        <Link href="/packages">
          <button className="btn-primary mt-8 px-8 py-3 rounded-full text-xl shadow-xl hover:scale-105 transition">
            ← {t('app.packages.grid.back_to_packages')}
          </button>
        </Link>
      </div>
    );
  }

  // 🔀 select the effective package when "extra device" is chosen
  const effectivePackage =
    isExtraDeviceSelected && twoDeviceSibling ? twoDeviceSibling : selectedPackage; // 🔗 resolved package

  // 💵 compute total price (base + adult + vpn)
  const totalPrice =
    (effectivePackage.price ?? 0) + (isAdultSelected ? 10 : 0) + (isVpnSelected ? 10 : 0); // 💰 dynamic total

  // 🏷️ devices label
  const effectiveDevicesLabel =
    effectivePackage.devices === 2
      ? t('app.packages.grid.two_devices')
      : t('app.packages.grid.single_device'); // 🏷️ device badge text

  // 🔗 build buy-now URL with params (adult/vpn/price)
  const buyNowUrlWithParams = `${effectivePackage.buyNowUrl}?adult=${
    isAdultSelected ? 1 : 0
  }&vpn=${isVpnSelected ? 1 : 0}&price=${totalPrice}`; // 🔗 purchase link with query params

  return (
    <div className="flex flex-col items-center w-full min-h-screen lg:mt-0 mt-12">
      {/* 💳 package card */}
      <div className="container-style max-w-2xl w-full border-2 rounded-3xl shadow-2xl backdrop-blur-lg px-8 py-12 mb-10 relative">
        {/* 🏷️ device badge */}
        <div className="absolute top-6 right-6 bg-wonderful-2 border border-black text-black px-4 py-1 rounded-full text-xs font-bold shadow-lg uppercase tracking-widest">
          {effectiveDevicesLabel}
        </div>

        {/* 🏆 title (use product‑specific translation if present, fallback to raw) */}
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

        {/* 🧰 features list */}
        <div className="mb-4 w-full">
          <ul className="list-disc list-inside text-lg text-cyan-100 space-y-1 mb-6 max-w-xs mx-auto text-left">
            {featuresKeys.map((translationKey, indexNumber) => (
              <li key={indexNumber} className="flex gap-2 items-center">
                <span className="text-2xl">✔️</span> {t(translationKey)}
                {/* 📝 expects full keys like "app.packages.grid.feature_full_hd" */}
              </li>
            ))}
          </ul>
        </div>

        {/* 🖥️ devices note */}
        <div className="mb-6 text-cyan-200 text-lg text-center">
          {effectivePackage.devices === 2
            ? t('app.packages.grid.watch_two_devices')
            : t('app.packages.grid.watch_single_device')}
        </div>

        {/* 🗳️ Add-ons */}
        <div className="flex flex-col max-w-md text-center w-full mx-auto bg-black/50 rounded-2xl p-6 shadow-xl mb-6">
          {/* 🔞 Adult add-on */}
          <label className="flex flex-col items-center gap-1 text-pink-200">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAdultSelected}
                onChange={() => setIsAdultSelected(!isAdultSelected)}
              />
              {t('app.packages.grid.adult_addon_label')}
            </span>
            {isAdultSelected && (
              <div className="text-sm text-pink-300 mt-1">
                {t('app.packages.grid.adult_addon_details')}
              </div>
            )}
          </label>

          {/* 🛡️ VPN add-on */}
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
              href={buyNowUrlWithParams}
              className="btn-success btn-lg btn-glow w-2/3 rounded-xl text-xl font-bold shadow-xl transition"
            >
              {t('app.packages.grid.buy_now')}
            </Link>
          ) : (
            <Link
              href="/auth/signup"
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
          href="/packages"
          className="btn-info btn-lg px-8 py-3 rounded-full shadow-xl hover:scale-110 transition"
        >
          ← {t('app.packages.grid.back_to_packages')}
        </Link>
      </div>
    </div>
  );
}
