/**
 * GET /api/admin/liveChat/user/[user_id]
 * --------------------------------------
 * 📎 Query‑params
 *   • page   : number (default 1)
 *   • limit  : number (default 5)
 * 📦 Response:
 *   {
 *     conversations: [{ conversation_id, subject, updatedAt, unreadCount }],
 *     totalPages,
 *     userDetails
 *   }
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, context) {
  // 1️⃣ Extract path param
  const { user_id } = await context.params;

  if (!user_id) {
    return NextResponse.json({ error: 'User ID is required in the URL path' }, { status: 400 });
  }

  // 2️⃣ Parse pagination
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.max(1, Number(searchParams.get('limit') ?? 5));

  try {
    // 3️⃣ Fetch user details
    const userDetails = await prisma.user.findUnique({
      where: { user_id },
      select: { user_id: true, name: true, username: true, email: true }
    });
    if (!userDetails) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4️⃣ Fetch all conversations for this user (no skip/take yet!)
    const allConvos = await prisma.liveChatConversation.findMany({
      where: { user_id },
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

    // 5️⃣ Shape & unread-first sort
    const sortedConvos = allConvos
      .map((convo) => ({
        conversation_id: convo.conversation_id,
        subject: convo.subject,
        updatedAt: convo.updatedAt,
        unreadCount: convo._count.messages
      }))
      .sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        // Fallback: newest updated first
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });

    // 6️⃣ Paginate AFTER sorting
    const start = (page - 1) * limit;
    const end = start + limit;
    const conversations = sortedConvos.slice(start, end);

    const totalPages = Math.ceil(sortedConvos.length / limit);

    // 7️⃣ Return
    return NextResponse.json({
      conversations,
      totalPages,
      userDetails,
      unreadConvos: sortedConvos.filter((conv) => conv.unreadCount > 0).length // (if you want this for badges)
    });
  } catch (err) {
    console.error('🔥 [admin/liveChat/user/[user_id]/route.js] failed:', err);
    return NextResponse.json(
      { error: `Failed to fetch user conversations: ${err.message}` },
      { status: 500 }
    );
  }
}
