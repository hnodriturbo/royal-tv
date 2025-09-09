/**
 * This is the default simple config for i18n.
 */

export const LOCALES = ['en', 'is'];
export const DEFAULT_LOCALE = 'en';
export function isLocale(input) {
  return !!input && LOCALES.includes(input);
}
