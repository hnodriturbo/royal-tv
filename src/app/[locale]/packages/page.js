/**
 * ==================================
 * 🗂️ /packages/page.js
 * ----------------------------------
 * Lists ALL purchasable packages, and embeds the central <Guide /> below.
 * - Uses PackagesGrid from data file
 * - Passes authenticated flag to grid
 * - Pulls all user-facing text from i18n (useT)
 * ==================================
 */

'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl'; // 🌍 i18n access

import PackagesGrid from '@/components/packages/data/packages';
import Guide from '@/components/packages/data/guide';

export default function AllPackagesPage() {
  // 🗣️ i18n handle for this page
  const t = useTranslations();

  // 👤 session status to drive CTAs inside grid
  const { data: session, status } = useSession();
  const isAuthenticatedUser = status === 'authenticated' && Boolean(session?.user);

  return (
    <div className="flex flex-col items-center w-full min-h-screen lg:mt-0 mt-12">
      {/* 🏷️ headline */}
      <div className="container-style max-w-3xl w-full text-center mb-8 border-2">
        <h1 className="text-4xl md:text-5xl font-black text-wonderful-5 drop-shadow-xl mb-2">
          {t('app.packages.main.title')}
        </h1>
        <p className="text-cyan-100 text-lg">{t('app.packages.main.subtitle')}</p>
      </div>

      {/* 🧱 package grid (non-trial by design) */}
      <div className="w-full px-4">
        <PackagesGrid authenticated={isAuthenticatedUser} />
      </div>

      {/* 📘 step-by-step guide (reused component) */}
      <Guide />
    </div>
  );
}
