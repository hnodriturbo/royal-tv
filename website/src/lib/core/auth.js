import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/core/prisma';
import bcrypt from 'bcryptjs';
import { headers, cookies } from 'next/headers';

async function resolveLocaleFromHeadersOrCookie() {
  const h = await headers();
  const c = await cookies();
  const hinted =
    h.get('x-locale') || h.get('accept-language') || c.get('NEXT_LOCALE')?.value || 'en';
  const lower = String(hinted).toLowerCase();
  return lower.startsWith('is') ? 'is' : 'en';
}

const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        remember_me: { label: 'Remember Me', type: 'checkbox' }
      },
      async authorize(raw) {
        const username = String(raw?.username ?? '').trim();
        const password = String(raw?.password ?? '');
        const rememberRaw = raw?.remember_me;
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({
          where: { username },
          select: {
            user_id: true,
            username: true,
            email: true,
            password: true,
            name: true,
            role: true
          }
        });
        if (!user || !user.password) return null;
        if (!(user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        const remember =
          rememberRaw === true ||
          rememberRaw === 'true' ||
          rememberRaw === 'on' ||
          rememberRaw === '1';
        return {
          user_id: user.user_id,
          name: user.name || user.username || 'User',
          email: user.email || null,
          role: user.role || 'user',
          username: user.username,
          __remember_me: remember
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user_id = user.user_id;
        token.role = user.role || 'user';
        token.name = user.name || 'User';
        token.email = user.email || null;
        token.username = user.username || null;
        const lifespan = user.__remember_me ? ONE_DAY : ONE_HOUR;
        token.sessionExpiresAt = Math.floor(Date.now() / 1000) + lifespan;
      }
      token.locale = await resolveLocaleFromHeadersOrCookie();
      if (token.sessionExpiresAt && Math.floor(Date.now() / 1000) >= token.sessionExpiresAt) {
        return {};
      }
      return token;
    },
    async session({ session, token }) {
      if (!token?.user_id) return null;
      session.user = {
        user_id: token.user_id,
        role: token.role || 'user',
        name: token.name || 'User',
        email: token.email ?? null,
        username: token.username ?? null,
        locale: token.locale || 'en'
      };
      if (token.sessionExpiresAt) {
        session.expires = new Date(token.sessionExpiresAt * 1000).toISOString();
      }
      return session;
    }
  },
  debug: process.env.NODE_ENV !== 'production'
});

export const GET = handlers.GET;
export const POST = handlers.POST;
