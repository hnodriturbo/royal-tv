/**
 *   ======================== AdminFreeTrialsPage.js ========================
 * 🎁
 * HEADLINE: Admin Free Trial Requests – Main List
 * - Paginated, sortable, desktop table + mobile card view.
 * - Actions: View/Edit, Delete (admin only, modal confirmation).
 * ========================================================================
 * ⚙️
 * PROPS: none (auto-fetches, admin-guarded)
 * ========================================================================
 * 📌
 * USAGE:
 *   /admin/freeTrial/main – main admin page to manage free trials
 * ========================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/reusableUI/Pagination';
import useModal from '@/hooks/useModal';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
// Sorting
import SortDropdown from '@/components/reusableUI/SortDropdown';
import { freeTrialSortOptions, getFreeTrialSortFunction } from '@/lib/sorting';
import useLocalSorter from '@/hooks/useLocalSorter';

export default function AdminFreeTrialsPage() {
  // 🦸 Admin session/auth
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  // 📦 Free trials state
  const [freeTrials, setFreeTrials] = useState([]);
  const [sortOrder, setSortOrder] = useState('createdAt_desc');
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * 📥 Fetch all Free Trials (admin)
   * - Calls backend with x-user-role header for security.
   * - Shows loader, handles errors, updates state.
   */
  const fetchFreeTrials = async () => {
    try {
      // 🌀 Show loader to indicate loading state
      showLoader({ text: 'Loading free trials...' });

      // 🌐 Make GET request to API (admin only, header added globally by axiosInstance)
      const res = await axiosInstance.get('/api/admin/freeTrials/main');

      // 💾 Store results in state
      setFreeTrials(res.data.trials || []);

      // ✅ Success
      displayMessage('Free trials loaded!', 'success');
    } catch (err) {
      // ❌ Handle error and show feedback
      displayMessage(
        `Failed to load free trials${err?.response?.data?.error ? `: ${err.response.data.error}` : ''}`,
        'error'
      );
    } finally {
      // 🛑 Always hide loader when done
      hideLoader();
    }
  };

  // 2️⃣ Modal Delete logic
  const handleDelete = (trial_id) => {
    openModal('deleteFreeTrial', {
      title: 'Delete Free Trial',
      description:
        'Are you sure you want to delete this free trial request? This cannot be undone.',
      confirmButtonText: 'Delete',
      confirmButtonType: 'Danger',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        try {
          showLoader({ text: 'Deleting free trial...' });
          await axiosInstance.delete(`/api/admin/freeTrials/${trial_id}`);
          displayMessage('Free trial deleted!', 'success');
          fetchFreeTrials(); // 🔄 Refresh list
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

  // ✅ Countdown timer for refresh every 10 minutes
  const { AutoRefresh } = useAutoRefresh(fetchFreeTrials, {
    intervalSeconds: 600,
    uiOptions: {
      showManualButton: true,
      showPauseToggle: true
    }
  });

  // ✅ Status color map
  const STATUS_COLOR_MAP = {
    active: 'bg-green-600',
    pending: 'bg-yellow-500',
    disabled: 'bg-gray-500'
  };

  // Local sorting and pagination (these happen on the client only)
  const sortedTrials = useLocalSorter(freeTrials, sortOrder, getFreeTrialSortFunction);
  const pageSize = 10;
  const totalPages = Math.ceil(sortedTrials.length / pageSize);
  const pagedTrials = sortedTrials.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Only fetch ONCE when user is authenticated & allowed
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchFreeTrials();
    }
  }, [status, isAllowed]);

  // 4️⃣ Redirect if not allowed
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        {/* 🏷️ Title & Divider */}
        <div className="flex flex-col items-center text-center justify-center relative w-full">
          <h1 className="text-wonderful-5 text-2xl mb-0">All Free Trial Requests</h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>
        {/* 🔄 Sorting & AutoRefresh Controls (row on desktop, stacked on mobile) */}
        <div className="flex justify-center items-center w-full">
          <div className="flex flex-col w-10/12 mb-3 items-center md:flex-row md:space-x-3 md:space-y-0 space-y-10">
            {/* 🟦 SortDropdown centered in its column */}
            <div className="flex-1 flex justify-center items-center m-0">
              <SortDropdown
                options={freeTrialSortOptions}
                value={sortOrder}
                onChange={setSortOrder}
              />
            </div>

            {/* 📏 Divider for mobile/tablet */}
            <hr className="md:hidden border border-gray-400 w-8/12 my-4" />

            {/* ⏳ AutoRefresh centered in its column */}
            <div className="flex-1 flex justify-center items-center">{AutoRefresh}</div>
          </div>
        </div>

        {/* ===================💻 Desktop: Responsive Table View (xl+) =================== */}
        <div className="hidden xl:flex justify-center w-full">
          {/* 🖱️ Horizontal scroll if needed */}
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[850px] w-full border-separate border-spacing-0 text-shadow-dark-1">
              <thead>
                <tr className="bg-gray-600 text-base-100 font-bold">
                  <th className="border border-gray-300 px-4 py-2">User</th>
                  <th className="border border-gray-300 px-4 py-2">Username</th>
                  <th className="border border-gray-300 px-4 py-2">Email</th>
                  <th className="border border-gray-300 px-4 py-2">Status</th>
                  <th className="border border-gray-300 px-4 py-2">Created</th>
                  <th className="border border-gray-300 px-4 py-2">Start Date</th>
                  <th className="border border-gray-300 px-4 py-2">End Date</th>
                  <th className="border border-gray-300 px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {pagedTrials.map((trial) => (
                  <tr key={trial.trial_id} className="hover:bg-gray-400">
                    <td className="border border-gray-300 px-4 py-2">{trial.user?.name || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {trial.user?.username || '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{trial.user?.email || '-'}</td>
                    <td
                      className={`border border-gray-300 px-4 py-2 font-bold ${STATUS_COLOR_MAP[trial.status]}`}
                    >
                      {trial.status}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {trial.createdAt ? new Date(trial.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {trial.startDate ? new Date(trial.startDate).toLocaleString() : '—'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {trial.endDate ? new Date(trial.endDate).toLocaleString() : '—'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {/* 🛠️ Table action buttons */}
                      <div className="flex flex-row gap-2 w-fit justify-center">
                        <Link href={`/admin/freeTrials/${trial.trial_id}`}>
                          <button className="btn-primary btn-sm">View/Edit</button>
                        </Link>
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => handleDelete(trial.trial_id)}
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

        {/* ===================📱 Card View for Mobile/Tablet (below xl) =================== */}
        <div className="xl:hidden flex flex-col gap-4 w-full mt-6">
          {pagedTrials.map((trial) => (
            <div
              key={trial.trial_id}
              className="border border-gray-300 rounded-2xl p-4 shadow-sm bg-gray-600 text-base-100 font-bold"
            >
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold text-lg">
                  {trial.user?.name || '-'}
                  <span className="ml-2 text-xs text-muted">
                    {trial.user?.username && `(${trial.user.username})`}
                  </span>
                </h3>
                <span
                  className={`px-4 py-2 rounded text-sm font-bold ${STATUS_COLOR_MAP[trial.status]}`}
                >
                  {trial.status}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Email:</strong> {trial.user?.email || '-'}
                </div>
                <div>
                  <strong>Created:</strong>{' '}
                  {trial.createdAt ? new Date(trial.createdAt).toLocaleString() : '—'}
                </div>
                <div>
                  <strong>Start:</strong>{' '}
                  {trial.startDate ? new Date(trial.startDate).toLocaleString() : '—'}
                </div>
                <div>
                  <strong>End:</strong>{' '}
                  {trial.endDate ? new Date(trial.endDate).toLocaleString() : '—'}
                </div>
              </div>
              {/* 🛠️ Card action buttons */}
              <div className="flex flex-row gap-3 mt-4 w-full">
                <Link
                  href={`/admin/freeTrials/${trial.trial_id}`}
                  className="flex-1 flex justify-start"
                >
                  <button className="btn-primary w-full">View/Edit</button>
                </Link>
                <div className="flex-1 flex justify-end">
                  <button
                    className="btn-danger w-full"
                    onClick={() => handleDelete(trial.trial_id)}
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
