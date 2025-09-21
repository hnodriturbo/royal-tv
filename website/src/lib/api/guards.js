// src/lib/api/guards.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/core/auth'; // your NextAuth v5 export { auth } = NextAuth({ ... })

/**
 * Obtain a session from NextAuth, or fall back to middleware headers.
 * If headers provide x-user-id, synthesize a minimal session so legacy
 * header-based flows continue to work without rewriting routes.
 */
async function getSessionOrHeader(req) {
  let session = await auth(); // null if not signed in
  if (!session) {
    const uid = req.headers.get('x-user-id');
    if (uid) {
      const role = req.headers.get('x-user-role') ?? 'user';
      session = { user: { id: uid, user_id: uid, role } };
    }
  }
  return session;
}

/**
 * Wrap a route handler to require an authenticated session (or header auth).
 * @param {(req: Request, ctx: any, session: any) => Promise<Response>|Response} handler
 */
export function withAuth(handler) {
  return async (req, ctx) => {
    const session = await getSessionOrHeader(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req, ctx, session);
  };
}

/**
 * Require a specific role. "user" passes for users and admins.
 * Merges header identity into session so downstream getUserId works.
 * @param {'user'|'admin'} required
 * @param {(req: Request, ctx: any, session: any) => Promise<Response>|Response} handler
 */
export function withRole(required, handler) {
  return withAuth(async (req, ctx, session) => {
    // Compose effective role from session or header
    const effectiveRole = session?.user?.role ?? req.headers.get('x-user-role') ?? 'user';
    if (required === 'admin' && effectiveRole !== 'admin') {
      return NextResponse.json({ error: 'Admins only' }, { status: 403 });
    }
    if (required === 'user' && !(effectiveRole === 'user' || effectiveRole === 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure id is present (fill from headers if missing)
    const headerId = req.headers.get('x-user-id');
    const user = {
      ...(session?.user ?? {}),
      id: session?.user?.id ?? headerId ?? null,
      user_id: session?.user?.user_id ?? headerId ?? null,
      role: effectiveRole
    };

    const mergedSession = { ...session, user };
    if (!mergedSession.user?.id && !mergedSession.user?.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(req, ctx, mergedSession);
  });
}

/**
 * Get the current user's id from session; if absent, fall back to request headers.
 * Accepts (session) or (session, req) — req is optional.
 */
export function getUserId(session, req) {
  return (
    session?.user?.user_id ??
    session?.user?.id ??
    session?.user_id ??
    (req?.headers?.get ? req.headers.get('x-user-id') : null) ??
    null
  );
}
