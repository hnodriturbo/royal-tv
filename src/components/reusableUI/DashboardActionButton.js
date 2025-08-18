// 🧠  /components/reusableUI/DashboardActionButton.js
/**
 * ===================== DashboardActionButton.js =====================
 * 🟢 Reusable stacked action button for all dashboards
 * - Translated with i18n client via useT()
 * - Always stacked, 100% width.
 * - bg-smooth-gradient and shadow for style.
 * ====================================================================
 */

'use client';

import { Link } from '@/lib/language';
import { useT } from '@/lib/i18n/client'; // 🌐 i18n

export default function DashboardActionButton({ href, label }) {
  const t = useT(); // 🔤

  return (
    <Link href={href}>
      <button className="w-full bg-smooth-gradient py-2 px-4 rounded-lg shadow-2xl hover:shadow-md transition z-40 cursor-pointer font-medium">
        {/* 🏷️ Prefer prop label if provided, else default translation */}
        {label || t('components.dashboardActionButton.default_label')}
      </button>
    </Link>
  );
}
