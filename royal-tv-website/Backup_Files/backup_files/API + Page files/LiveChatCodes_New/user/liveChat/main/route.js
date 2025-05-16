/**
 * GET /api/user/liveChat/main
 * ---------------------------
 * Authenticated user (via middleware) fetches THEIR conversations.
 *
 * Returns the same shape as the admin route above so the same React hook
 * can render it.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    /* ── 1.  Who is calling?  (x‑user‑id header injected by middleware) -- */
    const user_id = request.headers.get('x-user-id');
    if (!user_id) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    /* ── 2.  Pagination -------------------------------------------------- */
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 5);
    const skip = (page - 1) * pageSize;

    /* ── 3.  Count + fetch conversations ------------------------------- */
    const [totalCount, conversations] = await Promise.all([
      prisma.liveChatConversation.count({ where: { user_id } }),
      prisma.liveChatConversation.findMany({
        where: { user_id },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          conversation_id: true,
          subject: true,
          updatedAt: true,
        },
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    if (!conversations.length) {
      return NextResponse.json({ items: [], totalPages });
    }

    const convoIds = conversations.map((c) => c.conversation_id);

    /* Total & unread (from ADMIN → user) */
    const totals = await prisma.liveChatMessage.groupBy({
      by: ['conversation_id'],
      where: { conversation_id: { in: convoIds }, status: { not: 'deleted' } },
      _count: { _all: true },
    });
    const totalMap = Object.fromEntries(
      totals.map((t) => [t.conversation_id, t._count._all]),
    );

    const unread = await prisma.liveChatMessage.groupBy({
      by: ['conversation_id'],
      where: {
        conversation_id: { in: convoIds },
        sender_is_admin: true,
        status: 'sent',
      },
      _count: { _all: true },
    });
    const unreadMap = Object.fromEntries(
      unread.map((u) => [u.conversation_id, u._count._all]),
    );

    /* Latest message per convo */
    const lastMsgs = await prisma.liveChatMessage.findMany({
      where: { conversation_id: { in: convoIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['conversation_id'],
      select: {
        conversation_id: true,
        message_id: true,
        message: true,
        sender_is_admin: true,
        createdAt: true,
        updatedAt: true,
        status: true,
      },
    });
    const lastMap = Object.fromEntries(
      lastMsgs.map((m) => [m.conversation_id, m]),
    );

    /* Build items[] */
    const items = conversations.map((conv) => ({
      conversation_id: conv.conversation_id,
      subject: conv.subject,
      updatedAt: conv.updatedAt,
      totalMessagesInConversation: totalMap[conv.conversation_id] || 0,
      unreadMessagesInConversation: unreadMap[conv.conversation_id] || 0,
      lastMessage: lastMap[conv.conversation_id] || null,
      user: null, // ← not needed on user side
    }));

    return NextResponse.json({ items, totalPages });
  } catch (error) {
    console.error('❌ [user/liveChat/main] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
