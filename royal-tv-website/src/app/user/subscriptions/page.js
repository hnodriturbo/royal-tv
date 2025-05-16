'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';

export default function UserSubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  // 🚀 Check authentication
  const { isAllowed, redirect } = useAuthGuard('user');
  useEffect(() => {
    if (!session?.user?.user_id) return;

    const fetchSubscriptions = async () => {
      try {
        const res = await axios.get('/api/user/subscriptions', {
          headers: { 'User-ID': session?.user?.user_id }
        });
        setSubscriptions(res.data);
      } catch (err) {
        console.error('Failed to load subscriptions:', err);
      }
    };

    fetchSubscriptions();
  }, [session]);

  /* ➡️ Redirect if not authorised once state is known */
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full py-10 px-4 lg:px-10">
      <div className="container-style">
        <h1 className="text-3xl font-bold mb-6">📦 Your Subscriptions</h1>

        {subscriptions.length === 0 ? (
          <p className="text-gray-500">No subscriptions found.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {subscriptions.map((sub) => (
              <div key={sub.subscription_id} className="border rounded-2xl p-6 shadow-md bg-white">
                <p>
                  <strong>Plan:</strong> {sub.plan ?? '-'}
                </p>
                <p>
                  <strong>Status:</strong> {sub.status ?? '-'}
                </p>
                <p>
                  <strong>Username:</strong> {sub.subscription_username ?? '-'}
                </p>
                <p>
                  <strong>Password:</strong> {sub.subscription_password ?? '-'}
                </p>
                <p>
                  <strong>URL:</strong> {sub.subscription_url ?? '-'}
                </p>
                <p>
                  <strong>Other Info:</strong> {sub.subscription_other ?? '-'}
                </p>
                <p>
                  <strong>Details:</strong> {sub.additional_info ?? '-'}
                </p>
                <p>
                  <strong>Start:</strong> {new Date(sub.startDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>End:</strong>{' '}
                  {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '-'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
