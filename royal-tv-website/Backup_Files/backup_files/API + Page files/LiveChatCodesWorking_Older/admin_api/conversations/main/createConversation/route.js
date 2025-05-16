'use server';

import { NextResponse } from 'next/server';
import prisma from '@lib/prisma';

export async function POST(req) {
  try {
    const { subject, message, user_id } = await req.json();

    if (!subject || !message || !user_id) {
      return NextResponse.json(
        { error: 'Subject, message, and user_id are required' },
        { status: 400 },
      );
    }

    const newConversation = await prisma.supportConversation.create({
      data: {
        subject,
        user_id,
        messages: {
          create: {
            message,
            sender_is_admin: true,
            status: 'sent',
            is_original: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        conversation_id: newConversation.conversation_id,
        message: 'Conversation created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('API Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation', details: error.message },
      { status: 500 },
    );
  }
}
