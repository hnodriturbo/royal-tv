// /data/packages.js

/**
 * Royal TV Payment Packages & Shared Features
 * ==========================================
 */

export const packageFeatures = [
  'Full HD Channels',
  'Premium Movies & Sports',
  '24/7 Support',
  '20,000 channels from all over the world',
  'Premium service'
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
