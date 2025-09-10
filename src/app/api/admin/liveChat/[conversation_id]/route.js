import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRole('admin', async (_req, ctx) => {
  const { conversation_id } = ctx.params;

  try {
    const convo = await prisma.liveChatConversation.findUnique({
      where: { conversation_id },
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

    const unreadCount = await prisma.liveChatMessage.count({
      where: { conversation_id, readAt: null, sender_is_admin: false }
    });

    return NextResponse.json({ ...convo, unreadCount });
  } catch (err) {
    console.error('GET [conversation_id] error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
      ...err
    });
    return NextResponse.json({ error: err.message, full: err }, { status: 500 });
  }
});
