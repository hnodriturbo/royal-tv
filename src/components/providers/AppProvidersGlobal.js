/**
 * ======================= AppProvidersGlobal.js =======================
 * 🧱 Global, locale-agnostic providers shell
 * - Mounted once under SessionProvider (root layout)
 * - Keep only things that must not remount on locale change
 */

'use client';

export default function AppProvidersGlobal({ children }) {
  // 🔁 Render global shell as-is (no locale dependence here)
  return <>{children}</>;
}
