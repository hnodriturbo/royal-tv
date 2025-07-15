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
import Link from 'next/link';
import axiosInstance from '@/lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/reusableUI/Pagination';
import useModal from '@/hooks/useModal';
// Sorting
import SortDropdown from '@/components/reusableUI/SortDropdown';
import { userSubscriptionSortOptions, getUserSubscriptionSortFunction } from '@/lib/sorting'; // Use your user sub sort here
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
      const res = await axiosInstance.get('/api/admin/subscriptions/main');
      setSubscriptions(res.data.subscriptions || []);
      displayMessage('Subscriptions loaded!', 'success');
    } catch (err) {
      displayMessage(
        `Failed to load subscriptions${err?.response?.data?.error ? `: ${err.response.data.error}` : ''}`,
        'error'
      );
    } finally {
      hideLoader();
    }
  };

  // Modal Delete logic
  const handleDelete = (subscription_id) => {
    openModal('deleteSubscription', {
      title: 'Delete Subscription',
      description: 'Are you sure you want to delete this subscription? This cannot be undone.',
      confirmButtonText: 'Delete',
      confirmButtonType: 'Danger',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        try {
          showLoader({ text: 'Deleting subscription...' });
          await axiosInstance.delete(`/api/admin/subscriptions/${subscription_id}`);
          displayMessage('Subscription deleted!', 'success');
          fetchSubscriptions();
        } catch (err) {
          displayMessage(`❌ Delete failed: ${err.message}`, 'error');
        } finally {
          hideModal();
          hideLoader();
        }
      },
      onCancel: () => {
        displayMessage('🛑 Deletion cancelled.', 'info');
        hideModal();
      }
    });
  };

  // Local sorting and pagination (client only)
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
    expired: 'bg-gray-400',
    canceled: 'bg-red-500',
    disabled: 'bg-gray-500'
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        {/* 🏷️ Title & Divider */}
        <div className="flex flex-col items-center text-center justify-center relative w-full">
          <h1 className="text-wonderful-5 text-2xl mb-0">All Subscriptions</h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>
        {/* 🔄 Sorting */}
        <div className="flex justify-center items-center w-full mb-4">
          <SortDropdown
            options={userSubscriptionSortOptions}
            value={sortOrder}
            onChange={setSortOrder}
          />
        </div>

        {/* Desktop Table */}
        <div className="hidden xl:flex justify-center w-full">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[850px] w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-600 text-base-100 font-bold">
                  <th className="border border-gray-300 px-4 py-2">User</th>
                  <th className="border border-gray-300 px-4 py-2">Product</th>
                  <th className="border border-gray-300 px-4 py-2">Username</th>
                  <th className="border border-gray-300 px-4 py-2">Status</th>
                  <th className="border border-gray-300 px-4 py-2">Created</th>
                  <th className="border border-gray-300 px-4 py-2">Start</th>
                  <th className="border border-gray-300 px-4 py-2">End</th>
                  <th className="border border-gray-300 px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {pagedSubscriptions.map((sub) => (
                  <tr key={sub.subscription_id} className="hover:bg-gray-400">
                    <td className="border border-gray-300 px-4 py-2">{sub.user?.name || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2">{sub.product || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {sub.subscription_username || '-'}
                    </td>
                    <td
                      className={`border border-gray-300 px-4 py-2 font-bold ${STATUS_COLOR_MAP[sub.status]}`}
                    >
                      {sub.status}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {sub.startDate ? new Date(sub.startDate).toLocaleString() : '—'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {sub.endDate ? new Date(sub.endDate).toLocaleString() : '—'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex flex-row gap-2 w-fit justify-center">
                        <Link href={`/admin/subscriptions/${sub.subscription_id}`}>
                          <button className="btn-primary btn-sm">View/Edit</button>
                        </Link>
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => handleDelete(sub.subscription_id)}
                        >
                          Delete
                        </button>
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
                <h3 className="font-semibold text-lg">
                  {sub.user?.name || '-'}
                  <span className="ml-2 text-xs text-muted">
                    {sub.product && `(${sub.product})`}
                  </span>
                </h3>
                <span
                  className={`px-4 py-2 rounded text-sm font-bold ${STATUS_COLOR_MAP[sub.status]}`}
                >
                  {sub.status}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Username:</strong> {sub.subscription_username || '-'}
                </div>
                <div>
                  <strong>Created:</strong>{' '}
                  {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '—'}
                </div>
                <div>
                  <strong>Start:</strong>{' '}
                  {sub.startDate ? new Date(sub.startDate).toLocaleString() : '—'}
                </div>
                <div>
                  <strong>End:</strong> {sub.endDate ? new Date(sub.endDate).toLocaleString() : '—'}
                </div>
              </div>
              <div className="flex flex-row gap-3 mt-4 w-full">
                <Link
                  href={`/admin/subscriptions/${sub.subscription_id}`}
                  className="flex-1 flex justify-start"
                >
                  <button className="btn-primary w-full">View/Edit</button>
                </Link>
                <div className="flex-1 flex justify-end">
                  <button
                    className="btn-danger w-full"
                    onClick={() => handleDelete(sub.subscription_id)}
                  >
                    Delete
                  </button>
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
