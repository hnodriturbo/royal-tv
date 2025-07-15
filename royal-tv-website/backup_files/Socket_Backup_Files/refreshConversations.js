/**
 *   ========== refreshConversations.js ==========
 * 🔁
 * Helper to fetch and emit the latest conversation state (with messages)
 * to everyone in the conversation room.
 * ==============================================
 */
import getChatModel from '../../src/server/getChatModel.js';
import prisma from '../../src/lib/prisma.js';

export default async function refreshConversation(io, chatType = 'live', conversation_id) {
  // 1️⃣ Pick correct Prisma model for chat type
  const { conversationModel } = getChatModel(chatType, prisma);

  // 2️⃣ Fetch conversation with owner + all messages (sorted)
  const conversation = await conversationModel.findUnique({
    where: { conversation_id },
    include: {
      owner: true, // includes all owner/user fields (relation)
      messages: {
        orderBy: { createdAt: 'asc' }
        // no select: will include ALL message fields
      }
    }
  });

  // 3️⃣ Emit update to all in this conversation room
  io.to(conversation_id).emit('conversation_updated', conversation);

  // 4️⃣ Debug log
  console.log(
    `🔁 [${chatType}] Emitted updated conversation for conversation_id: ${conversation_id}`
  );
}
