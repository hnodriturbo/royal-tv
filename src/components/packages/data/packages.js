/**
 * ============================================================
 * 📦 Packages data + grid
 * ------------------------------------------------------------
 * - Exposes `paymentPackages` for pricing/cards
 * - Exposes `featuresKeys` for i18n feature bullets
 * - Renders <PackagesGrid /> using translated strings
 * ============================================================
 */

'use client';

import { Link } from '@/i18n';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl'; // 🌍 i18n

// 💰 raw package data (slugs used for i18n keys)
export const paymentPackages = [
  {
    id: 3,
    slug: '6m',
    order_id: '6m',
    order_description: '6 Months',
    duration: '6 Months (60$)',
    devices: 1,
    price: 30,
    package_id: 3,
    paid: true
  },
  {
    id: 4,
    slug: '6m_extra',
    order_id: '6m_extra',
    order_description: '6 Months + Extra Device',
    duration: '6 Months + Extra Device (100$)',
    devices: 2,
    price: 100,
    package_id: 3,
    paid: true
  },
  {
    id: 5,
    slug: '12m',
    order_id: '12m',
    order_description: '1 Year (Most Popular)',
    duration: '1 Year (Most Popular) (100$)',
    devices: 1,
    price: 100,
    package_id: 5,
    paid: true
  },
  {
    id: 6,
    slug: '12m_extra',
    order_id: '12m_extra',
    order_description: '1 Year + Extra Device',
    duration: '1 Year + Extra Device (160$)',
    devices: 2,
    price: 160,
    package_id: 5,
    paid: true
  },
  {
    id: 7,
    slug: '24m',
    order_id: '24m',
    order_description: '2 Years',
    duration: '2 Years (160$)',
    devices: 2,
    price: 160,
    package_id: 8,
    paid: true
  },
  {
    id: 8,
    slug: '24m_extra',
    order_id: '24m_extra',
    order_description: '2 Years + Extra Device',
    duration: '2 Years + Extra Device (240$)',
    devices: 2,
    price: 240,
    package_id: 8,
    paid: true
  }
].map((singlePackage) => ({
  ...singlePackage,
  detailsUrl: `/packages/${singlePackage.slug}/seeMore`,
  buyNowUrl: `/packages/${singlePackage.slug}/buyNow`
}));

// 🧩 export i18n feature keys so pages can localize consistently
export const featuresKeys = [
  'feature_full_hd',
  'feature_premium',
  'feature_20000',
  'feature_icelandic',
  'feature_vpn_addon',
  'feature_adult_addon'
];

const PackagesGrid = ({ authenticated }) => {
  const t = useTranslations(); // 🌍 always full-path

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-8 w-full max-w-6xl mx-auto justify-center items-center justify-items-center">
      {paymentPackages.map((singlePackage) => (
        <PackageCard
          key={singlePackage.slug}
          pkg={singlePackage}
          authenticated={authenticated}
          t={t}
        />
      ))}
    </div>
  );
};

function PackageCard({ pkg, authenticated, t }) {
  const [adultChecked, setAdultChecked] = useState(false); // 🔞 toggle
  const [vpnChecked, setVpnChecked] = useState(false); // 🛡️ toggle

  const totalPrice = pkg.price + (adultChecked ? 10 : 0) + (vpnChecked ? 10 : 0); // 💵 compute
  const buyNowUrl = `${pkg.buyNowUrl}?adult=${adultChecked ? 1 : 0}&vpn=${
    vpnChecked ? 1 : 0
  }&price=${totalPrice}`; // 🔗 url

  return (
    <div className="justify-center relative border-2 max-w-2xl container-style rounded-2xl p-8 flex flex-col items-center shadow-2xl transition-transform duration-300 hover:scale-102 hover:shadow-[0_8px_40px_0_rgba(0,0,0,0.40)] backdrop-blur-lg min-h-fit max-h-[200px]">
      {/* 🏷️ Device badge */}
      <div className="absolute top-4 right-4 bg-wonderful-4 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg uppercase">
        {pkg.devices === 1
          ? t('app.packages.grid.single_device')
          : t('app.packages.grid.two_devices')}
      </div>

      {/* 🏆 Name */}
      <h3 className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-xl text-glow-amber">
        {t(`app.packages.products.${pkg.slug}.order_description`, pkg.order_description)}
      </h3>

      {/* 💵 Price */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-3xl font-extrabold text-pink-400 drop-shadow-lg text-glow-purple">
          {t('app.packages.grid.only')} ${pkg.price}
        </span>
        <span className="text-2xl font-semibold text-glow-purple">
          {t('app.packages.grid.usd')}
        </span>
      </div>

      {/* 📦 Features */}
      <div className="flex flex-col items-center justify-center w-full mb-4">
        <div className="max-w-lg w’all mx-auto bg-black/50 rounded-2xl p-6 shadow-xl">
          <ul className="mb-2 mt-2 text-cyan-100 text-base font-medium space-y-1 text-left pl-6">
            {featuresKeys.map((translationKey) => (
              <li key={translationKey} className="flex items-center gap-2">
                <span className="text-2xl">✔️</span>
                {t(`app.packages.grid.${translationKey}`)}
              </li>
            ))}
          </ul>

          {pkg.devices === 2 && (
            <div className="flex items-center gap-2 text-green-300 font-bold pl-6 mb-3">
              <span className="text-green-500">🖥️</span>
              {t('app.packages.grid.watch_two_devices')}
            </div>
          )}

          {/* 🗳️ Add-ons */}
          <div className="flex flex-col gap-1 w-full mb-3 text-left pl-6">
            <label className="flex items-center gap-2">
              {t('app.packages.grid.adult_addon_label')}
              <input
                type="checkbox"
                checked={adultChecked}
                onChange={() => setAdultChecked(!adultChecked)}
              />
            </label>
            {adultChecked && (
              <div className="ml-6 mt-2 text-sm text-pink-200">
                {t('app.packages.grid.adult_addon_details')}
              </div>
            )}
            <label className="flex items-center gap-2 text-white">
              {t('app.packages.grid.vpn_addon_label')}
              <input
                type="checkbox"
                checked={vpnChecked}
                onChange={() => setVpnChecked(!vpnChecked)}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 🔗 Buttons */}
      <div className="flex flex-col gap-2 w-full mt-auto">
        {authenticated ? (
          <Link
            href={buyNowUrl}
            className="btn-primary text-glow btn-glow text-black w-full py-3 rounded-xl font-bold text-xl tracking-wide shadow-xl hover:scale-102 text-center"
          >
            {t('app.packages.grid.buy_now')}
          </Link>
        ) : (
          <Link
            href="/auth/signup"
            className="btn-secondary text-glow btn-glow text-black w-full py-3 rounded-xl font-bold text-xl tracking-wide shadow-xl hover:scale-102 text-center"
          >
            {t('app.packages.grid.register_to_buy')}
          </Link>
        )}
        <Link
          href={pkg.detailsUrl}
          className="btn-info text-glow text-black w-full py-3 rounded-xl font-bold text-lg tracking-wide shadow-lg hover:scale-102 text-center"
        >
          {t('app.packages.grid.more_info')}
        </Link>
      </div>
    </div>
  );
}

export default PackagesGrid;
