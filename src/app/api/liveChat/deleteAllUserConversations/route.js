/**
 * DELETE /api/liveChat/deleteAllUserConversations
 * -------------------------------------------
 * Deletes ALL liveChat conversations of a specific user.
 * Query Params:
 *   • user_id : string (UUID)  ← required
 * Middleware: Requires admin role
 */
import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    if (!userId || userRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Admins only.' }, { status: 403 });
    }
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');
    if (!user_id) return NextResponse.json({ message: 'user_id required' }, { status: 400 });

    // Only delete liveChat conversations
    await prisma.liveChatConversation.deleteMany({ where: { owner_id: user_id } });

    return NextResponse.json(
      { success: true, message: 'Deleted all liveChat conversations for user' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('❌ deleteAllUserConversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
