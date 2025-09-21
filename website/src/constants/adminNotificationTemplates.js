/**
 * 📢 Admin Notification Templates (string-safe)
 * ---------------------------------------------
 * - Every interpolated value is coerced to string.
 * - Safe defaults prevent [object Object] and React #130.
 * - Keeps "\n" since emails convert it to <br> later.
 */

import { NotificationType } from './notificationTypes.js';

// 🧼 Coercion helper → always a string
const toStr = (value, fallback = '') => {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback; // never leak objects
};

// 📅 Format dates safely
const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

export const adminNotificationTemplates = {
  // 👤 New user registration
  [NotificationType.NEW_USER_REGISTRATION]: (data = {}) => ({
    title: '👤 New User Registered',
    body:
      `A new user just signed up:\n\n` +
      `• Name: ${toStr(data.name)}\n` +
      `• Email: ${toStr(data.email)}\n` +
      `• Username: ${toStr(data.username)}\n` +
      `• User ID: ${toStr(data.user_id)}\n` +
      `• Registered: ${toStr(formatDate(data.createdAt))}\n` +
      (data.preferredContactWay
        ? `• Preferred contact: ${toStr(data.preferredContactWay)}\n`
        : '') +
      (data.whatsapp ? `• WhatsApp: ${toStr(data.whatsapp)}\n` : '') +
      (data.telegram ? `• Telegram: ${toStr(data.telegram)}\n` : '') +
      `\n👉 Click Open to review this user's profile and manage permissions.`,
    link: `/admin/users/${toStr(data.user_id)}`
  }),

  // 🎁 Free trial created/activated
  [`${NotificationType.FREE_TRIAL}_created`]: (data = {}) => ({
    title: '🎁 Free Trial Activated',
    body:
      `A new free trial was just created and is active:\n\n` +
      `• Name: ${toStr(data.name, 'N/A')}\n` +
      `• Email: ${toStr(data.email, 'N/A')}\n` +
      `• Username: ${toStr(data.username, 'N/A')}\n` +
      `• User ID: ${toStr(data.user_id)}\n` +
      `• Trial ID: ${toStr(data.trial_id)}\n` +
      (data.package_name ? `• Package: ${toStr(data.package_name)}\n` : '') +
      (typeof data.adult === 'boolean'
        ? `• Adult Channels: ${data.adult ? 'Enabled' : 'Disabled'}\n`
        : '') +
      `\n👉 Open to view the full trial details.`,
    link: `/admin/freeTrials/${toStr(data.trial_id)}`
  }),

  // 📦 Subscription created/activated
  [`${NotificationType.SUBSCRIPTION}_created`]: (data = {}) => ({
    title: '🆕 Subscription Created & Activated',
    body:
      `A new subscription was automatically created and activated:\n\n` +
      `• Name: ${toStr(data.name, 'N/A')}\n` +
      `• Email: ${toStr(data.email, 'N/A')}\n` +
      `• Username: ${toStr(data.username, 'N/A')}\n` +
      `• User ID: ${toStr(data.user_id)}\n` + // 🪲 fixed (was data.name)
      `• Subscription ID: ${toStr(data.subscription_id)}\n` +
      (data.order_id ? `• Order ID: ${toStr(data.order_id)}\n` : '') +
      (data.package_name ? `• Package: ${toStr(data.package_name)}\n` : '') +
      (data.expiring_at ? `• Expires: ${toStr(formatDate(data.expiring_at))}\n` : '') +
      (data.max_connections ? `• Devices Allowed: ${toStr(data.max_connections)}\n` : '') +
      (typeof data.adult === 'boolean'
        ? `• Adult Channels: ${data.adult ? 'Enabled' : 'Disabled'}\n`
        : '') +
      (typeof data.enable_vpn === 'boolean'
        ? `• VPN: ${data.enable_vpn ? 'Enabled' : 'Disabled'}\n`
        : '') +
      `\n👉 Open to review subscription details or manage user access.`,
    link: `/admin/subscriptions/${toStr(data.subscription_id)}`
  }),

  // 💸 Payment received
  [NotificationType.PAYMENT]: (data = {}) => ({
    title: '💸 Payment Received',
    body:
      `A payment was received:\n\n` +
      `• Name: ${toStr(data.name, 'N/A')}\n` +
      `• Email: ${toStr(data.email, 'N/A')}\n` +
      `• Username: ${toStr(data.username, 'N/A')}\n` +
      `• User ID: ${toStr(data.user_id)}\n` +
      (data.amount_paid && data.price_currency
        ? `• Amount Paid (Fiat): ${toStr(data.amount_paid)} ${toStr(data.price_currency)}\n`
        : '') +
      (data.actually_paid && data.pay_currency
        ? `• Amount Received (Crypto): ${toStr(data.actually_paid)} ${toStr(data.pay_currency)}\n`
        : '') +
      (data.pay_currency ? `• Payment currency: ${toStr(data.pay_currency)}\n` : '') +
      (data.network ? `• Network: ${toStr(data.network)}\n` : '') +
      (data.pay_address ? `• Payment address: ${toStr(data.pay_address)}\n` : '') +
      (data.invoice_id ? `• Invoice: ${toStr(data.invoice_id)}\n` : '') +
      (data.payment_id ? `• Payment ID: ${toStr(data.payment_id)}\n` : '') +
      (data.received_at ? `• Received at: ${toStr(formatDate(data.received_at))}\n` : '') +
      `• Subscription ID: ${toStr(data.subscription_id, 'N/A')}\n` +
      (data.order_id ? `• Order ID: ${toStr(data.order_id)}\n` : '') +
      `• Status: ${toStr(data.status, 'N/A')}\n` +
      `\n👉 Click Open to confirm payment and activate subscription if needed.`,
    link: `/admin/subscriptions/${toStr(data.subscription_id)}`
  }),

  // 💬 Live chat message
  [NotificationType.LIVE_CHAT_MESSAGE]: (data = {}) => ({
    title: '💬 New Live Chat Message',
    body:
      `You have a new message from ${toStr(data.name, 'a user')} on ${toStr(
        formatDate(data.createdAt)
      )}.\n` +
      (data.subject ? `Subject: ${toStr(data.subject)}\n` : '') +
      (data.message ? `Message: ${toStr(data.message)}\n` : '') +
      `\n👉 Click Open to reply via Live Chat.`,
    link: `/admin/liveChat/${toStr(data.conversation_id)}`
  }),

  // 🧯 Error notification
  [NotificationType.ERROR]: (data = {}) => ({
    title: '❌ Error occurred',
    body:
      `An error occurred!\n` +
      (data.user_id ? `• user_id: ${toStr(data.user_id)}\n` : '') +
      (data.name ? `• User Name: ${toStr(data.name)}\n` : '') +
      (data.errorTitle ? `• Error Title: ${toStr(data.errorTitle)}\n` : '') +
      (data.errorMessage ? `• Error Message: ${toStr(data.errorMessage)}\n` : '') +
      (data.errorDetails ? `• Details: ${toStr(data.errorDetails)}\n` : '')
    // link: 'N/A'
  })
};
