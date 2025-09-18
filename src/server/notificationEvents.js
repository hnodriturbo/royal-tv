/**
 * ==================== notificationEvents.js ====================
 * 🔔 Unified Socket Notification Events (Bulletproof Edition)
 *
 * ✅ DB row = English snapshot only (single source of truth)
 * ✅ Emits/Emails = localized from socket.data.currentLocale
 * ✅ Sanitizes every outbound row (prevents React #130)
 * ================================================================
 */

import notificationSystem from '../constants/notificationSystem.js'; // 🧩 templates
import prisma from '../lib/core/prisma.js'; // 🗄️ DB
import { sendEmailToAdmin } from '../lib/email/sendEmailToAdmin.js'; // ✉️ admin
import { sendEmailToUser } from '../lib/email/sendEmailToUser.js'; // ✉️ user

import {
  sanitizeNotificationForClient,
  sanitizeNotificationListForClient,
  localizeUserNotification,
  getOutboundLocale
} from './notificationHelpers.js';

// --- i18n seed for socket notifications (prod-safe) ---
import fs from 'node:fs'; // 📖 read files
import path from 'node:path'; // 🛣️ cross-OS path building

(function seedSocketDictionariesOnce() {
  // 🤏 helper: is the current global empty or missing?
  const isEmptyDicts = (g) => {
    if (!g || typeof g !== 'object') return true; // 🕳️ no global yet
    const enSize = Object.keys(g.en || {}).length; // 🔢 count keys
    const isSize = Object.keys(g.is || {}).length;
    return enSize === 0 && isSize === 0; // 🧪 both empty → treat as "not loaded"
  };

  // 🧯 only load if missing or empty
  if (!isEmptyDicts(globalThis.__ROYAL_TRANSLATIONS__)) {
    console.log('[i18n] notificationEvents: using preloaded translations'); // 👍
    return; // 🏁 already good
  }

  try {
    const base = path.resolve(process.cwd(), 'src', 'messages'); // 🗺️ <cwd>/src/messages
    const en = JSON.parse(fs.readFileSync(path.join(base, 'en.json'), 'utf8')); // 🇬🇧
    const is = JSON.parse(fs.readFileSync(path.join(base, 'is.json'), 'utf8')); // 🇮🇸
    globalThis.__ROYAL_TRANSLATIONS__ = { en, is }; // 🧰 set dictionaries
    console.log('[i18n] notificationEvents: ✅ translations loaded from', base); // 🎉
  } catch (e) {
    console.warn('[i18n] notificationEvents: ⚠️ failed to load translations:', e?.message); // 🧱
    // 🤝 final fallback: still set keys so downstream code remains safe
    globalThis.__ROYAL_TRANSLATIONS__ = { en: {}, is: {} }; // 🪺 empty but present
  }
});

// 🧭 admin targets
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || null;

