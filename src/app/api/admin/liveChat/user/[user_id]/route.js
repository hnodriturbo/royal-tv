import logger from '@/lib/core/logger';
import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRole('admin', async (_req, ctx) => {
  const { user_id } = ctx.params;
  if (!user_id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

  try {
    const userDetails = await prisma.user.findUnique({
      where: { user_id },
      select: { user_id: true, name: true, username: true, email: true }
    });
    if (!userDetails) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const allConvos = await prisma.liveChatConversation.findMany({
      where: { owner_id: user_id },
      orderBy: { updatedAt: 'desc' },
      select: {
        conversation_id: true,
        subject: true,
        updatedAt: true,
        _count: { select: { messages: { where: { readAt: null, sender_is_admin: false } } } }
      }
    });

    const conversations = allConvos
      .map((c) => ({
        conversation_id: c.conversation_id,
        subject: c.subject,
        updatedAt: c.updatedAt,
        unreadCount: c._count.messages
      }))
      .sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });

    return NextResponse.json({
      conversations,
      userDetails,
      unreadConvos: conversations.filter((conv) => conv.unreadCount > 0).length
    });
  } catch (err) {
    logger.error('GET [user_id] error:', err);
    return NextResponse.json({ error: err.message, full: err }, { status: 500 });
  }
});
