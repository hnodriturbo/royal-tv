/**
 * 📢 Admin Notification Templates for Royal TV
 * --------------------------------------------
 * Generates notification objects for admin actions:
 *   - New user registration
 *   - Free trial created/activated
 *   - Subscription created/activated
 *   - Payment received
 *   - Live chat messages
 *
 * ⚡ These templates are used for both real-time app notifications and transactional emails sent to admins.
 * Each object contains a title, message body, and link for the admin panel.
 */
import { NotificationType } from './notificationTypes.js';

// 📅 Date formatter for admin notifications
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
  // 👤 New user registration alert
  [NotificationType.NEW_USER_REGISTRATION]: (data) => ({
    title: '👤 New User Registered',
    body:
      `A new user just signed up:\n\n` +
      `• Name: ${data.name}\n` +
      `• Email: ${data.email}\n` +
      `• Username: ${data.username}\n` +
      `• User ID: ${data.user_id}\n` +
      `• Registered: ${formatDate(data.createdAt)}\n` +
      (data.preferredContactWay ? `• Preferred contact: ${data.preferredContactWay}\n` : '') +
      (data.whatsapp ? `• WhatsApp: ${data.whatsapp}\n` : '') +
      (data.telegram ? `• Telegram: ${data.telegram}\n` : '') +
      `\n👉 Click Open to review this user's profile and manage permissions.`,
    link: `/admin/users/${data.user_id}`
  }),

  // 🎁 Free trial creation/activation alert
  [`${NotificationType.FREE_TRIAL}_created`]: (data) => ({
    title: '🎁 Free Trial Activated',
    body:
      `A new free trial was just created and is active:\n\n` +
      `• Name: ${data.name || 'N/A'}\n` +
      `• Email: ${data.email || 'N/A'}\n` +
      `• Username: ${data.username || 'N/A'}\n` +
      `• User ID: ${data.user_id}\n` +
      `• Trial ID: ${data.trial_id}\n` +
      (data.package_name ? `• Package: ${data.package_name}\n` : '') +
      (typeof data.adult === 'boolean'
        ? `• Adult Channels: ${data.adult ? 'Enabled' : 'Disabled'}\n`
        : '') +
      `\n👉 Open to view the full trial details.`,
    link: `/admin/freeTrials/${data.trial_id}`
  }),

  // 📦 Subscription creation/activation alert
  [`${NotificationType.SUBSCRIPTION}_created`]: (data) => ({
    title: '🆕 Subscription Created & Activated',
    body:
      `A new subscription was automatically created and activated:\n\n` +
      `• Name: ${data.name || 'N/A'}\n` +
      `• Email: ${data.email || 'N/A'}\n` +
      `• Username: ${data.username || 'N/A'}\n` +
      `• User ID: ${data.name}\n` +
      `• Subscription ID: ${data.subscription_id}\n` +
      (data.order_id ? `• Order ID: ${data.order_id}\n` : '') +
      (data.package_name ? `• Package: ${data.package_name}\n` : '') +
      (data.expiring_at ? `• Expires: ${formatDate(data.expiring_at)}\n` : '') +
      (data.max_connections ? `• Devices Allowed: ${data.max_connections}\n` : '') +
      (typeof data.adult === 'boolean'
        ? `• Adult Channels: ${data.adult ? 'Enabled' : 'Disabled'}\n`
        : '') +
      (typeof data.enable_vpn === 'boolean'
        ? `• VPN: ${data.enable_vpn ? 'Enabled' : 'Disabled'}\n`
        : '') +
      `\n👉 Open to review subscription details or manage user access.`,
    link: `/admin/subscriptions/${data.subscription_id}`
  }),

  // 💸 Payment received alert
  [NotificationType.PAYMENT]: (data) => ({
    title: '💸 Payment Received',
    body:
      `A payment was received:\n\n` +
      `• Name: ${data.name || 'N/A'}\n` +
      `• Email: ${data.email || 'N/A'}\n` +
      `• Username: ${data.username || 'N/A'}\n` +
      `• User ID: ${data.user_id}\n` +
      (data.amount_paid && data.price_currency
        ? `• Amount Paid (Fiat): ${data.amount_paid} ${data.price_currency}\n`
        : '') +
      (data.actually_paid && data.pay_currency
        ? `• Amount Received (Crypto): ${data.actually_paid} ${data.pay_currency}\n`
        : '') +
      (data.pay_currency ? `• Payment currency: ${data.pay_currency}\n` : '') +
      (data.network ? `• Network: ${data.network}\n` : '') +
      (data.pay_address ? `• Payment address: ${data.pay_address}\n` : '') +
      (data.invoice_id ? `• Invoice: ${data.invoice_id}\n` : '') +
      (data.payment_id ? `• Payment ID: ${data.payment_id}\n` : '') +
      (data.received_at ? `• Received at: ${formatDate(data.received_at)}\n` : '') +
      `• Subscription ID: ${data.subscription_id || 'N/A'}\n` +
      (data.order_id ? `• Order ID: ${data.order_id}\n` : '') +
      `• Status: ${data.status || 'N/A'}\n` +
      `\n👉 Click Open to confirm payment and activate subscription if needed.`,
    link: `/admin/subscriptions/${data.subscription_id}`
  }),

  // 💬 Live chat message alert
  [NotificationType.LIVE_CHAT_MESSAGE]: (data) => ({
    title: '💬 New Live Chat Message',
    body:
      `You have a new message from ${data.name || 'a user'} on ${formatDate(data.createdAt)}.\n` +
      (data.subject ? `Subject: ${data.subject}\n` : '') +
      (data.message ? `Message: ${data.message}\n` : '') +
      `\n👉 Click Open to reply via Live Chat.`,
    link: `/admin/liveChat/${data.conversation_id}`
  }),

  // 🧯 Admin error notification
  [NotificationType.ERROR]: (data) => ({
    title: '❌ Error occurred',
    body:
      `An error occurred!\n` +
      (data.user_id ? `• user_id: ${data.user_id}\n` : '') +
      (data.name ? `• User Name: ${data.name}\n` : '') +
      (data.errorTitle ? `• Error Title: ${data.errorTitle}\n` : '') +
      (data.errorMessage ? `• Error Message: ${data.errorMessage}\n` : '') +
      (data.errorDetails ? `• Details: ${data.errorDetails}\n` : '')
    /*  link: 'N/A' */
  })
};
