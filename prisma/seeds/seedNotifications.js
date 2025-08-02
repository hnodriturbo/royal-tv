/**
 * ========== seedNotifications.js ==========
 * 🔔 Royal TV – Real Data Notification Seeder
 * - Seeds notifications for both user and admin.
 * - Admin gets a notification for every user event found.
 * - Uses sender_is_admin for routing chat message notifications!
 * - 🚫 BubbleChat notifications removed!
 * ==========================================
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { userNotificationBuilder, adminNotificationBuilder } from './notificationSystem.js';

const adminUserId = 'd630e143-cf4c-499c-a3f0-d4b4ddc7768c'; // 👑 Use your real admin user id
const freeTrialAndSubUserIds = [
  '83a42c6e-dc79-4615-89af-d50032f7a250', // user_1
  '308f62cd-ef64-4ab7-8215-0d78a14e2cd9', // user_2
  '8f9db3dd-7983-466e-9d38-b949c56e412d', // user_3
  'be1983f2-04e3-48f9-9145-028ecbdb647e', // user_4
  'd655cdab-559a-4be4-a7b8-858bec23b490' // user_5
];

async function main() {
  for (const user_id of freeTrialAndSubUserIds) {
    // 1️⃣ Fetch user
    const user = await prisma.user.findUnique({ where: { user_id } });
    if (!user) continue;

    // 2️⃣ Fetch ALL FreeTrials, Subscriptions, Payments for the user
    const freeTrials = await prisma.freeTrial.findMany({
      where: { user_id },
      orderBy: { createdAt: 'asc' }
    });
    const subscriptions = await prisma.subscription.findMany({
      where: { user_id },
      orderBy: { createdAt: 'asc' }
    });
    const payments = await prisma.subscriptionPayment.findMany({
      where: { user_id },
      orderBy: { createdAt: 'asc' }
    });

    // 3️⃣ Fetch latest LiveChatConversation and all its messages
    const liveChatConversation = await prisma.liveChatConversation.findFirst({
      where: { owner_id: user_id },
      orderBy: { createdAt: 'desc' }
    });
    const liveChatMessages = liveChatConversation
      ? await prisma.liveChatMessage.findMany({
          where: { conversation_id: liveChatConversation.conversation_id },
          orderBy: { createdAt: 'asc' }
          // sender_is_admin comes by default
        })
      : [];

    // ========== NOTIFICATIONS FOR USER & ADMIN ==========

    // 👤 USER registration notification
    const regNotifUser = userNotificationBuilder.newUserRegistration(user);
    const regNotifAdmin = adminNotificationBuilder.newUserRegistration(user);

    await prisma.notification.create({
      data: {
        user_id,
        title: regNotifUser.title,
        body: regNotifUser.body,
        link: regNotifUser.link || null,
        type: regNotifUser.type,
        is_read: false
      }
    });
    await prisma.notification.create({
      data: {
        user_id: adminUserId,
        title: regNotifAdmin.title,
        body: regNotifAdmin.body,
        link: regNotifAdmin.link || null,
        type: regNotifAdmin.type,
        is_read: false
      }
    });

    // 📝 FREE TRIALS (all rows, status aware)
    for (const ft of freeTrials) {
      // 📨 User always gets "requested"
      const notifUserReq = userNotificationBuilder.freeTrialRequested(ft, user);
      await prisma.notification.create({
        data: {
          user_id,
          title: notifUserReq.title,
          body: notifUserReq.body,
          link: notifUserReq.link || null,
          type: notifUserReq.type,
          is_read: false
        }
      });

      // 📨 Admin always gets "requested"
      const notifAdminReq = adminNotificationBuilder.freeTrialRequested(ft, user);
      await prisma.notification.create({
        data: {
          user_id: adminUserId,
          title: notifAdminReq.title,
          body: notifAdminReq.body,
          link: notifAdminReq.link || null,
          type: notifAdminReq.type,
          is_read: false
        }
      });

      // ✅ If active, add "activated"
      if (ft.status === 'active') {
        const notifUserAct = userNotificationBuilder.freeTrialActivated(ft, user);
        await prisma.notification.create({
          data: {
            user_id,
            title: notifUserAct.title,
            body: notifUserAct.body,
            link: notifUserAct.link || null,
            type: notifUserAct.type,
            is_read: false
          }
        });
        const notifAdminAct = adminNotificationBuilder.freeTrialActivated(ft, user);
        await prisma.notification.create({
          data: {
            user_id: adminUserId,
            title: notifAdminAct.title,
            body: notifAdminAct.body,
            link: notifAdminAct.link || null,
            type: notifAdminAct.type,
            is_read: false
          }
        });
      }
    }

    // 💳 SUBSCRIPTIONS (all rows, status aware)
    for (const sub of subscriptions) {
      // User: always gets "created"
      const notifUserSub = userNotificationBuilder.subscriptionCreated(sub, user);
      await prisma.notification.create({
        data: {
          user_id,
          title: notifUserSub.title,
          body: notifUserSub.body,
          link: notifUserSub.link || null,
          type: notifUserSub.type,
          is_read: false
        }
      });
      // Admin: always gets "created"
      const notifAdminSub = adminNotificationBuilder.subscriptionCreated(sub, user);
      await prisma.notification.create({
        data: {
          user_id: adminUserId,
          title: notifAdminSub.title,
          body: notifAdminSub.body,
          link: notifAdminSub.link || null,
          type: notifAdminSub.type,
          is_read: false
        }
      });

      // If active, add "activated"
      if (sub.status === 'active') {
        const notifUserSubA = userNotificationBuilder.subscriptionActivated(sub, user);
        await prisma.notification.create({
          data: {
            user_id,
            title: notifUserSubA.title,
            body: notifUserSubA.body,
            link: notifUserSubA.link || null,
            type: notifUserSubA.type,
            is_read: false
          }
        });
        const notifAdminSubA = adminNotificationBuilder.subscriptionActivated(sub, user);
        await prisma.notification.create({
          data: {
            user_id: adminUserId,
            title: notifAdminSubA.title,
            body: notifAdminSubA.body,
            link: notifAdminSubA.link || null,
            type: notifAdminSubA.type,
            is_read: false
          }
        });
      }
    }

    // 💰 PAYMENTS (all)
    for (const pay of payments) {
      const notifUserPay = userNotificationBuilder.paymentReceived(pay, user);
      await prisma.notification.create({
        data: {
          user_id,
          title: notifUserPay.title,
          body: notifUserPay.body,
          link: notifUserPay.link || null,
          type: notifUserPay.type,
          is_read: false
        }
      });
      const notifAdminPay = adminNotificationBuilder.paymentReceived(pay, user);
      await prisma.notification.create({
        data: {
          user_id: adminUserId,
          title: notifAdminPay.title,
          body: notifAdminPay.body,
          link: notifAdminPay.link || null,
          type: notifAdminPay.type,
          is_read: false
        }
      });
    }

    // 💬 LIVE CHAT MESSAGES (all, notify correct recipient)
    for (const msg of liveChatMessages) {
      // 🧑‍💼 Message from admin → Notify USER
      if (msg.sender_is_admin) {
        const notifUserLive = userNotificationBuilder.liveChatMessage(
          msg,
          liveChatConversation,
          user
        );
        if (notifUserLive) {
          await prisma.notification.create({
            data: {
              user_id,
              title: notifUserLive.title,
              body: notifUserLive.body,
              link: notifUserLive.link || null,
              type: notifUserLive.type,
              is_read: false
            }
          });
        }
      } else {
        // 🙋‍♂️ Message from user → Notify ADMIN
        const notifAdminLive = adminNotificationBuilder.liveChatMessage(
          msg,
          liveChatConversation,
          user
        );
        if (notifAdminLive) {
          await prisma.notification.create({
            data: {
              user_id: adminUserId,
              title: notifAdminLive.title,
              body: notifAdminLive.body,
              link: notifAdminLive.link || null,
              type: notifAdminLive.type,
              is_read: false
            }
          });
        }
      }
    }

    // 🚫 BubbleChat notifications removed!
  }

  console.log(
    '✅ All notifications seeded using *real* data (admin only gets notified on user chat messages, and vice versa)!'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
