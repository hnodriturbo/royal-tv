// 📁 src/app/api/user/deleteConversation/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request) {
  const user_id = request.headers.get('x-user-id');
  if (!user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { conversation_id, chatType = 'live' } = await request.json();

  if (!conversation_id) {
    return NextResponse.json(
      { error: 'conversation_id is required' },
      { status: 400 },
    );
  }

  try {
    const result =
      chatType === 'live'
        ? await prisma.liveChatConversation.deleteMany({
            where: { conversation_id, user_id },
          })
        : await prisma.bubbleChatConversation.deleteMany({
            where: { conversation_id, user_id },
          });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or not owned by you' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ User deleteConversation error:', error.message);
    return NextResponse.json(
      { error: `Failed to delete conversation: ${error.message}` },
      { status: 500 },
    );
  }
}
