// 📁 src/middleware.js
import { NextResponse } from 'next/server';
import { edgeAuth } from '@/lib/auth/edge-auth';

export async function middleware(req) {
  // 🔒 Authenticate & unpack token
  const token = await edgeAuth(req);
  const role = token?.role;
  const userId = token?.user_id; // Current user/admin id

  // 🗄️ Clone headers so we can safely modify
  const requestHeaders = new Headers(req.headers);

  // 1️⃣ Always inject x-user-id for all authenticated requests
  if (userId) {
    requestHeaders.set('x-user-id', userId);
    // 📝 Debug log
    console.log('[Middleware] injected x-user-id:', userId);
  }

  // 2️⃣ Optionally preserve x-owner-id and x-sender-id if frontend sent them
  //    (e.g., admin creates chat FOR user, or sends message on user's behalf)
  // No action needed unless you want to *enforce* these values.

  // 3️⃣ Admin API protection
  if (req.nextUrl.pathname.startsWith('/api/admin') && role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  // 4️⃣ Admin PAGE protection
  if (req.nextUrl.pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(`/auth/middlePage?admin=false`, req.url));
  }
  // 5️⃣ User PAGE protection
  if (req.nextUrl.pathname.startsWith('/user') && role !== 'user') {
    return NextResponse.redirect(new URL(`/auth/middlePage?user=false`, req.url));
  }
  // 6️⃣ User API protection
  if (req.nextUrl.pathname.startsWith('/api/user') && role !== 'user') {
    return NextResponse.json({ error: 'User only' }, { status: 403 });
  }

  // ✅ Continue, passing along our modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: ['/api/admin/:path*', '/api/user/:path*', '/admin/:path*', '/user/:path*']
};
