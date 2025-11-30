/**
 * cleanupPublicChat.js
 * 🧹 Delete all public chat test data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up public chat data...');

  // Delete all messages first (foreign key constraint)
  const deletedMessages = await prisma.publicLiveChatMessage.deleteMany({});
  console.log(`✅ Deleted ${deletedMessages.count} messages`);

  // Delete all conversations
  const deletedConversations = await prisma.publicLiveChatConversation.deleteMany({});
  console.log(`✅ Deleted ${deletedConversations.count} conversations`);

  console.log('🎉 Cleanup complete!');
}

cleanup()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
