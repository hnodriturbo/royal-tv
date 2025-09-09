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
  matcher: ['/((?!_next|.*\..*|api).*)']
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
import {LOCALES} from '@/i18n/config';

export default function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  function switchTo(locale) {
    const parts = pathname.split('/');
    parts[1] = locale; // swap locale segment
    router.push(parts.join('/'));
  }
  return (
    <div>
      {LOCALES.map((l) => (
        <button key={l} onClick={() => switchTo(l)}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}
```

---

# Notes to fit your current repo

* You mentioned `prisma.js` sits under `core` → this setup imports it as `@/lib/core/prisma`. Keep your file there or adjust the import.
* Your `axiosInstance` looks for `session.user.token`. The provided NextAuth config doesn’t set a custom token by default; the header will be skipped safely. If you later mint an API token, attach it in the `jwt` callback as `token.apiToken` and mirror to `session.user.token` in the `session` callback.
* Keep `AuthGuard` as-is. The role is exposed at `session.user.role`. Your `useAuthGuard` hook should read from `useSession()` and check `role` + `session.expires`.

---

# Usage guidance (keys & sockets)

* **Do not send localized strings** through sockets. Always send `{id, params}`. On the client: `const {id, params} = JSON.parse(evt.data); t(id, params)`.
* Prefer component-scoped namespaces: `auth.*`, `notifications.*`, etc.
* Use `t.rich()` when you need rich text without HTML/SafeString.

---

# Extraction: Sign-in form component (same Tailwind), thin page wrapper, and locale-safe AuthGuard redirects

Below are **drop-in JS files** that keep your styling intact and add a tiny redirect helper for `middlePage`.

---

## 1) `src/components/SignInForm.js`

> Extracted from the previous Sign In page. Same Tailwind. Handles form submit, remember‑me, and localized messages.

```js
'use client';

import {useState, useEffect} from 'react';
import {signIn} from 'next-auth/react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useTranslations, useLocale} from 'next-intl';
import Link from 'next/link';
import useAppHandlers from '@/hooks/useAppHandlers';

export default function SignInForm() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {displayMessage, showLoader, hideLoader} = useAppHandlers();

  const initialUsername = searchParams?.get('username') || '';
  const isSignupFlow = searchParams?.get('signup') === 'true';

  const [usernameValue, setUsernameValue] = useState(initialUsername);
  const [passwordValue, setPasswordValue] = useState('');
  const [rememberMeChecked, setRememberMeChecked] = useState(false);

  useEffect(() => {
    if (isSignupFlow && initialUsername) {
      displayMessage(
        t('app.signin.signupWelcomeMessage', {username: initialUsername, default: 'Welcome! Please sign in.'}),
        'success'
      );
      return;
    }
    const errOrMsg = searchParams?.get('error') || searchParams?.get('message') || searchParams?.get('info');
    if (errOrMsg) displayMessage(decodeURIComponent(errOrMsg), 'error');
  }, [searchParams, displayMessage, t, isSignupFlow, initialUsername]);

  async function handleSignin(e) {
    e.preventDefault();

    if (!usernameValue || !passwordValue) {
      displayMessage(t('app.signin.fillBothFields', {default: 'Please fill in both username and password.'}), 'info');
      return;
    }

    showLoader({text: t('app.signin.loggingIn', {default: 'Logging in...'})});

    try {
      const result = await signIn('credentials', {
        redirect: false,
        username: usernameValue,
        password: passwordValue,
        remember_me: rememberMeChecked ? 'on' : ''
      });

      if (!result?.error) {
        displayMessage(t('app.signin.loginSuccess', {default: 'Login successful! Redirecting...'}), 'success');
        const redirectTo = searchParams?.get('redirectTo') || '';
        const middle = `/${locale}/auth/middlePage?login=true${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
        setTimeout(() => router.replace(middle), 1000);
      } else {
        displayMessage(t('app.signin.wrongCredentials', {default: 'Wrong username or password'}), 'error');
      }
    } catch (error) {
      displayMessage(t('app.signin.loginError', {error: String(error), default: `Login error: ${String(error)}` }), 'error');
    } finally {
      hideLoader();
    }
  }

  return (
    <div className="flex items-center justify-center w-full mt-20">
      <div className="container-style lg:w-[700px] mx-auto my-12">
        <h1 className="text-4xl font-semibold text-center mb-5 super-decorative-2">
          {t('app.signin.title', {default: 'Sign In'})}
        </h1>

        <form onSubmit={handleSignin} noValidate>
          <input
            id="username"
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black mb-4"
            placeholder={t('app.signin.usernamePlaceholder', {default: 'Enter your username'})}
            value={usernameValue}
            onChange={(e) => setUsernameValue(e.target.value)}
            autoFocus
          />

          <input
            id="password"
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black mb-4"
            placeholder={t('app.signin.passwordPlaceholder', {default: 'Enter your password'})}
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
          />

          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={rememberMeChecked}
              onChange={(e) => setRememberMeChecked(e.target.checked)}
              className="mr-2"
            />
            {t('app.signin.rememberMe', {default: 'Remember me'})}
          </label>

          <button type="submit" className="w-full py-2 text-white rounded-lg bg-blue-400 hover:bg-blue-600">
            {t('app.signin.submitButton', {default: 'Sign In'})}
          </button>
        </form>

        <p className="text-center mt-4">
          {t('app.signin.noAccountPrompt', {default: 'Don’t have an account?'})}{' '}
          <Link href={`/${locale}/auth/signup`} className="underline">
            {t('app.signin.signUpLink', {default: 'Sign up'})}
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

## 2) Thin wrapper page

> Keeps routing under `/[locale]/auth/signin` and reuses the component above.

### `src/app/[locale]/auth/signin/page.js`

```js
import SignInForm from '@/components/SignInForm';

export default function Page() {
  return <SignInForm />;
}
```

---

## 3) MiddlePage URL builder (safe, locale‑aware)

> A tiny helper to construct the `/auth/middlePage` URL with flags and a sanitized `redirectTo`.

### `src/lib/core/authGuard/redirectHelpers.js`

```js
const FORBIDDEN = ['/auth/login', '/auth/middlePage'];

export function localePath(locale, path = '/') {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${p}`;
}

export function safeRedirectTo(pathname = '/', searchParams) {
  const query = searchParams?.toString?.() || '';
  const raw = `${pathname}${query ? `?${query}` : ''}`;
  if (FORBIDDEN.some((p) => raw.startsWith(p))) return '/';
  return raw;
}

export function middlePageUrl(locale, flags = {}, redirectTo) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(flags)) {
    if (v === true) qs.set(k, 'true');
    else if (v === false) qs.set(k, 'false');
  }
  if (redirectTo) qs.set('redirectTo', redirectTo);
  const base = localePath(locale, '/auth/middlePage');
  const suffix = qs.toString();
  return suffix ? `${base}?${suffix}` : base;
}

// convenience wrappers
export const middleAfterLogin = (locale, redirectTo) => middlePageUrl(locale, {login: true}, redirectTo);
export const middleAfterLogout = (locale) => middlePageUrl(locale, {logout: true});
export const middleNotLoggedIn = (locale, redirectTo) => middlePageUrl(locale, {notLoggedIn: true}, redirectTo);
export const middleAccessDenied = (locale, role, redirectTo) => middlePageUrl(locale, {[role]: false}, redirectTo);
```

---

## 4) Guard that redirects via MiddlePage (JS)

> Drop‑in replacement for your current guard at `src/lib/core/authGuard/AuthGuard.js`. It renders `children` only when allowed; otherwise it redirects to `middlePage` with the right flags/messages.

### `src/lib/core/authGuard/AuthGuard.js`

```js
'use client';

import {useEffect} from 'react';
import {useSession} from 'next-auth/react';
import {useRouter, usePathname, useSearchParams} from 'next/navigation';
import {useLocale} from 'next-intl';
import {safeRedirectTo, middleNotLoggedIn, middleAccessDenied} from './redirectHelpers';

/**
 * Props:
 * - role: 'admin' | 'user' | undefined (if provided, must match session.user.role)
 * - allowGuest: boolean (default false)
 * - children?: ReactNode (rendered only when allowed)
 */
export default function AuthGuard({role, allowGuest = false, children = null}) {
  const {data: session, status} = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  useEffect(() => {
    if (status === 'loading') return; // wait for session

    const redirectTo = safeRedirectTo(pathname, searchParams);

    // Not authenticated
    if (status !== 'authenticated') {
      if (!allowGuest) {
        router.replace(middleNotLoggedIn(locale, redirectTo));
      }
      return;
    }

    // Authenticated but role mismatch
    if (role && session?.user?.role && session.user.role !== role) {
      router.replace(middleAccessDenied(locale, role, redirectTo));
      return;
    }
  }, [status, session, pathname, searchParams, router, locale, role, allowGuest]);

  // When allowed, render children (or nothing if you prefer a pure protector)
  if (status === 'authenticated') {
    if (!role || session?.user?.role === role) return children;
  }
  return null;
}
```

> **Usage examples**

* Protect an admin page and render nothing until allowed:

```js
// app/[locale]/admin/dashboard/page.js
import AuthGuard from '@/lib/core/authGuard/AuthGuard';

export default function AdminDashboard() {
  return (
    <AuthGuard role="admin">
      {/* secure content here */}
      <div>Admin dashboard</div>
    </AuthGuard>
  );
}
```

* Protect a user page but allow guests to see a marketing hero while logged-out:

```js
<AuthGuard role="user" allowGuest>
  <UserArea />
</AuthGuard>
```

---

## 5) Message keys to add (if missing)

Make sure your `en.json` and `is.json` include keys used by SignInForm and MiddlePage (as per earlier sections):

* `app.signin.*` (title, usernamePlaceholder, passwordPlaceholder, rememberMe, submitButton, fillBothFields, loggingIn, loginSuccess, wrongCredentials, loginError, noAccountPrompt, signUpLink, signupWelcomeMessage)
* `app.middlePage.messages.*` (welcome, logoutSuccess, profileUpdated, passwordUpdated, paymentComplete, accessDenied, accessDeniedLogin, notAuthorized, pageMissing, badCredentials, unexpectedError)

---

# Done ✅ (extraction + guard)

* Sign-in form is now a reusable component (same Tailwind), with a minimal page wrapper.
* `AuthGuard` redirects through localized `middlePage` using a compact helper.
* Everything stays under `/[locale]/…` so i18n works automatically.

When you paste these, ping me if any import path differs (e.g., your hooks live elsewhere) and I’ll tweak the imports on the spot.
