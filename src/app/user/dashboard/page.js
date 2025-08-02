/**
 *   =========================== page.js ===========================
 * 🧑‍💻 USER DASHBOARD
 * -----------------------------------------------------------------
 * - NotificationCenter at top (user role)
 * - FreeTrialButton always reflects live backend status (socket-driven)
 * - Admin online status below FreeTrialButton
 * - Stacked dashboard action buttons, logout at bottom
 * =================================================================
 */

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useLogout from '@/hooks/useLogout';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';

import FreeTrialButton from '@/components/reusableUI/FreeTrialButtonMegaOtt';
import UserSubscriptionPanel from '@/components/reusableUI/socket/UserSubscriptionPanel';
import NotificationCenter from '@/components/reusableUI/socket/NotificationCenter';
import FreeTrials from '@/components/reusableUI/socket/FreeTrials';
import IsAdminOnline from '@/components/reusableUI/socket/IsAdminOnline';

export default function UserDashboard() {
  // 1️⃣ Auth/session setup
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('user');
  const logout = useLogout();
  const router = useRouter();

  // 7️⃣ Auth-redirect: if not allowed → redirect
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // Render nothing if not allowed
  if (!isAllowed) return null;

  // Render Dashboard UI
  return (
    <div className="flex flex-col items-center justify-center w-full lg:mt-0 mt-10">
      {/* 🟠 Main dashboard card */}
      <div className="container-style w-10/12 lg:w-[600px] mx-auto mb-2">
        {/* 1️⃣ Header */}
        <div className="font-bold text-center underline text-black lg:text-4xl text-2xl whitespace-nowrap">
          Welcome {session?.user?.name || 'User'}
        </div>
      </div>
      <div className="lg:w-[600px] w-full mx-auto">
        <FreeTrialButton />
      </div>

      {/* 🔵 User Subscription Panel */}
      <div className="lg:w-[600px] w-full mx-auto">
        <UserSubscriptionPanel user_id={session?.user?.user_id} />
      </div>
      {/* 🟢 Notification Center always at top, user role */}
      <div className="lg:w-[600px] w-full mx-auto p-4">
        <NotificationCenter userRole="user" />
      </div>

      {/* 🟣 Free Trial Panel (socket-powered) */}
      <div className="w-full lg:w-[600px] mx-auto">
        <FreeTrials user_id={session?.user?.user_id} className="container-style-sm mb-6" />
      </div>
      {/* 🔵 “Is Admin Online?” indicator */}
      <div className="container-style w-11/12 lg:w-[600px] mx-auto">
        <IsAdminOnline user_id={session?.user?.user_id} />
      </div>
    </div>
  );
}
{
  /*         <p className="text-center">
          Role: <span className="font-medium">{session?.user?.role ?? 'User'}</span>
        </p>
        <p className="text-center mb-6">
          User ID: <span className="font-medium">{session?.user?.user_id ?? 'NA'}</span>
        </p> */
}
