/**
 * notificationEvents.js
 * ============================================================
 * 🔔 Royal TVC: Unified Notification & Email Socket Handlers
 * - Creates notifications (user/admin) in DB
 * - Emits via Socket.io for instant updates
 * - Sends styled emails using user preference
 * - Honors user's sendEmails flag
 * - Always notifies admin, always emails admin
 * - 🚨 LOGS everything for robust debugging!
 * ============================================================
 */

import notificationSystem from '../constants/notificationSystem.js'; // 🧩 Template builder
import prisma from '../lib/prisma.js'; // 🗃️ DB ORM

import { sendEmailToAdmin } from '../lib/email/sendEmailToAdmin.js'; // ✉️ Admin
import { sendEmailToUser } from '../lib/email/sendEmailToUser.js'; // ✉️ User

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// 🛑 Ensure admin variables exist
if (!ADMIN_USER_ID || !ADMIN_EMAIL) {
  throw new Error('❌ Missing ADMIN_USER_ID or ADMIN_EMAIL in environment');
}

/**
 * Registers all notification-related socket handlers
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {import('socket.io').Socket} socket - Connected client socket
 */
export default function registerNotificationSocketHandlers(io, socket) {
  // ========================================================================
  // 🛠️ Master Notification Creator: DB, Socket, Email (User or Admin)
  // ========================================================================
  async function createAndEmitNotification({
    recipientUserId,
    recipientEmail,
    shouldSendEmail,
    isAdminNotification,
    notificationType,
    notificationEventKey,
    templateData
  }) {
    // 📝 Build notification template for user or admin
    const notificationTemplate = isAdminNotification
      ? notificationSystem.getAdminNotification(
          notificationType,
          notificationEventKey,
          templateData
        )
      : notificationSystem.getUserNotification(
          notificationType,
          notificationEventKey,
          templateData
        );

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
    console.log(
      `📥 Notification created for ${isAdminNotification ? 'ADMIN' : 'USER'} [${recipientUserId}] - ${notificationType}`
    );

    // 📬 Emit notification instantly via socket
    io.to(recipientUserId).emit('notification_received', createdNotification);

    // 📤 Log socket send
    console.log(
      `📤 Notification sent to ${isAdminNotification ? 'ADMIN' : 'USER'} (${recipientUserId})`
    );

    // ✉️ Optionally send email (admin always gets email)
    if (shouldSendEmail) {
      try {
        if (isAdminNotification) {
          // 👑 Admin email: no signature
          await sendEmailToAdmin({
            subject: notificationTemplate.title,
            title: notificationTemplate.title,
            contentHtml: notificationTemplate.body.replace(/\n/g, '<br>'),
            includeSignature: false
          });
          // 📧 Log admin email sent
          console.log(`✉️ [EMAIL] Admin email sent to ${ADMIN_EMAIL}`);
        } else {
          // 👤 User email: with signature
          await sendEmailToUser({
            to: recipientEmail,
            subject: notificationTemplate.title,
            title: notificationTemplate.title,
            contentHtml: notificationTemplate.body.replace(/\n/g, '<br>'),
            includeSignature: true
          });
          // 📧 Log user email sent
          console.log(`✉️ [EMAIL] User email sent to ${recipientEmail}`);
        }
      } catch (emailError) {
        // ❌ Log email send error
        console.error('❌ [EMAIL] Failed to send email:', emailError);
      }
    }

    return createdNotification;
  }

  // =========================================================================
  // 🎯 EVENT: Notify Both User & Admin (and email if allowed)
  // =========================================================================
  socket.on('create_notification_for_both', async (payload) => {
    try {
      // 👤 Get the latest user info (incl. sendEmails flag)
      const targetUser = await prisma.user.findUnique({
        where: { user_id: payload.user.user_id },
        select: { user_id: true, email: true, sendEmails: true }
      });
      if (!targetUser) throw new Error(`User ${payload.user.user_id} not found`);

      const combinedTemplateData = { ...targetUser, ...(payload.data || {}) };

      // 👑 Admin notification (always emails)
      const adminNotification = await createAndEmitNotification({
        recipientUserId: ADMIN_USER_ID,
        recipientEmail: ADMIN_EMAIL,
        shouldSendEmail: true,
        isAdminNotification: true,
        notificationType: payload.type,
        notificationEventKey: payload.event,
        templateData: combinedTemplateData
      });

      // 👤 User notification (respects user's email preference)
      const userNotification = await createAndEmitNotification({
        recipientUserId: targetUser.user_id,
        recipientEmail: targetUser.email,
        shouldSendEmail: targetUser.sendEmails,
        isAdminNotification: false,
        notificationType: payload.type,
        notificationEventKey: payload.event,
        templateData: combinedTemplateData
      });

      // ✅ Acknowledge both creations
      socket.emit('notification_created', {
        success: true,
        adminNotification,
        userNotification
      });

      // 🗒️ Log acknowledgment sent
      console.log(
        `✅ [SOCKET] notification_created emitted with both admin and user notifications`
      );
    } catch (error) {
      // ❌ Log error
      console.error('❌ [SOCKET] create_notification_for_both error:', error);
      socket.emit('notifications_error', { message: error.message });
    }
  });

  // =========================================================================
  // 👑 EVENT: Admin-Only Notification (always emails)
  // =========================================================================
  socket.on('create_notification_for_admin', async (payload) => {
    try {
      const adminNotification = await createAndEmitNotification({
        recipientUserId: ADMIN_USER_ID,
        recipientEmail: ADMIN_EMAIL,
        shouldSendEmail: true,
        isAdminNotification: true,
        notificationType: payload.type,
        notificationEventKey: payload.event,
        templateData: payload.data || {}
      });
      socket.emit('notification_created', { success: true, adminNotification });
      console.log(`✅ [SOCKET] notification_created emitted for admin`);
    } catch (error) {
      console.error('❌ [SOCKET] create_notification_for_admin error:', error);
      socket.emit('notifications_error', { message: error.message });
    }
  });

  // =========================================================================
  // 👤 EVENT: User-Only Notification (respects sendEmails flag)
  // =========================================================================
  socket.on('create_notification_for_user', async (payload) => {
    try {
      const targetUser = await prisma.user.findUnique({
        where: { user_id: payload.user.user_id },
        select: { user_id: true, email: true, sendEmails: true }
      });
      if (!targetUser) throw new Error(`User ${payload.user.user_id} not found`);

      const userNotification = await createAndEmitNotification({
        recipientUserId: targetUser.user_id,
        recipientEmail: targetUser.email,
        shouldSendEmail: targetUser.sendEmails,
        isAdminNotification: false,
        notificationType: payload.type,
        notificationEventKey: payload.event,
        templateData: { ...targetUser, ...(payload.data || {}) }
      });

      socket.emit('notification_created', { success: true, userNotification });
      console.log(`✅ [SOCKET] notification_created emitted for user`);
    } catch (error) {
      console.error('❌ [SOCKET] create_notification_for_user error:', error);
      socket.emit('notifications_error', { message: error.message });
    }
  });
}
