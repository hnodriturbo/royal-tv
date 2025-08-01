/**
 *  🔐 lib/auth.js — Credentials auth with Prisma & JWT
 *  -------------------------------------------------------
 *  • Username/password login via bcrypt
 *  • JWT sessions with maxAge set via NextAuth
 *  • Explicit logging of cookie expiry
 */

import logger from '@/lib/logger';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

logger.log('🌍 AUTH_TRUST_HOST:', process.env.AUTH_TRUST_HOST);

const nextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { type: 'text' },
        password: { type: 'password' },
        rememberMe: { type: 'checkbox' }
      },
      async authorize({ username, password }) {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;

        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) return null;

        const { password: _, ...safeUser } = user;
        return safeUser;
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 86400 // 24 hours fixed expiry
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user_id = user.user_id;
        token.role = user.role;

        const expiryDate = new Date(Date.now() + 86400 * 1000);
        logger.log(`🕒 [JWT] Token will expire at: ${expiryDate.toISOString()}`);
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        user_id: token.user_id || null,
        role: token.role || 'guest' // <-- Defaults to "guest" if not set
      };
      return session;
    }
  },

  pages: {
    signIn: '/auth/signin'
  },

  debug: process.env.NODE_ENV === 'development',

  logger: {
    error(code, metadata) {
      logger.error('[AUTH ERROR] ❌', code, metadata);
    },
    warn(code) {
      logger.warn('[AUTH WARN] ⚠️', code);
    },
    debug(code, metadata) {
      logger.log('[AUTH DEBUG] 🪲', code, metadata);
    }
  }
};

export const { auth, handlers, signIn, signOut } = NextAuth(nextAuthOptions);

export const { GET, POST } = handlers;
