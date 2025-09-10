/**
 * DELETE /api/liveChat/deleteAllUserConversations
 * -------------------------------------------
 * Deletes ALL liveChat conversations of a specific user.
 * Query Params:
 *   • user_id : string (UUID)  ← required
 * Middleware: Requires admin role
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';

export const DELETE = withRole('admin', async (request) => {
  const url = new URL(request.url);
  const user_id = url.searchParams.get('user_id');
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  await prisma.liveChatConversation.deleteMany({ where: { owner_id: user_id } });
  return NextResponse.json({ success: true });
});
