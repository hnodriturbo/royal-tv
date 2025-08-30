/**
 *   ====================== notificationSystem.js ======================
 * 🔔
 * UNIFIED NOTIFICATION BUILDER & HUB – Royal TV
 * - Dynamically builds notifications for both user and admin sides.
 * - Always merges full user and event payloads into templates.
 * =====================================================================
 */
import { NotificationType } from './notificationTypes.js'; // 🎯 Type enum
import { adminNotificationTemplates } from './adminNotificationTemplates.js'; // 👑 Admin templates
import { userNotificationTemplates } from './userNotificationTemplates.js'; // 👤 User templates

// 🧩 Utility for interpolating tokens in text (for future)
function interpolate(template, data) {
  if (!template) return null;
  return template.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? '');
}

// 👤 USER DATA
function mapUserData(user = {}) {
  return {
    user_id: user.user_id,
    username: user.username,
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    telegram: user.telegram,
    preferredContactWay: user.preferredContactWay,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

// 🧩 Merge user and payload into a single object
function mergeUserAndPayload(user = {}, payload = {}) {
  // 🟢 User fields merged first, payload fields can overwrite or add
  return { ...mapUserData(user), ...payload };
}

// 🟢 SAFETY WRAPPER: Ensure every notification template is a function
function safeTemplateCall(templates, key, data, errorCtx) {
  const fn = templates[key];
  if (typeof fn !== 'function') {
    throw new Error(
      `[NotificationSystem] Notification template for key [${key}] is not a function!` +
        (errorCtx ? ` Context: ${errorCtx}` : '')
    );
  }
  return fn(data);
}

/**
 * 👤 USER Notification Builders
 * ✨ Always (user, payload)
 */
export const userNotificationBuilder = {
  newUserRegistration: (user) => {
    // 🧩 Only user data for registration
    const data = mergeUserAndPayload(user);
    const template = safeTemplateCall(
      userNotificationTemplates,
      NotificationType.NEW_USER_REGISTRATION,
      data,
      'user registration'
    );
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.NEW_USER_REGISTRATION
    };
  },

  freeTrialRequested: (user, freeTrial) => {
    const data = mergeUserAndPayload(user, freeTrial);
    const key = `${NotificationType.FREE_TRIAL}_requested`;
    const template = safeTemplateCall(userNotificationTemplates, key, data, 'free trial requested');
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.FREE_TRIAL
    };
  },

  freeTrialActivated: (user, freeTrial) => {
    const data = mergeUserAndPayload(user, freeTrial);
    const key = `${NotificationType.FREE_TRIAL}_activated`;
    const template = safeTemplateCall(userNotificationTemplates, key, data, 'free trial activated');
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.FREE_TRIAL
    };
  },

  subscriptionCreated: (user, subscription) => {
    const data = mergeUserAndPayload(user, subscription);
    const key = `${NotificationType.SUBSCRIPTION}_created`;
    const template = safeTemplateCall(userNotificationTemplates, key, data, 'subscription created');
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.SUBSCRIPTION
    };
  },

  subscriptionActivated: (user, subscription) => {
    const data = mergeUserAndPayload(user, subscription);
    const key = `${NotificationType.SUBSCRIPTION}_activated`;
    const template = safeTemplateCall(
      userNotificationTemplates,
      key,
      data,
      'subscription activated'
    );
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.SUBSCRIPTION
    };
  },

  paymentReceived: (user, payment) => {
    const data = mergeUserAndPayload(user, payment);
    const template = safeTemplateCall(
      userNotificationTemplates,
      NotificationType.PAYMENT,
      data,
      'payment received'
    );
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.PAYMENT
    };
  },

  liveChatMessage: (user, messageAndConversation) => {
    const data = mergeUserAndPayload(user, messageAndConversation);
    const template = safeTemplateCall(
      userNotificationTemplates,
      NotificationType.LIVE_CHAT_MESSAGE,
      data,
      'live chat message'
    );
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.LIVE_CHAT_MESSAGE
    };
  },

  // ❌ USER builder for error
  error: (user = {}, error) => {
    const data = mergeUserAndPayload(user, error);
    const template = safeTemplateCall(
      userNotificationTemplates,
      NotificationType.ERROR,
      data,
      'user error'
    );
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.ERROR
    };
  }
};

/**
 * 👑 ADMIN Notification Builders
 * ✨ Always (user, payload)
 */
