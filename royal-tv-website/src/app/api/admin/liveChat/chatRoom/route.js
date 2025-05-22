/**
 * /api/admin/liveChat/ChatRoom
 * -------------------------------------------------
 * Handles all ChatRoom actions for admins:
 *  - POST    → send a new message as admin
 *  - PUT     → edit an existing message
 *  - DELETE  → delete a message
 *  - GET     → get all messages + conversation data (optional)
 *
 * All requests require:
 *   - conversation_id: string (query or body)
 * For PUT/DELETE:
 *   - message_id: string
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1️⃣ GET - Fetch conversation + all messages (optional for SSR, not sockets)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const conversation_id = searchParams.get('conversation_id');
  const adminUserId = request.headers.get('x-user-id');
  if (!conversation_id) {
    return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 });
  }

  try {
    const conversation = await prisma.liveChatConversation.findUnique({
      where: { conversation_id },
      select: {
        conversation_id: true,
        subject: true,
        user: { select: { user_id: true, name: true, email: true, username: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            message_id: true,
            conversation_id: true,
            user_id: true,
            sender_is_admin: true,
            message: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });
    if (!conversation)
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    return NextResponse.json(conversation);
  } catch (err) {
    console.error('❌ ChatRoom GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2️⃣ POST - Send a new message (admin)
export async function POST(request) {
  const { conversation_id, message } = await request.json();
  const adminUserId = request.headers.get('x-user-id');

  if (!conversation_id || !message || !admin_user_id) {
    return NextResponse.json(
      { error: 'conversation_id, message, and admin_user_id are required' },
      { status: 400 }
    );
  }

  try {
    // Find conversation recipient
    const convo = await prisma.liveChatConversation.findUnique({
      where: { conversation_id },
      select: { user_id: true }
    });
    if (!convo) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    // Create message
    const saved = await prisma.liveChatMessage.create({
      data: {
        conversation_id,
        user_id: convo.user_id, // recipient
        sender_is_admin: true,
        message: message.trim(),
        status: 'sent'
      },
      select: {
        message_id: true,
        conversation_id: true,
        user_id: true,
        sender_is_admin: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    console.error('❌ ChatRoom POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3️⃣ PUT - Edit message
export async function PUT(request) {
  const { message_id, message } = await request.json();
  const adminUserId = request.headers.get('x-user-id');
  if (!message_id || !message || !adminUserId) {
    return NextResponse.json(
      { error: 'message_id, message, and admin_user_id are required' },
      { status: 400 }
    );
  }

  try {
    // Ensure admin is editing (optional: check in prod)
    const orig = await prisma.liveChatMessage.findUnique({
      where: { message_id },
      select: { sender_is_admin: true }
    });
    if (!orig) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    if (!orig.sender_is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updated = await prisma.liveChatMessage.update({
      where: { message_id },
      data: {
        message: message.trim(),
        status: 'edited',
        updatedAt: new Date()
      },
      select: {
        message_id: true,
        conversation_id: true,
        user_id: true,

        sender_is_admin: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('❌ ChatRoom PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4️⃣ DELETE - Delete message
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const message_id = searchParams.get('message_id');
  const admin_user_id = searchParams.get('admin_user_id'); // Or pass as header/body

  if (!message_id || !admin_user_id) {
    return NextResponse.json({ error: 'message_id and admin_user_id required' }, { status: 400 });
  }

  try {
    // Ensure admin is deleting (optional: check in prod)
    const orig = await prisma.liveChatMessage.findUnique({
      where: { message_id },
      select: { sender_is_admin: true }
    });
    if (!orig) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    if (!orig.sender_is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.liveChatMessage.update({
      where: { message_id },
      data: { status: 'deleted', updatedAt: new Date() }
    });

    return NextResponse.json({ success: true, deleted: message_id });
  } catch (err) {
    console.error('❌ ChatRoom DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
