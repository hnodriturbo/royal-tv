/**
 * 📲 User Notification Templates (string-safe)
 * --------------------------------------------
 * - Every interpolated value is coerced to string.
 * - No raw objects leak into JSX or emails.
 * - Keeps "\n" since emails convert it to <br> later.
 */

import { NotificationType } from './notificationTypes.js';

// 🧼 Coercion helper → always a string
const toStr = (value, fallback = '') => {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

// 📅 Safe date formatter
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
  // 🎉 Registration welcome
  [NotificationType.NEW_USER_REGISTRATION]: (data = {}) => ({
    title: '🎉 Welcome to Royal IPTV!',
    body:
      `Hello ${toStr(data.name)}${data.name ? '' : ''}, and thank you for joining Royal IPTV! 🎊\n` +
      `Your account (${toStr(data.email)}) was created on ${toStr(formatDate(data.createdAt))}.\n` +
      (data.username ? `Username: ${toStr(data.username)}\n` : '') +
      (data.preferredContactWay ? `Preferred contact: ${toStr(data.preferredContactWay)}\n` : '') +
      (data.sendEmails
        ? 'We will send you notifications as email also.\n'
        : 'We will only send you notifications on your dashboard and not emails.\n') +
      `\n👉 Request your free trial by clicking the request free trial button!\n` +
      `Need help? Contact us on whatsapp or use Live Chat for support !`,
    link: `/user/profile`
  }),

  // 🎁 Free trial created
  [`${NotificationType.FREE_TRIAL}_created`]: (data = {}) => ({
    title: '🎁 Your Free Trial Information!',
    body:
      `Hi ${toStr(data.name)}!\n\n` +
      `Your free trial will automatically be activated on your first official login.\n` +
      (data.package_name ? `• Package: ${toStr(data.package_name)}\n` : '') +
      `• Expires exactly 1 day after you first login! Try to enjoy the IPTV service to the full.\n` +
      `\n🎬 Use the credentials in your IPTV app to enjoy your free trial right away!\n` +
      `• You can find your credentials by clicking on open content in this notification.\n` +
      `Need help? Contact us on whatsapp or use Live Chat for support !`,
    link: `/user/freeTrials`
  }),

  // 📦 Subscription created
  [`${NotificationType.SUBSCRIPTION}_created`]: (data = {}) => ({
    title: '🎉 Subscription Ready – Start Watching Now!',
    body:
      `Hi ${toStr(data.name)}!\n\n` +
      `Your subscription was created as of ${toStr(formatDate(data.createdAt))}.\n` +
      (data.package_name || (data.package && data.package.name)
        ? `• Package: ${toStr(data.package_name || (data.package && data.package.name))}\n`
        : '') +
      (data.order_description ? `• Order: ${toStr(data.order_description)}\n` : '') +
      (data.expiring_at ? `• Expires: ${toStr(formatDate(data.expiring_at))}\n` : '') +
      `\n🚀 Use your credentials to create a new playlist in your IPTV app and start watching immediately!\n` +
      `Need help? Contact us on whatsapp or use Live Chat for support !`,
    link: `/user/subscriptions`
  }),

  // 💸 Payment confirmed
  [NotificationType.PAYMENT]: (data = {}) => ({
    title: '💸 Payment Confirmed',
    body:
      `Thank you! Your payment for order #${toStr(data.order_id, 'N/A')} has been received.\n\n` +
      (data.amount_paid && data.price_currency
        ? `• Amount Paid: ${toStr(data.amount_paid)} ${toStr(data.price_currency)}\n`
        : '') +
      (data.invoice_id ? `• Invoice ID: ${toStr(data.invoice_id)}\n` : '') +
      (data.received_at ? `• Received: ${toStr(formatDate(data.received_at))}\n` : '') +
      (data.status ? `• Status: ${toStr(data.status || 'Confirmed !')}\n` : '') +
      `Need help? Contact us on whatsapp or use Live Chat for support !`,
    link: '/user/subscriptions'
  }),

  // 💬 Live chat message
  [NotificationType.LIVE_CHAT_MESSAGE]: (data = {}) => ({
    title: '💬 New Live Chat Message',
    body:
      `You have a new message from Royal TV support on ${toStr(formatDate(data.createdAt))}.\n` +
      (data.subject ? `Subject: ${toStr(data.subject)}\n` : '') +
      (data.message ? `Message: ${toStr(data.message)}\n` : '') +
      `\nNeed help? Contact us on whatsapp or use Live Chat for support !`,
    link: `/user/liveChat/${toStr(data.conversation_id)}`
  }),

  // 🧯 Error
  [NotificationType.ERROR]: (data = {}) => ({
    title: '⚠️ Error occurred',
    body:
      (data.errorTitle ? `• Error Title: ${toStr(data.errorTitle)}\n` : '') +
      (data.errorMessage ? `• Error Message: ${toStr(data.errorMessage)}\n` : '') +
      (data.errorDetails ? `• Details: ${toStr(data.errorDetails)}\n` : '')
  })
};
