// 🧠  /components/reusableUI/DashboardActionButton.js

/**
 * ===================== DashboardActionButton.js =====================
 * 🟢 Reusable stacked action button for all dashboards
 * - Always stacked, 100% width.
 * - bg-smooth-gradient and shadow for style.
 * ====================================================================
 */

import Link from 'next/link';

export default function DashboardActionButton({ href, label }) {
  return (
    <Link href={href}>
      <button className="w-full bg-smooth-gradient py-2 px-4 rounded-lg shadow-2xl hover:shadow-md transition z-40 cursor-pointer font-medium">
        {label}
      </button>
    </Link>
  );
}
