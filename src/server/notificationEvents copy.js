/**
 * ==================== notificationEvents.js ====================
 * 🔔 Unified Socket Notification Events
 *
 * ✅ DB row = English snapshot only (source of truth)
 * ✅ Emits/Emails = localized from socket.data.currentLocale (or fallback)
 * 🚫 No DB locale reads/writes at all
 * 🛠️ Used by both Socket listeners and HTTP bridges
 * ===============================================================
 */

import notificationSystem from '../constants/notificationSystem.js'; // 🧩 English templates
import prisma from '../lib/core/prisma.js'; // 🗄️ DB for notifications
import { sendEmailToAdmin } from '../lib/email/sendEmailToAdmin.js'; // ✉️ admin emails
import { sendEmailToUser } from '../lib/email/sendEmailToUser.js'; // ✉️ user emails

// 📦 FS helpers for translations
import { readFileSync } from 'fs';
import path from 'path';

// 📂 Locate messages folder
const messagesDirectory = (() => {
  const NODE_ENV = process.env.NODE_ENV || 'development';

  if (NODE_ENV === 'production') {
    // 🌍 in prod → require env var
    const fromEnv = process.env.MESSAGES_DIR;
    if (!fromEnv) {
      throw new Error('❌ MESSAGES_DIR must be set in production');
    }
    return path.isAbsolute(fromEnv) ? fromEnv : path.resolve(process.cwd(), fromEnv);
  }

  // 🛠️ in dev → always fallback to <projectRoot>/messages
  return path.resolve(process.cwd(), 'messages');
})();

// 📖 Load messages JSON (en.json / is.json)
function loadMessages(localeCode) {
  const fullPath = path.join(messagesDirectory, `${localeCode}.json`);
  return JSON.parse(readFileSync(fullPath, 'utf8'));
}

// 🌍 Dictionaries
const enLanguage = loadMessages('en'); // 🇬🇧
const isLanguage = loadMessages('is'); // 🇮🇸

// 👑 Admin constants (must be set in .env)
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (!ADMIN_USER_ID || !ADMIN_EMAIL) {
  throw new Error('❌ Missing ADMIN_USER_ID or ADMIN_EMAIL');
}

/* ===============================================================
 * 🌍 Locale helpers
 * =============================================================*/

// 🌍 Decide outbound locale (socket first, then snapshot, fallback en)
function getOutboundLocale(socket) {
  const raw = socket?.data?.currentLocale || socket?.userData?.locale || 'en';
  return String(raw).toLowerCase().startsWith('is') ? 'is' : 'en';
}

// 🌍 Pick dictionary
const getLanguageForLocale = (code) => (code === 'is' ? isLanguage : enLanguage);

// 🔄 Replace {tokens} with data values
function interpolateSingleBraceTokens(text, data = {}) {
  if (typeof text !== 'string') return text ?? '';
  return text.replace(/{\s*([\w.]+)\s*}/g, (_, keyPath) => {
    const parts = String(keyPath).split('.');
    let value = data;
    for (const key of parts) {
      if (value && Object.prototype.hasOwnProperty.call(value, key)) {
        value = value[key];
      } else {
        return '';
      }
    }
    return value == null ? '' : String(value);
  });
}

// 🔍 Locate translation node in dictionary
function findUserNotificationNode(dict, typeKey, eventKey) {
  const node = dict?.socket?.ui?.notifications?.user?.[typeKey];
  if (!node) return null;
  if (eventKey && node[eventKey]) return node[eventKey];
  if (node.body || node.title) return node;
  return Object.values(node)[0] || null;
}

