// /data/packages.js (i18n)
// 📦 Renders package cards, labels via app.packages.grid.* and app.packages.products.* per slug

'use client';

import { Link } from '@/lib/language';
import { useState } from 'react';
import { useT } from '@/lib/i18n/client'; // 🌍 i18n

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
].map((pkg) => ({
  ...pkg,
  detailsUrl: `/packages/${pkg.slug}/seeMore`,
  buyNowUrl: `/packages/${pkg.slug}/buyNow`
}));

const featuresKeys = [
  'feature_full_hd',
  'feature_premium',
  'feature_20000',
  'feature_icelandic',
  'feature_vpn_addon',
  'feature_adult_addon'
];

const PackagesGrid = ({ authenticated }) => {
  const t = useT('app.packages.grid'); // 🏷️ for generic labels
  const tProd = useT('app.packages.products'); // 🏷️ for per-product strings

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-8 w-full max-w-6xl mx-auto justify-center items-center justify-items-center">
      {paymentPackages.map((pkg) => (
        <PackageCard key={pkg.slug} pkg={pkg} authenticated={authenticated} t={t} tProd={tProd} />
      ))}
    </div>
  );
};

function PackageCard({ pkg, authenticated, t, tProd }) {
  const [adultChecked, setAdultChecked] = useState(false); // 🔞 state
  const [vpnChecked, setVpnChecked] = useState(false); // 🛡️ state

  const totalPrice = pkg.price + (adultChecked ? 10 : 0) + (vpnChecked ? 10 : 0); // 💵 compute
  const buyNowUrl = `${pkg.buyNowUrl}?adult=${adultChecked ? 1 : 0}&vpn=${vpnChecked ? 1 : 0}&price=${totalPrice}`; // 🔗 url

  return (
    <div className="justify-center relative border-2 max-w-2xl container-style rounded-2xl p-8 flex flex-col items-center shadow-2xl transition-transform duration-300 hover:scale-102 hover:shadow-[0_8px_40px_0_rgba(0,0,0,0.40)] backdrop-blur-lg min-h-fit max-h-[200px]">
      {/* 🏷️ Device badge */}
      <div className="absolute top-4 right-4 bg-wonderful-4 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg uppercase">
        {pkg.devices === 1 ? t('single_device') : t('two_devices')}
      </div>

      {/* 🏆 Name */}
      <h3 className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-xl text-glow-amber">
        {tProd(`${pkg.slug}.order_description`, pkg.order_description)}
      </h3>

      {/* 💵 Price */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-3xl font-extrabold text-pink-400 drop-shadow-lg text-glow-purple">
          {t('only')} ${pkg.price}
        </span>
        <span className="text-2xl font-semibold text-glow-purple">{t('usd')}</span>
      </div>

      {/* 📦 Features */}
      <div className="flex flex-col items-center justify-center w-full mb-4">
        <div className="max-w-lg w-full mx-auto bg-black/50 rounded-2xl p-6 shadow-xl">
          <ul className="mb-2 mt-2 text-cyan-100 text-base font-medium space-y-1 text-left pl-6">
            {featuresKeys.map((k) => (
              <li key={k} className="flex items-center gap-2">
                <span className="text-2xl">✔️</span>
                {t(k)}
              </li>
            ))}
          </ul>

          {pkg.devices === 2 && (
            <div className="flex items-center gap-2 text-green-300 font-bold pl-6 mb-3">
              <span className="text-green-500">🖥️</span>
              {t('watch_two_devices')}
            </div>
          )}

          {/* 🗳️ Add-ons */}
          <div className="flex flex-col gap-1 w-full mb-3 text-left pl-6">
            <label className="flex items-center gap-2">
              {t('adult_addon_label')}
              <input
                type="checkbox"
                checked={adultChecked}
                onChange={() => setAdultChecked(!adultChecked)}
              />
            </label>
            {adultChecked && (
              <div className="ml-6 mt-2 text-sm text-pink-200">{t('adult_addon_details')}</div>
            )}
            <label className="flex items-center gap-2 text-white">
              {t('vpn_addon_label')}
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
          <Link href={buyNowUrl} className="w-full">
            <button className="btn-primary text-glow btn-glow text-black w-full py-3 rounded-xl font-bold text-xl tracking-wide shadow-xl hover:scale-102">
              {t('buy_now')}
            </button>
          </Link>
        ) : (
          <Link href="/auth/signup" className="w-full">
            <button className="btn-secondary text-glow btn-glow text-black w-full py-3 rounded-xl font-bold text-xl tracking-wide shadow-xl hover:scale-102">
              {t('register_to_buy')}
            </button>
          </Link>
        )}
        <Link href={pkg.detailsUrl} className="w-full">
          <button className="btn-info text-glow text-black w-full py-3 rounded-xl font-bold text-lg tracking-wide shadow-lg hover:scale-102">
            {t('more_info')}
          </button>
        </Link>
      </div>
    </div>
  );
}

export default PackagesGrid;
