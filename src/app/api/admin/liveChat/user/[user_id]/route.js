/**
 * GET /api/admin/liveChat/user/[user_id]
 * --------------------------------------
 * 📎 Query‑params
 *   • page   : number (default 1)
 *   • limit  : number (default 5)
 *
 * 📦 Response
 *   {
 *     conversations : [{
 *       conversation_id : string
 *       subject         : string | null
 *       updatedAt       : string          // ISO
 *       unreadCount     : number          // unread msgs in this conv
 *     }],
 *     totalPages   : number
 *     userDetails  : {
 *       user_id   : string
 *       name      : string | null
 *       username  : string | null
 *       email     : string | null
 *     }
 *   }
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // 🔌 central Prisma helper

export async function GET(request, { params }) {
  // 1️⃣ Extract path‑param ------------------------------------------------
  const { user_id } = await params; // /[user_id] from the URL
  if (!user_id) {
    return NextResponse.json(
      { error: 'User ID is required in the URL path' },
      { status: 400 }
    );
  }

  // 2️⃣ Parse pagination --------------------------------------------------
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.max(1, Number(searchParams.get('limit') ?? 5));
  const skip = (page - 1) * limit;

  try {
    // 3️⃣ Fetch basic user details (name, email, …) ----------------------
    const userDetails = await prisma.user.findUnique({
      where: { user_id },
      select: { user_id: true, name: true, username: true, email: true },
    });

    if (!userDetails) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4️⃣ Grab this user’s conversations ---------------------------------
    const rawConvs = await prisma.liveChatConversation.findMany({
      where: { user_id },
      skip,
      take: limit,

      // Order newest‑update first (we’ll fine‑tune later)
      orderBy: { updatedAt: 'desc' },

      select: {
        conversation_id: true,
        subject: true,
        updatedAt: true,

        // 👀 unread counter (user‑sent + unread)
        _count: {
          select: {
            messages: {
              where: { readAt: null, sender_is_admin: false },
            },
          },
        },
      },
    });

    // 5️⃣ Shape + secondary sort (unread first) --------------------------
    const conversations = rawConvs
      .map((c) => ({
        conversation_id: c.conversation_id,
        subject: c.subject,
        updatedAt: c.updatedAt,
        unreadCount: c._count.messages,
      }))
      .sort((a, b) => {
        // unread convs to the top 🔼
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        // otherwise keep the updatedAt order (already desc)
        return 0;
      });

    // 6️⃣ Pagination helpers --------------------------------------------
    const totalConvs = await prisma.liveChatConversation.count({
      where: { user_id },
    });
    const totalPages = Math.ceil(totalConvs / limit);

    // 7️⃣ Done ✅ ---------------------------------------------------------
    return NextResponse.json({ conversations, totalPages, userDetails });
  } catch (err) {
    // 8️⃣ Error handling 🔥 ----------------------------------------------
    console.error('🔥 [admin/liveChat/user] failed:', err);
    return NextResponse.json(
      { error: `Failed to fetch user conversations: ${err.message}` },
      { status: 500 }
    );
  }
}
