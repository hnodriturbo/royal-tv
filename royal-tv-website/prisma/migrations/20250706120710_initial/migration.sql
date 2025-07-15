/*
  Warnings:

  - The values [bubbleChatMessage] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `BubbleChatConversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BubbleChatMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('subscription', 'payment', 'freeTrial', 'liveChatMessage', 'newUserRegistration');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "BubbleChatConversation" DROP CONSTRAINT "BubbleChatConversation_user_id_fkey";

-- DropForeignKey
ALTER TABLE "BubbleChatMessage" DROP CONSTRAINT "BubbleChatMessage_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "BubbleChatMessage" DROP CONSTRAINT "BubbleChatMessage_user_id_fkey";

-- DropTable
DROP TABLE "BubbleChatConversation";

-- DropTable
DROP TABLE "BubbleChatMessage";
