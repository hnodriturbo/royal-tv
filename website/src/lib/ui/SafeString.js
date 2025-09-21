// /lib/ui/SafeString.js
/**
 * SafeString(value, fallback = '', opts = {})
 * - Always returns a string.
 * - Keeps translations from next-intl (t(...)) as-is.
 * - Null/undefined → fallback (default: '').
 * - Booleans → fallback by default (avoids stray "true"/"false" in UI).
 * - Dates → locale string (if opts.locale given) or ISO.
 * - Objects → JSON (circular-safe).
 */
export function SafeString(value, fallback = '', opts = {}) {
  try {
    if (value == null) return fallback;

    switch (typeof value) {
      case 'string':
        return value;
      case 'number':
        return Number.isFinite(value) ? String(value) : fallback;
      case 'boolean':
        // Default: hide booleans unless you *want* them as "true"/"false"
        return opts.showBoolean ? String(value) : fallback;
      case 'bigint':
        return value.toString();
      case 'symbol':
        return value.description ?? fallback;
      case 'function':
        return value.name || 'anonymous';
      case 'object': {
        if (value instanceof Date) {
          const { locale, dateOptions } = opts;
          return locale ? value.toLocaleString(locale, dateOptions) : value.toISOString();
        }
        // Circular-safe stringify
        const seen = new WeakSet();
        return JSON.stringify(value, (k, v) => {
          if (typeof v === 'object' && v !== null) {
            if (seen.has(v)) return '[Circular]';
            seen.add(v);
          }
          return v;
        });
      }
      default:
        return String(value);
    }
  } catch (err) {
    console.error('[SafeString] failed to convert:', err, value);
    return fallback;
  }
}

/* 
Usage:
import { SafeString } from '@/lib/ui/SafeString';

<span>{SafeString(t('app.admin.users.main.freeTrials'))}</span>   // ✅ fine
<span>{SafeString(singleUser.name, '')}</span>                    // ✅ user/DB fields
<span>{SafeString(new Date(singleUser.createdAt), '', { locale })}</span> // ✅ dates
 */
