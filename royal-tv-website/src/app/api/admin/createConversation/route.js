/**
 * POST /api/admin/createConversation
 * ----------------------------------
 * Body JSON
 *   • user_id : string                    ← target user
 *   • subject : string
 *   • message : string
 *   • chatType    : 'live' | 'bubble'         ← optional, default 'live'
 *
 * Returns { conversation_id }
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  // 1️⃣ Parse + trim
  const { subject, message, user_id, chatType } = await request.json();
  const adminUserId = request.headers.get('x-user-id');
  // 2️⃣ Validate
  if (!user_id || !subject || !message)
    return NextResponse.json(
      { error: 'user_id, subject and message are required' },
      { status: 400 }
    );
  const adminUser = await prisma.user.findUnique({
    where: { user_id: adminUserId },
    select: { role: true }
  });
  if (!adminUser || adminUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: admin privileges required' }, { status: 403 });
  }
  try {
    // 3️⃣ Create the conversation first
    const convoData = { user_id, subject }; // ✅ only valid fields here
    const convo =
      chatType === 'bubble'
        ? await prisma.bubbleChatConversation.create({ data: convoData })
        : await prisma.liveChatConversation.create({ data: convoData });

    // 4️⃣ Create the initial message
    const msgData = {
      conversation_id: convo.conversation_id,
      user_id,
      message,
      sender_is_admin: true,
      status: 'sent'
    };

    if (chatType === 'bubble') {
      await prisma.bubbleChatMessage.create({ data: msgData });
    } else {
      await prisma.liveChatMessage.create({ data: msgData });
    }
    console.log('Message object:', msgData);
    // 5️⃣ Success
    return NextResponse.json({ conversation_id: convo.conversation_id }, { status: 201 });
  } catch (err) {
    console.error('❌ createConversation:', err);
    return NextResponse.json(
      { error: `Failed to create conversation: ${err.message}` },
      { status: 500 }
    );
  }
}
