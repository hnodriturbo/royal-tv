/**
 * 🧪 Seed Script: Insert Real MegaOTT Subscription
 * -----------------------------------------------
 * Inserts a real subscription (id: 8647612) for testing
 */

import prisma from '../../src/lib/prisma.js'; // Adjust if your prisma.js path differs

async function seedRealMegaottSubscription() {
  const userId = '0038bb49-5d65-423a-a55c-445c064dccc8';

  const subscription = await prisma.subscription.create({
    data: {
      user_id: userId,
      order_id: 'ORDER-REAL-8647612', // Custom, just for tracking
      megaott_id: 8647612,
      username: 'XCVHJKYF',
      password: '1FZRNUEM',
      mac_address: null,
      package_id: 6,
      package_name: '3 Months',
      template: null,
      max_connections: 1,
      forced_country: 'ALL',
      adult: true,
      enable_vpn: false, // Not in your data, assuming false
      note: 'TEST API FOR PACKAGE 6 months',
      whatsapp_telegram: '3547624845',
      paid: true,
      expiring_at: new Date('2025-11-04T13:39:07.000Z'),
      dns_link: 'http://fuaecidd.megahdtv.xyz',
      dns_link_for_samsung_lg: 'http://fuaecidd.smfrt.com',
      portal_link: null,
      status: 'active' // Defaulting to active
    }
  });

  console.log('✅ Seeded subscription:', subscription.subscription_id);
}

seedRealMegaottSubscription()
  .catch((err) => {
    console.error('❌ Seed error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
