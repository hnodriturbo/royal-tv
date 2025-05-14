// 📁 src/middleware.js
import { NextResponse } from 'next/server';
import { edgeAuth } from '@/lib/auth/edge-auth';

export async function middleware(req) {
  // 🔒 authenticate & unpack token
  const token = await edgeAuth(req);
  const role = token?.role;
  const userId = token?.user_id; // wherever you store the user’s unique ID

  // 🗄️ clone headers and inject x-user-id for downstream handlers
  const requestHeaders = new Headers(req.headers);
  if (userId) {
    requestHeaders.set('x-user-id', userId);
    console.log('[Middleware] injected x-user-id:', userId);
  }

  // 🚧 guard admin routes
  if (req.nextUrl.pathname.startsWith('/api/admin') && role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  // 🚧 guard user routes
  if (req.nextUrl.pathname.startsWith('/api/user') && role !== 'user') {
    return NextResponse.json({ error: 'User only' }, { status: 403 });
  }

  // ✅ continue, passing along our modified headers
  return NextResponse.next({
    request: {
      // supply the new headers object
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/admin/:path*', '/api/user/:path*'],
};
