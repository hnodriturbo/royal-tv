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
  // 👤 New User Registration
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

  // 1️⃣ Free Trial Requested
  [`${NotificationType.FREE_TRIAL}_requested`]: (data) => ({
    title: '⏳ Free Trial Requested',
    body:
      `A user requested a free trial:\n\n` +
      `• Name: ${data.name || 'N/A'}\n` +
      `• Email: ${data.email || 'N/A'}\n` +
      `• Username: ${data.username || 'N/A'}\n` +
      `• User ID: ${data.user_id}\n` +
      `• Trial ID: ${data.trial_id}\n` +
      (data.preferredContactWay ? `• Preferred contact: ${data.preferredContactWay}\n` : '') + // 🟢 New line!
      `• Requested: ${formatDate(data.createdAt)}\n` +
      `• Status: ${data.status}\n` +
      `\n👉 Click Open to review and activate or reject this free trial request.`,
    link: `/admin/freeTrials/${data.trial_id}`
  }),

  // 2️⃣ Free Trial Activated
  [`${NotificationType.FREE_TRIAL}_activated`]: (data) => ({
    title: '🎁 Free Trial Activated',
    body:
      `A free trial was activated for a user:\n\n` +
      `• Name: ${data.name || 'N/A'}\n` +
      `• Email: ${data.email || 'N/A'}\n` +
      `• Username: ${data.username || 'N/A'}\n` +
      `• User ID: ${data.user_id}\n` +
      `• Trial ID: ${data.trial_id}\n` +
      (data.free_trial_username ? `• Trial Username: ${data.free_trial_username}\n` : '') +
      (data.free_trial_password ? `• Trial Password: ${data.free_trial_password}\n` : '') +
      (data.free_trial_url ? `• URL: ${data.free_trial_url}\n` : '') +
      (data.free_trial_other ? `• Other: ${data.free_trial_other}\n` : '') +
      (data.additional_info ? `• Notes: ${data.additional_info}\n` : '') +
      (data.startDate ? `• Start: ${formatDate(data.startDate)}\n` : '') +
      (data.endDate ? `• End: ${formatDate(data.endDate)}\n` : '') +
      `• Status: ${data.status}\n` +
      `\n👉 Click Open to see the trial info.`,
    link: `/admin/freeTrials/${data.trial_id}`
  }),

  // 1️⃣ Subscription Created
  [`${NotificationType.SUBSCRIPTION}_created`]: (data) => ({
    title: '🆕 Subscription Created',
    body:
      `A new subscription was created:\n\n` +
      `• Name: ${data.name || 'N/A'}\n` +
      `• Email: ${data.email || 'N/A'}\n` +
      `• Username: ${data.username || 'N/A'}\n` +
      `• User ID: ${data.user_id}\n` +
      `• Subscription ID: ${data.subscription_id}\n` +
      (data.order_id ? `• Order ID: ${data.order_id}\n` : '') +
      `• Created: ${formatDate(data.createdAt)}\n` +
      `\n👉 Click Open to view this subscription, confirm payment, and activate when ready.`,
    link: `/admin/subscriptions/${data.subscription_id}`
  }),

  // 2️⃣ Subscription Activated
  [`${NotificationType.SUBSCRIPTION}_activated`]: (data) => ({
    title: '🟢 Subscription Activated',
    body:
      `A subscription is now active for a user:\n\n` +
      `• Name: ${data.name || 'N/A'}\n` +
      `• Email: ${data.email || 'N/A'}\n` +
      `• Username: ${data.username || 'N/A'}\n` +
      `• User ID: ${data.user_id}\n` +
      `• Subscription ID: ${data.subscription_id}\n` +
      (data.order_id ? `• Order ID: ${data.order_id}\n` : '') +
      (data.subscription_username ? `• Username: ${data.subscription_username}\n` : '') +
      (data.subscription_password ? `• Password: ${data.subscription_password}\n` : '') +
      (data.subscription_url ? `• URL: ${data.subscription_url}\n` : '') +
      (data.subscription_other ? `• Other: ${data.subscription_other}\n` : '') +
      (data.additional_info ? `• Notes: ${data.additional_info}\n` : '') +
      (data.startDate ? `• Start: ${formatDate(data.startDate)}\n` : '') +
      (data.endDate ? `• End: ${formatDate(data.endDate)}\n` : '') +
      `• Status: ${data.status}\n` +
      `\n👉 Click Open to review subscription credentials and manage user access.`,
    link: `/admin/subscriptions/${data.subscription_id}`
  }),

  // 💸 Payment Received
  [NotificationType.PAYMENT]: (data) => ({
    title: '💸 Payment Received',
    body:
      `A payment was received:\n\n` +
      `• Name: ${data.name || 'N/A'}\n` +
      `• Email: ${data.email || 'N/A'}\n` +
      `• Username: ${data.username || 'N/A'}\n` +
      `• User ID: ${data.user_id}\n` +
      (data.amount_paid ? `• Amount Paid: ${data.amount_paid} ${data.currency || ''}\n` : '') +
      (data.amount_received
        ? `• Amount Received: ${data.amount_received} ${data.currency || ''}\n`
        : '') +
      (data.pay_currency ? `• Payment currency: ${data.pay_currency}\n` : '') +
      (data.network ? `• Network: ${data.network}\n` : '') +
      (data.pay_address ? `• Payment address: ${data.pay_address}\n` : '') +
      (data.invoice_id ? `• Invoice: ${data.invoice_id}\n` : '') +
      (data.payment_id ? `• Invoice: ${data.payment_id}\n` : '') +
      (data.received_at ? `• Received at: ${formatDate(data.received_at)}\n` : '') +
      `• Subscription ID: ${data.subscription_id}\n` +
      (data.order_id ? `• Order ID: ${data.order_id}\n` : '') +
      `• Status: ${data.status}\n` +
      `\n👉 Click Open to confirm payment and activate subscription if needed.`,
    link: `/admin/subscriptions/${data.subscription_id}`
  }),

  // 💬 Live Chat (Admin)
  [NotificationType.LIVE_CHAT_MESSAGE]: (data) => ({
    title: '💬 New Live Chat Message',
    body:
      `You have a new message from ${data.name || 'a user'} on ${formatDate(data.createdAt)}.\n` +
      (data.subject ? `Subject: ${data.subject}\n` : '') +
      (data.message ? `Message: ${data.message}\n` : '') +
      `\n👉 Click Open to reply via Live Chat.`,
    link: `/admin/liveChat/${data.conversation_id}`
  })
};
