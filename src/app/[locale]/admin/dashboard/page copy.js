/**
 * =========================== /app/[locale]/admin/page.js ===========================
 * 👑 ADMIN DASHBOARD (Client Component)
 * - Guards admin access, shows Admin Online + Online Users + Notification Center.
 * - Text translations use next-intl → useTranslations() with full keys.
 * - Navigation (router) from @/i18n.
 * ===============================================================================
 */

'use client';import { useRouter } from "next/navigation";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

import useLogout from '@/hooks/useLogout';
import useAuthGuard from '@/hooks/useAuthGuard';
// 🌍 locale-aware router
import { useTranslations } from 'next-intl'; // 🌐 i18n (full keys)

import NotificationCenter from '@/components/reusableUI/socket/NotificationCenter';
import OnlineUsers from '@/components/reusableUI/socket/OnlineUsers';
import IsAdminOnline from '@/components/reusableUI/socket/IsAdminOnline';

export default function AdminDashboard() {
  // 🌐 translator
  const t = useTranslations();

  // 👤 auth/session
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const logout = useLogout();
  const router = useRouter();

  // 🔒 redirect protection
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  // 🛡️ non-admin block
  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-start w-full min-h-screen gap-8">
      {/* 🏷️ page heading */}
      <div className="w-full flex justify-center mt-4">
        <h1 className="text-2xl font-bold">{t('app.admin.dashboard.title')}</h1>
      </div>

      {/* 🟢 admin presence */}
      <div className="container-style w-6/12">
        <IsAdminOnline />
      </div>

      {/* 👥 online users */}
      <div className="flex w-8/12 items-center justify-center">
        <OnlineUsers />
      </div>

      {/* 🔔 notification center */}
      <div className="w-11/12 max-w-[600px] mx-auto">
        <NotificationCenter userRole="admin" />
      </div>
    </div>);

}