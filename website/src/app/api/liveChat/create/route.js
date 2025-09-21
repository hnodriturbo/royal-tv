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

import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';

export const POST = withRole('user', async (req, ctx, session) => {
  try {
    const { user_id, subject, message } = await req.json().catch(() => ({}));
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    // The conversation owner must be a normal user
    const owner = await prisma.user.findUnique({
      where: { user_id },
      select: { role: true }
    });
    if (!owner || owner.role !== 'user') {
      return NextResponse.json({ error: 'Owner must be a user' }, { status: 403 });
    }

    const conversation = await prisma.liveChatConversation.create({
      data: {
        owner_id: user_id,
        subject: subject || null
      }
    });

    if (message?.trim()) {
      const actorId = session?.user?.user_id ?? null; // sender is the actor (admin or user)
      await prisma.liveChatMessage.create({
        data: {
          conversation_id: conversation.conversation_id,
          sender_id: actorId,
          sender_is_admin: session?.user?.role === 'admin',
          message,
          status: 'sent'
        }
      });
    }

    return NextResponse.json(
      { conversation_id: conversation.conversation_id, id: conversation.conversation_id },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/liveChat/create failed:', err);
    return NextResponse.json({ error: 'Unknown server error' }, { status: 500 });
  }
});
