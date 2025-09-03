/**
 * ===========================================================
 * 🧭 /app/[locale]/more-info/page.js
 * -----------------------------------------------------------
 * More Info page:
 * - Shows the full setup Guide and then the Packages grid.
 * - All user-facing text is pulled from i18n via useTranslations().
 * ===========================================================
 */

'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl'; // 🌍 i18n — requested import path & style
import { Link } from '@/i18n';

import Guide from '@/components/packages/data/guide'; // 🛠️ setup guide
import PackagesGrid from '@/components/packages/data/packages'; // 📦 packages grid

export default function MoreInfoPage() {
  // 🗣️ translation handle
  const t = useTranslations();

  // 👤 auth status (optional for grid behaviors)
  const { data: session, status } = useSession();
  const isAuthenticatedUser =
    status === 'authenticated' && session?.user?.role && session.user.role !== 'guest';

  return (
    <div className="flex flex-col items-center w-full lg:mt-0 mt-12">
      {/* 🧭 step-by-step guide & app recommendations */}
      <Guide />

      {/* 📦 all packages for user to browse/purchase */}
      <div className="mt-20 mb-12 w-full flex flex-col items-center">
        <div className="container-style mb-4 w-fit">
          {/* 🏷️ section heading */}
          <h2 className="text-4xl font-bold text-wonderful-5 mb-8 text-center drop-shadow-lg">
            {t('app.more-info.packages_heading')}
          </h2>
        </div>

        <PackagesGrid authenticated={isAuthenticatedUser} />
      </div>
    </div>
  );
}
