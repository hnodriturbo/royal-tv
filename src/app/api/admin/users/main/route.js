import { NextResponse } from 'next/server';
import prisma from '@/lib/core/prisma';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRole('admin', async () => {
  try {
    // Base user data + latest freeTrial/subscription + counts
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        user_id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        whatsapp: true,
        telegram: true,
        preferredContactWay: true,
        createdAt: true,
        freeTrials: { orderBy: { createdAt: 'desc' }, take: 1 },
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { subscriptions: true, freeTrials: true } }
      }
    });

    // Per-user LC counts
    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        const [totalLiveChats, unreadLiveChats] = await Promise.all([
          prisma.liveChatConversation.count({ where: { owner_id: u.user_id } }),
          prisma.liveChatConversation.count({ where: { owner_id: u.user_id, read: false } })
        ]);

        return {
          ...u,
          totalLiveChats,
          unreadLiveChats,
          totalSubscriptions: u._count.subscriptions,
          totalFreeTrials: u._count.freeTrials
        };
      })
    );

    return NextResponse.json({ users: usersWithCounts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
