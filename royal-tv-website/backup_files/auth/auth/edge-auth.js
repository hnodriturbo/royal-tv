// 📁 src/lib/auth/edge-auth.js
import logger from '@/lib/logger';
import { getToken } from 'next-auth/jwt';

/**
 * Lightweight Edge-safe auth function for use in middleware
 * Only works with JWT strategy (NextAuth v5)
 */
export async function edgeAuth(req) {
  logger.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET);
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });

  return token || null;
}
