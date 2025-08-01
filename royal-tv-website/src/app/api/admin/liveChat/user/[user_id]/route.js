/**
 * GET /api/admin/liveChat/user/[user_id]
 * --------------------------------------
 * Returns all liveChat conversations for a given user, sorted unread first then by newest.
 * No pagination: client does all pagination and sorting!
 * --------------------------------------
 */
import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, context) {
  // 1️⃣ Extract path param
  const { user_id } = await context.params;

  if (!user_id) {
    return NextResponse.json({ error: 'User ID is required in the URL path' }, { status: 400 });
  }

  try {
    // 2️⃣ Fetch user details
    const userDetails = await prisma.user.findUnique({
      where: { user_id },
      select: { user_id: true, name: true, username: true, email: true }
    });
    if (!userDetails) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3️⃣ Fetch all conversations for this user
    const allConvos = await prisma.liveChatConversation.findMany({
      where: { owner_id: user_id },
      orderBy: { updatedAt: 'desc' },
      select: {
        conversation_id: true,
        subject: true,
        updatedAt: true,
        _count: {
          select: {
            messages: {
              where: { readAt: null, sender_is_admin: false }
            }
          }
        }
      }
    });

    // 4️⃣ Shape & unread-first, newest fallback sort
    const conversations = allConvos
      .map((convo) => ({
        conversation_id: convo.conversation_id,
        subject: convo.subject,
        updatedAt: convo.updatedAt,
        unreadCount: convo._count.messages
      }))
      .sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });

    // 5️⃣ Return all conversations (no pagination)
    return NextResponse.json({
      conversations,
      userDetails,
      unreadConvos: conversations.filter((conv) => conv.unreadCount > 0).length
    });
  } catch (err) {
    logger.error('GET [user_id] error:', err);
    return NextResponse.json({ error: err.message, full: err }, { status: 500 });
  }
}
