/**
 * GET /api/admin/users/main
 * =========================================
 * Returns all users with live/bubble chat counts (and unread counts), and subscription count
 * - Requires: x-user-role: 'admin' header
 * =========================================
 */

import { NextResponse } from 'next/server'; // 📤
import prisma from '@/lib/core/prisma'; // 🗄️

export async function GET(request) {
  // 🔒 Admin check
  const userRole = request.headers.get('x-user-role')?.toLowerCase();
  if (userRole !== 'admin') {
    // 🚫 Not allowed – Only admins!
    return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
  }

  try {
    // 🗃️ Fetch all users, include all freeTrials/subscriptions arrays for latest status
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
        // All free trials for status display
        freeTrials: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Only the most recent
        },
        // All subscriptions for direct-link
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Only the most recent
        },
        // 🧮 Counts for relations
        _count: {
          select: {
            subscriptions: true,
            freeTrials: true
          }
        }
      }
    });

    // 🧮 For each user, fetch chat counts in parallel
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        // 🟣 LiveChatConversation counts
        const totalLiveChats = await prisma.liveChatConversation.count({
          where: { owner_id: user.user_id }
        });
        const unreadLiveChats = await prisma.liveChatConversation.count({
          where: { owner_id: user.user_id, read: false }
        });

        return {
          ...user,
          totalLiveChats, // 💬
          unreadLiveChats, // 🔴
          totalSubscriptions: user._count.subscriptions, // 📦
          totalFreeTrials: user._count.freeTrials // 🎁
        };
      })
    );

    // ✅ Done!
    return NextResponse.json({ users: usersWithCounts }, { status: 200 });
  } catch (error) {
    // 💥
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
