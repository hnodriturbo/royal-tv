// 🛠 prisma/seeds/seedUsers.js
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// 🐞 2. Debug: confirm we have DATABASE_URL
console.log('🛠️ DATABASE_URL is:', process.env.DATABASE_URL);
const prisma = new PrismaClient();

async function seedUsers() {
  // Admin Users
  const adminUser = {
    name: 'Admin Support',
    email: 'support@royal-tv.tv',
    username: 'admin',
    whatsapp: '+3547624845',
    telegram: '@Royal_TV',
    password: await bcrypt.hash('Hnodri2529!', 10),
    role: 'admin',
  };

  // Regular Users (handle async password hashing with Promise.all)
  const regularUsers = await Promise.all(
    Array.from({ length: 10 }, async (_, i) => ({
      name: `user_${i + 1}`,
      email: `user_${i + 1}@example.com`,
      username: `user_${i + 1}`,
      password: await bcrypt.hash(`password_${i + 1}`, 10),
      role: 'user',
    })),
  );

  // Combine all users
  const users = [...regularUsers];

  // Insert users into the database
  for (const user of users) {
    await prisma.user.create({
      data: user,
    });
  }
  await prisma.user.create({
    data: adminUser, // Use the first (and only) user object from the adminUsers array
  });
  console.log('Users seeded successfully!');
  await prisma.$disconnect();
}

seedUsers().catch((e) => {
  console.error('Error seeding users:', e);
  prisma.$disconnect();
  process.exit(1);
});
