
import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRole('admin', async () => {
  try {
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
            messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
            _count: { select: { messages: { where: { readAt: null, sender_is_admin: false } } } }
          }
        }
      }
    });

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

    return NextResponse.json({ users, totalCount: users.length });
  } catch (err) {
    console.error('🔥 [admin/liveChat/main] failed:', err);
    return NextResponse.json(
      { error: `Failed to fetch user conversations: ${err.message}` },
      { status: 500 }
    );
  }
});
