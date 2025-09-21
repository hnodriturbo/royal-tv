/**
 * 📆 calculateMonthsDaysLeft Utility (UTC-safe)
 * -------------------------------------------------
 * Returns:
 *   - "X months, Y days"
 *   - "less than 1 day" (if under 24h)
 *   - null if missing/invalid/already expired
 *
 * Accepts: Date | string | number
 * Works in frontend & backend.
 */
export default function calculateMonthsDaysLeft(expiringAt) {
  // 🛡️ No expiry? Bail out
  if (!expiringAt) return null;

  // 🗓️ Parse and validate
  const expiry = new Date(expiringAt);
  if (!(expiry instanceof Date) || isNaN(expiry)) return null; // 🧯 invalid date

  const now = new Date();

  // ⛔ Already expired (to the millisecond)
  if (expiry <= now) return null;

  // 🌍 Normalize to UTC midnight to avoid DST / TZ off-by-ones
  const toUtcStart = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const startNowUTC = toUtcStart(now);
  const startExpiryUTC = toUtcStart(expiry);

  // 🧮 Initial months difference
  let months =
    (startExpiryUTC.getUTCFullYear() - startNowUTC.getUTCFullYear()) * 12 +
    (startExpiryUTC.getUTCMonth() - startNowUTC.getUTCMonth());

  // ➕ Helper: add months in UTC
  const addUtcMonths = (dateUTC, m) =>
    new Date(Date.UTC(dateUTC.getUTCFullYear(), dateUTC.getUTCMonth() + m, dateUTC.getUTCDate()));

  // 🧭 Anchor by months and adjust if we overshot the expiry date
  let anchorUTC = addUtcMonths(startNowUTC, months);
  if (anchorUTC > startExpiryUTC) {
    months -= 1;
    anchorUTC = addUtcMonths(startNowUTC, months);
  }

  // 📏 Days left after taking whole months
  const msPerDay = 24 * 60 * 60 * 1000;
  let days = Math.ceil((startExpiryUTC - anchorUTC) / msPerDay);

  // 🧹 Only positive values
  if (months < 0) months = 0;
  if (days < 0) days = 0;

  // 🗣️ Build friendly string
  const parts = [];
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);

  // ⏳ If both zero but future (i.e., < 24h), say "less than 1 day"
  if (parts.length === 0) return 'less than 1 day';

  return parts.join(', ');
}
