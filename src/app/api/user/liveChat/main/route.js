import logger from '@/lib/core/logger';
import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole, getUserId } from '@/lib/api/guards';

export const GET = withRole('user', async (req, _ctx, session) => {
  try {
    const user_id = getUserId(session);

    const rawConvos = await prisma.liveChatConversation.findMany({
      where: { owner_id: user_id },
      orderBy: { updatedAt: 'desc' },
      select: {
        conversation_id: true,
        subject: true,
        updatedAt: true,
        messages: {
          select: { message_id: true, readAt: true, sender_is_admin: true }
        }
      }
    });

    const conversations = rawConvos.map((c) => ({
      conversation_id: c.conversation_id,
      subject: c.subject,
      updatedAt: c.updatedAt,
      unreadCount: c.messages.filter((m) => m.readAt === null && m.sender_is_admin).length,
      totalMessages: c.messages.length
    }));

    return NextResponse.json({ conversations });
  } catch (err) {
    logger.error('🔥 [users/liveChat/main] failed:', err);
    return NextResponse.json(
      { error: `Failed to fetch conversations: ${err.message}` },
      { status: 500 }
    );
  }
});
