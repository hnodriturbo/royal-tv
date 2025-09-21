/**
 * 🚫 Language Lock Guard
 * ----------------------
 * Returns `true` if the current pathname MUST NOT allow language switching.
 * Target: /{locale}/packages/{slug}/buyNow
 */

export function isLanguageLockedForPathname(currentPathname = '') {
  // 🧼 Normalize to string
  const normalizedPathname = String(currentPathname || '');

  // 🧭 Match `/en/packages/{any}/buyNow` or `/is/packages/{any}/buyNow` (+ optional trailing slash)
  const buyNowStrictPattern = /^\/(en|is)\/packages\/[^/]+\/buyNow(?:\/|$)/;

  // 🔒 Lock on strict BuyNow route
  if (buyNowStrictPattern.test(normalizedPathname)) return true;

  // 🧯 Future-proof: allow broader matches if you add variants (commented for now)
  // const buyNowLoosePattern = /\/packages\/[^/]+\/buyNow(?:\/|$)/i;
  // if (buyNowLoosePattern.test(normalizedPathname)) return true;

  // ✅ Default: unlocked
  return false;
}
