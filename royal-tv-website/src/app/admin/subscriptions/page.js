'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axiosInstance';
import Link from 'next/link';
import useAppHandlers from '@/hooks/useAppHandlers';
import Pagination from '@/components/reusableUI/Pagination';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AdminSubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const [subscriptions, setSubscriptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSubscriptions = async () => {
    try {
      showLoader({ text: 'Loading subscriptions...' });

      const res = await axiosInstance.get('/api/admin/subscriptions', {
        params: { page: currentPage, limit: 10 }
      });

      setSubscriptions(res.data.subscriptions);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      displayMessage('Failed to fetch subscriptions', 'error');
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchSubscriptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  /* ➡️ Redirect if not authorised once state is known */
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style lg:w-11/12 xl:w-8/12">
        <div className="text-center">
          <h1 className="text-2xl font-bold m-4">User Subscriptions</h1>
          <hr className="border border-gray-400 w-8/12 mx-auto mb-4" />
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No subscriptions found.</p>
          </div>
        ) : (
          <>
            {/* Table view for desktop */}
            <div className="overflow-x-auto w-full lg:block hidden">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-600 text-white">
                    <th className="border border-gray-300 px-4 py-2">User</th>
                    <th className="border border-gray-300 px-4 py-2">Email</th>
                    <th className="border border-gray-300 px-4 py-2">Plan</th>
                    <th className="border border-gray-300 px-4 py-2">Status</th>
                    <th className="border border-gray-300 px-4 py-2">Start</th>
                    <th className="border border-gray-300 px-4 py-2">End</th>
                    <th className="border border-gray-300 px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.subscription_id} className="hover:bg-gray-100">
                      <td className="border border-gray-300 px-4 py-2">
                        {sub.user?.name || 'N/A'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {sub.user?.email || 'N/A'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{sub.plan || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2">{sub.status}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {new Date(sub.startDate).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <Link href={`/admin/subscriptions/${sub.subscription_id}`}>
                          <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition">
                            View/Edit
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 📱 Card View for Mobile */}
            <div className="lg:hidden flex flex-col gap-4 w-full mt-6 no-wrap">
              {subscriptions.map((sub) => (
                <div
                  key={sub.subscription_id}
                  className="border border-gray-300 rounded-lg p-4 shadow bg-white"
                >
                  <h2 className="font-bold">{sub.user?.name || 'N/A'}</h2>
                  <p>Email: {sub.user?.email || 'N/A'}</p>
                  <p>Plan: {sub.plan || '-'}</p>
                  <p>Status: {sub.status}</p>
                  <p>Start: {new Date(sub.startDate).toLocaleDateString()}</p>
                  <p>End: {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '-'}</p>
                  <div className="mt-2 flex justify-end">
                    <Link href={`/admin/subscriptions/${sub.subscription_id}`}>
                      <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm">
                        View/Edit
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination always after both views */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
