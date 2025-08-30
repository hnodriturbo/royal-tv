'use client'; // 💡 Client page

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useLogout from '@/hooks/useLogout';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from '@/i18n';

import UserSubscriptionPanel from '@/components/reusableUI/socket/UserSubscriptionPanel';
import NotificationCenter from '@/components/reusableUI/socket/NotificationCenter';
import FreeTrialPanel from '@/components/reusableUI/socket/FreeTrialPanel';
import IsAdminOnline from '@/components/reusableUI/socket/IsAdminOnline';
import { useTranslations, useLocale } from 'next-intl'; // 🌍 import translator

export default function UserDashboard() {
  // 🔐 Auth/session setup
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('user');
  const logout = useLogout();
  const router = useRouter();

  // 🗣️ Translator for root dashboard bits
  const t = useTranslations(); // 🏷️ base: app.dashboard.page

  // 🚦 Auth-redirect
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 🚫 Render nothing if not allowed
  if (!isAllowed) return null;

  // 🎨 Render Dashboard UI
  return (
    <div className="flex flex-col items-center justify-center w-full lg:mt-0 mt-10">
      {/* 🟠 Main dashboard card */}
      <div className="container-style w-10/12 lg:w-[600px] mx-auto mb-6">
        {/* 🏷️ Header, localized */}
        <div className="font-bold text-center underline text-wonderful-1 text-black lg:text-4xl text-2xl whitespace-nowrap">
          {t('app.user.dashboard.page.welcome')}{' '}
          {session?.user?.name || t('app.user.dashboard.page.user')}
        </div>
      </div>

      {/* 🟣 Free Trial Panel (socket-powered) */}
      <div className="w-full mx-auto mb-4">
        <FreeTrialPanel user_id={session?.user?.user_id} className="container-style" />
      </div>

      {/* 🔵 User Subscription Panel */}
      <div className="w-full mx-auto">
        <UserSubscriptionPanel user_id={session?.user?.user_id} />
      </div>

      {/* 🟢 Notification Center */}
      <div className="lg:w-[600px] w-full mx-auto p-4">
        <NotificationCenter userRole="user" />
      </div>

      {/* 🧑‍💼 Admin Online Indicator */}
      <div className="container-style w-11/12 lg:w-[600px] mx-auto">
        <IsAdminOnline user_id={session?.user?.user_id} />
      </div>
    </div>
  );
}
