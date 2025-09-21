// src/i18n/withLocale.js (server-safe module, no 'use client')
export function withLocale(locale, path = '/') {
  // 🧹 normalize
  const raw = typeof path === 'string' ? path : '/';
  const clean = raw.startsWith('/') ? raw : `/${raw}`;

  if (!locale) return clean; // 🚫 no locale → just return

  // 🧪 prevent "/en/en/..."
  const first = clean.split('/').filter(Boolean)[0];
  if (first === locale) return clean;

  return `/${locale}${clean}`;
}
/**
 * <Link href={withLocale(locale, `/admin/users/${userId}`)}>...</Link>
 *   */
