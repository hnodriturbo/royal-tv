/**
 *   ============ /api/user/notifications/route.js ============
 * 📬
 * USER NOTIFICATIONS API ROUTE (paginated, header-based)
 * - Returns notifications for a user.
 * - Reads user_id from x-user-id header, never from query!
 * =================================================================
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma.js';

export async function GET(request) {
  // 1️⃣ Get user_id from headers (always, never from URL)
  const user_id = request.headers.get('x-user-id');
  // 2️⃣ Parse pagination params
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  if (!user_id) {
    return NextResponse.json({ error: 'Missing x-user-id header' }, { status: 400 });
  }

  try {
    // 3️⃣ Fetch notifications and badge counts in parallel
    const [notifications, total, unreadCount, readCount] = await Promise.all([
      prisma.notification.findMany({
        where: { user_id },
        orderBy: { createdAt: 'desc' },
        skip: page * pageSize,
        take: pageSize
      }),
      prisma.notification.count({ where: { user_id } }),
      prisma.notification.count({ where: { user_id, is_read: false } }),
      prisma.notification.count({ where: { user_id, is_read: true } })
    ]);

    // 4️⃣ Return everything needed for the UI
    return NextResponse.json({
      notifications,
      total,
      page,
      pageSize,
      unreadCount,
      readCount
    });
  } catch (error) {
    console.error('❌ GET /api/user/notifications failed:', error);
    return NextResponse.json(
      { notifications: [], total: 0, page: 0, pageSize: 10, unreadCount: 0, readCount: 0 },
      { status: 500 }
    );
  }
}
