/**
 * ===============================================
 * /packages/page.js — Royal TV Subscription Grid
 * ===============================================
 * - Displays all available subscription packages in a responsive grid.
 * - Shows Buy Now and More Info buttons for each package.
 * - Authenticated users see "Buy Now"; guests see "Register to Buy".
 * - Uses session to determine if user is logged in.
 * - No extra container—minimal, flexible page for maximum reusability!
 */

'use client';

import { useSession } from 'next-auth/react';
import PackagesGrid from '@/components/packages/data/packages';
import { useTranslations } from 'next-intl';

export default function PackagesPage() {
  const t = useTranslations();
  // 🌐 Get session for authentication
  const { data: session, status } = useSession();
  const authenticated =
    status === 'authenticated' && session?.user?.role && session.user.role !== 'guest';

  return (
    <div className="w-full flex flex-col items-center py-8">
      {/* 🏆 Page Title (inside extra container) */}
      <div className="container-style w-fit mb-8 px-20">
        <h1 className="text-4xl font-bold text-center">{t('app.packages.main.title')}</h1>
      </div>
      {/* 📦 Packages Grid — card-based grid, just like the front page */}
      <PackagesGrid authenticated={authenticated} />
    </div>
  );
}
