/**
 * NextAuth Route for Authentication (Credentials + Prisma)
 * --------------------------------------------------------
 * Always sets a `role` and `name` (user's name or 'guest') in the session.
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const { handlers } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { type: 'text' },
        password: { type: 'password' }
      },
      async authorize({ username, password }) {
        // 🔎 Find user by username
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
    maxAge: 24 * 60 * 60 // 24h
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 // 24h
      }
    }
  },
  jwt: {
    maxAge: 24 * 60 * 60 // JWT expiry explicitly matched
  },
  callbacks: {
    // 🪙 Add role & name to JWT (or default to guest)
    async jwt({ token, user }) {
      if (user) {
        token.user_id = user.user_id;
        token.role = user.role;
        token.name = user.name || user.username || 'user'; // 🏷️ User's real name or username
      }
      if (!token.role) {
        token.role = 'guest'; // 👤 Always have a role
      }
      if (!token.name) {
        token.name = 'guest'; // 🏷️ Always have a name
      }
      return token;
    },
    // 🗂️ Add user_id, role, and name to session object
    async session({ session, token }) {
      session.user = {
        ...session.user,
        user_id: token.user_id,
        role: token.role,
        name: token.name // 🏷️ Attach name to session
      };
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin'
  },
  debug: process.env.NODE_ENV === 'development'
});

export const { GET, POST } = handlers;
