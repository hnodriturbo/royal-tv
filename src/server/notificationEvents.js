/**
 * ==================== notificationEvents.js ====================
 * 🔔 Unified Socket Notification Events for Royal TV
 *
 * ✅ DB: Always store English (single source of truth).
 * ✅ Client emit: Send localized (user) strings based on socket locale.
 * ✅ Emails: Users get localized; Admins always English.
 * ✅ Translations: Loaded directly from JSON (en.json / is.json).
 * ✅ Admin notifications stay in English on both emit and email.
 * =================================================================
 */

import notificationSystem from '../constants/notificationSystem.js'; // 🧩 English templates (DB truth)
import prisma from '../lib/core/prisma.js'; // 🗄️ DB
import { sendEmailToAdmin } from '../lib/email/sendEmailToAdmin.js'; // ✉️ admin mailer
import { sendEmailToUser } from '../lib/email/sendEmailToUser.js'; // ✉️ user mailer

// ⚡ Import readFileSync and path to read the english and icelandic dictionaries
import { readFileSync } from 'fs';
import path from 'path';

// 🗂️ Load raw translation JSONs (only used for outbound localization)
const enLanguage = JSON.parse(readFileSync(path.resolve('./messages/en.json'), 'utf8')); // 🌍 English JSON
const isLanguage = JSON.parse(readFileSync(path.resolve('./messages/is.json'), 'utf8')); // 🌍 Icelandic JSON

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!ADMIN_USER_ID || !ADMIN_EMAIL) {
  throw new Error('❌ Missing ADMIN_USER_ID or ADMIN_EMAIL in environment');
}

/** -------------------------------------------------------------
 * 🧩 Locale helpers (simple, dependency-free)
 * -----------------------------------------------------------
 */

// 🧭 pick outbound locale from socket (room preference)
function getOutboundLocale(socket) {
  const rawLocalValue = socket?.data?.currentLocale || socket?.userData?.locale || 'en';
  const lowerCasedLocale = String(rawLocalValue).toLowerCase();
  return lowerCasedLocale.startsWith('is') ? 'is' : 'en';
}

// 📚 choose dictionary by locale
const getLanguageForLocale = (localeCode) => (localeCode === 'is' ? isLanguage : enLanguage);

/**
 * 🔄 interpolateSingleBraceTokens
 *
 * Replace placeholders inside a string with values from a data object.
 *
 * Example:
 *   interpolateSingleBraceTokens("Hello {user.name}!", { user: { name: "Alice" } })
 *   → "Hello Alice!"
 */
function interpolateSingleBraceTokens(text, data = {}) {
  // ✅ If it's not a string, just return it (or empty string if null/undefined)
  if (typeof text !== 'string') return text ?? ''; // '??' means "or"

  // 🔍 Find all tokens like {something} in the text
  return text.replace(/{\s*([\w.]+)\s*}/g, (_, dottetKeyPath) => {
    // 🧩 Example: "user.name" → ["user", "name"]
    const keyParts = String(dottetKeyPath).split('.');

    // 📦 Start from the whole data object
    let currentValue = data;

    // 🚶 Walk through each part of the path (e.g. "user" → "name")
    for (const keyPart of keyParts) {
      // 👀 Check if this key exists at the current level
      if (currentValue && Object.prototype.hasOwnProperty.call(currentValue, keyPart)) {
        currentValue = currentValue[keyPart]; // ✅ Go deeper
      } else {
        return ''; // ❌ If missing, return empty string
      }
    }
    // 🎯 Return the found value as a string, or empty if null/undefined
    return currentValue == null ? '' : String(currentValue);
  });
}

/* ==================== translation node lookup ==================== */

// 🔎 find node under socket.ui.notifications.user[type][event?]
function findUserNotificationNode(languageDictionary, typeKey, eventKey) {
  const translationNode = languageDictionary?.socket?.ui?.notifications?.user?.[typeKey];
  if (!translationNode) return null;
  if (eventKey && translationNode[eventKey]) return translationNode[eventKey];
  if (translationNode.body || translationNode.title) return translationNode;
  const firstChild = Object.values(translationNode)[0];
  return firstChild || null;
}

/* ==================== user localization ==================== */

