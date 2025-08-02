/**
 *   ======================== page.js =========================
 * 👑 ADMIN NOTIFICATIONS
 * ----------------------------------------------------------
 * Shows all notifications for admins in a paginated, protected page.
 * =================================================================
 * 📦 PROPS: None (uses session, hooks)
 * =================================================================
 * 📌 USAGE: /admin/notifications
 * =================================================================
 */

'use client';

import { useSession } from 'next-auth/react'; // 🔐 Session
import { useEffect } from 'react'; // ⏱️ Side-effects
import { useRouter } from 'next/navigation'; // 🧭 Navigation
import useAuthGuard from '@/hooks/useAuthGuard'; // 🚧 Protect route by role
import SeeAllNotifications from '@/components/reusableUI/socket/SeeAllNotifications'; // 🛎️ See all notifications

export default function AdminNotificationsPage() {
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('admin');
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
      {/* 👑 SeeAllNotifications for admin */}
      <SeeAllNotifications userRole="admin" />
    </div>
  );
}
