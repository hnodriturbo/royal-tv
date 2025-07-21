// 📁 src/lib/auth/edge-auth.js
import { getToken } from 'next-auth/jwt';

/**
 * Lightweight Edge-safe auth function for use in middleware
 * Only works with JWT strategy (NextAuth v5)
 */
export async function edgeAuth(req) {
  console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET);
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });

  return token || null;
}
