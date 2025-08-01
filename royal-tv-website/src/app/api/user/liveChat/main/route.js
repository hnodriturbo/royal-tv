/**
 * GET /api/users/liveChat/main
 * ----------------------------
 * Query-params
 *   • page   : number default 1
 *   • limit  : number default 5
 * Headers
 *   • x-user-id: user UUID (required)
 *
 * Returns
 *   {
 *     conversations : [{
 *       conversation_id : string
 *       subject         : string | null
 *       updatedAt       : string (ISO)
 *       unreadCount     : number // unread user messages for this convo
 *       totalMessages   : number
 *     }],
 *     totalPages  : number
 *   }
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    // 🔑 Extract user ID from header
    const user_id = request.headers.get('x-user-id');
    if (!user_id) return NextResponse.json({ error: 'User ID required' }, { status: 401 });

    // Fetch all conversations for the user
    const rawConvos = await prisma.liveChatConversation.findMany({
      where: { owner_id: user_id },
      orderBy: { updatedAt: 'desc' }, // default sort
      select: {
        conversation_id: true,
        subject: true,
        updatedAt: true,
        messages: {
          select: {
            message_id: true,
            readAt: true,
            sender_is_admin: true
          }
        }
      }
    });

    // Transform to flat structure for frontend
    const conversations = rawConvos.map((c) => ({
      conversation_id: c.conversation_id,
      subject: c.subject,
      updatedAt: c.updatedAt,
      unreadCount: c.messages.filter((m) => m.readAt === null && m.sender_is_admin).length,
      totalMessages: c.messages.length
    }));

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error('🔥 [users/liveChat/main] failed:', err);
    return NextResponse.json(
      { error: `Failed to fetch conversations: ${err.message}` },
      { status: 500 }
    );
  }
}
