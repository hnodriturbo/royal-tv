/* ———————————————————————————————————————————
   REMOVE THE WHOLE OLD FILE
—————————————————————————————————————————— */

/* ———————————————————————————————————————————
   ADD THIS INSTEAD
—————————————————————————————————————————— */
/**
 * /api/user/liveChat/[conversation_id]
 * ------------------------------------
 *   GET     → full convo + messages (+ admin header)
 *   POST    → add *user* message
 *   PATCH   → mark all ADMIN messages as read
 *   PUT     → edit one message (owner‑only)
 *   DELETE  → (?message_id) delete msg | (no param) delete convo
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // ✅ project alias

/*  Shared message projection so we don’t repeat ourselves */
const messageSelect = {
  message_id: true,
  user_id: true,
  message: true,
  sender_is_admin: true,
  readAt: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

/* 1️⃣  GET – conversation + messages + admin header */
export async function GET(request, context) {
  const { conversation_id } = context.params;

  try {
    const convo = await prisma.liveChatConversation.findUnique({
      where: { conversation_id },
      select: {
        conversation_id: true,
        subject: true,
        updatedAt: true,
        user: {
          select: { user_id: true, name: true, email: true, username: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: messageSelect
        }
      }
    });

    if (!convo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(convo);
  } catch (err) {
    console.error('GET [conversation_id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* 2️⃣  POST – user sends new message */
export async function POST(request, context) {
  const { conversation_id } = context.params;
  const { message } = await request.json();
  const user_id = request.headers.get('x-user-id');

  if (!user_id || !message?.trim())
    return NextResponse.json(
      { error: 'user_id header and non‑empty message required' },
      { status: 400 }
    );

  try {
    const newMsg = await prisma.liveChatMessage.create({
      data: {
        conversation_id,
        user_id,
        message: message.trim(),
        sender_is_admin: false,
        status: 'sent'
      },
      select: messageSelect
    });

    await prisma.liveChatConversation.update({
      where: { conversation_id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(newMsg, { status: 201 });
  } catch (err) {
    console.error('POST [conversation_id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* 3️⃣  PATCH – mark ADMIN messages as read */
export async function PATCH(request, context) {
  const { conversation_id } = context.params;
  try {
    await prisma.liveChatMessage.updateMany({
      where: { conversation_id, sender_is_admin: true, readAt: null },
      data: { readAt: new Date() }
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* 4️⃣  PUT – edit single message (owner‑only) */
export async function PUT(request) {
  const { message_id, message } = await request.json();
  const user_id = request.headers.get('x-user-id');

  if (!user_id || !message_id || !message?.trim())
    return NextResponse.json(
      { error: 'user_id header, message_id and non‑empty text required' },
      { status: 400 }
    );

  try {
    /* ensure the caller owns the message */
    const original = await prisma.liveChatMessage.findUnique({
      where: { message_id },
      select: { user_id: true }
    });
    if (original?.user_id !== user_id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const edited = await prisma.liveChatMessage.update({
      where: { message_id },
      data: {
        message: message.trim(),
        status: 'edited',
        updatedAt: new Date()
      },
      select: messageSelect
    });
    return NextResponse.json(edited);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* 5️⃣  DELETE – message OR entire conversation */
export async function DELETE(request, context) {
  const { conversation_id } = context.params;
  const user_id = request.headers.get('x-user-id');
  const msgId = new URL(request.url).searchParams.get('message_id');

  try {
    if (msgId) {
      /* delete single message (owner‑only) */
      const original = await prisma.liveChatMessage.findUnique({
        where: { message_id: msgId },
        select: { user_id: true }
      });
      if (original?.user_id !== user_id)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      await prisma.liveChatMessage.update({
        where: { message_id: msgId },
        data: { status: 'deleted', updatedAt: new Date() }
      });
      return NextResponse.json({ success: true, deleted: 'message' });
    }

    /* delete whole conversation (must belong to user) */
    const result = await prisma.liveChatConversation.deleteMany({
      where: { conversation_id, user_id }
    });
    if (result.count === 0)
      return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 });

    return NextResponse.json({ success: true, deleted: 'conversation' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
