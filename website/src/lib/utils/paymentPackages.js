/**
 * paymentPackages.js
 * ==================
 * Maps your local package slugs to MegaOTT package details.
 *
 * Contains an array of all available payment packages used
 * throughout the app (both client and server). Each package
 * defines:
 *   • id, slug, order identifiers and descriptions
 *   • duration, device count, price, and MegaOTT package_id
 *   • flags (paid vs trial)
 *   • auto-generated URLs for details and purchase
 *
 * Usage:
 *   import { paymentPackages } from '@/lib/utils/paymentPackages';
 */

// 💰 Main packages array, auto-generates detailsUrl and buyNowUrl
export const paymentPackages = [
  {
    id: 1,
    slug: 'trial_24h',
    order_id: 'trial_24h',
    order_description: '24H Free Trial (FREE)',
    duration: '24 Hours',
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
    order_description: '3 Months (40$)',
    duration: '3 Months',
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
    order_description: '6 Months (60$)',
    duration: '6 Months',
    devices: 1,
    price: 60,
    package_id: 3,
    paid: true
  },
  {
    id: 4,
    slug: '6m_extra',
    order_id: '6m_extra',
    order_description: '6 Months + Extra Device (100$)',
    duration: '6 Months',
    devices: 2,
    price: 100,
    package_id: 3,
    paid: true
  },
  {
    id: 5,
    slug: '12m',
    order_id: '12m',
    order_description: '1 Year (Most Popular) (100$)',
    duration: '1 Year',
    devices: 1,
    price: 100,
    package_id: 5,
    paid: true
  },
  {
    id: 6,
    slug: '12m_extra',
    order_id: '12m_extra',
    order_description: '1 Year + Extra Device (160$)',
    duration: '1 Year',
    devices: 2,
    price: 160,
    package_id: 5,
    paid: true
  },
  {
    id: 7,
    slug: '24m',
    order_id: '24m',
    order_description: '2 Years (160$)',
    duration: '2 Year',
    devices: 2,
    price: 160,
    package_id: 8,
    paid: true
  },
  {
    id: 8,
    slug: '24m_extra',
    order_id: '24m_extra',
    order_description: '2 Years + Extra Device (240$)',
    duration: '2 Year',
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
