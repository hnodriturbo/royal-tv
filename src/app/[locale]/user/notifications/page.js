/**
 *   ======================== page.js =========================
 * 👤 USER NOTIFICATIONS
 * ----------------------------------------------------------
 * Shows all notifications for the user in a paginated, protected page.
 * =================================================================
 * 📦 PROPS: None (uses session, hooks)
 * =================================================================
 * 📌 USAGE: /user/notifications
 * =================================================================
 */

'use client';import { useRouter } from "next/navigation";

import { useSession } from 'next-auth/react'; // 🔐 Session
import { useEffect } from 'react'; // ⏱️ Side-effects
// 🧭 Navigation
import useAuthGuard from '@/hooks/useAuthGuard'; // 🚧 Protect route by role
import SeeAllNotifications from '@/components/reusableUI/socket/SeeAllNotifications'; // 🛎️ See all notifications

export default function UserNotificationsPage() {
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('user');
  const router = useRouter();

  useEffect(() => {
    // 🚦 Redirect if unauthorized
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null; // 🛑 Wait until allowed

  return (
    <div className="flex flex-col items-center w-full py-6">
      {/* 👤 SeeAllNotifications for user */}
      <SeeAllNotifications userRole="user" />
    </div>);

}