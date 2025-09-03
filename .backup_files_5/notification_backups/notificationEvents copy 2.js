/**
 * ==================== notificationEvents.js ====================
 * 🔔 Unified Socket Notification Events (Bulletproof Edition)
 *
 * ✅ DB row = English snapshot only (single source of truth)
 * ✅ Emits/Emails = localized from socket.data.currentLocale (no DB locale)
 * ✅ No fs/path usage; no import-time throws; graceful fallbacks
 * ✅ Uses dictionaries injected globally from socketServer.js
 * 🚫 Never load locale from DB; never crash the process on config mistakes
 * ===============================================================
 */

import notificationSystem from '../../src/constants/notificationSystem.js'; // 🧩 English templates
import prisma from '../../src/lib/core/prisma.js'; // 🗄️ DB access for notifications
import { sendEmailToAdmin } from '../../src/lib/email/sendEmailToAdmin.js'; // ✉️ admin emails
import { sendEmailToUser } from '../../src/lib/email/sendEmailToUser.js'; // ✉️ user emails

// 🧭 admin targets (optional)
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || null; // 👑 admin room
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || null; // 👑 admin mailbox

// ===============================================================
// 🌍 Dictionary Access (no fs/path here, rely on socketServer preload)
// ===============================================================

function getDictionary(localeCode) {
  const dicts = globalThis.__ROYAL_TRANSLATIONS__ || { en: {}, is: {} };
  return localeCode === 'is' ? dicts.is : dicts.en;
}

// ===============================================================
// 🌍 Locale helpers (runtime only, seeded from handshake/set_locale)
// ===============================================================

function normalizeToSupportedLocale(value) {
  const v = String(value || '').toLowerCase();
  return v.startsWith('is') ? 'is' : 'en';
}

function getOutboundLocale(socket) {
  const raw = socket?.data?.currentLocale || socket?.userData?.locale || 'en';
  return normalizeToSupportedLocale(raw);
}

// ===============================================================
// 🪄 Translation helpers
// ===============================================================

// 🔄 Replace {tokens} with values from nested data
function interpolateSingleBraceTokens(text, data = {}) {
  if (typeof text !== 'string') return text ?? '';
  return text.replace(/{\s*([\w.]+)\s*}/g, (_, keyPath) => {
    const parts = String(keyPath).split('.');
    let value = data;
    for (const k of parts) {
      if (value && Object.prototype.hasOwnProperty.call(value, k)) value = value[k];
      else return '';
    }
    return value == null ? '' : String(value);
  });
}

// 🧭 locate a user notification node in the dictionary
function findUserNotificationNode(dict, typeKey, eventKey) {
  const node = dict?.socket?.ui?.notifications?.user?.[typeKey];
  if (!node) return null;
  if (eventKey && node[eventKey]) return node[eventKey];
  if (node.body || node.title) return node;
  const first = Object.values(node)[0];
  return first || null;
}

// 🪄 localize user notification (admin stays English)
async function localizeUserNotification({ locale, type, event, english, data }) {
  const prefDict = getDictionary(locale);
  const engDict = getDictionary('en');

  const pref = findUserNotificationNode(prefDict, type, event);
  const eng = findUserNotificationNode(engDict, type, event);

  const titleTemplate = (pref?.title ?? eng?.title ?? english.title) || '';
  const bodyTemplate = (pref?.body ?? eng?.body ?? english.body) || '';
  const linkTemplate = (pref?.link ?? eng?.link ?? english.link) || null;

  return {
    title: interpolateSingleBraceTokens(titleTemplate, data),
    body: interpolateSingleBraceTokens(bodyTemplate, data),
    link: linkTemplate ? interpolateSingleBraceTokens(linkTemplate, data) : null
  };
}

// ===============================================================
// 🧱 Prisma helpers (never crash UI on DB hiccups)
// ===============================================================

