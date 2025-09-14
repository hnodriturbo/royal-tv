/**
 * DELETE /api/liveChat/deleteConversation
 * ------------------------------------
 * Query params
 *   • conversation_id : string       ← delete only that convo (REQUIRED)
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';

export const DELETE = withRole('user', async (request, _ctx, session) => {
  const url = new URL(request.url);
  let conversation_id = url.searchParams.get('conversation_id');

  if (!conversation_id) {
    try {
      const body = await request.json();
      conversation_id = body?.conversation_id ?? null;
    } catch (err) {
      // ignore JSON parse errors
    }
  }

  if (!conversation_id) {
    return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 });
  }

  // Only owner or admin can delete:
  const convo = await prisma.liveChatConversation.findUnique({
    where: { conversation_id },
    select: { owner_id: true }
  });
  // Check if its the owner or admin deleting a conversation
  const isOwner = session?.user?.user_id && convo && convo.owner_id === session.user.user_id;
  if (!(isOwner || session?.user?.role === 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.liveChatConversation.delete({ where: { conversation_id } });
  return NextResponse.json({ success: true, deleted: conversation_id });
});
