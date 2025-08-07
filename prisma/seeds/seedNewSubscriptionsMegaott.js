/**
 * 🧪 Seed Script: Create 5 Test Subscriptions
 * ------------------------------------------
 * Adds 5 dummy subscriptions for testing, with expiring_at
 * dates set from 1 to 5 days in the future.
 * ------------------------------------------
 */

import prisma from '../../src/lib/prisma.js'; // ✅ Adjust if needed

// 📅 Helper: Add N days to current date
function getFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
}

// 🚀 Main seeding function
async function createTestSubscriptions() {
  const userId = '0038bb49-5d65-423a-a55c-445c064dccc8'; // 👤 Your test user
  const packageId = 5;
  const packageName = '6 Months';

  for (let i = 1; i <= 5; i++) {
    const subscription = await prisma.subscription.create({
      data: {
        user_id: userId,
        order_id: `ORDER-SEED-${i}`,
        megaott_id: 9005000 + i, // 🎯 Unique dummy MegaOTT ID
        username: `test6mo_user${i}`,
        password: `testPass${i}`,
        mac_address: null,
        package_id: packageId,
        package_name: packageName,
        template: null,
        max_connections: 1,
        forced_country: 'ALL',
        adult: false,
        enable_vpn: false,
        note: `Seeded 6-month sub #${i}`,
        whatsapp_telegram: 'seeduser / test',
        paid: true,
        expiring_at: getFutureDate(i), // ⏳ Set to i days in future
        dns_link: 'http://seed.megahdtv.xyz',
        dns_link_for_samsung_lg: 'http://seed.smfrt.com',
        portal_link: null,
        status: 'active'
      }
    });

    console.log(`✅ Created: Subscription ${subscription.subscription_id}`);
  }

  console.log('🌱 Finished seeding 5 test subscriptions.');
}

// 🧼 Execute
createTestSubscriptions()
  .catch((err) => {
    console.error('❌ Seed error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
