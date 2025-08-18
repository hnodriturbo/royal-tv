/**
 *   ======================== AdminSubscriptionsPage.js ========================
 * 📦
 * HEADLINE: Admin Subscriptions – Main List
 * - Paginated, sortable, desktop table + mobile card view.
 * - Actions: View/Edit, Delete (admin only, modal confirmation).
 * ========================================================================
 * ⚙️
 * PROPS: none (auto-fetches, admin-guarded)
 * ========================================================================
 * 📌
 * USAGE:
 *   /admin/subscriptions/main – main admin page to manage subscriptions
 * ========================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/lib/language';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from '@/lib/language';
import Pagination from '@/components/reusableUI/Pagination';
import useModal from '@/hooks/useModal';
// Sorting
import SortDropdown from '@/components/reusableUI/SortDropdown';
import { userSubscriptionSortOptions, getUserSubscriptionSortFunction } from '@/lib/utils/sorting'; // Use your user sub sort here
import useLocalSorter from '@/hooks/useLocalSorter';

export default function AdminSubscriptionsPage() {
  // 🦸 Admin session/auth
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  // 📦 Subscriptions state
  const [subscriptions, setSubscriptions] = useState([]);
  const [sortOrder, setSortOrder] = useState('created_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // 📥 Fetch all Subscriptions (admin)
  const fetchSubscriptions = async () => {
    try {
      showLoader({ text: 'Loading subscriptions...' });
      const response = await axiosInstance.get('/api/admin/subscriptions/main');
      setSubscriptions(response.data.subscriptions || []);
      displayMessage('All Subscriptions loaded!', 'success');
    } catch (err) {
      displayMessage(
        `Failed to load subscriptions${err?.response?.data?.error ? `: ${err.response.data.error}` : ''}`,
        'error'
      );
    } finally {
      hideLoader();
    }
  };

  // Local sorting and pagination (client side only sorting)
  const sortedSubscriptions = useLocalSorter(
    subscriptions,
    sortOrder,
    getUserSubscriptionSortFunction
  );
  const pageSize = 10;
  const totalPages = Math.ceil(sortedSubscriptions.length / pageSize);
  const pagedSubscriptions = sortedSubscriptions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Only fetch ONCE when user is authenticated & allowed
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchSubscriptions();
    }
  }, [status, isAllowed]);

  // Redirect if not allowed
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  const STATUS_COLOR_MAP = {
    active: 'bg-green-600',
    pending: 'bg-yellow-500',
    expired: 'bg-red-400',
    canceled: 'bg-red-500',
    disabled: 'bg-gray-500'
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        {/* 🏷️ Title & Divider */}
        <div className="flex flex-col items-center text-center justify-center relative w-full">
          <h1 className="text-4xl mb-0 text-glow-sky font-extrabold">All Subscriptions</h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>
        <div className="flex justify-center items-center">
          {/* 🔄 Sorting */}
          <div className="flex justify-center items-center lg:w-full w-1/2 mb-4">
            <SortDropdown
              options={userSubscriptionSortOptions}
              value={sortOrder}
              onChange={setSortOrder}
            />
          </div>
        </div>
        <div className="flex justify-center items-center">
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>
        {/* Desktop Table */}
        <div className="hidden xl:flex justify-center w-full">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[850px] w-full border-separate border-spacing-0 text-shadow-dark-1">
              <thead>
                <tr className="bg-gray-600 text-base-100 font-bold">
                  <th className="border border-gray-300 px-4 py-2">User</th>
                  <th className="border border-gray-300 px-4 py-2">Product</th>
                  <th className="border border-gray-300 px-4 py-2">Username</th>
                  <th className="border border-gray-300 px-4 py-2">Status</th>
                  <th className="border border-gray-300 px-4 py-2">Created</th>
                  <th className="border border-gray-300 px-4 py-2">Expiring At</th>
                  <th className="border border-gray-300 px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {pagedSubscriptions.map((sub) => (
                  <tr key={sub.subscription_id} className="hover:bg-gray-400">
                    {/* 👤 User */}
                    <td className="border border-gray-300 px-4 py-2">{sub.user?.name || '-'}</td>
                    {/* 📦 Product */}
                    <td className="border border-gray-300 px-4 py-2">{sub.package_name || '-'}</td>
                    {/* 👤 Username */}
                    <td className="border border-gray-300 px-4 py-2">{sub.username || '-'}</td>
                    {/* 🟢 Status */}
                    <td
                      className={`border border-gray-300 px-4 py-2 font-bold ${STATUS_COLOR_MAP[sub.status]}`}
                    >
                      {sub.status}
                    </td>
                    {/* 🕒 Created */}
                    <td className="border border-gray-300 px-4 py-2">
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '—'}
                    </td>
                    {/* ⏳ Expires */}
                    <td className="border border-gray-300 px-4 py-2">
                      {sub.expiring_at ? new Date(sub.expiring_at).toLocaleString() : '—'}
                    </td>
                    {/* 🛠️ Actions */}
                    <td className="flex border border-gray-300 px-4 py-2 justify-center">
                      <div className="flex flex-row gap-2 justify-center w-full">
                        <Link href={`/admin/subscriptions/${sub.subscription_id}`}>
                          <button
                            className="btn-primary btn-lg btn-glow"
                            style={{ width: '100%', padding: '0 40px' }}
                          >
                            View
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card View for Mobile/Tablet (below xl) */}
        <div className="xl:hidden flex flex-col gap-4 w-full mt-6">
          {pagedSubscriptions.map((sub) => (
            <div
              key={sub.subscription_id}
              className="border border-gray-300 rounded-2xl p-4 shadow-sm bg-gray-600 text-base-100 font-bold"
            >
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold text-lg">{sub.user?.name || '-'}</h3>
                <span
                  className={`px-4 py-2 rounded text-sm font-bold ${STATUS_COLOR_MAP[sub.status]}`}
                >
                  {sub.status}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Product:</strong> {sub.order_description || sub.package_name || '-'}
                </div>
                <div>
                  <strong>Username:</strong> {sub.username || '-'}
                </div>
                <div>
                  <strong>Created:</strong>{' '}
                  {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '—'}
                </div>
                <div>
                  <strong>Expires:</strong>{' '}
                  {sub.expiring_at ? new Date(sub.expiring_at).toLocaleString() : '—'}
                </div>
              </div>
              <div className="flex gap-3 mt-4 w-full justify-center">
                <div className="flex justify-center w-full">
                  <Link
                    href={`/admin/subscriptions/${sub.subscription_id}`}
                    className="flex justify-center !w-full"
                  >
                    <button className="btn-primary">View</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 🔢 Pagination below tables/cards */}
        <div className="flex justify-center mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
