-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "PreferredContactWay" AS ENUM ('email', 'whatsapp', 'telegram', 'website');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'read', 'deleted', 'edited');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'expired', 'canceled', 'pending', 'disabled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('waiting', 'confirming', 'confirmed', 'finished', 'failed', 'expired', 'refunded');

-- CreateEnum
CREATE TYPE "FreeTrialStatus" AS ENUM ('active', 'disabled', 'pending');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('subscription', 'payment', 'freeTrial', 'bubbleChatMessage', 'liveChatMessage', 'newUserRegistration');

-- CreateTable
CREATE TABLE "User" (
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "whatsapp" TEXT,
    "telegram" TEXT,
    "preferredContactWay" "PreferredContactWay" NOT NULL DEFAULT 'email',
    "sendEmails" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "LiveChatConversation" (
    "conversation_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "subject" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveChatConversation_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "LiveChatMessage" (
    "message_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID,
    "guest_id" TEXT,
    "sender_is_admin" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'sent',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveChatMessage_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "BubbleChatConversation" (
    "conversation_id" UUID NOT NULL,
    "owner_id" UUID,
    "subject" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BubbleChatConversation_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "BubbleChatMessage" (
    "message_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID,
    "guest_id" TEXT,
    "sender_is_admin" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'sent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(6),

    CONSTRAINT "BubbleChatMessage_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "subscription_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" TEXT,
    "subscription_username" TEXT,
    "subscription_password" TEXT,
    "subscription_url" TEXT,
    "subscription_other" TEXT,
    "additional_info" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'pending',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subscription_id" UUID,
    "payment_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "status" "PaymentStatus" NOT NULL,
    "currency" TEXT,
    "amount_paid" DOUBLE PRECISION,
    "amount_received" DOUBLE PRECISION,
    "pay_currency" TEXT,
    "pay_address" TEXT,
    "network" TEXT,
    "received_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreeTrial" (
    "trial_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "free_trial_username" TEXT,
    "free_trial_password" TEXT,
    "free_trial_url" TEXT,
    "free_trial_other" TEXT,
    "additional_info" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "FreeTrialStatus" NOT NULL DEFAULT 'disabled',
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeTrial_pkey" PRIMARY KEY ("trial_id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notification_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "type" "NotificationType" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "LiveChatConversation_user_id_idx" ON "LiveChatConversation"("owner_id");

-- CreateIndex
CREATE INDEX "LiveChatMessage_conversation_id_idx" ON "LiveChatMessage"("conversation_id");

-- CreateIndex
CREATE INDEX "LiveChatMessage_status_idx" ON "LiveChatMessage"("status");

-- CreateIndex
CREATE INDEX "LiveChatMessage_user_id_idx" ON "LiveChatMessage"("sender_id");

-- CreateIndex
CREATE INDEX "BubbleChatConversation_user_id_idx" ON "BubbleChatConversation"("owner_id");

-- CreateIndex
CREATE INDEX "BubbleChatMessage_conversation_id_idx" ON "BubbleChatMessage"("conversation_id");

-- CreateIndex
CREATE INDEX "BubbleChatMessage_user_id_idx" ON "BubbleChatMessage"("sender_id");

-- CreateIndex
CREATE INDEX "Subscription_user_id_idx" ON "Subscription"("user_id");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_invoice_id_key" ON "SubscriptionPayment"("invoice_id");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_payment_id_idx" ON "SubscriptionPayment"("payment_id");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_user_id_idx" ON "SubscriptionPayment"("user_id");

-- CreateIndex
CREATE INDEX "FreeTrial_user_id_idx" ON "FreeTrial"("user_id");

-- CreateIndex
CREATE INDEX "FreeTrial_status_idx" ON "FreeTrial"("status");

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- AddForeignKey
ALTER TABLE "LiveChatConversation" ADD CONSTRAINT "LiveChatConversation_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveChatMessage" ADD CONSTRAINT "LiveChatMessage_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "LiveChatConversation"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveChatMessage" ADD CONSTRAINT "LiveChatMessage_user_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BubbleChatConversation" ADD CONSTRAINT "BubbleChatConversation_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BubbleChatMessage" ADD CONSTRAINT "BubbleChatMessage_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "BubbleChatConversation"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BubbleChatMessage" ADD CONSTRAINT "BubbleChatMessage_user_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("subscription_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreeTrial" ADD CONSTRAINT "FreeTrial_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
