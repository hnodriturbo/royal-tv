/**
 *   ============= constants/notificationTypes.js =============
 * 🎯
 * NotificationType enums and dynamic route link templates.
 * - Central place to add/edit notification types and their links.
 * ============================================================
 */

// ================== 1️⃣ Notification Types ====================
export const NotificationType = {
  SUBSCRIPTION: 'subscription', // 🔔 Subscription related
  PAYMENT: 'payment', // 💰 Payment received/failed
  FREE_TRIAL_REQUEST: 'freeTrial', // 🎁 Free trial request
  BUBBLE_CHAT_MESSAGE: 'bubbleChatMessage', // 💬 Bubble chat message
  LIVE_CHAT_MESSAGE: 'liveChatMessage', // 📡 Live chat message
  NEW_USER_REGISTRATION: 'newUserRegistration' // 🆕 New user registered (welcome)
};

// ================== 2️⃣ Dynamic Notification Links =============
// - Functions return the correct path for user or admin.
// - For admin, always pass user_id where needed!
export const NotificationLinks = {
  // 💬 Live Chat (needs conversation_id)
  [NotificationType.LIVE_CHAT_MESSAGE]: ({ conversation_id, isAdmin = false }) =>
    `/${isAdmin ? 'admin' : 'user'}/liveChat/conversation/${conversation_id}`,

  // 💬 Bubble Chat (needs conversation_id)
  [NotificationType.BUBBLE_CHAT_MESSAGE]: ({ conversation_id, isAdmin = false }) =>
    `/${isAdmin ? 'admin' : 'user'}/bubbleChat/conversation/${conversation_id}`,

  // 💎 Subscription (needs subscription_id)
  [NotificationType.SUBSCRIPTION]: ({ subscription_id, isAdmin = false }) =>
    subscription_id
      ? `/${isAdmin ? 'admin' : 'user'}/subscriptions/${subscription_id}`
      : `/${isAdmin ? 'admin' : 'user'}/subscriptions`,

  // 💰 Payments
  [NotificationType.PAYMENT]: ({ isAdmin = false }) => `/${isAdmin ? 'admin' : 'user'}/payments`,

  // 🎁 Free Trial Requests
  [NotificationType.FREE_TRIAL_REQUEST]: ({ freeTrial_id, isAdmin = false }) =>
    isAdmin
      ? // Admin: link directly to "grant free trial" for this user
        `/admin/freeTrials/${freeTrial_id}/createFreeTrial`
      : // User: go to user's free trial status page
        '/user/freeTrials',

  // 🆕 New User Registration
  [NotificationType.NEW_USER_REGISTRATION]: ({ user_id, isAdmin = false }) =>
    isAdmin
      ? // Admin: link to that user's profile page
        `/admin/users/${user_id}`
      : // User: dashboard (welcome)
        '/user/dashboard'
};

// ================== 3️⃣ Link Resolver Helper ===================
// - Gets correct link for any notification, based on type/user_id/isAdmin
export function getNotificationLink(notification, isAdmin = false) {
  // If we have a type and matching link handler
  if (notification.type && NotificationLinks[notification.type]) {
    return NotificationLinks[notification.type]({ ...notification, isAdmin });
  }
  // Fallback to notifications list
  return isAdmin ? '/admin/notifications' : '/user/notifications';
}
