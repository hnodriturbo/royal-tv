// 🧠  /components/reusableUI/DashboardActionButton.js
/**
 * ===================== DashboardActionButton.js =====================
 * 🟢 Reusable stacked action button for all dashboards
 * - Translated with i18n client via useTranslations()
 * - Always stacked, 100% width.
 * - bg-smooth-gradient and shadow for style.
 * ====================================================================
 */

'use client';

import { Link } from '@/i18n';
import { useTranslations, useLocale } from 'next-intl'; // 🌐 i18n

export default function DashboardActionButton({ href, label }) {
  const t = useTranslations(); // 🔤

  return (
    <Link
      href={href}
      className="w-full bg-smooth-gradient py-2 px-4 rounded-lg shadow-2xl hover:shadow-md transition z-40 cursor-pointer font-medium text-center block"
    >
      {label || t('components.dashboardActionButton.default_label')}
    </Link>
  );
}
