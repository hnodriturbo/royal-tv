/**
 * POST /api/liveChat/createConversation
 * -------------------------------------
 * Body JSON:
 *   • user_id  : string     // The USER who should own the conversation (never admin!)
 *   • subject  : string
 *   • message  : string
 *
 * Returns: { conversation_id }
 * -------------------------------------
 * 🏰 Royal TV rule: Only USERS can own conversations! Admins can create, but never own.
 */

import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  const { subject, message, user_id } = await request.json();
  const creatorUserId = request.headers.get('x-user-id');

  // Validate
  if (!user_id || !subject || !message)
    return NextResponse.json(
      { error: 'user_id, subject and message are required' },
      { status: 400 }
    );

  // Enforce: user_id must be a real user, not admin
  const ownerUser = await prisma.user.findUnique({
    where: { user_id },
    select: { role: true }
  });
  if (!ownerUser || ownerUser.role !== 'user') {
    return NextResponse.json(
      {
        error:
          'Only a user can be set as the owner of a conversation. Provided user_id is not a user.'
      },
      { status: 403 }
    );
  }

  // Prevent admin or user starting a chat with themselves (redundant, but good practice)
  if (creatorUserId === user_id) {
    return NextResponse.json(
      { error: 'You cannot create a conversation with yourself.' },
      { status: 400 }
    );
  }

  try {
    // user_id is always the recipient user (owner)!
    const convoData = { user_id, subject };

    const conversation = await prisma.liveChatConversation.create({ data: convoData });

    // Create initial message, sender_is_admin true if created by admin
    const messageData = {
      conversation_id: conversation.conversation_id,
      user_id, // The recipient user is always the owner
      message,
      sender_is_admin: creatorUserId !== user_id, // true if admin, false if user
      status: 'sent'
    };

    await prisma.liveChatMessage.create({ data: messageData });

    return NextResponse.json({ conversation_id: conversation.conversation_id }, { status: 201 });
  } catch (err) {
    logger.error('❌ createConversation route error:', err);
    return NextResponse.json(
      { error: `Failed to create conversation: ${err.message}` },
      { status: 500 }
    );
  }
}
