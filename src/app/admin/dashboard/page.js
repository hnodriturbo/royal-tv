/**
 *   =========================== page.js ===========================
 * 👑 ADMIN DASHBOARD
 * - NotificationCenter and Admin Menu stacked, same width.
 * - Both always top-aligned, centered horizontally, not vertically.
 * =================================================================
 */

'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import useLogout from '@/hooks/useLogout';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import DashboardActionButton from '@/components/reusableUI/DashboardActionButton';
import NotificationCenter from '@/components/reusableUI/socket/NotificationCenter';
import OnlineUsers from '@/components/reusableUI/socket/OnlineUsers';
import IsAdminOnline from '@/components/reusableUI/socket/IsAdminOnline';
export default function AdminDashboard() {
  // 👤 Auth/session setup
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const logout = useLogout();
  const router = useRouter();

  // 🔒 Redirect protection
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    // 🟪 STACKED layout, always top-aligned, centered horizontally
    <div className="flex flex-col items-center justify-start w-full min-h-screen gap-8">
      <div className="container-style w-6/12">
        <IsAdminOnline />
      </div>
      <div className="flex w-8/12 items-center justify-center">
        <OnlineUsers />
      </div>

      {/* 🗂️ Admin menu card (matches NotificationCenter width) */}
      {/*  <div className="container-style w-11/12 max-w-[600px] mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Welcome, {session?.user?.username || 'Admin'}
        </h2>
        <p className="text-center">
          Role: <span className="font-medium">{session?.user?.role}</span>
        </p>
        <p className="text-center mb-6">
          User ID: <span className="font-medium">{session?.user?.user_id}</span>
        </p>

      </div> */}
      {/* 🔔 Notification Center panel */}
      <div className="w-11/12 max-w-[600px] mx-auto">
        <NotificationCenter userRole="admin" />
      </div>
    </div>
  );
}
