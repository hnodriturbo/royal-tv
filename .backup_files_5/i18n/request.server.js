// src/i18n/request.server.js
import { notFound } from 'next/navigation';
import { routing } from './routing';

// ensure you have src/messages/en.json, is.json, etc.
export async function readLocaleMessages(locale) {
  if (!routing?.locales?.includes(locale)) notFound();
  try {
    // i18n/ → messages/ (sibling folders under src/)
    const messages = (await import(`../messages/${locale}.json`)).default;
    return messages;
  } catch (err) {
    notFound();
  }
}
