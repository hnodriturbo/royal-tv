/**
 * ==================== notificationBuilder.js ====================
 * 🏗️
 * Central builder for admin/user notifications (with links!)
 * - All admin templates are functions: always called with data.
 * - All notification types covered.
 * ================================================================
 */

import { NotificationType } from './notificationHub.js';
import userTemplates from '../../src/constants/userNotificationTemplates.js';
import adminTemplates from '../../src/constants/adminNotificationTemplates.js';

// Interpolator (for {key} tokens in template strings)
function interpolate(template, data) {
  if (!template) return null;
  return template.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? '');
}

// Mapping helpers (expand if you add fields to models)
function mapUserData(user = {}) {
  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    telegram: user.telegram,
    preferredContactWay: user.preferredContactWay
  };
}

function mapSubscriptionData(subscription = {}, user = {}) {
  return {
    ...mapUserData(user),
    plan: subscription.plan,
    order_id: subscription.order_id,
    subscription_id: subscription.subscription_id,
    status: subscription.status,
    subscription_username: subscription.subscription_username,
    subscription_password: subscription.subscription_password,
    subscription_url: subscription.subscription_url,
    additional_info: subscription.additional_info
  };
}

function mapPaymentData(payment = {}, user = {}) {
  return {
    ...mapUserData(user),
    amount: payment.amount,
    currency: payment.currency,
    payment_id: payment.payment_id,
    order_id: payment.order_id,
    subscription_id: payment.subscription_id
  };
}

function mapChatMessageData(message = {}, conversation = {}, sender = {}, recipient = {}) {
  return {
    conversation_id: conversation.conversation_id,
    sender_id: sender.user_id,
    senderName: sender.name,
    recipient_id: recipient.user_id,
    recipientName: recipient.name,
    body: message.body
  };
}

function mapFreeTrialData(trial = {}, user = {}) {
  return {
    ...mapUserData(user),
    freeTrial_id: trial.freeTrial_id
  };
}

// ======================= ADMIN-SIDE ===========================
export const adminNotificationBuilder = {
  newUserRegistration: (user) => {
    const data = mapUserData(user);
    const template = adminTemplates[NotificationType.NEW_USER_REGISTRATION](data);
    return {
      title: interpolate(template.title, data),
      body: interpolate(template.body, data),
      link: template.link ? interpolate(template.link, data) : null,
      type: NotificationType.NEW_USER_REGISTRATION
    };
  },
  freeTrialRequested: (trial, user) => {
    const data = { ...mapFreeTrialData(trial, user), ...trial };
    const template = adminTemplates[NotificationType.FREE_TRIAL_REQUEST](data);
    return {
      title: interpolate(template.title, data),
      body: interpolate(template.body, data),
      link: template.link ? interpolate(template.link, data) : null,
      type: NotificationType.FREE_TRIAL_REQUEST
    };
  },
  subscriptionActivated: (subscription, user) => {
    const data = mapSubscriptionData(subscription, user);
    const template = adminTemplates[NotificationType.SUBSCRIPTION](data);
    return {
      title: interpolate(template.title, data),
      body: interpolate(template.body, data),
      link: template.link ? interpolate(template.link, data) : null,
      type: NotificationType.SUBSCRIPTION
    };
  },
  paymentReceived: (payment, user) => {
    const data = mapPaymentData(payment, user);
    const template = adminTemplates[NotificationType.PAYMENT](data);
    return {
      title: interpolate(template.title, data),
      body: interpolate(template.body, data),
      link: template.link ? interpolate(template.link, data) : null,
      type: NotificationType.PAYMENT
    };
  },
  liveChatMessage: (message, conversation) => {
    const data = { conversation_id: conversation.conversation_id };
    const template = adminTemplates[NotificationType.LIVE_CHAT_MESSAGE](data);
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.LIVE_CHAT_MESSAGE
    };
  },
  bubbleChatMessage: (message, conversation) => {
    const data = { conversation_id: conversation.conversation_id };
    const template = adminTemplates[NotificationType.BUBBLE_CHAT_MESSAGE](data);
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.BUBBLE_CHAT_MESSAGE
    };
  }
};

// ==========================================
// 👤 USER-SIDE NOTIFICATION BUILDERS
// ==========================================
export const userNotificationBuilder = {
  newUserRegistration: (user) => {
    const data = mapUserData(user);
    const template = userTemplates[NotificationType.NEW_USER_REGISTRATION](data);
    return {
      title: interpolate(template.title, data),
      body: interpolate(template.body, data),
      link: template.link ? interpolate(template.link, data) : null,
      type: NotificationType.NEW_USER_REGISTRATION
    };
  },
  freeTrialRequested: (trial, user) => {
    const data = mapFreeTrialData(trial, user);
    const template = userTemplates[NotificationType.FREE_TRIAL_REQUEST](data);
    return {
      title: interpolate(template.title, data),
      body: interpolate(template.body, data),
      link: template.link ? interpolate(template.link, data) : null,
      type: NotificationType.FREE_TRIAL_REQUEST
    };
  },
  subscriptionActivated: (subscription, user) => {
    const data = mapSubscriptionData(subscription, user);
    const template = userTemplates[NotificationType.SUBSCRIPTION](data);
    return {
      title: interpolate(template.title, data),
      body: interpolate(template.body, data),
      link: template.link ? interpolate(template.link, data) : null,
      type: NotificationType.SUBSCRIPTION
    };
  },
  paymentReceived: (payment, user) => {
    const data = mapPaymentData(payment, user);
    const template = userTemplates[NotificationType.PAYMENT](data);
    return {
      title: interpolate(template.title, data),
      body: interpolate(template.body, data),
      link: template.link ? interpolate(template.link, data) : null,
      type: NotificationType.PAYMENT
    };
  },
  liveChatMessage: (message, conversation) => {
    // 📨 Only need conversation_id for the link!
    const data = { conversation_id: conversation.conversation_id };
    const template = userTemplates[NotificationType.LIVE_CHAT_MESSAGE](data);
    return {
      title: template.title, // No interpolation needed
      body: template.body,
      link: template.link,
      type: NotificationType.LIVE_CHAT_MESSAGE
    };
  },
  bubbleChatMessage: (message, conversation) => {
    const data = { conversation_id: conversation.conversation_id };
    const template = userTemplates[NotificationType.BUBBLE_CHAT_MESSAGE](data);
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.BUBBLE_CHAT_MESSAGE
    };
  }
};

export default {
  adminNotificationBuilder,
  userNotificationBuilder
};

/* ========= HOW TO USE ========= */
/* 
import { adminNotificationBuilder, userNotificationBuilder } from '@/constants/notificationBuilder';

// For user notification
const userNotif = userNotificationBuilder.subscriptionActivated(updatedSubscription, updatedSubscription.user);

// For admin notification
const adminNotif = adminNotificationBuilder.subscriptionActivated(updatedSubscription, updatedSubscription.user);

// Use result to create notification in DB
await prisma.notification.create({
  data: {
    user_id: ...,
    title: userNotif.title,
    body: userNotif.body,
    link: userNotif.link,
    type: userNotif.type
  }
});
 */
