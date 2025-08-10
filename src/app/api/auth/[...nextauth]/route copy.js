// src/app/api/auth/[...nextauth]/route.js

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/core/prisma';
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user_id = user.user_id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        user_id: token.user_id,
        role: token.role
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
