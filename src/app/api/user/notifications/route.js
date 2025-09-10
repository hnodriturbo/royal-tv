
import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole, getUserId } from '@/lib/api/guards';

export const GET = withRole('user', async (request, _ctx, session) => {
  const user_id = getUserId(session);
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  try {
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

    return NextResponse.json({ notifications, total, page, pageSize, unreadCount, readCount });
  } catch (error) {
    console.error('❌ GET /api/user/notifications failed:', error);
    return NextResponse.json(
      { notifications: [], total: 0, page: 0, pageSize: 10, unreadCount: 0, readCount: 0 },
      { status: 500 }
    );
  }
});
