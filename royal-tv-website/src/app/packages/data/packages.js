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

import Link from 'next/link';

/**
 * Royal TV Payment Packages & Shared Features
 * ==========================================
 */

export const packageFeatures = [
  'Full HD Channels',
  'Premium Movies & Sports',
  '24/7 Support',
  '20,000 channels from all over the world',
  'Premium service',
  'Adult content for extra 10$'
];

// 💰 Main packages array, auto-generates detailsUrl and buyNowUrl
export const paymentPackages = [
  {
    slug: 'tester',
    order_id: 'tester',
    name: 'Tester',
    duration: 'Test period',
    devices: 1,
    price: 30,
    iid: '4369375603'
  },
  {
    slug: '6m',
    order_id: '6m',
    name: '6 Months',
    duration: '6 months',
    devices: 1,
    price: 70,
    iid: '5164526363'
  },
  {
    slug: '6m_extra',
    order_id: '6m_extra',
    name: '6 Months + Extra Device',
    duration: '6 months',
    devices: 2,
    price: 120,
    iid: '4900982772'
  },
  {
    slug: '12m',
    order_id: '12m',
    name: '12 Months',
    duration: '12 months',
    devices: 1,
    price: 120,
    iid: '5663642432'
  },
  {
    slug: '12m_extra',
    order_id: '12m_extra',
    name: '12 Months + Extra Device',
    duration: '12 months',
    devices: 2,
    price: 180,
    iid: '4701899669'
  }
].map((pkg) => ({
  ...pkg,
  // 🛤️ Always use underscore slug for URLs
  detailsUrl: `/packages/${pkg.slug}/seeMore`,
  buyNowUrl: `/packages/${pkg.slug}/buyNow`
}));

const PackagesGrid = ({ authenticated }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-8 w-full max-w-6xl mx-auto justify-center items-center justify-items-center">
    {paymentPackages.map((pkg) => (
      <div
        key={pkg.slug}
        className="justify-center
          relative border-2 max-w-2xl
          container-style rounded-2xl p-8 flex flex-col items-center shadow-2xl
          transition-transform duration-300 hover:-translate-y-2 hover:scale-102 hover:shadow-[0_8px_40px_0_rgba(0,0,0,0.40)]
          backdrop-blur-lg
        "
      >
        {/* 🏷️ Device Badge */}
        <div className="absolute top-4 right-4 bg-wonderful-4 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg uppercase">
          {pkg.devices === 1 ? 'Single Device' : '2 Devices'}
        </div>
        {/* 🏆 Name */}
        <h3 className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-xl">{pkg.name}</h3>
        {/* 💵 Price */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-3xl font-extrabold text-pink-400 drop-shadow-lg">${pkg.price}</span>
          <span className="text-lg font-semibold text-white/80">USD</span>
        </div>
        {/* ⏳ Duration */}
        <div className="mb-1 text-lg text-blue-200 font-bold tracking-wide uppercase">
          {pkg.duration}
        </div>
        {/* 🎁 Shared Features */}
        <ul className="mb-6 mt-2 text-cyan-100 text-base font-medium space-y-1 text-left w-full max-w-[260px]">
          {packageFeatures.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-wonderful-5">✔️</span>
              {feature}
            </li>
          ))}
        </ul>
        {/* 🔗 Buttons */}
        <div className="flex flex-col gap-2 w-full mt-auto">
          {authenticated ? (
            <Link href={pkg.buyNowUrl} className="w-full">
              <button className="btn-primary w-full py-3 rounded-xl font-bold text-xl tracking-wide shadow-xl transition hover:scale-105">
                Buy Now
              </button>
            </Link>
          ) : (
            <Link href="/auth/signup" className="w-full">
              <button className="btn-secondary w-full py-3 rounded-xl font-bold text-xl tracking-wide shadow-xl transition hover:scale-105">
                Register to Buy
              </button>
            </Link>
          )}
          <Link href={pkg.detailsUrl} className="w-full">
            <button className="btn-info w-full py-3 rounded-xl font-bold text-lg tracking-wide shadow-lg hover:scale-105">
              More Info
            </button>
          </Link>
        </div>
      </div>
    ))}
  </div>
);

export default PackagesGrid;
