/**
 *  ==================== notificationEvents.js ====================
 *  🔔 Unified Socket Notification Events for Royal TV
 *
 *  - Handles all notification creation for Admin & User via Socket.IO
 *  - Uses premade templates/builders for DRY, human-readable notifications
 *  - Real-time DB + Socket updates, mark as read, counts, and fetch
 *
 *  ==============================================================
 *  📦 EXPORTED:
 *    • registerNotificationEvents(io, socket)
 *
 *  ==============================================================
 *  🏷️ EVENTS HANDLED:
 *    1. create_notification_for_both      // Notifies both Admin & User
 *    2. create_notification_for_admin     // Notifies only Admin
 *    3. create_notification_for_user      // Notifies only User
 *    4. fetch_notifications               // Get all notifications for user
 *    5. count_notifications               // Get badge/count for user
 *    6. mark_notification_read            // Mark as read (single)
 *    7. refresh_notifications             // Manual refresh of notifications
 *    8. create_notification               // Legacy/generic single-notification
 *    // (Bulk mark/delete is scaffolded for the future)
 *
 *  ==============================================================
 *  📌 USAGE:
 *    import registerNotificationEvents from './notificationEvents.js';
 *    registerNotificationEvents(io, socket);
 *  ==============================================================
 */

import notificationSystem from '../constants/notificationSystem.js'; // Central notification builder
import prisma from '../lib/prisma.js'; // 🗃️ Import your Prisma client

// 🗝️ Load admin user ID from environment for security
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// 🚨 Guard against missing ADMIN_USER_ID
if (!ADMIN_USER_ID) {
  throw new Error('❌ ADMIN_USER_ID environment variable is not set!');
}

