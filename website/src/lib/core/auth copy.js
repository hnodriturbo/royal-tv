/**
 * /src/app/api/auth/[...nextauth]/route.js
 * ----------------------------------------
 * 🔐 NextAuth v5 (JWT session) with Prisma + Credentials (username + password)
 *
 * 🧩 What this file does:
 *   - Uses PrismaAdapter for User management
 *   - Authenticates with Credentials provider using `username` + `password`
 *   - Supports "Remember me": 1 hour (falsey) or 1 day (truthy)
 *   - Adds `session.user.locale` from request headers/cookie (never persisted)
 *   - Exposes `session.expires` based on per-login remember-me choice
 *
 * 📝 Important notes:
 *   - NextAuth's cookie maxAge is global. For per-login expiry, a stamped
 *     `token.sessionExpiresAt` is used and surfaced to `session.expires`.
 *   - Gate protected endpoints/pages should respect `session.expires`
 *     (e.g., sign out client-side or deny server-side when past).
 */

import NextAuth from 'next-auth'; // 🔧 core
import Credentials from 'next-auth/providers/credentials'; // 🧾 credentials
import { PrismaAdapter } from '@auth/prisma-adapter'; // 🧩 adapter (for users)
import prisma from '@/lib/core/prisma'; // 🗄️ prisma client
import bcrypt from 'bcryptjs'; // 🔑 hash compare
import { headers, cookies } from 'next/headers'; // ✉️ request readers

// 🌍 derive UI locale without ever touching DB
async function resolveLocaleFromHeadersOrCookie() {
  // 📨 read incoming request context
  const incomingHeaders = await headers();
  const incomingCookies = await cookies();

  // 🌐 prioritize explicit locale header → Accept-Language → NEXT_LOCALE cookie → 'en'
  const headerLocale =
    incomingHeaders.get('x-locale') ||
    incomingHeaders.get('accept-language') ||
    incomingCookies.get('NEXT_LOCALE')?.value ||
    'en';

  // 🔤 normalize + constrain to supported
  const lower = String(headerLocale).toLowerCase();
  if (lower.startsWith('is')) return 'is';
  return 'en';
}

// 🧮 remember-me durations (seconds)
const ONE_HOUR_SECONDS = 60 * 60; // ⏱️ 1 hour
const ONE_DAY_SECONDS = 24 * 60 * 60; // 📆 1 day

// ⚙️ NextAuth config
export const { handlers, auth, signIn, signOut } = NextAuth({
  // 🧩 Attach Prisma adapter (users are stored in DB)
  adapter: PrismaAdapter(prisma),

  // 🪪 JWT-only session strategy
  session: {
    strategy: 'jwt',
    // 🧯 keep a generous global maxAge as a ceiling;
    //     we still enforce per-login with token.sessionExpiresAt
    maxAge: 30 * 24 * 60 * 60 // 30 days (ceiling, not used as the hard rule for remember-me)
  },

  // 🔌 Providers
  providers: [
    Credentials({
      // 🧾 Form field definitions (only relevant for built-in page)
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' }, // 🧑‍💻 username login
        password: { label: 'Password', type: 'password' },
        remember_me: { label: 'Remember Me', type: 'checkbox' } // 🧠 1 day if truthy, else 1 hour
      },

      // 🔐 Inline authorize for username + password
      async authorize(raw) {
        // 🧼 normalize input
        const normalizedUsername = String(raw?.username ?? '').trim();
        const rawPassword = String(raw?.password ?? '');
        const rememberMeRaw = raw?.remember_me; // 🧠 may be boolean or string 'on'/'true'

        // 🚧 basic guard
        if (!normalizedUsername || !rawPassword) {
          return null; // ❌ invalid
        }

        // 🔎 find user by username (must be unique in your Prisma schema)
        //     Update the field name if your model uses a different column.
        const user = await prisma.user.findUnique({
          where: { username: normalizedUsername },
          select: {
            user_id: true,
            username: true,
            email: true,
            password: true, // 🔐 bcrypt hash column
            name: true,
            role: true
          }
        });

        // 🧱 user exists + has password hash
        if (!user || !user.password) return null;

        // 🧾 quick hash format sanity: should look like $2a/$2b
        if (!(user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
          // ❌ different algo → treat as invalid to avoid throwing
          return null;
        }

        // 🔑 compare password
        const isValid = await bcrypt.compare(rawPassword, user.password);
        if (!isValid) return null;

        // 🧠 coerce remember flag
        const rememberMe =
          rememberMeRaw === true ||
          rememberMeRaw === 'true' ||
          rememberMeRaw === 'on' ||
          rememberMeRaw === '1';

        // ✅ return minimal safe user object + a hint for remember-me
        return {
          user_id: user.user_id,
          name: user.name || user.username || 'User',
          email: user.email || null,
          role: user.role || 'user',
          username: user.username,
          // 🧠 put remember flag on the user object so `jwt()` can read it on first pass
          __remember_me: rememberMe
        };
      }
    })
  ],

  // 🧠 Callbacks
  callbacks: {
    // 📨 Attach fields to token (runs on every request that touches auth)
    async jwt({ token, user }) {
      // 🚀 On initial sign-in, merge user fields + stamp per-login expiry
      if (user) {
        token.user_id = user.user_id;
        token.role = user.role || 'user';
        token.name = user.name || 'User';
        token.email = user.email || null;
        token.username = user.username || null;

        // 🧠 compute per-login expiry (1h or 1d)
        const nowSeconds = Math.floor(Date.now() / 1000);
        const lifespanSeconds = user.__remember_me ? ONE_DAY_SECONDS : ONE_HOUR_SECONDS;
        token.sessionExpiresAt = nowSeconds + lifespanSeconds; // ⏳ UNIX seconds
      }

      // 🌍 always refresh current locale from headers/cookie
      token.locale = await resolveLocaleFromHeadersOrCookie();

      // ⛔ hard stop if token is expired based on our stamped time
      //     (prevents stale cookies from being treated as valid by your own checks)
      const now = Math.floor(Date.now() / 1000);
      if (token.sessionExpiresAt && now >= token.sessionExpiresAt) {
        // 🧹 returning an empty object effectively invalidates the session downstream
        return {};
      }

      return token;
    },

    // 🧾 Build the session payload for the client
    async session({ session, token }) {
      // 🚪 If token was wiped due to expiry, surface no session
      if (!token?.user_id) {
        return null;
      }

      // 🧾 expose essential user data
      session.user = {
        user_id: token.user_id,
        role: token.role,
        name: token.name,
        email: token.email,
        username: token.username,
        locale: token.locale || 'en' // 🌍 runtime locale (never persisted)
      };

      // ⏱️ expose per-login expiry (ISO string)
      if (token.sessionExpiresAt) {
        session.expires = new Date(token.sessionExpiresAt * 1000).toISOString();
      }

      return session;
    }
  },

  // 🧯 Less noise during production
  debug: process.env.NODE_ENV !== 'production'
});

// 🚪 API Route exports (server file by default; no "use server" needed)
export const GET = handlers.GET; // 📮 Next.js App Router
export const POST = handlers.POST; // 📮 Next.js App Router
