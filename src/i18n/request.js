// src/i18n/request.js
import { getRequestConfig } from 'next-intl/server';

function normalize(locale) {
  const v = String(locale || '').toLowerCase();
  return v.startsWith('is') ? 'is' : 'en';
}

export default getRequestConfig(async ({ locale }) => {
  const l = normalize(locale);
  // from src/i18n → src/messages
  const messages = (await import(`../messages/${l}.json`)).default;
  return { locale: l, messages };
});
