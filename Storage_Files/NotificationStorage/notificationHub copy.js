/**
 * ================== notificationHub.js ==================
 * 🧩
 * CENTRALIZED NOTIFICATION UTILITY FOR ROYAL TV
 * ---------------------------------------------------------
 * - Imports: NotificationType, NotificationLinks, premade templates for admin/user
 * - Exports:
 *    • getAdminNotificationTemplate(type, data)   // returns {title, body}
 *    • getUserNotificationTemplate(type, data)    // returns {title, body}
 *    • getNotificationLink(notification, isAdmin) // returns string
 *    • All enums and full template/link objects
 * =========================================================
 */

// ========= Imports =========
import { NotificationType, NotificationLinks, getNotificationLink } from './notificationTypes';
import AdminNotificationTemplates from '../../src/constants/adminNotificationTemplates';
import UserNotificationTemplates from '../../src/constants/userNotificationTemplates';

// ========= Template getters =========

// 🛡️ Get admin-side notification (returns { title, body } or fallback)
export function getAdminNotificationTemplate(type, data = {}) {
  if (AdminNotificationTemplates[type]) {
    return AdminNotificationTemplates[type](data);
  }
  // 🟠 Fallback if type not found
  return {
    title: '🔔 Admin Notification',
    body: 'You have a new admin notification.'
  };
}

// 👤 Get user-side notification (returns { title, body } or fallback)
export function getUserNotificationTemplate(type, data = {}) {
  if (UserNotificationTemplates[type]) {
    return UserNotificationTemplates[type](data);
  }
  // 🟠 Fallback if type not found
  return {
    title: '🔔 Notification',
    body: 'You have a new notification.'
  };
}

// ========= Link resolver =========

// 🧭 Get the correct notification link for user or admin context
//    (notification object must include .type and any ids)
export { getNotificationLink }; // Already imported from notificationLinks.js

// ========= Direct export of all objects/constants (optional) =========
export {
  NotificationType,
  NotificationLinks,
  AdminNotificationTemplates,
  UserNotificationTemplates
};

// ========= Default export (optional: the hub) =========
const NotificationHub = {
  NotificationType,
  NotificationLinks,
  AdminNotificationTemplates,
  UserNotificationTemplates,
  getAdminNotificationTemplate,
  getUserNotificationTemplate,
  getNotificationLink
};

export default NotificationHub;

/**
 * =================== USAGE GUIDE ===================
 * import {
 *   getAdminNotificationTemplate,
 *   getUserNotificationTemplate,
 *   getNotificationLink,
 *   NotificationType
 * } from '@/constants/notificationHub';
 *
 * // Example:
 * const { title, body } = getAdminNotificationTemplate(NotificationType.PAYMENT, notificationData);
 * const link = getNotificationLink(notification, true); // isAdmin = true
 * ===================================================
 */
