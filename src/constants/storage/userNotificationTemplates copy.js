/**
 * =================== notificationTemplates.js ===================
 * 👤
 * All user-side notification titles & bodies for NotificationType.
 * - Every function returns { title, body } based on event data.
 * ================================================================
 */

import { NotificationType } from './notificationTypes';

// ======================= USER SIDE ==========================
export const UserNotificationTemplates = {
  [NotificationType.NEW_USER_REGISTRATION]: (data = {}) => ({
    title: '🎉 Welcome to Royal IPTV!',
    body: `Thank you for signing up for Royal IPTV! 🎊

To get started, please request your free 1-day trial by clicking the button below.
This will unlock full access so you can experience all our premium channels and features — totally free!

Ready to enjoy? Just press the "Request My Free Trial" button on your dashboard!`
  }),

  [NotificationType.FREE_TRIAL_REQUEST]: (data = {}) => ({
    title: '🎁 Free Trial Requested!',
    body: `Your free trial request was received and is pending approval.
We’ll notify you as soon as it’s activated. Hang tight—our team will review and unlock your trial shortly!`
  }),

  [NotificationType.SUBSCRIPTION]: (data = {}) => ({
    title: '🟢 Subscription Activated!',
    body: `Your subscription to Royal IPTV is now active${data?.plan ? ` (Plan: ${data.plan})` : ''}.
You can now enjoy all our premium channels and features. Thank you for being part of Royal IPTV!`
  }),

  [NotificationType.PAYMENT]: (data = {}) => ({
    title: '💸 Payment Received',
    body: `We received your payment${data?.amount ? ` of ${data.amount} ${data.currency || ''}` : ''}. 
Thank you for supporting Royal IPTV!
You can manage your subscriptions anytime from your dashboard.`
  }),

  [NotificationType.LIVE_CHAT_MESSAGE]: (data = {}) => ({
    title: '💬 New Live Chat Message',
    body: `You have a new message${data?.senderName ? ` from ${data.senderName}` : ''} in your live chat.
Open your conversation to view and reply instantly!`
  }),

  [NotificationType.BUBBLE_CHAT_MESSAGE]: (data = {}) => ({
    title: '💬 New Bubble Chat Message',
    body: `You have a new message${data?.senderName ? ` from ${data.senderName}` : ''} in your bubble chat.
Tap to open your chat and keep the conversation going!`
  })
};

export default UserNotificationTemplates;
