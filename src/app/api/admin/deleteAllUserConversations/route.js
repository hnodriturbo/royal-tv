/**
 * DELETE /api/admin/deleteAllUserConversations
 * -------------------------------------------
 * Deletes ALL conversations (live and bubble) of a specific user.
 *
 * Query Params:
 *   • user_id : string (UUID)  ← required
 *
 * Middleware:
 *   • Requires admin role (handled by middleware)
 *
 * Response:
 *   • 200: { success: true, message: 'Deleted all conversations for user' }
 *   • 400: { error: 'user_id is required' }
 *   • 500: { error: 'Internal server error' }
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');
    const chatType = url.searchParams.get('chatType');

    if (!user_id || !chatType)
      return NextResponse.json(
        { error: 'user_id & chatType required' },
        { status: 400 },
      );

    const model =
      chatType === 'bubbleChat'
        ? prisma.bubbleChatConversation
        : prisma.liveChatConversation;

    await model.deleteMany({ where: { user_id } });

    // ✅ Success
    return NextResponse.json(
      { success: true, message: 'Deleted all conversations for user' },
      { status: 200 },
    );
  } catch (error) {
    console.error('❌ deleteAllUserConversations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
