/**
 * ======================= /i18n/request.server.js =======================
 * 🖥️ Server-only i18n loader
 * - Guarded with `server-only`
 * - Reads translations from /messages/<locale>.json
 * ======================================================================
 */

import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function readLocaleMessages(locale) {
  if (typeof locale !== 'string') {
    console.error('[i18n/request.server] Expected string locale but got:', locale);
    throw new Error('Invalid locale argument to readLocaleMessages()');
  }

  const messagesPath = path.join(process.cwd(), 'messages', `${locale}.json`);

  try {
    const raw = await fs.readFile(messagesPath, 'utf8');
    return JSON.parse(raw); // ✅ return messages object directly
  } catch (error) {
    console.error('[i18n/request.server] Failed to load messages:', {
      messagesPath,
      error: String(error)
    });
    throw error;
  }
}