// ================================================================
// 🧱 Prisma helpers
// ================================================================
async function safeCreateNotificationRow(data) {
  try {
    return await prisma.notification.create({ data });
  } catch (err) {
    console.warn('⚠️ [notifications] DB create failed; emitting ephemeral row:', err?.message);
    return {
      ...data,
      notification_id: `ephemeral_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEphemeral: true
    };
  }
}

async function safeFindUserForNotification(user_id) {
  try {
    return await prisma.user.findUnique({
      where: { user_id },
      select: { user_id: true, email: true, sendEmails: true }
    });
  } catch (err) {
    console.warn('⚠️ [notifications] DB user lookup failed:', err?.message);
    return null;
  }
}

// ================================================================
// ✨ Create + Emit + Email
// ================================================================
export async function createAndDispatchNotification({
  io,
  socket,
  isAdmin,
  recipientUserId,
  recipientEmail,
  shouldEmail,
  type,
  event,
  data
}) {
  const englishSource = isAdmin
    ? notificationSystem.getAdminNotification(type, event, data)
    : notificationSystem.getUserNotification(type, event, data);

  const createdRow = await safeCreateNotificationRow({
    user_id: recipientUserId,
    title: englishSource.title,
    body: englishSource.body,
    link: englishSource.link,
    type,
    event: event || null,
    for_admin: Boolean(isAdmin),
    data,
    is_read: false
  });

  const safeRow = sanitizeNotificationForClient(createdRow);

  if (isAdmin) {
    if (recipientUserId) io.to(recipientUserId).emit('notification_received', safeRow);
  } else {
    const locale = getOutboundLocale(socket);
    const localized = await localizeUserNotification({
      locale,
      type,
      event,
      english: englishSource,
      data
    });
    // ✅ Sanitize for client the notification received to be a string, not an object
    const safeLocalized = sanitizeNotificationForClient(localized);
    if (recipientUserId) {
      io.to(recipientUserId).emit('notification_received', { ...safeRow, ...safeLocalized });
    }
  }

  if (shouldEmail) {
    try {
      if (isAdmin && ADMIN_EMAIL) {
        await sendEmailToAdmin({
          subject: safeRow.title || 'Notification',
          title: safeRow.title || 'Notification',
          contentHtml: (safeRow.body || '').replace(/\n/g, '<br>'),
          includeSignature: false
        });
      } else if (!isAdmin && recipientEmail) {
        const locale = getOutboundLocale(socket);
        const { title, body } = await localizeUserNotification({
          locale,
          type,
          event,
          english: englishSource,
          data
        });
        await sendEmailToUser({
          to: recipientEmail,
          subject: title || safeRow.title || 'Notification',
          title: title || safeRow.title || 'Notification',
          contentHtml: (body || safeRow.body || '').replace(/\n/g, '<br>'),
          includeSignature: true
        });
      }
    } catch (err) {
      console.warn('⚠️ [notifications] email send failed:', err?.message);
    }
  }

  return safeRow;
}

// ================================================================
// 🔌 Register socket listeners
// ================================================================
export default function registerNotificationEvents(io, socket) {
  // 🤝 Both admin + user
  socket.on('create_notification_for_both', async ({ type, event, user, data: payload }) => {
    try {
      const templateData = notificationSystem.mergeUserAndPayload(user, payload);

      if (ADMIN_USER_ID) {
        await createAndDispatchNotification({
          io,
          socket,
          isAdmin: true,
          recipientUserId: ADMIN_USER_ID,
          recipientEmail: ADMIN_EMAIL,
          shouldEmail: Boolean(ADMIN_EMAIL),
          type,
          event,
          data: templateData
        });
        io.to(ADMIN_USER_ID).emit('notifications_list_refresh', { user_id: ADMIN_USER_ID });
      }

      const dbUser = await safeFindUserForNotification(user.user_id);
      if (!dbUser) throw new Error(`User not found: ${user.user_id}`);

      await createAndDispatchNotification({
        io,
        socket,
        isAdmin: false,
        recipientUserId: dbUser.user_id,
        recipientEmail: dbUser.email,
        shouldEmail: Boolean(dbUser.sendEmails),
        type,
        event,
        data: templateData
      });

      io.to(dbUser.user_id).emit('notifications_list_refresh', { user_id: dbUser.user_id });
    } catch (err) {
      console.warn('⚠️ create_notification_for_both', err?.message);
      socket.emit('notifications_error', { message: 'Error creating notification for both' });
    }
  });

  // 👑 Admin only
  socket.on('create_notification_for_admin', async ({ type, event, user, data: payload }) => {
    try {
      if (!ADMIN_USER_ID) return;
      const templateData = notificationSystem.mergeUserAndPayload(user, payload);
      await createAndDispatchNotification({
        io,
        socket,
        isAdmin: true,
        recipientUserId: ADMIN_USER_ID,
        recipientEmail: ADMIN_EMAIL,
        shouldEmail: Boolean(ADMIN_EMAIL),
        type,
        event,
        data: templateData
      });
      io.to(ADMIN_USER_ID).emit('notifications_list_refresh', { user_id: ADMIN_USER_ID });
    } catch (err) {
      console.warn('⚠️ create_notification_for_admin', err?.message);
    }
  });

  // 👤 User only
  socket.on('create_notification_for_user', async ({ type, event, user, data: payload }) => {
    try {
      const templateData = notificationSystem.mergeUserAndPayload(user, payload);
      const dbUser = await safeFindUserForNotification(user.user_id);
      if (!dbUser) throw new Error(`User not found: ${user.user_id}`);

      await createAndDispatchNotification({
        io,
        socket,
        isAdmin: false,
        recipientUserId: dbUser.user_id,
        recipientEmail: dbUser.email,
        shouldEmail: Boolean(dbUser.sendEmails),
        type,
        event,
        data: templateData
      });

      io.to(dbUser.user_id).emit('notifications_list_refresh', { user_id: dbUser.user_id });
    } catch (err) {
      console.warn('⚠️ create_notification_for_user', err?.message);
    }
  });

  // 📥 Fetch list
  socket.on('fetch_notifications', async ({ user_id }) => {
    try {
      const outboundLocale = getOutboundLocale(socket);
      let rows = [];
      try {
        rows = await prisma.notification.findMany({
          where: { user_id },
          orderBy: { createdAt: 'desc' }
        });
      } catch (err) {
        console.warn('⚠️ [notifications] DB findMany failed:', err?.message);
      }

      const list = await Promise.all(
        rows.map(async (row) => {
          if (row.for_admin) return sanitizeNotificationForClient(row);
          const englishSnapshot = { title: row.title, body: row.body, link: row.link };
          const localized = await localizeUserNotification({
            locale: outboundLocale,
            type: row.type,
            event: row.event,
            english: englishSnapshot,
            data: row.data || {}
          });
          return sanitizeNotificationForClient({ ...row, ...localized });
        })
      );

      let unreadCount = 0;
      try {
        unreadCount = await prisma.notification.count({ where: { user_id, is_read: false } });
      } catch {
        unreadCount = 0;
      }

      socket.emit('notifications_list', { notifications: list, unreadCount, total: rows.length });
    } catch (err) {
      socket.emit('notifications_list', { notifications: [], unreadCount: 0, total: 0 });
    }
  });

  // 🔢 Count badge
  socket.on('count_notifications', async ({ user_id }) => {
    try {
      const unreadCount = await prisma.notification.count({ where: { user_id, is_read: false } });
      socket.emit('notifications_count', { unreadCount });
    } catch {
      socket.emit('notifications_count', { unreadCount: 0 });
    }
  });

  // ✅ Mark read
  socket.on('mark_notification_read', async ({ notification_id }) => {
    try {
      await prisma.notification.update({ where: { notification_id }, data: { is_read: true } });
      socket.emit('notification_marked_read', { notification_id });
    } catch {
      socket.emit('notifications_error', { message: 'Error marking notification as read' });
    }
  });

  // 🗑️ Delete one
  socket.on('delete_notification', async ({ notification_id, user_id }) => {
    try {
      await prisma.notification.delete({ where: { notification_id } });
      io.to(user_id).emit('notifications_list_refresh', { user_id });
    } catch {
      socket.emit('notifications_error', { message: 'Error deleting notification' });
    }
  });

  // 🧹 Clear all
  socket.on('clear_notifications', async ({ user_id }) => {
    try {
      await prisma.notification.deleteMany({ where: { user_id } });
      socket.emit('notifications_list', { notifications: [], unreadCount: 0, total: 0 });
      io.to(user_id).emit('notifications_list_refresh', { user_id });
    } catch {
      socket.emit('notifications_error', { message: 'Error clearing notifications' });
    }
  });
}
