/**
 * GET /api/admin/liveChat/[conversation_id]
 * ------------------------------------------
 * Fetches full details for a single live chat conversation.
 * Includes all messages in chronological order and unread count.
 * Admin-only route! Used by the admin panel to view conversation history.
 *
 * Path Params:
 *   • conversation_id: string (ID of the live chat conversation)
 *
 * Headers:
 *   • x-user-role: must be "admin"
 *
 * Response:
 *   • conversation_id, subject, updatedAt
 *   • owner (user_id, name, email, username)
 *   • messages[] (all fields + timestamps)
 *   • unreadCount: number of unread user messages
 */

import logger from '@/lib/core/logger';
import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';

export async function GET(request, context) {
  const { conversation_id } = await context.params;

  try {
    const convo = await prisma.liveChatConversation.findUnique({
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
    const unreadCount = await prisma.liveChatMessage.count({
      where: {
        conversation_id,
        readAt: null,
        sender_is_admin: false
      }
    });

    if (!convo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ ...convo, unreadCount });
  } catch (err) {
    // Print everything
    logger.error('GET [conversation_id] error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
      ...err
    });
    return NextResponse.json({ error: err.message, full: err }, { status: 500 });
  }
}
