/**
 *  🔐  lib/auth.js — Credentials-only auth with Prisma and JWT
 *  -----------------------------------------------------------
 *  • Handles username/password login with bcrypt
 *  • Supports "Remember Me" checkbox: session lasts 1h or 24h accordingly
 *  • Uses JWT sessions with expiry embedded in token
 *  • Exports NextAuth handlers for API routes
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// 🌍 Debug your trusted host on startup
console.log('🌍 AUTH_TRUST_HOST:', process.env.AUTH_TRUST_HOST);

const nextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { type: 'text' },
        password: { type: 'password' },
        rememberMe: { type: 'checkbox' } // ⏰ Session duration toggle from frontend
      },
      async authorize({ username, password, rememberMe }) {
        // 🔎 Find user in DB by username
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null; // No user found — reject login

        // 🔐 Compare hashed password
        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) return null; // Password mismatch

        // 🧹 Return user without password hash + rememberMe flag normalized
        const { password: _pass, ...safeUser } = user;
        return {
          ...safeUser,
          rememberMe: rememberMe === true || rememberMe === 'true'
        };
      }
    })
  ],

  session: { strategy: 'jwt' }, // JWT sessions for scalability

  callbacks: {
    // 🎟️ Customize JWT on login and every update
    async jwt({ token, user }) {
      if (user) {
        // ⏰ Set expiry in seconds from current time, depends on rememberMe
        token.user_id = user.user_id;
        token.role = user.role;
        token.expiry =
          Math.floor(Date.now() / 1000) + (user.rememberMe ? 24 * 60 * 60 : 1 * 60 * 60); // 24h or 1h expiry
      }

      // 🕵️‍♂️ Check if token expired - fallback to guest if expired
      const now = Math.floor(Date.now() / 1000);
      if (token.expiry && now > token.expiry) {
        return { name: 'Guest', role: 'guest' };
      }

      return token; // Valid session token
    },

    // 📦 Pass useful user info and token to session on client
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user, // default fields (name, email)
          user_id: token.user_id,
          role: token.role,
          token // full JWT token (optional, useful for API auth)
        };
      }
      return session;
    }
  },

  pages: {
    signIn: '/auth/signin' // Use your custom sign-in page
  },

  debug: process.env.NODE_ENV === 'development',

  logger: {
    error(code, metadata) {
      console.error('[AUTH ERROR] ❌', code, metadata);
    },
    warn(code) {
      console.warn('[AUTH WARN] ⚠️', code);
    },
    debug(code, metadata) {
      console.log('[AUTH DEBUG] 🪲', code, metadata);
    }
  }
};

export const { auth, handlers, signIn, signOut } = NextAuth(nextAuthOptions);

export const { GET, POST } = handlers;
