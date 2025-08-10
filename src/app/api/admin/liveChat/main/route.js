/**
 * GET /api/admin/liveChat/main
 * -----------------------------
 * Returns all users who have at least one live chat conversation.
 * Admin-only route! All sorting and pagination is done locally on the frontend.
 *
 * Headers:
 *   • x-user-role: must be "admin"
 */

import logger from '@/lib/core/logger';
import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
export async function GET(request) {
  // 🛡️ Check for admin role in headers
  const role = request.headers.get('x-user-role');
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    // 🟣 Fetch all users with at least one conversation (no limit, no pagination)
    const usersRaw = await prisma.user.findMany({
      where: { liveChatConversations: { some: {} } },
      select: {
        user_id: true,
        username: true,
        name: true,
        email: true,
        _count: { select: { liveChatConversations: true } },
        liveChatConversations: {
          orderBy: { updatedAt: 'desc' },
          select: {
            updatedAt: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { createdAt: true }
            },
            _count: {
              select: {
                messages: {
                  where: { readAt: null, sender_is_admin: false }
                }
              }
            }
          }
        }
      }
    });

    // 🟣 Prepare flat user objects for frontend
    const users = usersRaw.map((u) => {
      const newestConversation = u.liveChatConversations[0];
      const lastMessage = newestConversation?.messages[0]?.createdAt ?? null;
      const unreadConvoCount = u.liveChatConversations.filter((c) => c._count.messages > 0).length;

      return {
        user_id: u.user_id,
        username: u.username,
        name: u.name,
        email: u.email,
        conversationCount: u._count.liveChatConversations,
        unreadConvoCount,
        lastMessage
      };
    });

    // 🟣 Total count for info (not used for frontend pagination)
    const totalCount = users.length;

    return NextResponse.json({ users, totalCount });
  } catch (err) {
    logger.error('🔥 [admin/liveChat/main] failed:', err);
    return NextResponse.json(
      { error: `Failed to fetch user conversations: ${err.message}` },
      { status: 500 }
    );
  }
}
