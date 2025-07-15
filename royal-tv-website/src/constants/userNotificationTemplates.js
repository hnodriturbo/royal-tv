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
  /**
   * 🎉 Registration Success
   */
  [NotificationType.NEW_USER_REGISTRATION]: (data) => ({
    title: '🎉 Welcome to Royal IPTV!',
    body:
      `Hello${data.name ? ` ${data.name}` : ''}, and thank you for joining Royal IPTV! 🎊\n` +
      `Your account (${data.email || 'no email'}) was created on ${formatDate(data.createdAt)}.\n` +
      (data.username ? `Username: ${data.username}\n` : '') +
      (data.preferredContactWay ? `Preferred contact: ${data.preferredContactWay}\n` : '') +
      `\n👉 Request your free trial to start watching—just open your dashboard!\n` +
      `If you have questions, login and use Live Chat for help!`,
    link: null
  }),

  /**
   * 1️⃣ Free Trial Requested
   */
  [`${NotificationType.FREE_TRIAL}_requested`]: (data) => ({
    title: '⏳ Free Trial Requested',
    body:
      `We received your request for a free 24-hour trial on ${formatDate(data.createdAt)}.\n` +
      `Status: ${data.status || 'pending'}.\n` +
      (data.preferredContactWay ? `We’ll contact you via: ${data.preferredContactWay}\n` : '') +
      `We'll notify you as soon as your trial is active.\n` +
      `Questions? Login and use Live Chat to get instant support!`,
    link: '/user/freeTrials'
  }),

  /**
   * 2️⃣ Free Trial Activated
   */
  [`${NotificationType.FREE_TRIAL}_activated`]: (data) => ({
    title: '🎁 Free Trial Activated!',
    body:
      `Your free 24-hour trial is now active as of ${formatDate(data.activatedAt || data.startDate || data.updatedAt)}.\n` +
      `Status: ${data.status || 'active'}\n` +
      (data.startDate ? `Starts: ${formatDate(data.startDate)}\n` : '') +
      (data.endDate ? `Expires: ${formatDate(data.endDate)}\n` : '') +
      (data.free_trial_username ? `Username: ${data.free_trial_username}\n` : '') +
      (data.free_trial_password ? `Password: ${data.free_trial_password}\n` : '') +
      (data.free_trial_url ? `URL: ${data.free_trial_url}\n` : '') +
      `\nUse these credentials in your favorite IPTV app.\n` +
      `Need help? Login and use Live Chat!`,
    link: `/user/freeTrials`
  }),

  /**
   * 1️⃣ Subscription Created
   */
  [`${NotificationType.SUBSCRIPTION}_created`]: (data) => ({
    title: '🆕 Subscription Created',
    body:
      `Your new subscription was created on ${formatDate(data.createdAt)}.\n` +
      (data.order_id ? `Order ID: ${data.order_id}\n` : '') +
      `Status: ${data.status || 'pending'}\n` +
      `\n👉 Please complete payment if you haven't already.\n` +
      `We'll activate your subscription and send your login details as soon as payment is confirmed!\n` +
      `Need help? Login and use Live Chat for support.`,
    link: '/user/subscriptions'
  }),

  /**
   * 2️⃣ Subscription Activated
   */
  [`${NotificationType.SUBSCRIPTION}_activated`]: (data) => ({
    title: '🟢 Subscription Active',
    body:
      `Your subscription is now fully active!\n` +
      (data.order_id ? `• Order ID: ${data.order_id}\n` : '') +
      (data.startDate ? `Start: ${formatDate(data.startDate)}\n` : '') +
      (data.endDate ? `Expires: ${formatDate(data.endDate)}\n` : '') +
      `Status: ${data.status || 'active'}\n` +
      (data.subscription_username ? `Username: ${data.subscription_username}\n` : '') +
      (data.subscription_password ? `Password: ${data.subscription_password}\n` : '') +
      (data.subscription_url ? `URL: ${data.subscription_url}\n` : '') +
      (data.subscription_other ? `Other: ${data.subscription_other}\n` : '') +
      `\n🚀 Enter these details into your IPTV app to start watching now.\n` +
      `If you need help, login and use Live Chat for fastest support!`,
    link: `/user/subscriptions`
  }),

  /**
   * 💸 Payment Confirmed
   */
  [NotificationType.PAYMENT]: (data) => ({
    title: '💸 Payment Confirmed',
    body:
      `Thank you! We received ${data.amount_paid ? `${data.amount_paid} ${data.currency || ''}` : 'your payment'} for order #${data.order_id || 'N/A'}.\n` +
      `Status: ${data.status || 'completed'}.\n` +
      (data.pay_currency ? `Payment currency: ${data.pay_currency}\n` : '') +
      (data.network ? `Network: ${data.network}\n` : '') +
      (data.pay_address ? `Payment address: ${data.pay_address}\n` : '') +
      (data.invoice_id ? `Invoice: ${data.invoice_id}\n` : '') +
      (data.received_at ? `Received at: ${formatDate(data.received_at)}\n` : '') +
      `\nYou'll get another notification when your subscription is activated.\n` +
      `Questions? Login and use Live Chat!`,
    link: '/user/subscriptions'
  }),

  /**
   * 💬 Live Chat Message (User)
   */
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