// 📦 Helper: Fetch all notifications and counts at once
async function getAllNotifications(user_id) {
  // 🚀 Run all queries in parallel for speed
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

// ========================= MAIN EXPORT ===========================
export default function registerNotificationEvents(io, socket) {
  // CREATE NOTIFICATION FOR BOTH ADMIN AND USER
  socket.on('create_notification_for_both', async (payload) => {
    try {
      const user = await prisma.user.findUnique({ where: { user_id: payload.user.user_id } });
      if (!user) throw new Error(`User not found: ${payload.user.user_id}`);

      const mergedData = { ...user, ...(payload.data || {}) };

      const adminNotification = notificationSystem.getAdminNotification(
        payload.type,
        payload.event,
        mergedData
      );
      const userNotification = notificationSystem.getUserNotification(
        payload.type,
        payload.event,
        mergedData
      );

      const createdAdminNotification = await prisma.notification.create({
        data: {
          user_id: ADMIN_USER_ID,
          title: adminNotification.title,
          body: adminNotification.body,
          link: adminNotification.link,
          type: payload.type,
          is_read: false,
          createdAt: new Date()
        }
      });
      console.log(
        `📥 Notification created for ADMIN [${createdAdminNotification.notification_id}] - ${payload.type}`
      );

      const createdUserNotification = await prisma.notification.create({
        data: {
          user_id: user.user_id,
          title: userNotification.title,
          body: userNotification.body,
          link: userNotification.link,
          type: payload.type,
          is_read: false,
          createdAt: new Date()
        }
      });
      console.log(
        `📥 Notification created for USER [${createdUserNotification.notification_id}] - ${payload.type}`
      );

      io.to(ADMIN_USER_ID).emit('notification_received', createdAdminNotification);
      console.log(`📤 Notification sent to ADMIN (${ADMIN_USER_ID})`);

      io.to(user.user_id).emit('notification_received', createdUserNotification);
      console.log(`📤 Notification sent to USER (${user.user_id})`);

      socket.emit('notification_created', {
        success: true,
        adminNotification: createdAdminNotification,
        userNotification: createdUserNotification
      });
    } catch (error) {
      console.error('❌ [SOCKET] Error creating notification for both:', error);
      socket.emit('notifications_error', { message: 'Error creating notification for both' });
    }
  });

  // CREATE NOTIFICATION FOR ADMIN ONLY
  socket.on('create_notification_for_admin', async (payload) => {
    try {
      const adminNotification = notificationSystem.getAdminNotification(
        payload.type,
        payload.event,
        payload.data || {}
      );

      const createdAdminNotification = await prisma.notification.create({
        data: {
          user_id: ADMIN_USER_ID,
          title: adminNotification.title,
          body: adminNotification.body,
          link: adminNotification.link,
          type: payload.type,
          is_read: false,
          createdAt: new Date()
        }
      });
      console.log(
        `📥 Notification created for ADMIN [${createdAdminNotification.notification_id}] - ${payload.type}`
      );

      io.to(ADMIN_USER_ID).emit('notification_received', createdAdminNotification);
      console.log(`📤 Notification sent to ADMIN (${ADMIN_USER_ID})`);

      socket.emit('notification_created', {
        success: true,
        adminNotification: createdAdminNotification
      });
    } catch (error) {
      console.error('❌ [SOCKET] Error creating admin notification:', error);
      socket.emit('notifications_error', { message: 'Error creating admin notification' });
    }
  });

  // CREATE NOTIFICATION FOR USER ONLY
  socket.on('create_notification_for_user', async (payload) => {
    try {
      const userNotification = notificationSystem.getUserNotification(
        payload.type,
        payload.event,
        payload.data || {}
      );

      const createdUserNotification = await prisma.notification.create({
        data: {
          user_id: payload.user.user_id,
          title: userNotification.title,
          body: userNotification.body,
          link: userNotification.link,
          type: payload.type,
          is_read: false,
          createdAt: new Date()
        }
      });
      console.log(
        `📥 Notification created for USER [${createdUserNotification.notification_id}] - ${payload.type}`
      );

      io.to(payload.user.user_id).emit('notification_received', createdUserNotification);
      console.log(`📤 Notification sent to USER (${payload.user.user_id})`);

      socket.emit('notification_created', {
        success: true,
        userNotification: createdUserNotification
      });
    } catch (error) {
      console.error('❌ [SOCKET] Error creating user notification:', error);
      socket.emit('notifications_error', { message: 'Error creating user notification' });
    }
  });

  // 1️⃣ FETCH ALL NOTIFICATIONS (on page load/refresh)
  socket.on('fetch_notifications', async ({ user_id }) => {
    try {
      // 🟢 Fetch notifications & counts for this user
      const { notifications, unreadCount, total } = await getAllNotifications(user_id);

      // 🟠 Debug logging for totals!
      console.log(
        `🔔 [SOCKET] notifications: total=${total}, unread=${unreadCount}, user_id=${user_id}`
      );

      // 📤 Send full notification list to this socket
      socket.emit('notifications_list', { notifications, unreadCount, total });
    } catch (error) {
      console.error('❌ [SOCKET] Error fetching notifications:', error);
      socket.emit('notifications_list', []);
    }
  });

  // 2️⃣ COUNT NOTIFICATIONS (for badge/bubble only)
  socket.on('count_notifications', async ({ user_id }) => {
    try {
      // 🟢 Get just the counts for badge UI
      const total = await prisma.notification.count({ where: { user_id } });
      const unread = await prisma.notification.count({ where: { user_id, is_read: false } });
      const read = total - unread;

      // 🟡 Log for easy tracking
      console.log(
        `🔢 [SOCKET] notifications count: total=${total}, unread=${unread}, read=${read}, user_id=${user_id}`
      );

      // 📤 Send counts back to the client
      socket.emit('notifications_count', { total, unread, read });
    } catch (error) {
      console.error('❌ [SOCKET] Error counting notifications:', error);
      socket.emit('notifications_count', { total: 0, unread: 0, read: 0 });
    }
  });

  // 3️⃣ MARK AS READ (single notification)
  socket.on('mark_notification_read', async ({ notification_id }) => {
    try {
      // 🟢 Update a single notification as read
      await prisma.notification.update({
        where: { notification_id },
        data: { is_read: true }
      });

      // 📤 Let this socket know it worked
      socket.emit('notification_marked_read', { notification_id });
      // ✅ Log for clarity
      console.log(`🟢 [SOCKET] notification ${notification_id} marked read`);
    } catch (error) {
      console.error('❌ [SOCKET] Error marking notification as read:', error);
      socket.emit('notifications_error', { message: 'Error marking as read' });
    }
  });

  // 5️⃣ REFRESH NOTIFICATIONS (manual refresh request from client)
  socket.on('refresh_notifications', async ({ user_id }) => {
    try {
      // 🟢 Get the latest notifications and counts
      const { notifications, unreadCount, total } = await getAllNotifications(user_id);

      // 🟠 Log for debug
      console.log(
        `🔄 [SOCKET] notifications refreshed: total=${total}, unread=${unreadCount}, user_id=${user_id}`
      );

      // 📤 Send the latest list to just this socket (or use io.to(user_id) for all tabs)
      socket.emit('notifications_list', { notifications, unreadCount, total });
    } catch (error) {
      console.error('❌ [SOCKET] Error refreshing notifications:', error);
      socket.emit('notifications_list', []);
    }
  });

  // 6️⃣ FUTURE: BULK MARK-ALL-AS-READ or DELETE (for admin/tools)
  // socket.on('mark_all_notifications_read', async ({ user_id }) => {
  //   try {
  //     await prisma.notification.updateMany({
  //       where: { user_id, is_read: false },
  //       data: { is_read: true }
  //     });
  //     const { notifications, unreadCount, total } = await getAllNotifications(user_id);
  //     io.to(user_id).emit('notifications_list', notifications);
  //     console.log(`🔄 [SOCKET] All notifications marked as read for user: ${user_id}`);
  //   } catch (error) {
  //     console.error('❌ [SOCKET] Error bulk marking notifications as read:', error);
  //   }
  // });

  // 7️⃣ CREATE NOTIFICATION (socket-driven, replaces REST creation)
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
      // 1️⃣ Select builder function based on forAdmin flag
      const getNotification = payload.forAdmin
        ? notificationSystem.getAdminNotification
        : notificationSystem.getUserNotification;

      // 2️⃣ Compose merged data for the builder/template
      const mergedData = {
        ...(payload.user || {}),
        ...(payload.data || {})
      };

      // 3️⃣ Generate notification content (title, body, link)
      const notification = getNotification(payload.type, payload.event, mergedData);

      // 4️⃣ Save notification to DB for the specified user (user_id could be admin or normal user)
      const created = await prisma.notification.create({
        data: {
          user_id: payload.user.user_id,
          title: notification.title,
          body: notification.body,
          link: notification.link,
          type: payload.type,
          is_read: false,
          createdAt: new Date(),
          // Optionally, allow extra Prisma fields for advanced templates
          ...((payload.data || {}).additionalPrismaFields || {})
        }
      });

      // 5️⃣ Instantly push to the user (admin or not)
      io.to(payload.user.user_id).emit('notification_received', created);

      // 6️⃣ (Optional) Ack to sender
      socket.emit('notification_created', { success: true, notification: created });
    } catch (error) {
      console.error('❌ [SOCKET] Error creating notification via socket:', error);
      socket.emit('notifications_error', { message: 'Error creating notification' });
    }
  });
}
