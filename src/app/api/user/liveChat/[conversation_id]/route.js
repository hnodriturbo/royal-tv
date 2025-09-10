import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole, getUserId } from '@/lib/api/guards';

export const GET = withRole('user', async (_req, ctx, session) => {
  const { conversation_id } = ctx.params;
  const user_id = getUserId(session);

  try {
    const convo = await prisma.liveChatConversation.findFirst({
      where: { conversation_id, owner_id: user_id }, // enforce ownership
      select: {
        conversation_id: true,
        subject: true,
        updatedAt: true,
        owner: { select: { user_id: true, name: true, email: true, username: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            message_id: true,
            sender_id: true,
            message: true,
            sender_is_admin: true,
            readAt: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!convo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const unreadCount = convo.messages.filter(
      (msg) => msg.readAt === null && msg.sender_is_admin
    ).length;

    return NextResponse.json({ ...convo, unreadCount });
  } catch (err) {
    console.error('GET /user/liveChat/[conversation_id] error:', err);
    return NextResponse.json({ error: err.message, full: err }, { status: 500 });
  }
});
