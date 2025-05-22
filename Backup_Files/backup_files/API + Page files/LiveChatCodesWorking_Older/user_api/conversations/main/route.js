'use server';

import { NextResponse } from 'next/server';
import prisma from '@lib/prisma';

export async function GET(req) {
  try {
    const user_id = req.headers.get('User-ID');
    console.log('✅ Received User-ID:', user_id); // Debugging

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }

    // ✅ Fetch all user conversations and their subjects
    const conversations = await prisma.supportConversation.findMany({
      where: { user_id },
      orderBy: { updatedAt: 'desc' },
      select: {
        conversation_id: true,
        subject: true, // ✅ Fetch subject directly from Conversation
        updatedAt: true,
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const user_id = req.headers.get('User-ID');
    const { subject, message } = await req.json(); // ✅ Get required fields

    if (!user_id || !subject || !message) {
      return NextResponse.json(
        { error: 'User ID, subject, and message are required' },
        { status: 400 },
      );
    }

    // ✅ Create a new conversation
    const conversation = await prisma.supportConversation.create({
      data: {
        user_id,
        subject, // ✅ Store subject in Conversation
      },
    });

    // ✅ Add the first message
    await prisma.supportMessage.create({
      data: {
        conversation_id: conversation.conversation_id,
        user_id,
        message,
        sender_is_admin: false, // ✅ Message is from user
      },
    });

    return NextResponse.json({ conversation_id: conversation.conversation_id });
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 },
    );
  }
}
