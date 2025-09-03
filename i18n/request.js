/**
 * ================== /src/i18n/request.js ==================
 * 🌍 Per-request next-intl config (locale + messages)
 * - Loads correct locale messages dynamically from /messages.
 * - Ensures fallback to defaultLocale when invalid.
 * - Single source of truth: /root/royal-tv/messages/*.json
 * ==========================================================
 */

import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing.js';
import path from 'path';
import fs from 'fs/promises';

export default getRequestConfig(async ({ requestLocale }) => {
  // 🧭 Ensure locale is valid, fallback to default if not
  const requestedLocale = await requestLocale;
  const activeLocale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  // 📁 Resolve messages directory (env first, then ./messages)
  const messagesDir = process.env.MESSAGES_DIR || path.join(process.cwd(), 'messages');
  const messagesPath = path.join(messagesDir, `${activeLocale}.json`);

  // 📦 Load and parse JSON
  const raw = await fs.readFile(messagesPath, 'utf8');
  const messages = JSON.parse(raw);

  return { locale: activeLocale, messages }; // 🌍 return bound config
});
