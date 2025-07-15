/**
 *   ================== createSampleNotifications/route.js ==================
 * 🌈
 * DEV ROUTE – GENERATE ALL USER + ADMIN NOTIFICATIONS (SAMPLE DATA)
 * - POST returns an object with every possible notification prebuilt for testing.
 * =====================================================================
 */
import { NextResponse } from 'next/server'; // 🦄 Next.js API Response
import prisma from '@/lib/prisma';
import { userNotificationBuilder, adminNotificationBuilder } from '@/constants/notificationSystem';

// ===================== 🧑 Dummy User (all fields used in mapping) =====================
/* const dummyUser = {
  user_id: 'user-abc-123',
  username: 'johndemo',
  name: 'John Demo',
  email: 'demo@royal-tv.tv',
  preferredContactWay: 'email',
  whatsapp: '+3541234567',
  telegram: '@johndemo',
  createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-05T12:00:00Z').toISOString()
};
 */
// ================== 🎁 Dummy Free Trial (full fields used by templates) ==================
const dummyFreeTrial = {
  freeTrial_id: 'trial-789',
  status: 'active', // "pending", "active", etc.
  createdAt: new Date('2024-01-10T08:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-10T09:00:00Z').toISOString(),
  activatedAt: new Date('2024-01-10T09:10:00Z').toISOString(),
  expiryDate: new Date('2024-01-11T09:10:00Z').toISOString(),
  trial_code: 'TRIAL2024',
  additional_info: 'Extra device: Samsung TV',
  admin_note: 'Approved for 24h trial'
  // User fields merged by mappers!
};

// ================== 🟢 Dummy Subscription (all fields used by templates) ==================
const dummySubscription = {
  subscription_id: 'sub-111',
  plan_name: 'Premium',
  order_id: 'ORD222',
  status: 'active', // "pending", "active"
  createdAt: new Date('2024-01-11T13:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-11T13:15:00Z').toISOString(),
  activatedAt: new Date('2024-01-11T13:16:00Z').toISOString(),
  expiryDate: new Date('2024-02-11T13:16:00Z').toISOString()
  // User fields merged by mappers!
};

// ================== 💸 Dummy Payment (all fields used by templates) ==================
const dummyPayment = {
  payment_id: 'pay-999',
  amount: '14.99',
  currency: 'USD',
  order_id: 'ORD222',
  subscription_id: 'sub-111',
  status: 'completed'
  // User fields merged by mappers!
};

// ================== 💬 Dummy Chat Message (all fields used by templates) ==================
const dummyChatMessage = {
  message_id: 'msg-333',
  conversation_id: 'conv-555',
  senderName: 'Support Bot',
  createdAt: new Date('2024-01-11T14:00:00Z').toISOString()
  // User fields merged by mappers!
  // You can add text/content if you want but templates don’t display it
};

// ================== 🗨️ Dummy Conversation (min required for mapping) ==================
const dummyConversation = {
  conversation_id: 'conv-555'
  // If you want to test conversation-based templates, add more fields as needed
};

// ======================= 🛠️ POST Handler – Generate All Notifications =======================
export async function POST(request) {
  // 🟢 Get the logged-in user_id from header (or session fallback if needed)
  const user_id = request.headers.get('x-user-id');
  if (!user_id) {
    return NextResponse.json({ ok: false, error: 'Missing x-user-id header' }, { status: 400 });
  }

  // 🟣 ADMIN USER_ID from env
  const admin_id = process.env.ADMIN_USER_ID;
  if (!admin_id) {
    return NextResponse.json({ ok: false, error: 'Missing ADMIN_USER_ID in env' }, { status: 500 });
  }

  // 🏗️ Build all user/admin notification objects
  const userNotifications = Object.values({
    newUserRegistration: userNotificationBuilder.newUserRegistration(dummyUser),
    freeTrialRequested: userNotificationBuilder.freeTrialRequested(dummyFreeTrial, dummyUser),
    freeTrialActivated: userNotificationBuilder.freeTrialActivated(dummyFreeTrial, dummyUser),
    subscriptionCreated: userNotificationBuilder.subscriptionCreated(dummySubscription, dummyUser),
    subscriptionActivated: userNotificationBuilder.subscriptionActivated(
      dummySubscription,
      dummyUser
    ),
    paymentReceived: userNotificationBuilder.paymentReceived(dummyPayment, dummyUser),
    liveChatMessage: userNotificationBuilder.liveChatMessage(
      dummyChatMessage,
      dummyConversation,
      dummyUser
    ),
    bubbleChatMessage: userNotificationBuilder.bubbleChatMessage(
      dummyChatMessage,
      dummyConversation,
      dummyUser
    )
  });

  const adminNotifications = Object.values({
    newUserRegistration: adminNotificationBuilder.newUserRegistration(dummyUser),
    freeTrialRequested: adminNotificationBuilder.freeTrialRequested(dummyFreeTrial, dummyUser),
    freeTrialActivated: adminNotificationBuilder.freeTrialActivated(dummyFreeTrial, dummyUser),
    subscriptionCreated: adminNotificationBuilder.subscriptionCreated(dummySubscription, dummyUser),
    subscriptionActivated: adminNotificationBuilder.subscriptionActivated(
      dummySubscription,
      dummyUser
    ),
    paymentReceived: adminNotificationBuilder.paymentReceived(dummyPayment, dummyUser),
    liveChatMessage: adminNotificationBuilder.liveChatMessage(
      dummyChatMessage,
      dummyConversation,
      dummyUser
    ),
    bubbleChatMessage: adminNotificationBuilder.bubbleChatMessage(
      dummyChatMessage,
      dummyConversation,
      dummyUser
    )
  });

  // 🗄️ Insert all notifications (user & admin) into the Notification table
  const created = [];

  // 👤 Insert user notifications
  for (const notif of userNotifications) {
    created.push(
      await prisma.notification.create({
        data: {
          /* notification_id: uuidv4(),  */ // Always unique for test!
          user_id: user_id, // You can set a different user for admin if needed
          title: notif.title,
          body: notif.body,
          link: notif.link,
          type: notif.type,
          is_read: false
        }
      })
    );
  }
  const adminId = process.env.ADMIN_USER_ID;
  // 👑 Insert admin notifications
  for (const notif of adminNotifications) {
    created.push(
      await prisma.notification.create({
        data: {
          user_id: admin_id, // or use an admin user id if you want!
          title: notif.title,
          body: notif.body,
          link: notif.link,
          type: notif.type,
          is_read: false
        }
      })
    );
  }

  return NextResponse.json({
    ok: true,
    createdCount: created.length,
    notifications: created
  });
}