// 🪄 Localize user notification (admin stays English)
function localizeUserNotification({ locale, type, event, english, data }) {
  const pref = findUserNotificationNode(getLanguageForLocale(locale), type, event);
  const eng = findUserNotificationNode(getLanguageForLocale('en'), type, event);

  const titleTemplate = (pref?.title ?? eng?.title ?? english.title) || '';
  const bodyTemplate = (pref?.body ?? eng?.body ?? english.body) || '';
  const linkTemplate = (pref?.link ?? eng?.link ?? english.link) || null;

  return {
    title: interpolateSingleBraceTokens(titleTemplate, data),
    body: interpolateSingleBraceTokens(bodyTemplate, data),
    link: linkTemplate ? interpolateSingleBraceTokens(linkTemplate, data) : null
  };
}

/* ===============================================================
 * ✨ Create + Emit + Email
 * =============================================================*/

// 🛠️ Create and dispatch a notification row (used inside socket events)
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
  // 📜 English snapshot (single source of truth)
  const englishSource = isAdmin
    ? notificationSystem.getAdminNotification(type, event, data)
    : notificationSystem.getUserNotification(type, event, data);

  // 🗄️ Store English in DB
  const createdRow = await prisma.notification.create({
    data: {
      user_id: recipientUserId,
      title: englishSource.title,
      body: englishSource.body,
      link: englishSource.link,
      type,
      event: event || null,
      for_admin: Boolean(isAdmin),
      data,
      is_read: false
    }
  });

  // 📡 Emit localized for user, English for admin
  if (isAdmin) {
    io.to(recipientUserId).emit('notification_received', createdRow);
  } else {
    const locale = getOutboundLocale(socket);
    const localized = localizeUserNotification({
      locale,
      type,
      event,
      english: englishSource,
      data
    });
    io.to(recipientUserId).emit('notification_received', { ...createdRow, ...localized });
  }

  // ✉️ Email if requested
  if (shouldEmail) {
    try {
      if (isAdmin) {
        await sendEmailToAdmin({
          subject: englishSource.title?.trim() || 'Notification',
          title: englishSource.title?.trim() || 'Notification',
          contentHtml: (englishSource.body || '').replace(/\n/g, '<br>'),
          includeSignature: false
        });
      } else {
        const locale = getOutboundLocale(socket);
        const { title, body } = localizeUserNotification({
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
      console.error('email failed', err); // 🧱 logs always English
    }
  }

  return createdRow;
}

// 🛠️ Direct helper (used by HTTP bridges)
export async function createEmitNotification(io, socket, { type, event, user, data }) {
  if (!user?.user_id) {
    console.warn('[notifications] createEmitNotification called without valid user');
    return;
  }

  const user_id = user.user_id;
  const englishSource = notificationSystem.getUserNotification(type, event, { ...data, user });

  // 🗄️ Save English row
  const notificationRow = await prisma.notification.create({
    data: {
      user_id,
      type,
      event,
      for_admin: false,
      title: englishSource.title,
      body: englishSource.body,
      link: englishSource.link,
      data: { ...data, user },
      is_read: false
    }
  });

  // 🌍 Localize
  const outboundLocale = getOutboundLocale(socket);
  const localized = localizeUserNotification({
    locale: outboundLocale,
    type,
    event,
    english: englishSource,
    data: { ...data, user }
  });

  // 📡 Emit localized + English snapshot row
  io.to(user_id).emit('notification_received', { ...notificationRow, ...localized });
  io.to(user_id).emit('notifications_list_refresh', { user_id });
}

/* ===============================================================
 * 🔌 Register socket listeners
 * =============================================================*/
export default function registerNotificationEvents(io, socket) {
  // 📨 Create for both admin + user
  socket.on('create_notification_for_both', async ({ type, event, user, data: payload }) => {
    try {
      const templateData = notificationSystem.mergeUserAndPayload(user, payload);

      // 👑 Admin row
      await createAndDispatchNotification({
        io,
        socket,
        isAdmin: true,
        recipientUserId: process.env.ADMIN_USER_ID,
        recipientEmail: process.env.ADMIN_EMAIL,
        shouldEmail: true,
        type,
        event,
        data: templateData
      });

      // 👤 User row
      const dbUser = await prisma.user.findUnique({
        where: { user_id: user.user_id },
        select: { user_id: true, email: true, sendEmails: true }
      });
      if (!dbUser) throw new Error(`User not found: ${user.user_id}`);

      await createAndDispatchNotification({
        io,
        socket,
        isAdmin: false,
        recipientUserId: dbUser.user_id,
        recipientEmail: dbUser.email,
        shouldEmail: dbUser.sendEmails,
        type,
        event,
        data: templateData
      });

      // 🔄 Refresh both rooms
      io.to(process.env.ADMIN_USER_ID).emit('notifications_list_refresh', {
        user_id: process.env.ADMIN_USER_ID
      });
      io.to(dbUser.user_id).emit('notifications_list_refresh', { user_id: dbUser.user_id });
    } catch (err) {
      console.error('create_notification_for_both', err);
      socket.emit('notifications_error', { message: 'Error creating notification for both' });
    }
  });

  // 📨 Create for admin only
  socket.on('create_notification_for_admin', async ({ type, event, user, data: payload }) => {
    try {
      const templateData = notificationSystem.mergeUserAndPayload(user, payload);
      await createAndDispatchNotification({
        io,
        socket,
        isAdmin: true,
        recipientUserId: process.env.ADMIN_USER_ID,
        recipientEmail: process.env.ADMIN_EMAIL,
        shouldEmail: true,
        type,
        event,
        data: templateData
      });
      io.to(process.env.ADMIN_USER_ID).emit('notifications_list_refresh', {
        user_id: process.env.ADMIN_USER_ID
      });
    } catch (err) {
      console.error('create_notification_for_admin', err);
      socket.emit('notifications_error', { message: 'Error creating admin notification' });
    }
  });

  // 📨 Create for user only
  socket.on('create_notification_for_user', async ({ type, event, user, data: payload }) => {
    try {
      const templateData = notificationSystem.mergeUserAndPayload(user, payload);
      const dbUser = await prisma.user.findUnique({
        where: { user_id: user.user_id },
        select: { user_id: true, email: true, sendEmails: true }
      });
      if (!dbUser) throw new Error(`User not found: ${user.user_id}`);

      await createAndDispatchNotification({
        io,
        socket,
        isAdmin: false,
        recipientUserId: dbUser.user_id,
        recipientEmail: dbUser.email,
        shouldEmail: dbUser.sendEmails,
        type,
        event,
        data: templateData
      });

      io.to(dbUser.user_id).emit('notifications_list_refresh', { user_id: dbUser.user_id });
    } catch (err) {
      console.error('create_notification_for_user', err);
      socket.emit('notifications_error', { message: 'Error creating user notification' });
    }
  });

  // 📥 Fetch localized list
  socket.on('fetch_notifications', async ({ user_id }) => {
    try {
      const outboundLocale = getOutboundLocale(socket);
      const rows = await prisma.notification.findMany({
        where: { user_id },
        orderBy: { createdAt: 'desc' }
      });

      const list = rows.map((row) => {
        if (row.for_admin) return row; // 👑 Admin stays English
        const englishSnapshot = { title: row.title, body: row.body, link: row.link };
        const { title, body, link } = localizeUserNotification({
          locale: outboundLocale,
          type: row.type,
          event: row.event,
          english: englishSnapshot,
          data: row.data || {}
        });
        return { ...row, title, body, link };
      });

      const unreadCount = await prisma.notification.count({ where: { user_id, is_read: false } });
      socket.emit('notifications_list', { notifications: list, unreadCount, total: rows.length });
    } catch (err) {
      console.error('fetch_notifications', err);
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
  /* 
  // 🌍 Locale change (runtime only, no DB persistence)
  socket.on('set_locale', ({ locale }) => {
    socket.data.currentLocale = locale;
    socket.userData = socket.userData || {};
    socket.userData.locale = locale;
    socket.emit('locale_changed', { locale });
  }); 
*/
}