async function safeCreateNotificationRow(data) {
  try {
    return await prisma.notification.create({ data });
  } catch (err) {
    console.warn('⚠️ [notifications] DB create failed; emitting ephemeral row:', err?.message);
    // 🧪 ephemeral row for UI continuity (client should treat as read-only)
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

// ===============================================================
// ✨ Create + Emit + Email
// ===============================================================

async function createAndDispatchNotification({
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
  // 📝 English source (single truth)
  const englishSource = isAdmin
    ? notificationSystem.getAdminNotification(type, event, data)
    : notificationSystem.getUserNotification(type, event, data);

  // 🗄️ Store English snapshot (or emit ephemeral if DB down)
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

  // 📡 Emit (admin: English | user: localized)
  if (isAdmin) {
    if (recipientUserId) io.to(recipientUserId).emit('notification_received', createdRow); // // 👑
  } else {
    const locale = getOutboundLocale(socket);
    const localized = await localizeUserNotification({
      locale,
      type,
      event,
      english: englishSource,
      data
    });
    if (recipientUserId) {
      io.to(recipientUserId).emit('notification_received', { ...createdRow, ...localized });
    }
  }

  // ✉️ Email (best-effort; never crash)
  if (shouldEmail) {
    try {
      if (isAdmin && ADMIN_EMAIL) {
        await sendEmailToAdmin({
          subject: englishSource.title?.trim() || 'Notification',
          title: englishSource.title?.trim() || 'Notification',
          contentHtml: (englishSource.body || '').replace(/\n/g, '<br>'),
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
          subject: (title || englishSource.title || 'Notification').trim(),
          title: (title || englishSource.title || 'Notification').trim(),
          contentHtml: (body || englishSource.body || '').replace(/\n/g, '<br>'),
          includeSignature: true
        });
      }
    } catch (err) {
      console.warn('⚠️ [notifications] email send failed:', err?.message); // // logs always English
    }
  }

  return createdRow;
}

// 🛠️ Direct helper (used by HTTP bridges; same signature as before)
export async function createEmitNotification(io, socket, { type, event, user, data }) {
  if (!user?.user_id) {
    console.warn('[notifications] createEmitNotification called without valid user');
    return;
  }

  const user_id = user.user_id;
  const englishSource = notificationSystem.getUserNotification(type, event, { ...data, user });

  // 🗄️ Save English row (or ephemeral)
  const notificationRow = await safeCreateNotificationRow({
    user_id,
    type,
    event,
    for_admin: false,
    title: englishSource.title,
    body: englishSource.body,
    link: englishSource.link,
    data: { ...data, user },
    is_read: false
  });

  // 🌍 Localize + Emit
  const outboundLocale = getOutboundLocale(socket);
  const localized = await localizeUserNotification({
    locale: outboundLocale,
    type,
    event,
    english: englishSource,
    data: { ...data, user }
  });

  io.to(user_id).emit('notification_received', { ...notificationRow, ...localized });
  io.to(user_id).emit('notifications_list_refresh', { user_id });
}

// ===============================================================
// 🔌 Register socket listeners (default export)
// ===============================================================
export default function registerNotificationEvents(io, socket) {
  // 🤝 Create for both admin + user
  socket.on('create_notification_for_both', async ({ type, event, user, data: payload }) => {
    try {
      const templateData = notificationSystem.mergeUserAndPayload(user, payload);

      // 👑 Admin row (only if target is configured)
      if (!ADMIN_USER_ID) {
        console.warn('⚠️ [notifications] ADMIN_USER_ID not set; skipping admin target');
      } else {
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

      // 👤 User row
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

  // 👑 Create for admin only
  socket.on('create_notification_for_admin', async ({ type, event, user, data: payload }) => {
    try {
      if (!ADMIN_USER_ID) {
        console.warn('⚠️ [notifications] ADMIN_USER_ID not set; skipping admin target');
        return socket.emit('notifications_error', { message: 'Admin target not configured' });
      }

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
      socket.emit('notifications_error', { message: 'Error creating admin notification' });
    }
  });

  // 👤 Create for user only
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
      socket.emit('notifications_error', { message: 'Error creating user notification' });
    }
  });

  // 📥 Fetch localized list
  socket.on('fetch_notifications', async ({ user_id }) => {
    try {
      const outboundLocale = getOutboundLocale(socket);

      // 🔎 read rows (silent failure → empty list)
      let rows = [];
      try {
        rows = await prisma.notification.findMany({
          where: { user_id },
          orderBy: { createdAt: 'desc' }
        });
      } catch (err) {
        console.warn('⚠️ [notifications] DB findMany failed:', err?.message);
        rows = [];
      }

      // 🌍 localize user rows; admin rows remain English
      const list = await Promise.all(
        rows.map(async (row) => {
          if (row.for_admin) return row; // 👑 keep English
          const englishSnapshot = { title: row.title, body: row.body, link: row.link };
          const { title, body, link } = await localizeUserNotification({
            locale: outboundLocale,
            type: row.type,
            event: row.event,
            english: englishSnapshot,
            data: row.data || {}
          });
          return { ...row, title, body, link };
        })
      );

      // 🔢 badge counts (silent failure → zeros)
      let unreadCount = 0;
      try {
        unreadCount = await prisma.notification.count({ where: { user_id, is_read: false } });
      } catch (_) {
        unreadCount = 0;
      }

      socket.emit('notifications_list', { notifications: list, unreadCount, total: rows.length });
    } catch (err) {
      console.warn('⚠️ fetch_notifications', err?.message);
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

  // ✅ Mark one read
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
