/**
 * ==================== notificationEvents.js ====================
 * 🔔 Unified Socket Notification Events for Royal TV
 *
 * - Handles all notification creation for Admin & User via Socket.IO
 * - Uses premade templates/builders for DRY, human-readable notifications
 * - Real-time DB + Socket updates, emails, mark as read, counts, fetch & refresh
 * - Robust logging at every step!
 * ===============================================================
 */

import logger from '../lib/core/logger.js';
import notificationSystem from '../constants/notificationSystem.js';
import prisma from '../lib/core/prisma.js';
import { sendEmailToAdmin } from '../lib/email/sendEmailToAdmin.js';
import { sendEmailToUser } from '../lib/email/sendEmailToUser.js';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!ADMIN_USER_ID || !ADMIN_EMAIL) {
  throw new Error('❌ Missing ADMIN_USER_ID or ADMIN_EMAIL in environment');
}

// 📦 Helper: Fetch all notifications and counts at once
async function getAllNotifications(user_id) {
  const [notifications, unreadCount, total] = await Promise.all([
    prisma.notification.findMany({
      where: { user_id },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.notification.count({ where: { user_id, is_read: false } }),
    prisma.notification.count({ where: { user_id } })
  ]);
  return { notifications, unreadCount, total };
}

// 🛠️ Main notification + email sender utility
async function createAndEmitNotification({
  recipientUserId,
  recipientEmail,
  shouldSendEmail,
  isAdminNotification,
  notificationType,
  notificationEventKey,
  templateData,
  io
}) {
  // 📝 Build notification template for user or admin
  const notificationTemplate = isAdminNotification
    ? notificationSystem.getAdminNotification(notificationType, notificationEventKey, templateData)
    : notificationSystem.getUserNotification(notificationType, notificationEventKey, templateData);

  // 💾 Save notification to database
  const createdNotification = await prisma.notification.create({
    data: {
      user_id: recipientUserId,
      title: notificationTemplate.title,
      body: notificationTemplate.body,
      link: notificationTemplate.link,
      type: notificationType,
      is_read: false,
      createdAt: new Date()
    }
  });

  // 📥 Log notification creation
  logger.log(
    `📥 Notification created for ${isAdminNotification ? 'ADMIN' : 'USER'} [${createdNotification.notification_id}] - ${notificationType}`
  );

  // 📬 Emit notification instantly via socket
  io.to(recipientUserId).emit('notification_received', createdNotification);
  logger.log(
    `📤 Notification sent to ${isAdminNotification ? 'ADMIN' : 'USER'} (${recipientUserId})`
  );

  // ✉️ Optionally send email (admin always gets email)
  if (shouldSendEmail) {
    try {
      if (isAdminNotification) {
        await sendEmailToAdmin({
          subject: notificationTemplate.title,
          title: notificationTemplate.title,
          contentHtml: notificationTemplate.body.replace(/\n/g, '<br>'),
          includeSignature: false
        });
        logger.log(`✉️ [EMAIL] Admin email sent to ${ADMIN_EMAIL}`);
      } else {
        await sendEmailToUser({
          to: recipientEmail,
          subject: notificationTemplate.title,
          title: notificationTemplate.title,
          contentHtml: notificationTemplate.body.replace(/\n/g, '<br>'),
          includeSignature: true
        });
        logger.log(`✉️ [EMAIL] User email sent to ${recipientEmail}`);
      }
    } catch (emailError) {
      logger.error('❌ [EMAIL] Failed to send email:', emailError);
    }
  }

  return createdNotification;
}

// ================== MAIN EXPORT ==========================
export default function registerNotificationEvents(io, socket) {
  // 1️⃣ CREATE NOTIFICATION FOR BOTH ADMIN AND USER
  socket.on('create_notification_for_both', async (payload) => {
    try {
      const user = await prisma.user.findUnique({ where: { user_id: payload.user.user_id } });
      if (!user) throw new Error(`User not found: ${payload.user.user_id}`);

      const mergedData = { ...user, ...(payload.data || {}) };

      // 👑 Admin notification (always emails)
      const adminNotification = await createAndEmitNotification({
        recipientUserId: ADMIN_USER_ID,
        recipientEmail: ADMIN_EMAIL,
        shouldSendEmail: true,
        isAdminNotification: true,
        notificationType: payload.type,
        notificationEventKey: payload.event,
        templateData: mergedData,
        io
      });

      // 👤 User notification (respects user's email preference)
      const userNotification = await createAndEmitNotification({
        recipientUserId: user.user_id,
        recipientEmail: user.email,
        shouldSendEmail: user.sendEmails,
        isAdminNotification: false,
        notificationType: payload.type,
        notificationEventKey: payload.event,
        templateData: mergedData,
        io
      });

      socket.emit('notification_created', {
        success: true,
        adminNotification,
        userNotification
      });
      logger.log('✅ [SOCKET] notification_created emitted with both admin and user notifications');
    } catch (error) {
      logger.error('❌ [SOCKET] Error creating notification for both:', error);
      socket.emit('notifications_error', { message: 'Error creating notification for both' });
    }
  });

  // 2️⃣ CREATE NOTIFICATION FOR ADMIN ONLY
  socket.on('create_notification_for_admin', async (payload) => {
    try {
      const adminNotification = await createAndEmitNotification({
        recipientUserId: ADMIN_USER_ID,
        recipientEmail: ADMIN_EMAIL,
        shouldSendEmail: true,
        isAdminNotification: true,
        notificationType: payload.type,
        notificationEventKey: payload.event,
        templateData: payload.data || {},
        io
      });
      socket.emit('notification_created', { success: true, adminNotification });
      logger.log('✅ [SOCKET] notification_created emitted for admin');
    } catch (error) {
      logger.error('❌ [SOCKET] Error creating admin notification:', error);
      socket.emit('notifications_error', { message: 'Error creating admin notification' });
    }
  });

  // 3️⃣ CREATE NOTIFICATION FOR USER ONLY
  socket.on('create_notification_for_user', async (payload) => {
    try {
      const targetUser = await prisma.user.findUnique({
        where: { user_id: payload.user.user_id },
        select: { user_id: true, email: true, sendEmails: true }
      });
      if (!targetUser) throw new Error(`User not found: ${payload.user.user_id}`);

      const userNotification = await createAndEmitNotification({
        recipientUserId: targetUser.user_id,
        recipientEmail: targetUser.email,
        shouldSendEmail: targetUser.sendEmails,
        isAdminNotification: false,
        notificationType: payload.type,
        notificationEventKey: payload.event,
        templateData: { ...targetUser, ...(payload.data || {}) },
        io
      });

      socket.emit('notification_created', { success: true, userNotification });
      logger.log('✅ [SOCKET] notification_created emitted for user');
    } catch (error) {
      logger.error('❌ [SOCKET] Error creating user notification:', error);
      socket.emit('notifications_error', { message: 'Error creating user notification' });
    }
  });

  // 4️⃣ FETCH ALL NOTIFICATIONS (on page load/refresh)
  socket.on('fetch_notifications', async ({ user_id }) => {
    try {
      const { notifications, unreadCount, total } = await getAllNotifications(user_id);
      logger.log(
        `🔔 [SOCKET] notifications: total=${total}, unread=${unreadCount}, user_id=${user_id}`
      );
      socket.emit('notifications_list', { notifications, unreadCount, total });
    } catch (error) {
      logger.error('❌ [SOCKET] Error fetching notifications:', error);
      socket.emit('notifications_list', []);
    }
  });

  // 5️⃣ COUNT NOTIFICATIONS (for badge/bubble only)
  socket.on('count_notifications', async ({ user_id }) => {
    try {
      const total = await prisma.notification.count({ where: { user_id } });
      const unread = await prisma.notification.count({ where: { user_id, is_read: false } });
      const read = total - unread;
      logger.log(
        `🔢 [SOCKET] notifications count: total=${total}, unread=${unread}, read=${read}, user_id=${user_id}`
      );
      socket.emit('notifications_count', { total, unread, read });
    } catch (error) {
      logger.error('❌ [SOCKET] Error counting notifications:', error);
      socket.emit('notifications_count', { total: 0, unread: 0, read: 0 });
    }
  });

  // 6️⃣ MARK AS READ (single notification)
  socket.on('mark_notification_read', async ({ notification_id }) => {
    try {
      await prisma.notification.update({
        where: { notification_id },
        data: { is_read: true }
      });
      socket.emit('notification_marked_read', { notification_id });
      logger.log(`🟢 [SOCKET] notification ${notification_id} marked read`);
    } catch (error) {
      logger.error('❌ [SOCKET] Error marking notification as read:', error);
      socket.emit('notifications_error', { message: 'Error marking as read' });
    }
  });

  // 7️⃣ REFRESH NOTIFICATIONS (manual refresh request from client)
  socket.on('refresh_notifications', async ({ user_id }) => {
    try {
      const { notifications, unreadCount, total } = await getAllNotifications(user_id);
      logger.log(
        `🔄 [SOCKET] notifications refreshed: total=${total}, unread=${unreadCount}, user_id=${user_id}`
      );
      socket.emit('notifications_list', { notifications, unreadCount, total });
    } catch (error) {
      logger.error('❌ [SOCKET] Error refreshing notifications:', error);
      socket.emit('notifications_list', []);
    }
  });

  // 8️⃣ CREATE NOTIFICATION (legacy/generic for advanced/manual)
  socket.on('create_notification', async (payload) => {
    /**
     * payload: {
     *   type: NotificationType,    // required (string)
     *   event?: string,            // (optional: for event-based templates)
     *   user: { ...userData },     // required: recipient user (user_id, email, name, etc)
     *   data?: { ...extra },       // additional fields (e.g. freeTrial, subscription, payment, message, etc.)
     *   forAdmin?: boolean,        // if true, use admin templates (and type field) for content
     * }
     */
    try {
      const getNotification = payload.forAdmin
        ? notificationSystem.getAdminNotification
        : notificationSystem.getUserNotification;

      const mergedData = {
        ...(payload.user || {}),
        ...(payload.data || {})
      };

      const notification = getNotification(payload.type, payload.event, mergedData);

      const created = await prisma.notification.create({
        data: {
          user_id: payload.user.user_id,
          title: notification.title,
          body: notification.body,
          link: notification.link,
          type: payload.type,
          is_read: false,
          createdAt: new Date(),
          ...((payload.data || {}).additionalPrismaFields || {})
        }
      });

      io.to(payload.user.user_id).emit('notification_received', created);
      socket.emit('notification_created', { success: true, notification: created });
    } catch (error) {
      logger.error('❌ [SOCKET] Error creating notification via socket:', error);
      socket.emit('notifications_error', { message: 'Error creating notification' });
    }
  });

  // 🚧 Bulk mark/delete scaffolded for future
  // 9️⃣ DELETE A SINGLE NOTIFICATION
  socket.on('delete_notification', async ({ notification_id, user_id }) => {
    try {
      await prisma.notification.delete({
        where: { notification_id }
      });
      // 🗑️ Emit new notification list to user after deletion
      const { notifications, unreadCount, total } = await getAllNotifications(user_id);
      io.to(user_id).emit('notifications_list', { notifications, unreadCount, total });
      socket.emit('notification_deleted', [notification_id]);
      logger.log(`🗑️ [SOCKET] notification ${notification_id} deleted`);
    } catch (error) {
      logger.error('❌ [SOCKET] Error deleting notification:', error);
      socket.emit('notifications_error', { message: 'Error deleting notification' });
    }
  });

  // 🔥 CLEAR ALL NOTIFICATIONS (Danger Zone!)
  socket.on('clear_notifications', async ({ user_id }) => {
    try {
      await prisma.notification.deleteMany({ where: { user_id } });
      // ⚡ Emit new (empty) notification list to user after clearing
      io.to(user_id).emit('notifications_list', { notifications: [], unreadCount: 0, total: 0 });
      socket.emit('notifications_cleared', { user_id });
      logger.log(`🔥 [SOCKET] All notifications cleared for user ${user_id}`);
    } catch (error) {
      logger.error('❌ [SOCKET] Error clearing notifications:', error);
      socket.emit('notifications_error', { message: 'Error clearing notifications' });
    }
  });
}
