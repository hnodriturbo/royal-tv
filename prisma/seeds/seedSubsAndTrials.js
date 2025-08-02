// =================== prisma/seeds/seedHybridSubscriptions.js ===================
// Mixes minimal and full subscriptions for real admin UI testing

import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 🔵 User IDs who get a Free Trial and Subscriptions
const freeTrialAndSubUserIds = [
  '51197218-2c3c-4a65-ae10-1d337e30e820', // user_1
  '9a254db7-f69a-42cf-b79b-4646849a9d71', // user_2
  '5fca534b-e7cd-4813-9cc5-52c9c331fdd9', // user_3
  '65ae6f83-7e47-4992-ad2d-a42ce79381d1', // user_4
  '42c13421-c66c-4691-9de4-03838b71396d' // user_5
];

const orderIds = ['3m', '6m', '12m'];

// Simple helper to randomize active/pending
function randomStatus() {
  return Math.random() < 0.5 ? 'pending' : 'active';
}

// Helper for random date within 30 days ago
function randomDateBack(days = 30) {
  const now = new Date();
  const offset = Math.floor(Math.random() * days);
  return new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
}

async function seed() {
  console.log('Seeding hybrid subscriptions...');
  for (const user_id of userIds) {
    for (const order_id of orderIds) {
      const status = randomStatus();

      // Randomly decide: basic or full info (50/50)
      if (Math.random() < 0.5) {
        // Only required fields (minimal, pending)
        await prisma.subscription.create({
          data: {
            user_id,
            order_id,
            status: 'pending'
          }
        });
      } else {
        // All fields (active or pending)
        const startDate = status === 'active' ? randomDateBack(30) : null;
        let endDate = null;
        if (status === 'active' && startDate) {
          if (order_id === '3m') {
            endDate = new Date(startDate.getTime());
            endDate.setMonth(endDate.getMonth() + 3);
          } else if (order_id === '6m') {
            endDate = new Date(startDate.getTime());
            endDate.setMonth(endDate.getMonth() + 6);
          } else if (order_id === '12m') {
            endDate = new Date(startDate.getTime());
            endDate.setMonth(endDate.getMonth() + 12);
          }
        }
        await prisma.subscription.create({
          data: {
            user_id,
            order_id,
            status,
            subscription_username: `user_${user_id.slice(0, 6)}`,
            subscription_password: `pw_${order_id}_${user_id.slice(-4)}`,
            subscription_url: `https://iptv.example.com/${user_id.slice(0, 6)}`,
            subscription_other: 'Seeded for admin test',
            additional_info: 'This is a full seeded subscription.',
            startDate,
            endDate
          }
        });
      }
    }
  }
  console.log('✅ Hybrid subscriptions created!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
