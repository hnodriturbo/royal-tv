// GET /api/user/liveChat/[conversation_id]
'use server';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const { conversation_id } = params;
    const user_id = req.headers.get('User-ID');

    const convo = await prisma.liveChatConversation.findFirst({
      where: { conversation_id, user_id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!convo)
      return NextResponse.json({ error: 'not found' }, { status: 404 });

    return NextResponse.json(
      { subject: convo.subject, messages: convo.messages, user_id },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
