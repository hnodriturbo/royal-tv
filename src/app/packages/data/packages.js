// /data/packages.js
/**
 * Royal TV — Packages Grid Component 📦✨
 * ======================================
 * Displays all payment packages in a responsive grid,
 * using official data from packages/data/packages.js.
 *
 * Import and use in any page:
 * import PackagesGrid from '@/components/ui/PackagesGrid';
 * <PackagesGrid authenticated={authenticated} />
 */
'use client';
import Link from 'next/link';
import { useState } from 'react';
/**
 * Royal TV Payment Packages & Shared Features
 * ==========================================
 */

export const packageFeatures = [
  'Full HD Channels',
  'Premium Movies & Sports',
  '20,000 channels from all over the world',
  'All Icelandic Channels Included!',
  'VPN on your connection for extra 10$',
  'Adult content for extra 10$'
];

// 💰 Main packages array, auto-generates detailsUrl and buyNowUrl
export const paymentPackages = [
  {
    id: 1,
    slug: 'trial_24h',
    order_id: 'trial_24h',
    order_description: '24H Free Trial (FREE)',
    duration: '24H Free Trial (FREE)',
    devices: 1,
    price: 0,
    package_id: 2,
    paid: true,
    isTrial: true
  },
  /*   {
    id: 2,
    slug: '3m',
    order_id: '3m',
    order_description: '3 Months',
    duration: '3 Months (40$)',
    devices: 1,
    price: 40,
    package_id: 6,
    paid: true,
    isTrial: false
  }, */
  {
    id: 3,
    slug: '6m',
    order_id: '6m',
    order_description: '6 Months',
    duration: '6 Months (60$)',
    devices: 1,
    price: 60,
    package_id: 3,
    paid: true
  },
  {
    id: 4,
    slug: '6m_extra',
    order_id: '6m_extra',
    order_description: '6 Months + Extra Device',
    duration: '6 Months + Extra Device (100$)',
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

/**
 * PackagesGrid
 * Main export, renders all non-trial packages.
 * Each card gets checkboxes for add-ons and calculates total price.
 */
const PackagesGrid = ({ authenticated }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-8 w-full max-w-6xl mx-auto justify-center items-center justify-items-center">
    {paymentPackages
      .filter((pkg) => !pkg.isTrial)
      .map((pkg) => (
        <PackageCard key={pkg.slug} pkg={pkg} authenticated={authenticated} />
      ))}
  </div>
);

function PackageCard({ pkg, authenticated }) {
  // 🧩 Add-on states (Adult/VPN)
  const [adultChecked, setAdultChecked] = useState(false);
  const [vpnChecked, setVpnChecked] = useState(false);

  // 💰 Calculate total price based on selections
  const totalPrice = pkg.price + (adultChecked ? 10 : 0) + (vpnChecked ? 10 : 0);

  // 🔗 Prepare buyNow URL with selected options
  const buyNowUrl = `${pkg.buyNowUrl}?adult=${adultChecked ? 1 : 0}&vpn=${vpnChecked ? 1 : 0}&price=${totalPrice}`;

  return (
    // ✅ Render the package details html
    <div
      className="justify-center
        relative border-2 max-w-2xl
        container-style rounded-2xl p-8 flex flex-col items-center shadow-2xl
        transition-transform duration-300 hover:scale-102 hover:shadow-[0_8px_40px_0_rgba(0,0,0,0.40)]
        backdrop-blur-lg
        min-h-fit max-h-[200px]"
    >
      {/* 🏷️ Device badge */}
      <div className="absolute top-4 right-4 bg-wonderful-4 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg uppercase">
        {pkg.devices === 1 ? 'Single Device' : '2 Devices'}
      </div>
      {/* 🏆 Package name */}
      <h3 className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-xl text-glow-amber">
        {pkg.order_description}
      </h3>

      {/* 💵 Base price */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-3xl font-extrabold text-pink-400 drop-shadow-lg text-glow-purple">
          ONLY ${pkg.price}
        </span>
        <span className="text-2xl font-semibold text-glow-purple">USD</span>
      </div>
      {/* ⏳ Duration */}
      {/*       <div className="mb-1 text-lg text-blue-200 font-bold tracking-wide uppercase">
        {pkg.duration}
      </div> */}
      {/* 📦 Centered Card */}
      <div className="flex flex-col items-center justify-center w-full mb-4">
        <div className="max-w-lg w-full mx-auto bg-black/50 rounded-2xl p-6 shadow-xl">
          {/* 📝 Features list, left-aligned with left padding */}
          <ul className="mb-2 mt-2 text-cyan-100 text-base font-medium space-y-1 text-left pl-6">
            {packageFeatures.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-2xl">✔️</span>
                {feature}
              </li>
            ))}
          </ul>

          {pkg.devices === 2 && (
            <div className="flex items-center gap-2 text-green-300 font-bold pl-6 mb-3">
              <span className="text-green-500">🖥️</span>
              Watch on 2 devices at once
            </div>
          )}
          {/* 🗳️ Add-on checkboxes, also left-aligned with left padding */}
          <div className="flex flex-col gap-1 w-full mb-3 text-left pl-6">
            <label className="flex items-center gap-2">
              Adult content (+$10)
              <input
                type="checkbox"
                checked={adultChecked}
                onChange={() => setAdultChecked(!adultChecked)}
              />
            </label>
            {adultChecked && (
              <div className="ml-6 mt-2 text-sm text-pink-200">
                Unlocks <span className="font-bold text-yellow-300">200+ Adult Live Channels</span>
                <br />& unlimited adult movies, exclusive on Royal TV.
              </div>
            )}
            <label className="flex items-center gap-2 text-white">
              VPN protection (+$10)
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
              Buy Now
            </button>
          </Link>
        ) : (
          <Link href="/auth/signup" className="w-full">
            <button className="btn-secondary text-glow btn-glow text-black w-full py-3 rounded-xl font-bold text-xl tracking-wide shadow-xl hover:scale-102">
              Register to Buy
            </button>
          </Link>
        )}
        <Link href={pkg.detailsUrl} className="w-full">
          <button className="btn-info text-glow text-black w-full py-3 rounded-xl font-bold text-lg tracking-wide shadow-lg hover:scale-102">
            More Info
          </button>
        </Link>
      </div>
    </div>
  );
}
export default PackagesGrid;
