/**
 * 📲 User Notification Templates for Royal TV
 * -------------------------------------------
 * Generates notification objects for user-facing events:
 *   - Registration, free trial, subscription, payment, chat
 *
 * ⚡ These are used for both app notifications and transactional emails.
 * Each object includes a title, message body, and a relevant link for user action.
 */
import { NotificationType } from './notificationTypes.js';

// 📅 Helper for nice date formatting
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

export const userNotificationTemplates = {
  // 🎉 Registration success/welcome
  [NotificationType.NEW_USER_REGISTRATION]: (data) => ({
    title: '🎉 Welcome to Royal IPTV!',
    body:
      `Hello ${data.name ? `${data.name}` : ''}, and thank you for joining Royal IPTV! 🎊\n` +
      `Your account (${data.email || ''}) was created on ${formatDate(data.createdAt)}.\n` +
      (data.username ? `Username: ${data.username}\n` : '') +
      (data.preferredContactWay ? `Preferred contact: ${data.preferredContactWay}\n` : '') +
      (data.sendEmails
        ? 'We will send you notifications as email also.\n'
        : 'We will only send you notifications on your dashboard and not emails.\n') +
      `\n👉 Request your free trial by clicking the request free trial button!\n` +
      `If you have questions, login and use Live Chat for help!`,
    link: `/user/profile`
  }),

  // 🎁 Free trial info & credentials (user)
  [`${NotificationType.FREE_TRIAL}_created`]: (data) => ({
    title: '🎁 Your Free Trial Information!',
    body:
      `Hi ${data.name ? `${data.name}` : ''}!\n\n` +
      `Your free trial will automatically be activated on your first official login.\n` +
      (data.package_name ? `• Package: ${data.package_name}\n` : '') +
      `• Expires exactly 1 day after you first login! So use your time wisely and try to enjoy Royal IPTV to the full.\n` +
      (data.username ? `• Username: ${data.username}\n` : '') +
      (data.password ? `• Password: ${data.password}\n` : '') +
      (data.dns_link ? `• DNS: ${data.dns_link}\n` : '') +
      (data.dns_link_for_samsung_lg ? `• Samsung/LG DNS: ${data.dns_link_for_samsung_lg}\n` : '') +
      (data.portal_link ? `• Portal Link: ${data.portal_link}\n` : '') +
      `\n🎬 Use these credentials in your IPTV app to enjoy your free trial right away!\n` +
      `Need help? Login and use Live Chat for support.`,
    link: `/user/freeTrials`
  }),

  // 📦 Subscription created & credentials (user)
  [`${NotificationType.SUBSCRIPTION}_created`]: (data) => ({
    title: '🎉 Subscription Ready – Start Watching Now!',
    body:
      `Hi ${data.name ? `${data.name}` : ''}!\n\n` +
      `Your subscription was created as of ${formatDate(data.createdAt)}.\n` +
      (data.package_name || data.package?.name
        ? `• Package: ${data.package_name || data.package?.name}\n`
        : '') +
      (data.order_description ? `• Order: ${data.order_description}\n` : '') +
      (data.expiring_at ? `• Expires: ${formatDate(data.expiring_at)}\n` : '') +
      (data.dns_link ? `• DNS: ${data.dns_link}\n` : '') +
      (data.dns_link_for_samsung_lg ? `• Samsung/LG DNS: ${data.dns_link_for_samsung_lg}\n` : '') +
      (data.max_connections ? `• Devices Allowed: ${data.max_connections}\n` : '') +
      `\n🚀 Use these credentials in your IPTV app and start watching immediately!\n` +
      `Need help? Login and use Live Chat for support.`,
    link: `/user/subscriptions`
  }),

  // 💸 Payment confirmed receipt (user)
  [NotificationType.PAYMENT]: (data) => ({
    title: '💸 Payment Confirmed',
    body:
      `Thank you! Your payment for order #${data.order_id || 'N/A'} has been received.\n\n` +
      (data.amount_paid && data.price_currency
        ? `• Amount Paid: ${data.amount_paid} ${data.price_currency}\n`
        : '') +
      (data.actually_paid && data.pay_currency
        ? `• Amount Sent (Crypto): ${data.actually_paid} ${data.pay_currency}\n`
        : '') +
      (data.network ? `• Network: ${data.network}\n` : '') +
      (data.pay_address ? `• Payment Address: ${data.pay_address}\n` : '') +
      (data.invoice_id ? `• Invoice ID: ${data.invoice_id}\n` : '') +
      (data.received_at ? `• Received: ${formatDate(data.received_at)}\n` : '') +
      `• Status: ${data.status || 'confirmed'}\n` +
      `\nYou'll get another notification when your subscription is activated.\n` +
      `Questions? Login and use Live Chat!`,
    link: '/user/subscriptions'
  }),

  // 💬 Live chat message (user)
  [NotificationType.LIVE_CHAT_MESSAGE]: (data) => ({
    title: '💬 New Live Chat Message',
    body:
      `You have a new message from Royal TV support on ${formatDate(data.createdAt)}.\n` +
      (data.subject ? `Subject: ${data.subject}\n` : '') +
      (data.message ? `Message: ${data.message}\n` : '') +
      `\nLogin and use Live Chat for fastest support!`,
    link: `/user/liveChat/${data.conversation_id}`
  })
};
