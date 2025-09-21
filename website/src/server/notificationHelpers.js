/**
 * ==================== notificationHelpers.js ====================
 * 🧩 Shared helpers for Notification Events
 *
 * 🛡️ Ensures outbound notifications are always string-safe
 * 🌍 Provides localization + interpolation
 * ================================================================
 */

// ================================================================
// 🛡️ Sanitizer helpers
// ================================================================
function coerceToString(value, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') return JSON.stringify(value); // 🛡️ stringify objects safely
  return fallback;
}

function logCoercion(context, row, key, badValue) {
  try {
    console.warn('[notifications][sanitize]', context, {
      key,
      type: typeof badValue,
      notification_id: row?.notification_id ?? 'unknown',
      user_id: row?.user_id ?? 'unknown',
      event: row?.event ?? 'unknown'
    });
  } catch {
    /* ignore */
  }
}

export function sanitizeNotificationForClient(
  row,
  { stringLikeKeys = ['title', 'body', 'link'], allowNullKeys = ['link'], strictAll = true } = {}
) {
  if (!row || typeof row !== 'object') return row;
  const sanitized = { ...row };

  const sanitizeField = (key) => {
    const current = sanitized[key];
    if (current === null && allowNullKeys.includes(key)) return;

    if (
      typeof current === 'string' ||
      typeof current === 'number' ||
      typeof current === 'boolean'
    ) {
      sanitized[key] = String(current);
      return;
    }

    if (typeof current === 'object') {
      sanitized[key] = JSON.stringify(current); // 🛡️ never leak raw objects
      return;
    }

    if (current !== undefined) {
      logCoercion('coerceField', row, key, current);
      sanitized[key] = '';
    }
  };

  // sanitize string-like keys explicitly first
  for (const key of stringLikeKeys) sanitizeField(key);

  // then sanitize all other keys if strictAll is enabled
  if (strictAll) {
    for (const key of Object.keys(sanitized)) {
      if (!stringLikeKeys.includes(key)) sanitizeField(key);
    }
  }
  return sanitized;
}

export function sanitizeNotificationListForClient(rows, options) {
  if (!Array.isArray(rows)) return rows;
  return rows.map((r) => sanitizeNotificationForClient(r, options));
}

// ================================================================
// 🌍 Dictionary + locale helpers
// ================================================================
export function getDictionary(localeCode) {
  const dicts = globalThis.__ROYAL_TRANSLATIONS__ || { en: {}, is: {} };
  return localeCode === 'is' ? dicts.is : dicts.en;
}

export function normalizeToSupportedLocale(value) {
  const v = String(value || '').toLowerCase();
  return v.startsWith('is') ? 'is' : 'en';
}

export function getOutboundLocale(socket) {
  const raw = socket?.data?.currentLocale || socket?.userData?.locale || 'en';
  return normalizeToSupportedLocale(raw);
}

// ================================================================
// 🪄 Translation helpers
// ================================================================
export function interpolateSingleBraceTokens(text, data = {}) {
  const safeText = coerceToString(text, '');
  return safeText.replace(/{\s*([\w.]+)\s*}/g, (_, keyPath) => {
    const parts = String(keyPath).split('.');
    let value = data;
    for (const k of parts) {
      if (value && Object.prototype.hasOwnProperty.call(value, k)) value = value[k];
      else return '';
    }
    return coerceToString(value, '');
  });
}

function findUserNotificationNode(dict, typeKey, eventKey) {
  const node = dict?.socket?.ui?.notifications?.user?.[typeKey];
  if (!node) return null;
  if (eventKey && node[eventKey]) return node[eventKey];
  if (node.body || node.title) return node;
  const first = Object.values(node)[0];
  return first || null;
}

export async function localizeUserNotification({ locale, type, event, english, data }) {
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
