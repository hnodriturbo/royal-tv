/**
 * ========== /app/[locale]/admin/notifications/page.js ==========
 * 🔔 Admin Notifications
 * - Protected admin page rendering SeeAllNotifications (admin scope).
 * - Uses next-intl for the heading only; widget handles its own UI.
 * ===============================================================
 */

'use client';
import { useRouter } from 'next/navigation';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

import { useTranslations } from 'next-intl';

import useAuthGuard from '@/hooks/useAuthGuard';
import SeeAllNotifications from '@/components/reusableUI/socket/SeeAllNotifications';

export default function AdminNotificationsPage() {
  // 🌐 translator
  const t = useTranslations();

  // 🔐 auth
  const { status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const router = useRouter();

  // 🚦 forbidden → redirect
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center w-full py-6">
      {/* 🏷️ title */}
      <h1 className="text-2xl font-bold mb-4">{t('app.admin.notifications.title')}</h1>
      {/* 🛎️ list */}
      <SeeAllNotifications userRole="admin" />
    </div>
  );
}