// 🪄 localize a user-facing notification (admin remains English)
function localizeUserNotification({ locale, type, event, english, data }) {
  const preferredNode = findUserNotificationNode(getLanguageForLocale(locale), type, event);
  const englishNode = findUserNotificationNode(getLanguageForLocale('en'), type, event);

  const titleTemplate = (preferredNode?.title ?? englishNode?.title ?? english.title) || '';
  const bodyTemplate = (preferredNode?.body ?? englishNode?.body ?? english.body) || '';
  const linkTemplate = (preferredNode?.link ?? englishNode?.link ?? english.link) || null;

  return {
    title: interpolateSingleBraceTokens(titleTemplate, data),
    body: interpolateSingleBraceTokens(bodyTemplate, data),
    link: linkTemplate ? interpolateSingleBraceTokens(linkTemplate, data) : null
  };
}

/* ==================== create + emit + email ==================== */
/**
 * ✨ createAndDispatchNotification
 * – Build English from templates (single source of truth)
 * – Store English + raw template data
 * – Emit: user gets localized payload; admin sees English
 * – Email: localized for user, English for admin
 */
async function createAndDispatchNotification({
  io,
  socket,
  isAdmin,
  recipientUserId,
  recipientEmail,
  shouldEmail,
  type,
  event, // may be null
  data // merged templateData (user info + payload)
}) {
  const englishSource = isAdmin
    ? notificationSystem.getAdminNotification(type, event, data)
    : notificationSystem.getUserNotification(type, event, data);

  const createdRow = await prisma.notification.create({
    data: {
      user_id: recipientUserId,
      title: englishSource.title,
      body: englishSource.body,
      link: englishSource.link,
      type,
      event: event || null,
      for_admin: Boolean(isAdmin),
      data, // raw template data for future localization on fetch
      is_read: false
    }
  });

  // 📡 push: single item for instant UI (toast + prepend)
  if (isAdmin) {
    io.to(recipientUserId).emit('notification_received', createdRow); // admin keeps English
  } else {
    const outboundLocale = getOutboundLocale(socket);
    const localized = localizeUserNotification({
      locale: outboundLocale,
      type,
      event,
      english: englishSource,
      data
    });
    io.to(recipientUserId).emit('notification_received', { ...createdRow, ...localized });
  }

  // ✉️ email delivery (optional)
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
        const outboundLocale = getOutboundLocale(socket);
        const { title, body } = localizeUserNotification({
          locale: outboundLocale,
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
    } catch (emailError) {
      console.error('email failed', emailError); // logs stay English per your rule
    }
  }

  return createdRow;
}
/**
 * 🛠️ Direct helper to create + emit a notification outside of socket listeners
 * ---------------------------------------------------------------------------
 * Used by HTTP bridges (like /emit/transactionFinished in socketServer.js)
 * to avoid re-registering all notification events.
 *
 * @param {Server} io      - The Socket.IO server instance
 * @param {Socket} socket  - The real connected socket for the target user
 * @param {Object} options - Notification payload
 *   • type: string (e.g. 'payment', 'subscription', 'error')
 *   • event: string|null (e.g. 'created')
 *   • user: User object (must include user_id)
 *   • data: Json payload (payment/subscription/error details)
 */
/**
 * 🛠️ Direct helper to create + emit a notification outside of socket listeners
 */
/**
 * 🛠️ Direct helper to create + emit a notification outside of socket listeners
 */
export async function createEmitNotification(io, socket, { type, event, user, data }) {
  if (!socket || !user?.user_id) {
    console.warn('[notifications] createEmitNotification called without valid socket or user');
    return;
  }

  const user_id = user.user_id;

  // 🌍 locale of this socket
  const outboundLocale = getOutboundLocale(socket);

  // 📝 Always render English snapshot for DB
  const englishSource = notificationSystem.getUserNotification(type, event, {
    ...data,
    user
  });

  // 🗄 Save canonical English row
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

  // 🌍 Localize for immediate emit
  const localized = localizeUserNotification({
    locale: outboundLocale,
    type,
    event,
    english: englishSource,
    data: { ...data, user }
  });

  // 📡 Emit to client (merged English row + localized view)
  io.to(user_id).emit('notification_received', {
    ...notificationRow,
    ...localized
  });

  // 🔄 Ask client to refresh authoritative list/count
  io.to(user_id).emit('notifications_list_refresh', { user_id });
}

/* -------------------------------------------------------------
 * 🚀 Event registrations (simple & explicit)
 * -----------------------------------------------------------*/

