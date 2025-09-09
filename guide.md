# Commands (reset → install) — **JS / ESM edition**

```bash
# 0) remove previous next-intl (and any old peer helpers)
npm remove next-intl

# 1) install clean stack (adjust if using pnpm/yarn)
npm i next-intl next-auth @auth/prisma-adapter bcryptjs @prisma/client

# if you need Prisma CLI for migrations (dev dep)
npm i -D prisma

# 2) clear caches (optional but recommended when reshuffling files)
rm -rf .next node_modules/.cache
```

---

# `jsconfig.json` (so `@/` alias works in JS projects)

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

> If your code does **not** live under `src/`, set `baseUrl` to `.` and change imports accordingly.

---

# File tree (JS, ESM)

```
src/
  app/
    api/
      auth/
        [...nextauth]/route.js
    [locale]/
      layout.js
      page.js
      (auth)/
        signin/page.js
  components/
    SignInForm.js
    LocaleSwitcher.js
  i18n/
    config.js
    routing.js
  lib/
    core/
      auth.js         # NextAuth v5 (Credentials + Prisma, remember-me 1h/1d)
      prisma.js       # your existing Prisma client (JS)
      authGuard/
        AuthGuard.js  # your existing frontend protector
  messages/
    en.json           # you already have these two
    is.json
middleware.js
```

---

# i18n core (JS)

## `src/i18n/config.js`

```js
export const LOCALES = ['en', 'is'];
export const DEFAULT_LOCALE = 'en';
export function isLocale(input) {
  return !!input && LOCALES.includes(input);
}
```

## `src/i18n/routing.js`

```js
import {cookies, headers} from 'next/headers';
import {DEFAULT_LOCALE} from './config';

export function localeHref(locale, path = '/') {
  return `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function getRequestLocale() {
  const h = await headers();
  const c = await cookies();
  const hinted = h.get('x-locale') || c.get('NEXT_LOCALE')?.value || h.get('accept-language') || DEFAULT_LOCALE;
  const lower = String(hinted).toLowerCase();
  return lower.startsWith('is') ? 'is' : 'en';
}
```

---

# Middleware — idiot‑proof locale handling for `en` and `is`

## `middleware.js`

```js
import {NextResponse} from 'next/server';
import {DEFAULT_LOCALE, isLocale} from './src/i18n/config.js';

export function middleware(req) {
  const {pathname} = req.nextUrl;

  // Skip internals, static assets and API (incl. NextAuth)
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const segments = pathname.split('/');
  const maybeLocale = segments[1];

  // Determine active locale: path > cookie > Accept-Language > default
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value ?? null;
  const accept = (req.headers.get('accept-language') || '').toLowerCase();
  const acceptLocale = accept.startsWith('is') ? 'is' : 'en';

  let activeLocale;
  if (isLocale(maybeLocale)) {
    activeLocale = maybeLocale;
  } else if (isLocale(cookieLocale)) {
    activeLocale = cookieLocale;
  } else {
    activeLocale = acceptLocale || DEFAULT_LOCALE;
  }

  // If the URL is missing the locale, redirect to add it
  if (!isLocale(maybeLocale)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${activeLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Forward the active locale as a header to the rest of the app
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-locale', activeLocale);
  const res = NextResponse.next({request: {headers: requestHeaders}});

  // Keep cookie in sync for client navigations (1 year)
  res.cookies.set('NEXT_LOCALE', activeLocale, {path: '/', maxAge: 60 * 60 * 24 * 365});
  return res;
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|api).*)']
};
```

> If your repo isn’t under `src/`, change the import to `./i18n/config.js`.

---

# next-intl wiring (App Router, JS)

## `src/app/[locale]/layout.js`

```js
import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import {NextIntlClientProvider} from 'next-intl';
import {isLocale} from '@/i18n/config';

async function getMessages(locale) {
  try {
    const mod = await import(`@/messages/${locale}.json`);
    return mod.default || mod; // webpack/next exports JSON under .default
  } catch {
    return null;
  }
}

