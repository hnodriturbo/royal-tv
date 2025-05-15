'use server';

import { NextResponse } from 'next/server';
import prisma from '@lib/prisma';

export async function GET(req, { params }) {
  const { conversation_id } = await params;

  try {
    // ✅ Fetch conversation details along with its messages
    const conversation = await prisma.supportConversation.findUnique({
      where: { conversation_id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }, // ✅ Ensure messages are sorted
        },
        user: {
          select: { user_id: true, name: true, email: true, username: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      conversation_id: conversation.conversation_id,
      subject: conversation.subject, // ✅ Fetch subject from Conversation
      user: conversation.user,
      messages: conversation.messages || [], // ✅ Ensure messages is always an array
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 },
    );
  }
}

export async function POST(req, { params }) {
  try {
    const { conversation_id } = params;
    const user_id = req.headers.get('User-ID'); // ✅ Get user ID from headers
    const { message } = await req.json(); // ✅ Get the message from request body

    if (!user_id || !message) {
      return NextResponse.json(
        { error: 'User ID and message are required' },
        { status: 400 },
      );
    }

    // ✅ Check if conversation exists
    const conversation = await prisma.supportConversation.findUnique({
      where: { conversation_id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 },
      );
    }

    // ✅ Create a new message
    await prisma.message.create({
      data: {
        conversation_id,
        user_id,
        message,
        sender_is_admin: false, // ✅ Ensure it's a user message
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: error.message },
      { status: 500 },
    );
  }
}
