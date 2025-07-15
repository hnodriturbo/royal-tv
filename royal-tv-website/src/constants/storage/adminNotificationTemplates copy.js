/**
 *   =================== adminNotificationTemplates.js ===================
 * 🛡️
 * ADMIN-SIDE NOTIFICATION TEMPLATES
 * - Flat object, each key is a NotificationType.
 * - All bodies use {tokens} for runtime interpolation.
 * =======================================================================
 */

import { NotificationType } from './storage/notificationTypes';

// ======================= ADMIN SIDE (STATIC) ===========================
export const adminNotificationTemplates = {
  [NotificationType.NEW_USER_REGISTRATION]: {
    title: '👤 New User Registered',
    body: `{name} ({email}) just signed up.

Preferred contact: {preferredContactWay}
{whatsapp?WhatsApp: {whatsapp}\n:}{telegram?Telegram: {telegram}\n:}`, // optional fields shown below!
    link: '/admin/users/{user_id}' // admin user profile
  },

  [NotificationType.FREE_TRIAL_REQUEST]: {
    title: '🎁 Free Trial Request',
    body: `User {name} ({email}) requested a free trial.
Click to review their account and approve or deny their trial.`,
    link: '/admin/freeTrials/{freeTrial_id}'
  },

  [NotificationType.SUBSCRIPTION]: {
    title: '🟢 Subscription Activated',
    body: `User {name} has activated a subscription.
Plan: {plan}
Subscription ID: {subscription_id}`,
    link: '/admin/subscriptions/{subscription_id}'
  },

  [NotificationType.PAYMENT]: {
    title: '💸 Payment Received',
    body: `A payment was received from {name} ({email}).
Amount: {amount} {currency}
Payment ID: {payment_id}`,
    link: '/admin/subscriptions/{subscription_id}/payment'
  },

  [NotificationType.LIVE_CHAT_MESSAGE]: {
    title: '💬 New Live Chat Message',
    body: `New live chat message from {senderName} in conversation {conversation_id}.
Click to reply or monitor the chat.`,
    link: '/admin/liveChat/{conversation_id}'
  },

  [NotificationType.BUBBLE_CHAT_MESSAGE]: {
    title: '💬 New Bubble Chat Message',
    body: `New bubble chat message from {senderName} in conversation {conversation_id}.
Click to view or reply.`,
    link: '/admin/bubbleChat/{conversation_id}'
  }
};

export default adminNotificationTemplates;
