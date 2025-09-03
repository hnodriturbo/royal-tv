/**
 * /i18n/request.server.js
 * -----------------------
 * 🧩 Server-only i18n utilities
 * ❗ Never import this file in "use client" components.
 */

import 'server-only'; // 🛡️ Guard: prevents client bundle
import fs from 'fs/promises'; // 📂 Read JSON files
import path from 'path'; // 🛣️ Handle paths

/**
 * Load locale JSON file from /src/language/<locale>/<locale>.json
 */
export async function readLocaleMessages(currentLocale) {
  const messagesFilePath = path.join(
    process.cwd(),
    'src',
    'language',
    currentLocale,
    `${currentLocale}.json`
  );

  const fileBuffer = await fs.readFile(messagesFilePath, 'utf8');
  return JSON.parse(fileBuffer);
}
