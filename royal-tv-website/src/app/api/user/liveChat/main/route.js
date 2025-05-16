/* ──────────────────────────  ADD THIS INSTEAD  ────────────────────────── */
/**
 * GET /api/user/liveChat/main?page=1&limit=5
 * ------------------------------------------
 * Headers:
 *   • x-user-id: current user’s ID  (injected by middleware / axios)
 *
 * Returns paginated list of this user’s conversations, each with:
 *   • subject, updatedAt, lastMessageAt, unreadCount
 * Plus global pagination + how many convs still have unread admin replies.
 */

'use server';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    /* 1️⃣  Current user */
    const user_id = request.headers.get('x-user-id');
    if (!user_id) {
      return NextResponse.json(
        { error: 'x-user-id header missing' },
        { status: 400 },
      );
    }

    /* 2️⃣  Pagination params */
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '5'));
    const skip = (page - 1) * limit;

    /* 3️⃣  Count all conversations for this user */
    const totalConversations = await prisma.liveChatConversation.count({
      where: { user_id },
    });

    /* 4️⃣  Fetch one page with unread counts + last message timestamp */
    const conversations = await prisma.liveChatConversation.findMany({
      where: { user_id },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      select: {
        conversation_id: true,
        subject: true,
        updatedAt: true,
        /* newest message timestamp */
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
        /* unread admin‑sent messages */
        _count: {
          select: {
            messages: {
              where: { sender_is_admin: true, readAt: null },
            },
          },
        },
      },
    });

    /* 5️⃣  Map helpers */
    const mapped = conversations.map((c) => ({
      conversation_id: c.conversation_id,
      subject: c.subject,
      updatedAt: c.updatedAt,
      lastMessageAt: c.messages[0]?.createdAt || c.updatedAt,
      unreadCount: c._count.messages,
    }));

    /* how many convs still have ANY unread admin replies */
    const unreadConvoCount = mapped.filter((c) => c.unreadCount > 0).length;

    /* 6️⃣  Respond */
    return NextResponse.json({
      conversations: mapped,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalConversations / limit),
        totalConversations,
        pageSize: limit,
      },
      unreadConvoCount,
    });
  } catch (err) {
    console.error('❌ API Error in fetching conversations:', err);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 },
    );
  }
}
