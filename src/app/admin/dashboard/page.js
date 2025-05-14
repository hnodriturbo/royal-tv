'use client';

import Link from 'next/link';
import useLogout from '@/hooks/useLogout';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useAppHandlers from '@/hooks/useAppHandlers';
import useSocketHub from '@/hooks/socket/useSocketHub';
/* import OnlineUsers from '@/components/reusableUI/socket/OnlineUsers'; */

const DashboardActionButton = ({ href, label }) => (
  <Link href={href}>
    <button className="w-full bg-smooth-gradient py-2 px-4 rounded-lg shadow-2xl hover:shadow-md transition z-40">
      {label}
    </button>
  </Link>
);

const AdminDashboard = () => {
  // ✅ Local State
  const { data: session, status } = useSession();
  const logout = useLogout();
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState([]);

  // 🚀 Check authentication
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage } = useAppHandlers();

  /* ➡️ Redirect if not authorised once state is known */
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect)
      router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* <OnlineUsers /> */}

      <div className="container-style pc:w-[600px]">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Welcome, {session?.user?.username || 'Admin'}
        </h2>
        <p className="text-center">
          Role: <span className="font-medium">{session?.user?.role}</span>
        </p>
        <p className="text-center mb-6">
          User ID: <span className="font-medium">{session?.user?.user_id}</span>
        </p>

        <div className="grid mobile:grid-cols-1 pc:grid-cols-2 gap-4 w-full px-4">
          <DashboardActionButton
            href="/admin/users/main"
            label="Manage Users"
          />
          <DashboardActionButton
            href="/admin/subscriptions"
            label="Show Subscriptions"
          />
          <DashboardActionButton
            href="/admin/liveChat/main"
            label="View Live Chats"
          />
          <DashboardActionButton
            href="/admin/bubbleChat/main"
            label="View Bubble Chats"
          />
          <DashboardActionButton
            href="/admin/profile"
            label="View Your Profile"
          />
        </div>
        <div className="mt-8 flex justify-center items-center">
          <button
            onClick={logout}
            className="bg-gray-500 px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
