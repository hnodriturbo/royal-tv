/**
 *   ================== adminNotificationsTest.js ==================
 * 👑
 * DEV ROUTE – TEST ADMIN NOTIFICATIONS
 * - Triggers every admin notification type with complete dummy data.
 * - Uses process.env.ADMIN_USER_ID for admin user id
 * =====================================================================
 */

import { adminNotificationBuilder } from '@/constants/notificationSystem';

// Dummy user info
/* const dummyUser = {
  user_id: 'user-abc-123',
  name: 'John Demo',
  email: 'demo@royal-tv.tv',
  preferredContactWay: 'email',
  whatsapp: '+3541234567',
  telegram: '@johndemo',
  createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-05T12:00:00Z').toISOString()
}; */

// Dummy free trial info (all fields from latest templates)
const dummyFreeTrial = {
  freeTrial_id: 'trial-789',
  status: 'active',
  createdAt: new Date('2024-01-10T08:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-10T09:00:00Z').toISOString(),
  activatedAt: new Date('2024-01-10T09:10:00Z').toISOString(),
  expiryDate: new Date('2024-01-11T09:10:00Z').toISOString(),
  trial_code: 'TRIAL2024',
  additional_info: 'Extra device: Samsung TV',
  admin_note: 'Approved for 24h trial'
};

// Dummy subscription info (all fields from latest templates)
const dummySubscription = {
  subscription_id: 'sub-111',
  plan_name: 'Premium',
  order_id: 'ORD222',
  status: 'active',
  createdAt: new Date('2024-01-11T13:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-11T13:15:00Z').toISOString(),
  activatedAt: new Date('2024-01-11T13:16:00Z').toISOString(),
  expiryDate: new Date('2024-02-11T13:16:00Z').toISOString()
};

const dummyPayment = {
  payment_id: 'pay-999',
  amount: '14.99',
  currency: 'USD',
  order_id: 'ORD222',
  subscription_id: 'sub-111',
  status: 'completed'
};

const dummyChatMessage = {
  message_id: 'msg-333',
  senderName: 'Support Bot',
  createdAt: new Date('2024-01-11T14:00:00Z').toISOString(),
  text: 'Hello, your trial is active!'
};

const dummyConversation = {
  conversation_id: 'conv-555'
};

export async function POST(request) {
  const { type } = await request.json();

  let notification;
  switch (type) {
    case 'newUserRegistration':
      notification = adminNotificationBuilder.newUserRegistration(dummyUser);
      break;
    case 'freeTrialRequested':
      notification = adminNotificationBuilder.freeTrialRequested(dummyFreeTrial, dummyUser);
      break;
    case 'freeTrialActivated':
      notification = adminNotificationBuilder.freeTrialActivated(dummyFreeTrial, dummyUser);
      break;
    case 'subscriptionCreated':
      notification = adminNotificationBuilder.subscriptionCreated(dummySubscription, dummyUser);
      break;
    case 'subscriptionActivated':
      notification = adminNotificationBuilder.subscriptionActivated(dummySubscription, dummyUser);
      break;
    case 'paymentReceived':
      notification = adminNotificationBuilder.paymentReceived(dummyPayment, dummyUser);
      break;
    case 'liveChatMessage':
      notification = adminNotificationBuilder.liveChatMessage(
        dummyChatMessage,
        dummyConversation,
        dummyUser
      );
      break;
    case 'bubbleChatMessage':
      notification = adminNotificationBuilder.bubbleChatMessage(
        dummyChatMessage,
        dummyConversation,
        dummyUser
      );
      break;
    default:
      return new Response(JSON.stringify({ error: 'Invalid notification type' }), { status: 400 });
  }

  const actingAdminId = process.env.ADMIN_USER_ID;

  return Response.json({
    ok: true,
    type,
    actingAdminId,
    notification
  });
}