export default async function RootLayout({children, params}) {
  const maybe = params?.locale;
  const locale = isLocale(maybe) ? maybe : null;
  if (!locale) notFound();
  const messages = await getMessages(locale);
  if (!messages) notFound();

  return (
    <html lang={locale}>
      <body>
        <Suspense fallback={<div>Loading…</div>}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
```

## `src/app/[locale]/page.js`

```js
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {LOCALES} from '@/i18n/config';

export default function Page() {
  const t = useTranslations();
  return (
    <main>
      <h1>{t('nav.home', {default: 'Home'})}</h1>
      <ul>
        {LOCALES.map((l) => (
          <li key={l}><Link href={`/${l}`}>{l}</Link></li>
        ))}
      </ul>
    </main>
  );
}
```

---

# NextAuth v5 (JS / Credentials + Prisma + remember‑me 1h/1d)

> JWT strategy. `session.expires` reflects a per-login stamp. Runtime locale comes from headers/cookie via middleware.

## `src/lib/core/auth.js`

```js
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import {PrismaAdapter} from '@auth/prisma-adapter';
import prisma from '@/lib/core/prisma';
import bcrypt from 'bcryptjs';
import {headers, cookies} from 'next/headers';

async function resolveLocaleFromHeadersOrCookie() {
  const h = await headers();
  const c = await cookies();
  const hinted = h.get('x-locale') || h.get('accept-language') || c.get('NEXT_LOCALE')?.value || 'en';
  const lower = String(hinted).toLowerCase();
  return lower.startsWith('is') ? 'is' : 'en';
}

const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * 60 * 60;

export const {handlers, auth, signIn, signOut} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: {label: 'Username', type: 'text'},
        password: {label: 'Password', type: 'password'},
        remember_me: {label: 'Remember Me', type: 'checkbox'}
      },
      async authorize(raw) {
        const username = String(raw?.username ?? '').trim();
        const password = String(raw?.password ?? '');
        const rememberRaw = raw?.remember_me;
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({
          where: {username},
          select: {user_id: true, username: true, email: true, password: true, name: true, role: true}
        });
        if (!user || !user.password) return null;
        if (!(user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        const remember = rememberRaw === true || rememberRaw === 'true' || rememberRaw === 'on' || rememberRaw === '1';
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
    async jwt({token, user}) {
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
    async session({session, token}) {
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
```

## `src/app/api/auth/[...nextauth]/route.js`

```js
export {GET, POST} from '@/lib/core/auth';
```

> **ENV required** (`.env.local`):

```
NEXTAUTH_SECRET=your-strong-random-secret
NEXTAUTH_URL=http://localhost:3000
```

---

# Minimal sign-in UI with remember‑me (localized, JS)

## `src/components/SignInForm.js`

```js
'use client';
import {useState} from 'react';
import {signIn} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';

export default function SignInForm() {
  const t = useTranslations('auth');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const username = String(form.get('username') || '');
    const password = String(form.get('password') || '');
    const remember_me = form.get('remember_me') ? 'on' : '';

    const res = await signIn('credentials', {redirect: false, username, password, remember_me});
    setPending(false);
    if (res?.error) setError(res.error);
    else {
      router.refresh();
      router.push('./');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label>
          {t('username')}
          <input name="username" autoComplete="username" required />
        </label>
      </div>
      <div>
        <label>
          {t('password')}
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
      </div>
      <div>
        <label>
          <input name="remember_me" type="checkbox" /> {t('rememberMe')}
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={pending}>{pending ? t('signingIn') : t('signIn')}</button>
    </form>
  );
}
```

## `src/app/[locale]/(auth)/signin/page.js`

```js
import SignInForm from '@/components/SignInForm';
import {useTranslations} from 'next-intl';

export default function SignInPage() {
  const t = useTranslations('auth');
  return (
    <main>
      <h1>{t('title')}</h1>
      <SignInForm />
    </main>
  );
}
```

---

# Messages (example keys)

```jsonc
// src/messages/en.json
{
  "nav.home": "Home",
  "auth": {
    "title": "Sign in",
    "username": "Username",
    "password": "Password",
    "rememberMe": "Remember me (1 day)",
    "signIn": "Sign in",
    "signingIn": "Signing in…"
  },
  "notify.userJoined": "{name} joined the room"
}
```

```jsonc
// src/messages/is.json
{
  "nav.home": "Heim",
  "auth": {
    "title": "Skrá inn",
    "username": "Notandanafn",
    "password": "Lykilorð",
    "rememberMe": "Muna eftir mér (1 dagur)",
    "signIn": "Innskrá",
    "signingIn": "Skrái inn…"
  },
  "notify.userJoined": "{name} tengdist rýminu"
}
```

---

# Locale switcher (optional)

## `src/components/LocaleSwitcher.js`

```js
'use client';
import {usePathname, useRouter} from 'next/navigation';
import {LOCALES} from '@/i18n/config
```
# Commands (reset → install) — **JS / ESM edition**

```bash
# 0) remove previous next-intl (and any old peer helpers)
npm remove next-intl

# 1) install clean stack (adjust if using pnpm/yarn)
npm i next-intl next-auth @auth/prisma-adapter bcryptjs @prisma/client

# if you need Prisma CLI for migrations (dev dep)
npm i -D prisma

# 2) clear caches (optional but recommended when reshuffling files)
rm -rf .next node_modules/.cache
```

---

# `jsconfig.json` (so `@/` alias works in JS projects)

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

> If your code does **not** live under `src/`, set `baseUrl` to `.` and change imports accordingly.

---

# File tree (JS, ESM)

```
src/
  app/
    api/
      auth/
        [...nextauth]/route.js
    [locale]/
      layout.js
      page.js
      (auth)/
        signin/page.js
  components/
    SignInForm.js
    LocaleSwitcher.js
  i18n/
    config.js
    routing.js
  lib/
    core/
      auth.js         # NextAuth v5 (Credentials + Prisma, remember-me 1h/1d)
      prisma.js       # your existing Prisma client (JS)
      authGuard/
        AuthGuard.js  # your existing frontend protector
  messages/
    en.json           # you already have these two
    is.json
middleware.js
```

---

# i18n core (JS)

## `src/i18n/config.js`

```js
export const LOCALES = ['en', 'is'];
export const DEFAULT_LOCALE = 'en';
export function isLocale(input) {
  return !!input && LOCALES.includes(input);
}
```

## `src/i18n/routing.js`

```js
import {cookies, headers} from 'next/headers';
import {DEFAULT_LOCALE} from './config';

export function localeHref(locale, path = '/') {
  return `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function getRequestLocale() {
  const h = await headers();
  const c = await cookies();
  const hinted = h.get('x-locale') || c.get('NEXT_LOCALE')?.value || h.get('accept-language') || DEFAULT_LOCALE;
  const lower = String(hinted).toLowerCase();
  return lower.startsWith('is') ? 'is' : 'en';
}
```

---

# Middleware — idiot‑proof locale handling for `en` and `is`

## `middleware.js`

```js
import {NextResponse} from 'next/server';
import {DEFAULT_LOCALE, isLocale} from './src/i18n/config.js';

export function middleware(req) {
  const {pathname} = req.nextUrl;

  // Skip internals, static assets and API (incl. NextAuth)
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const segments = pathname.split('/');
  const maybeLocale = segments[1];

  // Determine active locale: path > cookie > Accept-Language > default
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value ?? null;
  const accept = (req.headers.get('accept-language') || '').toLowerCase();
  const acceptLocale = accept.startsWith('is') ? 'is' : 'en';

  let activeLocale;
  if (isLocale(maybeLocale)) {
    activeLocale = maybeLocale;
  } else if (isLocale(cookieLocale)) {
    activeLocale = cookieLocale;
  } else {
    activeLocale = acceptLocale || DEFAULT_LOCALE;
  }

  // If the URL is missing the locale, redirect to add it
  if (!isLocale(maybeLocale)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${activeLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Forward the active locale as a header to the rest of the app
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-locale', activeLocale);
  const res = NextResponse.next({request: {headers: requestHeaders}});

  // Keep cookie in sync for client navigations (1 year)
  res.cookies.set('NEXT_LOCALE', activeLocale, {path: '/', maxAge: 60 * 60 * 24 * 365});
  return res;
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|api).*)']
};
```

> If your repo isn’t under `src/`, change the import to `./i18n/config.js`.

---

# next-intl wiring (App Router, JS)

## `src/app/[locale]/layout.js`

```js
import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import {NextIntlClientProvider} from 'next-intl';
import {isLocale} from '@/i18n/config';

async function getMessages(locale) {
  try {
    const mod = await import(`@/messages/${locale}.json`);
    return mod.default || mod; // webpack/next exports JSON under .default
  } catch {
    return null;
  }
}

export default async function RootLayout({children, params}) {
  const maybe = params?.locale;
  const locale = isLocale(maybe) ? maybe : null;
  if (!locale) notFound();
  const messages = await getMessages(locale);
  if (!messages) notFound();

  return (
    <html lang={locale}>
      <body>
        <Suspense fallback={<div>Loading…</div>}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
```

## `src/app/[locale]/page.js`

```js
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {LOCALES} from '@/i18n/config';

export default function Page() {
  const t = useTranslations();
  return (
    <main>
      <h1>{t('nav.home', {default: 'Home'})}</h1>
      <ul>
        {LOCALES.map((l) => (
          <li key={l}><Link href={`/${l}`}>{l}</Link></li>
        ))}
      </ul>
    </main>
  );
}
```

---

# NextAuth v5 (JS / Credentials + Prisma + remember‑me 1h/1d)

> JWT strategy. `session.expires` reflects a per-login stamp. Runtime locale comes from headers/cookie via middleware.

## `src/lib/core/auth.js`

```js
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import {PrismaAdapter} from '@auth/prisma-adapter';
import prisma from '@/lib/core/prisma';
import bcrypt from 'bcryptjs';
import {headers, cookies} from 'next/headers';

async function resolveLocaleFromHeadersOrCookie() {
  const h = await headers();
  const c = await cookies();
  const hinted = h.get('x-locale') || h.get('accept-language') || c.get('NEXT_LOCALE')?.value || 'en';
  const lower = String(hinted).toLowerCase();
  return lower.startsWith('is') ? 'is' : 'en';
}

const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * 60 * 60;

export const {handlers, auth, signIn, signOut} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: {label: 'Username', type: 'text'},
        password: {label: 'Password', type: 'password'},
        remember_me: {label: 'Remember Me', type: 'checkbox'}
      },
      async authorize(raw) {
        const username = String(raw?.username ?? '').trim();
        const password = String(raw?.password ?? '');
        const rememberRaw = raw?.remember_me;
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({
          where: {username},
          select: {user_id: true, username: true, email: true, password: true, name: true, role: true}
        });
        if (!user || !user.password) return null;
        if (!(user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        const remember = rememberRaw === true || rememberRaw === 'true' || rememberRaw === 'on' || rememberRaw === '1';
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
    async jwt({token, user}) {
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
    async session({session, token}) {
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
```

## `src/app/api/auth/[...nextauth]/route.js`

```js
export {GET, POST} from '@/lib/core/auth';
```

> **ENV required** (`.env.local`):

```
NEXTAUTH_SECRET=your-strong-random-secret
NEXTAUTH_URL=http://localhost:3000
```

---

# Minimal sign-in UI with remember‑me (localized, JS)

## `src/components/SignInForm.js`

```js
'use client';
import {useState} from 'react';
import {signIn} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';

export default function SignInForm() {
  const t = useTranslations('auth');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const username = String(form.get('username') || '');
    const password = String(form.get('password') || '');
    const remember_me = form.get('remember_me') ? 'on' : '';

    const res = await signIn('credentials', {redirect: false, username, password, remember_me});
    setPending(false);
    if (res?.error) setError(res.error);
    else {
      router.refresh();
      router.push('./');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label>
          {t('username')}
          <input name="username" autoComplete="username" required />
        </label>
      </div>
      <div>
        <label>
          {t('password')}
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
      </div>
      <div>
        <label>
          <input name="remember_me" type="checkbox" /> {t('rememberMe')}
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={pending}>{pending ? t('signingIn') : t('signIn')}</button>
    </form>
  );
}
```

## `src/app/[locale]/(auth)/signin/page.js`

```js
import SignInForm from '@/components/SignInForm';
import {useTranslations} from 'next-intl';

export default function SignInPage() {
  const t = useTranslations('auth');
  return (
    <main>
      <h1>{t('title')}</h1>
      <SignInForm />
    </main>
  );
}
```

---

# Messages (example keys)

```jsonc
// src/messages/en.json
{
  "nav.home": "Home",
  "auth": {
    "title": "Sign in",
    "username": "Username",
    "password": "Password",
    "rememberMe": "Remember me (1 day)",
    "signIn": "Sign in",
    "signingIn": "Signing in…"
  },
  "notify.userJoined": "{name} joined the room"
}
```

```jsonc
// src/messages/is.json
{
  "nav.home": "Heim",
  "auth": {
    "title": "Skrá inn",
    "username": "Notandanafn",
    "password": "Lykilorð",
    "rememberMe": "Muna eftir mér (1 dagur)",
    "signIn": "Innskrá",
    "signingIn": "Skrái inn…"
  },
  "notify.userJoined": "{name} tengdist rýminu"
}
```

---

# Locale switcher (optional)

## `src/components/LocaleSwitcher.js`

```js
'use client';
import {usePathname, useRouter} from 'next/navigation';
import {LOCALES} from '@/i18n/config
```