export const adminNotificationBuilder = {
  newUserRegistration: (user) => {
    // 🧩 Only user data for registration
    const data = mergeUserAndPayload(user);
    const template = safeTemplateCall(
      adminNotificationTemplates,
      NotificationType.NEW_USER_REGISTRATION,
      data,
      'admin user registration'
    );
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.NEW_USER_REGISTRATION
    };
  },

  freeTrialRequested: (user, freeTrial) => {
    const data = mergeUserAndPayload(user, freeTrial);
    const key = `${NotificationType.FREE_TRIAL}_requested`;
    const template = safeTemplateCall(
      adminNotificationTemplates,
      key,
      data,
      'admin free trial requested'
    );
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.FREE_TRIAL
    };
  },

  freeTrialActivated: (user, freeTrial) => {
    const data = mergeUserAndPayload(user, freeTrial);
    const key = `${NotificationType.FREE_TRIAL}_activated`;
    const template = safeTemplateCall(
      adminNotificationTemplates,
      key,
      data,
      'admin free trial activated'
    );
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.FREE_TRIAL
    };
  },

  subscriptionCreated: (user, subscription) => {
    const data = mergeUserAndPayload(user, subscription);
    const key = `${NotificationType.SUBSCRIPTION}_created`;
    const template = safeTemplateCall(
      adminNotificationTemplates,
      key,
      data,
      'admin subscription created'
    );
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.SUBSCRIPTION
    };
  },

  subscriptionActivated: (user, subscription) => {
    const data = mergeUserAndPayload(user, subscription);
    const key = `${NotificationType.SUBSCRIPTION}_activated`;
    const template = safeTemplateCall(
      adminNotificationTemplates,
      key,
      data,
      'admin subscription activated'
    );
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.SUBSCRIPTION
    };
  },

  paymentReceived: (user, payment) => {
    const data = mergeUserAndPayload(user, payment);
    const template = safeTemplateCall(
      adminNotificationTemplates,
      NotificationType.PAYMENT,
      data,
      'admin payment received'
    );
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.PAYMENT
    };
  },

  liveChatMessage: (user, messageAndConversation) => {
    const data = mergeUserAndPayload(user, messageAndConversation);
    const template = safeTemplateCall(
      adminNotificationTemplates,
      NotificationType.LIVE_CHAT_MESSAGE,
      data,
      'admin live chat message'
    );
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.LIVE_CHAT_MESSAGE
    };
  },
  // 👑 ADMIN builder for error
  error: (user = {}, error) => {
    const data = mergeUserAndPayload(user, error);
    const template = safeTemplateCall(
      adminNotificationTemplates,
      NotificationType.ERROR,
      data,
      'admin error'
    );
    return {
      title: template.title,
      body: template.body,
      link: template.link,
      type: NotificationType.ERROR
    };
  }
};

// 🧩 GENERIC DIRECT USE HELPERS – Use these for generic lookup by type+event
function getUserNotification(type, event, data) {
  return getNotificationTemplate(type, event, data, false);
}
function getAdminNotification(type, event, data) {
  return getNotificationTemplate(type, event, data, true);
}

// 🧩 GENERIC NOTIFICATION TEMPLATE FETCHER – For direct lookups by type+event
function getNotificationTemplate(type, event, data = {}, isAdmin = false) {
  const templates = isAdmin ? adminNotificationTemplates : userNotificationTemplates;
  const templateKey = event ? `${type}_${event}` : type;
  const template = templates[templateKey] || templates[type];

  if (!template) {
    // Fallback generic notification (should never happen in production)
    return {
      title: '🔔 Notification',
      body: 'You have a new notification.',
      link: isAdmin ? '/admin/notifications' : '/user/notifications'
    };
  }
  const tpl = typeof template === 'function' ? template(data) : template;
  return {
    title: interpolate(tpl.title, data),
    body: interpolate(tpl.body, data),
    link: tpl.link ? interpolate(tpl.link, data) : null
  };
}

/* // 🧩 EXPORT EVERYTHING – Centralized for easy import elsewhere
export default {
  NotificationType,
  userNotificationBuilder,
  adminNotificationBuilder,
  getUserNotification,
  getAdminNotification,
  mergeUserAndPayload
}; */
const notificationSystem = {
  NotificationType,
  userNotificationBuilder,
  adminNotificationBuilder,
  getUserNotification,
  getAdminNotification,
  mergeUserAndPayload
};

export default notificationSystem;
