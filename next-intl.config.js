/**
 * ======================= next-intl.config.js =======================
 * 🌍 Root config for next-intl
 * ===================================================================
 */
import { routing } from './src/i18n/request.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  messages: {
    en: path.join(__dirname, 'messages/en.json'),
    is: path.join(__dirname, 'messages/is.json')
  }
};
