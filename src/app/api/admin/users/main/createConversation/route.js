'use server';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const admin_user_id = req.headers.get('User-ID'); // ✅ Admin user ID from headers
    const { subject, message, recipient_user_id } = await req.json();

    // ✅ Validate explicitly required fields
    if (!admin_user_id || !recipient_user_id || !subject || !message) {
      return NextResponse.json(
        {
          error:
            'All fields (admin_user_id, recipient_user_id, subject, message) are required.',
        },
        { status: 400 },
      );
    }

    // ✅ Create the conversation explicitly (linking to the user directly)
    const conversation = await prisma.supportConversation.create({
      data: {
        subject,
        user: {
          connect: { user_id: recipient_user_id }, // ✅ Explicitly connect recipient user
        },
      },
    });

    // ✅ Create the initial message in the new conversation explicitly
    await prisma.message.create({
      data: {
        conversation: {
          connect: { conversation_id: conversation.conversation_id }, // ✅ Connect to conversation explicitly
        },
        user: {
          connect: { user_id: admin_user_id }, // ✅ Connect the admin explicitly as the sender
        },
        sender_is_admin: true, // ✅ Mark explicitly as admin-sent
        message,
        is_original: true, // ✅ Explicitly mark as the original message
      },
    });

    // ✅ Return newly created conversation ID explicitly for frontend redirection
    return NextResponse.json({ conversation_id: conversation.conversation_id });
  } catch (error) {
    console.error('❌ API Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to create conversation', details: error.message },
      { status: 500 },
    );
  }
}
