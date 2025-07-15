// 📂 src/server/socket/events/bubbleConversationEvents.js
/**
 * registerBubbleConversationEvents
 * --------------------------------
 * Handles bubble-chat conversation list requests for the connected socket.
 *
 * Events:
 *   • fetch_bubble_conversations  → client asks for paginated list
 *   • bubble_conversations_update → server responds with { convos, totalPages }
 *
 * Usage on client side:
 *   socket.emit('fetch_bubble_conversations', { page: 2, limit: 10 });
 *   socket.on('bubble_conversations_update', ({ convos, totalPages }) => { … });
 */

export default function registerBubbleConversationEvents(io, socket, prisma) {
  // 1️⃣ Listen for client-side request
  socket.on('fetch_bubble_conversations', async ({ page = 1, limit = 5 }) => {
    try {
      // 2️⃣ Identify current user
      const userId = socket.userData.user_id;

      // 3️⃣ Total conversation count (for pagination)
      const totalCount = await prisma.bubbleChatConversation.count({
        where: { user_id: userId },
      });

      // 4️⃣ Fetch one paginated slice
      const convos = await prisma.bubbleChatConversation.findMany({
        where: { user_id: userId },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      // 5️⃣ Compute total pages and emit back to client
      const totalPages = Math.ceil(totalCount / limit);
      socket.emit('bubble_conversations_update', { convos, totalPages });
    } catch (err) {
      // ⚠️ Log any unexpected errors for debugging
      console.error('❌ Bubble convos error:', err);
    }
  });
}
