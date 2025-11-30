/**
 * =========================================
 * /src/lib/core/prisma.js
 * -----------------------------------------
 * Prisma Client singleton for PostgreSQL
 * Uses @prisma/adapter-pg with manual URL
 * encoding for special characters in password
 * =========================================
 */

// 🔐 Load environment variables FIRST
import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

// 🌍 Global singleton to prevent multiple instances in dev
const globalForPrisma = global;

/**
 * 🔐 Manually encode DATABASE_URL to handle special characters
 * The pg library requires proper URL encoding for passwords with special chars
 */
function encodeConnectionString(rawUrl) {
  if (!rawUrl) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  // Parse the connection string to extract and encode the password
  const urlPattern = /^(postgres(?:ql)?:\/\/)([^:]+):([^@]+)@(.+)$/;
  const match = rawUrl.match(urlPattern);

  if (!match) {
    // If it doesn't match the pattern, return as-is (might already be encoded)
    return rawUrl;
  }

  const [, protocol, username, password, hostAndDb] = match;

  // URL-encode the password (handles !, @, #, $, etc.)
  const encodedPassword = encodeURIComponent(password);

  // Reconstruct the URL with encoded password
  const encodedUrl = `${protocol}${username}:${encodedPassword}@${hostAndDb}`;

  console.log('[prisma] 🔐 Password encoded for pg Pool');
  return encodedUrl;
}

let prisma;

if (process.env.NODE_ENV === 'production') {
  // 🏭 Production: Create new instance with adapter
  const encodedUrl = encodeConnectionString(process.env.DATABASE_URL);
  const pool = new Pool({ connectionString: encodedUrl });
  const adapter = new PrismaPg(pool);

  prisma = new PrismaClient({
    adapter,
    log: ['warn', 'error']
  });
  console.log('✅ Prisma Client initialized in PRODUCTION mode.');
} else {
  // 🔧 Development: Reuse global instance to prevent connection exhaustion
  if (!globalForPrisma.prisma) {
    const encodedUrl = encodeConnectionString(process.env.DATABASE_URL);
    const pool = new Pool({ connectionString: encodedUrl });
    const adapter = new PrismaPg(pool);

    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: ['warn', 'error']
    });
    console.log('✅ Prisma Client initialized in DEVELOPMENT mode.');
  } else {
    console.log('♻️ Reusing existing Prisma Client instance.');
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;
