/**
 * GET /api/user/liveChat/[conversation_id]
 * -----------------------------------------
 * Path params:
 *   • conversation_id: string
 * Headers:
 *   • x-user-id: user UUID (required)
 *
 * Returns:
 *   {
 *     conversation_id : string
 *     subject         : string | null
 *     updatedAt       : string (ISO)
 *     owner           : { user_id, name, email, username }
 *     messages        : [ ... ]
 *     unreadCount     : number
 *   }
 */

import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, context) {
  const { conversation_id } = await context.params;
  const user_id = request.headers.get('x-user-id');

  if (!user_id) return NextResponse.json({ error: 'User ID required' }, { status: 401 });

  try {
    // Find the conversation for user
    const convo = await prisma.liveChatConversation.findFirst({
      where: { conversation_id },
      select: {
        conversation_id: true,
        subject: true,
        updatedAt: true,
        owner: {
          select: { user_id: true, name: true, email: true, username: true }
        },
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

    // Unread count: admin messages not read by user
    const unreadCount = convo.messages.filter(
      (msg) => msg.readAt === null && msg.sender_is_admin
    ).length;

    return NextResponse.json({ ...convo, unreadCount });
  } catch (err) {
    logger.error('GET /user/liveChat/[conversation_id] error:', err);
    return NextResponse.json({ error: err.message, full: err }, { status: 500 });
  }
}
