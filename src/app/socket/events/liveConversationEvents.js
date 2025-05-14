// 📁 src/server/events/liveConversationEvents.js

export default function registerLiveConversationEvents(io, socket, prisma) {
  // REST will handle listing conversations. This file handles only real-time actions.
  console.log('⚠️ REST API now handles fetching and listing conversations.');
  /* socket.on('fetch_initial_data', async ({ page = 1, limit = 5 } = {}) => {
    console.log('[LiveConv] fetch_initial_data received', {
      page,
      limit,
      user: socket.userData,
    });

    try {
      const userId = socket.userData.user_id;

      // 1) total count
      const totalCount = await prisma.liveChatConversation.count({
        where: { user_id: userId },
      });

      // 2) page of convos
      const convos = await prisma.liveChatConversation.findMany({
        where: { user_id: userId },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          conversation_id: true,
          subject: true,
          read: true,
          updatedAt: true,
        },
      });

      // 3) unread counts
      const unreadGroups = await prisma.liveChatMessage.groupBy({
        by: ['conversation_id'],
        where: {
          conversation: { user_id: userId },
          sender_is_admin: true,
          status: { not: 'read' },
        },
        _count: { _all: true },
      });
      const unreadMap = Object.fromEntries(
        unreadGroups.map((g) => [g.conversation_id, g._count._all]),
      );

      // 4) attach and compute pages
      const conversations = convos.map((c) => ({
        ...c,
        unread_message_count: unreadMap[c.conversation_id] || 0,
      }));
      const totalPages = Math.max(1, Math.ceil(totalCount / limit));

      // 5) send it back
      socket.emit('initial_data', { conversations, totalPages });
      console.log('[LiveConv] initial_data sent', {
        totalPages,
        count: conversations.length,
      });
    } catch (err) {
      console.error('❌ fetch_initial_data failed', err);
      // you could emit an error here if you want
    }
  }); */
}
