/**
 * ============================
 * /admin/logs/[ip_address]/page.js
 * 📜
 * Admin Logs By IP Page
 * - Lists all logs for a single IP (table for xl+, cards for mobile/tablet)
 * - Sorting and pagination are client-side
 * - Shows IP address as page title
 * ============================
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { useRouter, Link } from '@/i18n';

import useAuthGuard from '@/hooks/useAuthGuard';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';

// Local sorting/pagination
import Pagination from '@/components/reusableUI/Pagination';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import useLocalSorter from '@/hooks/useLocalSorter';

// 📚 Sorting options
import { logSortOptions, getLogSortFunction } from '@/lib/utils/sorting';

export default function AdminLogsByIpPage() {
  // 🛡️ Auth/session
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  // 🪵 State
  const [logs, setLogs] = useState([]);
  const [sortOrder, setSortOrder] = useState('createdAt_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // 🏷️ Extract and decode IP from params
  const ip_address = decodeURIComponent(params.ip_address || '');

  // 📥 Fetch logs for this IP
  const fetchLogs = async () => {
    try {
      showLoader({ text: 'Loading Logs for IP...' });
      const response = await axiosInstance.get(`/api/admin/logs/${encodeURIComponent(ip_address)}`);
      setLogs(response.data.logs || []);
      displayMessage('Logs Loaded!', 'success');
    } catch (err) {
      displayMessage(
        `Failed to load logs${err?.response?.data?.error ? `: ${err.response.data.error}` : ''}`,
        'error'
      );
    } finally {
      hideLoader();
    }
  };

  // 🧠 Sort logs
  const sortedLogs = useLocalSorter(logs, sortOrder, (order) => {
    const sortFunction = getLogSortFunction(order);
    return (a, b) => sortFunction(a, b);
  });

  // ⚙️ Pagination
  const pageSize = 10;
  const totalPages = Math.ceil(sortedLogs.length / pageSize);
  const pagedLogs = sortedLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 🔁 Fetch on load/auth change
  useEffect(() => {
    if (status === 'authenticated' && isAllowed && ip_address) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed, ip_address]);

  // 🚫 Redirect if not allowed
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;
  // 🗑️ Delete all logs for this IP (modal)
  const handleDelete = () => {
    openModal('deleteLogsByIp', {
      title: 'Delete All Logs for This IP',
      description: `Are you sure you want to delete ALL logs for IP: ${ip_address}? This cannot be undone.`,
      confirmButtonText: 'Delete',
      confirmButtonType: 'Danger',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        try {
          showLoader({ text: 'Deleting logs...' });
          await axiosInstance.delete(`/api/admin/logs/${encodeURIComponent(ip_address)}`);
          displayMessage('Logs deleted!', 'success');
          // ⏳ Wait 3 seconds, then navigate
          setTimeout(() => {
            router.push('/admin/logs/main'); // 🚀 Redirect to main logs page
          }, 3000);
        } catch (err) {
          displayMessage(`❌ Delete failed: ${err.message}`, 'error');
        } finally {
          hideLoader();
        }
      },
      onCancel: () => {
        displayMessage('🛑 Deletion cancelled.', 'info');
        hideModal();
        hideLoader();
      }
    });
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="container-style">
        {/* 🏷️ Page title */}
        <div className="flex flex-col items-center text-center w-full">
          <h1 className="text-wonderful-5 text-2xl mb-0">
            Activity Logs for IP: <span className="font-mono">{ip_address}</span>
          </h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>
        {/* Sort Dropdown: center on mobile, left on desktop */}
        <div className="flex flex-col gap-3 w-full mb-4 justify-center">
          <div className="flex lg:w-full gap-3 justify-center lg:justify-start w-full">
            <div className="flex justify-center items-center w-1/2">
              <SortDropdown options={logSortOptions} value={sortOrder} onChange={setSortOrder} />
            </div>
          </div>
          <div className="flex justify-center">
            <hr className="lg:hidden border border-gray-400 w-8/12 my-4" />
          </div>
        </div>

        {/* 💻 Table view (desktop) */}
        <div className="hidden xl:flex justify-center w-full">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[950px] w-full border-separate border-spacing-0 text-shadow-dark-1">
              <thead>
                <tr className="bg-gray-600 text-base-100 font-bold">
                  <th className="border px-2 py-1">Time</th>
                  <th className="border px-2 py-1">User</th>
                  <th className="border px-2 py-1">Event</th>
                  <th className="border px-2 py-1">Page</th>
                  <th className="border px-2 py-1">Description</th>
                  <th className="border px-2 py-1">User Agent</th>
                </tr>
              </thead>
              <tbody>
                {pagedLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-gray-400">
                    <td className="border px-2 py-1">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="border px-2 py-1 whitespace-nowrap">
                      👤 {log.user?.name ? log.user.name : 'Guest'}
                    </td>
                    <td className="border px-2 py-1">{log.event}</td>
                    <td className="border px-2 py-1">{log.page || '-'}</td>
                    <td className="border px-2 py-1">{log.description || '-'}</td>
                    <td className="border px-2 py-1 truncate max-w-[200px]">
                      {log.userAgent || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📱 Card View (mobile/tablet) */}
        <div className="xl:hidden flex flex-col gap-4 w-full mt-6">
          {pagedLogs.map((log) => (
            <div
              key={log.log_id}
              className="border border-gray-300 rounded-2xl p-4 shadow-md bg-gray-600 text-base-100 relative"
            >
              {/* 🕒 Top Row: Time (left), User (right) */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-200">
                  {new Date(log.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span className="text-xs font-semibold text-gray-200">
                  👤 {log.user?.name ? log.user.name : 'Guest'}
                </span>
              </div>

              {/* 🏷️ Event & Page Row */}
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold">Event : {log.event}</span>

                <span className="text-gray-200 font-bold truncate max-w-[60%] text-right">
                  Page Visited : {log.page || '-'}
                </span>
              </div>

              {/* 📝 Description (if exists) */}
              {log.description && (
                <div className="mt-1 mb-1 text-wonderful-3 italic text-2xl">{log.description}</div>
              )}

              {/* If you want a little visual separator */}
              <div className="my-2 border-t border-gray-500" />

              {/* ID or log details at the bottom, optional */}
              <div className="text-xs text-gray-400">Log ID: {log.log_id}</div>
            </div>
          ))}
        </div>

        {/* 🔢 Pagination */}
        <div className="flex justify-center mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
        {/* 🚩 Danger Zone Section - below table/cards, always full width */}
        <div className="flex justify-center mt-8 w-full">
          <div className="border border-red-600 bg-red-50 dark:bg-red-900/20 rounded-2xl px-6 py-6 flex flex-col items-center shadow-md lg:w-1/2 w-full">
            {/* Danger Zone Label */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-700 dark:text-red-400 text-xl font-bold">Danger Zone</span>
              <span className="text-2xl">⚠️</span>
            </div>
            {/* Warning Message */}
            <p className="text-red-600 dark:text-red-300 text-center mb-4 text-base font-medium">
              Deleting all logs for this IP is permanent and cannot be undone.
            </p>
            {/* Danger Button */}
            <button
              className="btn-danger font-bold py-3 px-7 text-xl rounded-xl w-full max-w-md btn-glow transition-all duration-150"
              onClick={handleDelete}
              style={{ letterSpacing: '1px' }}
            >
              Delete All Logs for This IP
            </button>
          </div>
        </div>

        {/* ← All Logs Button */}
        <div className="w-full flex justify-center">
          <Link href="/admin/logs/main" className="w-full mt-5">
            <button
              className="btn-secondary font-bold py-2 px-4 btn-glow w-1/2"
              style={{ fontSize: '18px' }}
            >
              ← Back To All Logs
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
