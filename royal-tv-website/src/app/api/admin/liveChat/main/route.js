/**
 * GET /api/admin/liveChat/main
 * ----------------------------
 * Query‑params
 *   • page   : number default 1
 *   • limit  : number default 5
 *
 * Returns
 *   {
 *     users       : [{
 *       user_id            : string
 *       username           : string | null
 *       name               : string | null
 *       email              : string | null
 *       conversationCount  : number     // total convs owned by user
 *       unreadConvoCount   : number     // convs that still contain unread 📩
 *       lastMessage        : string | null  // ISO timestamp of *newest* msg
 *     }],
 *     totalPages  : number               // for <Pagination/>
 *   }
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    // 1️⃣ Parse pagination params 🔢
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1)); // keep ≥1
    const limit = Math.max(1, Number(searchParams.get('limit') ?? 5)); // keep ≥1
    const skip = (page - 1) * limit; // ➗ offset calc

    // 2️⃣  Grab users who HAVE at least one live‑chat conversation 🗣️
    //     (the relation is **liveChatConversations** in the schema, not singular)
    const rawUsers = await prisma.user.findMany({
      where: { liveChatConversations: { some: {} } },
      skip,
      take: limit,
      select: {
        user_id: true,
        username: true,
        name: true,
        email: true,

        // total #convs (any status)
        _count: { select: { liveChatConversations: true } },

        // per‑conversation info, newest first
        liveChatConversations: {
          orderBy: { updatedAt: 'desc' },
          select: {
            updatedAt: true, // for global “lastMessage”
            // newest message — we only need its timestamp
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { createdAt: true },
            },
            // unread message counter (user‑sent + unread)
            _count: {
              select: {
                messages: {
                  where: { readAt: null, sender_is_admin: false },
                },
              },
            },
          },
        },
      },
    });

    // 3️⃣ Shape data for the client 📦
    const users = rawUsers.map((u) => {
      const newestConversation = u.liveChatConversations[0]; // already sorted DESC
      const lastMessage = newestConversation?.messages[0]?.createdAt ?? null;

      // count how many convs still have ANY unread user messages
      const unreadConvoCount = u.liveChatConversations.filter(
        (c) => c._count.messages > 0,
      ).length;

      return {
        user_id: u.user_id,
        username: u.username,
        name: u.name,
        email: u.email,
        conversationCount: u._count.liveChatConversations,
        unreadConvoCount,
        lastMessage,
      };
    });

    // 4️⃣ Paginator helpers 📄
    const totalUsers = await prisma.user.count({
      where: { liveChatConversations: { some: {} } },
    });
    const totalPages = Math.ceil(totalUsers / limit);

    // 5️⃣ All good 🚀
    return NextResponse.json({ users, totalPages });
  } catch (err) {
    // 6️⃣ Error handling 🔥
    console.error('🔥 [admin/liveChat/main] failed:', err);
    return NextResponse.json(
      { error: `Failed to fetch user conversations: ${err.message}` },
      { status: 500 },
    );
  }
}
