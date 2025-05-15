import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

import prisma from '@lib/prisma';
import { jwtCallback, sessionCallback } from './callbacks'; // ✅ stay local

const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { type: 'text' },
        password: { type: 'password' },
        rememberMe: { type: 'checkbox' },
      },
      authorize: async (credentials) => {
        const { username, password, rememberMe } = credentials;
        const isRemembered = rememberMe === 'true';

        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user) {
          throw new Error('Invalid username or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error('Invalid username or password.');
        }

        const { password: _, ...safeUser } = user;

        return { ...safeUser, rememberMe: isRemembered };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    jwt: jwtCallback,
    session: sessionCallback,
  },

  pages: {
    signIn: '/auth/signin',
  },

  debug: process.env.NODE_ENV === 'development',
};

export default authOptions;
