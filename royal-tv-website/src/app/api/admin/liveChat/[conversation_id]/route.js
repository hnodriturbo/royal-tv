/**
 * /api/admin/liveChat/[conversation_id]
 * -------------------------------------
 *   GET     → full convo + messages + user header
 *   POST    → add *admin* message
 *   PATCH   → mark all USER messages as read
 *   PUT     → edit one message
 *   DELETE  → (?message_id) delete msg | (no param) delete convo
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // project alias

/* Shared projection so we don’t repeat ourselves */
const messageSelect = {
  message_id: true,
  user_id: true,
  message: true,
  sender_is_admin: true,
  readAt: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

/* ── 1️⃣ GET – full conversation ------------------------------------ */
export async function GET(request, context) {
  const { conversation_id } = await context.params;

  try {
    const convo = await prisma.liveChatConversation.findUnique({
      where: { conversation_id },
      select: {
        conversation_id: true,
        subject: true,
        updatedAt: true,
        user: {
          select: { user_id: true, name: true, email: true, username: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: messageSelect,
        },
      },
    });

    if (!convo)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(convo);
  } catch (err) {
    console.error('GET [conversation_id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── 2️⃣ POST – add new admin message ------------------------------- */
export async function POST(request, context) {
  const { conversation_id } = await context.params;
  const { user_id, message } = await request.json();

  if (!user_id || !message?.trim())
    return NextResponse.json(
      { error: 'user_id and non‑empty message required' },
      { status: 400 },
    );

  try {
    const newMsg = await prisma.liveChatMessage.create({
      data: {
        conversation_id,
        user_id,
        message: message.trim(),
        sender_is_admin: true,
        status: 'sent',
      },
      select: messageSelect,
    });

    await prisma.liveChatConversation.update({
      where: { conversation_id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(newMsg, { status: 201 });
  } catch (err) {
    console.error('POST [conversation_id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── 3️⃣ PATCH – mark user messages read ---------------------------- */
export async function PATCH(request, context) {
  const { conversation_id } = await context.params;
  try {
    await prisma.liveChatMessage.updateMany({
      where: {
        conversation_id,
        sender_is_admin: false,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── 4️⃣ PUT – edit a single message ------------------------------- */
export async function PUT(request) {
  const { message_id, message } = await request.json();

  if (!message_id || !message?.trim())
    return NextResponse.json(
      { error: 'message_id and non‑empty message required' },
      { status: 400 },
    );

  try {
    const edited = await prisma.liveChatMessage.update({
      where: { message_id },
      data: {
        message: message.trim(),
        status: 'edited',
        updatedAt: new Date(),
      },
      select: messageSelect,
    });
    return NextResponse.json(edited);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── 5️⃣ DELETE – message OR entire convo -------------------------- */
export async function DELETE(request, context) {
  const { conversation_id } = await context.params;
  const msgId = new URL(request.url).searchParams.get('message_id');

  try {
    if (msgId) {
      await prisma.liveChatMessage.update({
        where: { message_id: msgId },
        data: { status: 'deleted' },
      });
      return NextResponse.json({ success: true, deleted: 'message' });
    }

    await prisma.liveChatConversation.delete({ where: { conversation_id } });
    return NextResponse.json({ success: true, deleted: 'conversation' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
