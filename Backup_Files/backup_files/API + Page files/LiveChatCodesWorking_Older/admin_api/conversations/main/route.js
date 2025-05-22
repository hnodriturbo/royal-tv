'use server';

import { NextResponse } from 'next/server';
import prisma from '@lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const skip = (page - 1) * limit;

    // ✅ Fetch users with at least one support conversation
    const usersWithConversations = await prisma.user.findMany({
      where: {
        supportConversations: { some: {} },
      },
      skip,
      take: limit,
      select: {
        user_id: true,
        name: true,
        username: true,
        email: true,
        _count: {
          select: { supportConversations: true },
        },
        supportConversations: {
          select: {
            conversation_id: true,
            updatedAt: true,
            messages: {
              select: {
                readAt: true,
                sender_is_admin: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    const users = usersWithConversations.map((user) => {
      const conversations = user.supportConversations;

      const unreadConvoCount = conversations.filter((conv) =>
        conv.messages.some((msg) => !msg.readAt && !msg.sender_is_admin),
      ).length;

      const lastMessage = conversations[0]?.updatedAt || null;

      return {
        conversation_id: user.conversation_id,
        user_id: user.user_id,
        username: user.username,
        name: user.name,
        email: user.email,
        conversationCount: user._count.supportConversations,
        lastMessage,
        unreadConvoCount,
      };
    });

    // ✅ Count total users with at least one conversation for pagination
    const totalUsers = await prisma.user.count({
      where: {
        supportConversations: { some: {} },
      },
    });

    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({ users, totalPages });
  } catch (error) {
    console.error('❌ Error fetching user conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user conversations' },
      { status: 500 },
    );
  }
}
