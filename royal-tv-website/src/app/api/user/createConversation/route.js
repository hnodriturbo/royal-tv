// 📁 src/app/api/user/createConversation/route.js

/**
 * POST /api/user/createConversation
 * ---------------------------------
 * Public endpoint (no auth).
 * Body JSON:
 *   • subject: string            – conversation subject
 *   • message: string            – first message text
 *   • chatType?:   'live' | 'bubble' – defaults to 'live'
 *
 * Creates a new LiveChatConversation or BubbleChatConversation
 * for the (anonymous) requester, then seeds the first message.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  const user_id = request.headers.get('x-user-id');

  const { subject, message, chatType = 'live' } = await request.json();

  if (!subject || !message) {
    return NextResponse.json(
      { error: 'Subject and message are required' },
      { status: 400 },
    );
  }

  try {
    // 🟢 Correct Prisma call
    const convoData = { user_id, subject };

    const conversation =
      chatType === 'live'
        ? await prisma.liveChatConversation.create({ data: convoData })
        : await prisma.bubbleChatConversation.create({ data: convoData });

    // 🟢 Correctly create the first message
    const msgData = {
      conversation_id: conversation.conversation_id,
      user_id,
      message,
      sender_is_admin: false,
      status: 'sent',
    };

    if (chatType === 'live') {
      await prisma.liveChatMessage.create({ data: msgData });
    } else {
      await prisma.bubbleChatMessage.create({ data: msgData });
    }

    return NextResponse.json(
      { conversation_id: conversation.conversation_id },
      { status: 201 },
    );
  } catch (error) {
    console.error('❌ User createConversation error:', error.message);
    return NextResponse.json(
      { error: `Failed to create conversation: ${error.message}` },
      { status: 500 },
    );
  }
}