export default function registerNotificationEvents(io, socket, globalState) {
  // 📨 create for both (admin + user)
  socket.on('create_notification_for_both', async ({ type, event, user, data: payload }) => {
    try {
      const templateData = notificationSystem.mergeUserAndPayload(user, payload);

      // admin row
      await createAndDispatchNotification({
        io,
        socket,
        isAdmin: true,
        recipientUserId: ADMIN_USER_ID,
        recipientEmail: ADMIN_EMAIL,
        shouldEmail: true,
        type,
        event,
        data: templateData
      });

      // user row
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

      // 🔁 ask both rooms to refetch authoritative list
      io.to(ADMIN_USER_ID).emit('notifications_list_refresh', { user_id: ADMIN_USER_ID });
      io.to(dbUser.user_id).emit('notifications_list_refresh', { user_id: dbUser.user_id });
    } catch (error) {
      console.error('create_notification_for_both', error);
      socket.emit('notifications_error', { message: 'Error creating notification for both' });
    }
  });

  // 📨 create for admin only
  socket.on('create_notification_for_admin', async ({ type, event, user, data: payload }) => {
    try {
      const templateData = notificationSystem.mergeUserAndPayload(user, payload);

      await createAndDispatchNotification({
        io,
        socket,
        isAdmin: true,
        recipientUserId: ADMIN_USER_ID,
        recipientEmail: ADMIN_EMAIL,
        shouldEmail: true,
        type,
        event,
        data: templateData
      });

      io.to(ADMIN_USER_ID).emit('notifications_list_refresh', { user_id: ADMIN_USER_ID });
    } catch (error) {
      console.error('create_notification_for_admin', error);
      socket.emit('notifications_error', { message: 'Error creating admin notification' });
    }
  });

  // 📨 create for user only
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
    } catch (error) {
      console.error('create_notification_for_user', error);
      socket.emit('notifications_error', { message: 'Error creating user notification' });
    }
  });

  // 📥 fetch localized list for a user
  socket.on('fetch_notifications', async ({ user_id }) => {
    try {
      const outboundLocale = getOutboundLocale(socket);
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[notifications] fetch_notifications: user_id=${user_id} outboundLocale=${outboundLocale}`
        );
      }
      const notificationRows = await prisma.notification.findMany({
        where: { user_id },
        orderBy: { createdAt: 'desc' }
      });

      const mappedLocalizedNotifications = notificationRows.map((notificationRow) => {
        if (notificationRow.for_admin) return notificationRow; // admin keeps English
        const englishSnapshot = {
          title: notificationRow.title,
          body: notificationRow.body,
          link: notificationRow.link
        };
        const { title, body, link } = localizeUserNotification({
          locale: outboundLocale,
          type: notificationRow.type,
          event: notificationRow.event,
          english: englishSnapshot,
          data: notificationRow.data || {}
        });
        return { ...notificationRow, title, body, link };
      });

      const unreadCount = await prisma.notification.count({
        where: { user_id, is_read: false }
      });

      socket.emit('notifications_list', {
        notifications: mappedLocalizedNotifications,
        unreadCount,
        total: notificationRows.length
      });
    } catch (error) {
      console.error('fetch_notifications', error); // 🧱 keep logs in English
      // 🧯 keep payload shape identical even on errors
      socket.emit('notifications_list', { notifications: [], unreadCount: 0, total: 0 });
    }
  });

  // 🔢 unread count badge
  socket.on('count_notifications', async ({ user_id }) => {
    try {
      const unreadCount = await prisma.notification.count({
        where: { user_id, is_read: false }
      });
      socket.emit('notifications_count', { unreadCount });
    } catch {
      socket.emit('notifications_count', { unreadCount: 0 });
    }
  });

  // ✅ mark read
  socket.on('mark_notification_read', async ({ notification_id }) => {
    try {
      await prisma.notification.update({
        where: { notification_id },
        data: { is_read: true }
      });
      socket.emit('notification_marked_read', { notification_id });
    } catch {
      socket.emit('notifications_error', { message: 'Error marking notification as read' });
    }
  });

  // 🗑️ delete one
  socket.on('delete_notification', async ({ notification_id, user_id }) => {
    try {
      await prisma.notification.delete({ where: { notification_id } });
      io.to(user_id).emit('notifications_list_refresh', { user_id });
    } catch {
      socket.emit('notifications_error', { message: 'Error deleting notification' });
    }
  });

  // 🧹 clear all
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
