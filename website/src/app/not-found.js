/**
 * ============================ /src/app/not-found.js ============================
 * 🚫 Not Found (404)
 * -----------------------------------------------------------------------------
 * 🧭 Purpose: Render a friendly 404 page when no route matches.
 * 🌍 Locale-aware: Uses next-intl server API to detect the active locale so that
 *     the “Go to homepage” link sends users to the correct localized root.
 * 🧩 Tech notes:
 *   - This is a Server Component (no "use client" at the top).
 *   - Uses <Link/> (not <a/>) for framework-aware navigation & prefetch.
 * ==============================================================================
 */

import Link from 'next/link';
import { getLocale } from 'next-intl/server'; // 🌍 server-safe locale getter

export default async function NotFound() {
  // 🗺️ Detect the active locale on the server (no client runtime needed)
  const locale = await getLocale();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
      {/* 🏷️ Title */}
      <h1 className="text-3xl font-bold">404 — Page not found</h1>

      {/* 📜 Friendly explanation */}
      <p className="opacity-70 max-w-prose">The page you’re looking for doesn’t exist or moved.</p>

      {/* 🏠 Locale-aware home link (uses <Link/>, not <a/>) */}
      <Link
        href={`/${locale}`}
        className="mt-2 inline-block rounded-xl px-4 py-2 border transition"
      >
        Go to homepage
      </Link>
    </div>
  );
}
