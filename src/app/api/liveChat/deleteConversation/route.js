/**
 * DELETE /api/liveChat/deleteConversation
 * ------------------------------------
 * Query params
 *   • conversation_id : string       ← delete only that convo (REQUIRED)
 * Only works for liveChat now!
 */
import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const conversation_id = url.searchParams.get('conversation_id');

    if (!conversation_id)
      return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 });

    // Only operate on liveChat
    await prisma.liveChatConversation.delete({ where: { conversation_id } });
    return NextResponse.json({
      success: true,
      deleted: `deleted conversation: ${conversation_id}`
    });
  } catch (err) {
    logger.error('❌ deleteConversation route:', err);
    return NextResponse.json({ error: `Deletion failed: ${err.message}` }, { status: 500 });
  }
}
