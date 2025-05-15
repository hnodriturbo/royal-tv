'use server';

import { NextResponse } from 'next/server';
import prisma from '@lib/prisma';

export async function GET(req, { params }) {
  const { user_id } = await params;

  console.log('✅ Fetching conversations for user:', user_id); // Debugging

  try {
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required in params' },
        { status: 400 },
      );
    }
    // Fetch the entire user record (adjust fields as needed)
    const userDetails = await prisma.user.findUnique({
      where: { user_id },
    });

    const conversations = await prisma.supportConversation.findMany({
      where: { user_id },
      select: {
        conversation_id: true,
        subject: true,
        updatedAt: true,
        messages: {
          select: {
            readAt: true,
            sender_is_admin: true,
            updatedAt: true,
          },
        },
      },
    });

    console.log('✅ Found Conversations:', conversations); // Debugging

    const sortedConversations = conversations
      .map((conv) => {
        const unreadCount = conv.messages.filter(
          (msg) => !msg.readAt && !msg.sender_is_admin,
        ).length;

        return {
          ...conv,
          unreadCount,
        };
      })
      .sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });

    return NextResponse.json({
      conversations: sortedConversations,
      userDetails,
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user conversations', details: error.message },
      { status: 500 },
    );
  }
}
