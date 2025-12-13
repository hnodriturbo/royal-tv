# Copilot Instructions – Royal TV

## 🎯 Mission

Follow Royal TV’s architecture and coding style. Keep instructions **simple and strict** so AI stays focused.

All output must follow:

- Next.js 15 conventions (App Router, server-by-default)
- Clear, descriptive variable/function names (no abbreviations)
- Block comment at top of files + emoji one-liner comments in code
- No TypeScript anywhere
- next-intl i18n rules (never place `t` in dependency arrays)

---

## 🧩 Core Stack (What Must Be Respected)

- **Next.js 15 + React 19** (App Router)
- **NextAuth v5** for auth
- **Tailwind v4** for styling
- **PostgreSQL + Prisma** (`/lib/core/prisma.js`)
- **Socket.IO** on a **separate Node server**
- **NowPayments IPN** for BTC payments
- **MegaOtt webhook IPN** for subscription provisioning
- **next-intl** with message parents: `common`, `app`, `socket`, `components`
  - Under `socket`: only `ui` + `hooks`
- Console logs, warnings, and errors are **debug-only**, never translated

---

## 🎨 Coding Style

- Top-of-file block comment explaining purpose
- Emoji one-liner comments for all non-trivial logic
- Never abbreviate variable/function names (use full words, e.g. request, response, config)
- Favor clarity over cleverness
- Client components must include 'use client' at the top
- Tables on admin/user panels must use borders + hover:bg-gray-400
- Favor the simplest possible solution over clever or complex patterns. (if possible).

## 📡 Realtime & Chat Architecture

- Socket server is separate from the Next.js app.
- Client socket flow:
  - Components / hooks → `useSocketHub` → Socket server → back to components
- `useSocketHub`:
  - Must always guard emits/listens until connection is ready.
  - Is the single entry-point for socket usage.

**Live Chat Systems:**

- **Private Live Chat**

  - User ↔ Admin, only for logged-in users
  - Uses `LiveChatConversation` and `LiveChatMessage`

- **Public Live Chat**
  - Rooms, presence, unread counts
  - Guests identified via `public_identity_id` cookie
  - Uses `PublicLiveChatConversation` and `PublicLiveChatMessage`

Copilot must **never mix** data models, flows, or events between private and public chat.

---

## 🗂️ API Route Rules & Guards

### API Route Shape

- Use Next.js App Router route files.
- Use standard `GET`, `POST`, `PATCH`, `DELETE` exports with a `request` parameter.
- Always use NextResponse for responses.
- **EXAMPLE:**

```js
// /app/api/some-endpoint/route.js WITH ROLE GUARD
import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRole('admin', async (_req, ctx) => {
  const { user_id } = await ctx.params;
  if (!user_id)
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

  // FETCH DATA FROM DATABASE AND RETURN IT
});
```

### API Guards (`/lib/api/guards.js`)

- Use provided guards for all protected APIs:
  - `withAuth` for authenticated routes
  - `withRole('admin' | 'user', ...)` for role-based routes
- Guards:
  - Resolve NextAuth session
  - Fall back to identity headers when needed
  - Provide a merged session object to the wrapped handler

Copilot must **not** reimplement custom auth/role checks when these guards already exist.

---

## 🔐 Auth: NextAuth, Middleware, AuthGuard

### NextAuth Core (`/lib/core/auth.js`)

- Manages login with username/password and remember-me logic.
- Stores `user_id`, `role`, `name`, `email`, `username`, and locale on token/session.
- Copilot must not change core session/remember-me behavior or locale propagation.

### Middleware (`/middleware.js`)

Responsibilities:

- Locale routing:
  - Enforces `/[locale]` prefixes (e.g., `/en`, `/is`) for user-facing pages.
- Public live chat identity:
  - Ensures `public_identity_id` cookie exists for all visitors.
- Auth gating:
  - Blocks guests from `/admin/*` and `/user/*`
  - Redirects non-admin users away from admin routes
  - Redirects logged-in users away from auth pages when appropriate

Copilot must **respect** middleware decisions and not work around them with ad-hoc redirects.

### Client Auth Guard (`AuthGuard` + `useAuthGuard`)

- `AuthGuard` is the **only** client-side gate for user/admin/packages pages.
- Uses `useAuthGuard` like this but only on user/admin/packages pages:

```jsx
const { isAllowed, redirect } = useAuthGuard('admin');
// 🔒 redirect protection
useEffect(() => {
  if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
}, [status, isAllowed, redirect, router]);

// 🛡️ non-admin block
if (!isAllowed) return null;
```

```

```

- Show loader while auth status is unknown
- Redirect when user is not allowed
- Render children only when allowed

Copilot must reuse `AuthGuard` and `useAuthGuard` instead of re-creating client guards.

---

## 🌐 Axios & Identity Headers

- Use the shared Axios instance from `/lib/core/axiosInstance.js`.
- This instance:
  - Attaches session-based auth (token when available)
  - Attaches identity headers (`x-user-id`, and related) used by guards and APIs
- Copilot must:
  - Use this central axios instance for internal APIs
  - Not create new raw axios clients that bypass headers or session handling

---

## 🗄️ Prisma Client

- Use the **single** Prisma client exported from `/lib/core/prisma.js`.
- That file:
  - Handles connection string encoding
  - Sets up a single shared client in development
  - Configures logging levels
- Copilot must not spawn new Prisma clients in other modules unless it's absolutely necessary (like socket event files for example).

---

## 🌍 i18n Rules

- Use `useT()` and then `const t = useT()`.
- Never include `t` in any React dependency arrays.
- Translation keys:
  - Must be flat and consistent with existing structure.
  - Must be added to all relevant locale files when used.
  - Must not be added if unused.
- Notifications:
  - Stored in English in the database.
  - Translated dynamically based on socket locale when sent.

---

## 💳 Payments

- NowPayments:
  - Used for BTC payments
  - IPN callbacks update payment and subscription status
- MegaOtt:
  - Webhook/IPN updates IPTV provisioning data
- Payment is treated as successful when status is **`confirmed`** (and also when `completed`).

---

## 🪵 Logging & Admin Logs Page

- Next.js logging:
  - Can be stripped in production via `next.config.mjs` (remove console methods except errors).
- Socket/server logging:
  - Controlled by `SERVER_LOGS` environment variable in `server.js`.
  - When disabled, only error logging remains active.

Logs and console messages stay in English and are **never** part of i18n.

---

## 🙅‍♂️ Forbidden

- TypeScript anywhere in the project.
- Adding i18n keys that are not actually used.
- Forgetting to add used keys to all supported languages.
- Changing Next.js routing patterns away from the established App Router conventions.
- Using legacy route handlers or Express-style APIs.
- Translating console or server log messages.
