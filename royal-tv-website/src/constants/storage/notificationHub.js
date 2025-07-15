/**
 *   ====================== notificationHub.js ======================
 * 📦
 * Centralized notification utility using static template JSON.
 * - Universal template builder, per-type shortcut helpers for admin/user.
 * ==================================================================
 */

import { userNotificationTemplates } from '@/constants/userNotificationTemplates';
import { adminNotificationTemplates } from '@/constants/adminNotificationTemplates';

// ✨ Simple template interpolator for notification links and text
function interpolate(template, data) {
  if (!template) return null;
  return template.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? '');
}

// 1️⃣ Universal builder: get title, body, and link for any type & context
export function getNotificationTemplate(type, data = {}, isAdmin = false) {
  const templates = isAdmin ? adminNotificationTemplates : userNotificationTemplates;
  const template = templates[type];
  if (!template) {
    return {
      title: '🔔 Notification',
      body: 'You have a new notification.',
      link: isAdmin ? '/admin/notifications' : '/user/notifications'
    };
  }
  return {
    title: interpolate(template.title, data),
    body: interpolate(template.body, data),
    link: interpolate(template.link, data)
  };
}

// 2️⃣ Per-type shortcut helpers (user-side)
export function buildUserNewUserRegistrationNotification(data) {
  return getNotificationTemplate(NotificationType.NEW_USER_REGISTRATION, data, false);
}
export function buildUserFreeTrialNotification(data) {
  return getNotificationTemplate(NotificationType.FREE_TRIAL_REQUEST, data, false);
}
export function buildUserSubscriptionNotification(data) {
  return getNotificationTemplate(NotificationType.SUBSCRIPTION, data, false);
}
export function buildUserPaymentNotification(data) {
  return getNotificationTemplate(NotificationType.PAYMENT, data, false);
}
export function buildUserLiveChatMessageNotification(data) {
  return getNotificationTemplate(NotificationType.LIVE_CHAT_MESSAGE, data, false);
}
export function buildUserBubbleChatMessageNotification(data) {
  return getNotificationTemplate(NotificationType.BUBBLE_CHAT_MESSAGE, data, false);
}

// 3️⃣ Per-type shortcut helpers (admin-side)
export function buildAdminNewUserRegistrationNotification(data) {
  return getNotificationTemplate(NotificationType.NEW_USER_REGISTRATION, data, true);
}
export function buildAdminFreeTrialNotification(data) {
  return getNotificationTemplate(NotificationType.FREE_TRIAL_REQUEST, data, true);
}
export function buildAdminSubscriptionNotification(data) {
  return getNotificationTemplate(NotificationType.SUBSCRIPTION, data, true);
}
export function buildAdminPaymentNotification(data) {
  return getNotificationTemplate(NotificationType.PAYMENT, data, true);
}
export function buildAdminLiveChatMessageNotification(data) {
  return getNotificationTemplate(NotificationType.LIVE_CHAT_MESSAGE, data, true);
}
export function buildAdminBubbleChatMessageNotification(data) {
  return getNotificationTemplate(NotificationType.BUBBLE_CHAT_MESSAGE, data, true);
}

// 4️⃣ Export everything for full flexibility
export default {
  getNotificationTemplate,
  buildUserNewUserRegistrationNotification,
  buildUserFreeTrialNotification,
  buildUserSubscriptionNotification,
  buildUserPaymentNotification,
  buildUserLiveChatMessageNotification,
  buildUserBubbleChatMessageNotification,
  buildAdminNewUserRegistrationNotification,
  buildAdminFreeTrialNotification,
  buildAdminSubscriptionNotification,
  buildAdminPaymentNotification,
  buildAdminLiveChatMessageNotification,
  buildAdminBubbleChatMessageNotification,
  NotificationType,
  userNotificationTemplates,
  adminNotificationTemplates
};
