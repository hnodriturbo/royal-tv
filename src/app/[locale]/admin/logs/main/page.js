/**
 *   ================== /admin/logs/main/page.js ==================
 * 📜
 * Admin Logs Main Page
 * - Lists all logs in a table (desktop) or cards (mobile).
 * - Sorting and pagination are client-side only.
 * - Clicking an IP opens the detail page for that IP.
 * ================================================================
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/lib/language';
import { Link } from '@/lib/language';
import useAuthGuard from '@/hooks/useAuthGuard';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';

// Local sorting and pagination
import Pagination from '@/components/reusableUI/Pagination';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import useLocalSorter from '@/hooks/useLocalSorter';

// 📚 Get the sorting options from the sorting file
import { logSortOptions, getLogSortFunction } from '@/lib/utils/sorting';

// ♻️ Auto Refresh Import
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

export default function AdminLogsMainPage() {
  // 🛡️ Auth/session hooks
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 🪵 State for logs, sorting, and pagination
  const [logs, setLogs] = useState([]);
  const [sortOrder, setSortOrder] = useState('createdAt_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // ⚡ Modal States
  const { openModal, hideModal } = useModal();

  // 📥 Fetch logs from the API
  const fetchLogs = async () => {
    try {
      showLoader({ text: 'Loading Activity Logs...' }); // ⏳ Loader up
      const response = await axiosInstance.get('/api/admin/logs/main'); // 🚚 Get logs
      setLogs(response.data.logs || []); // 📦 Save logs to state
      displayMessage('Activity Logs Loaded!', 'success'); // ✅ Toast
    } catch (err) {
      displayMessage(
        `Failed to load activity logs${err?.response?.data?.error ? `: ${err.response.data.error}` : ''}`,
        'error'
      );
    } finally {
      hideLoader(); // 🧹 Clean up
    }
  };

  // 👀 Fetch logs only when user is authenticated and allowed
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed]); // ✅ Don't include fetchLogs!

  // 🚫 Redirect if not allowed
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 👻 Return nothing while loading or unauthorized
  if (!isAllowed) return null;

  // ✅ Countdown timer for refresh every 10 minutes
  const { AutoRefresh } = useAutoRefresh(fetchLogs, {
    intervalSeconds: 600,
    uiOptions: {
      showManualButton: true,
      showPauseToggle: true
    }
  });

  // 🗂️ Group logs by IP address (beginner friendly)
  const logsByIp = {};
  // ✨ loop through the ip's
  logs.forEach((log) => {
    // 🌍 Get the IP address (or use '—' if missing)
    const ip = log.ip_address || '—';
    // 📦 Create a new array for this IP if not exists
    if (!logsByIp[ip]) {
      logsByIp[ip] = [];
    }
    // ➕ Add the log to the array for this IP
    logsByIp[ip].push(log);
  });

  // 🛠️ Turn logsByIp object into an array for rendering, sorting, and pagination
  const groupedLogs = Object.keys(logsByIp).map((ip) => {
    // 🔎 Sort logs by createdAt descending (latest first)
    const sortedLogs = logsByIp[ip]
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // ✅ Return the first sorted logs
    return {
      ip_address: ip,
      logs: sortedLogs,
      count: sortedLogs.length,
      latestLog: sortedLogs[0] // 🕗 The latest log for this ip
    };
  });

  // 🧠 Sorted logs using useLocalSorter
  const sortedGroupLogs = useLocalSorter(groupedLogs, sortOrder, (order) => {
    const sortFunction = getLogSortFunction(order);
    return (a, b) => sortFunction(a.latestLog, b.latestLog); // sort by latest log fields
  });

  // ⚙️ Pagination, pageSize, totalPages and pagedLogs using slice (frontend pagination)
  const pageSize = 10;
  const totalPages = Math.ceil(sortedGroupLogs.length / pageSize);
  const pagedLogs = sortedGroupLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 🗑️ Delete all logs for a specific IP (with modal confirmation)
  const handleDelete = (ip_address) => {
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
          fetchLogs(); // 🔄 Refresh list
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
        {/* 🏷️ Title & Divider */}
        <div className="flex flex-col items-center text-center w-full">
          <h1 className="text-wonderful-5 text-2xl mb-0">All User Activity Logs (by IP)</h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        {/* 🔄 Sorting & AutoRefresh Controls (row on desktop, stacked on mobile) */}
        <div className="flex justify-center items-center w-full">
          <div className="flex flex-col w-10/12 mb-3 items-center md:flex-row md:space-x-3 md:space-y-0 space-y-10">
            {/* 🟦 SortDropdown centered in its column */}
            <div className="flex-1 flex justify-center items-center m-0">
              <SortDropdown options={logSortOptions} value={sortOrder} onChange={setSortOrder} />
            </div>

            {/* 📏 Divider for mobile/tablet */}
            <hr className="md:hidden border border-gray-400 w-8/12 my-4" />

            {/* ⏳ AutoRefresh centered in its column */}
            <div className="flex-1 flex justify-center items-center">{AutoRefresh}</div>
          </div>
        </div>
        {/* 💻 Desktop Table View */}
        <div className="hidden xl:flex justify-center w-full">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[950px] w-full border-separate border-spacing-0 text-shadow-dark-1">
              <thead>
                <tr className="bg-gray-600 text-base-100 font-bold">
                  <th className="border px-2 py-1">IP Address</th>
                  <th className="border px-2 py-1">Logs</th>
                  <th className="border px-2 py-1">Latest Page</th>
                  <th className="border px-2 py-1">Latest User</th>
                  <th className="border px-2 py-1">Latest Time</th>
                  <th className="border px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedLogs.map((group) => (
                  <tr key={group.ip_address} className="hover:bg-gray-400">
                    <td className="border px-2 py-1">{group.ip_address}</td>
                    <td className="border px-2 py-1">{group.count}</td>
                    <td className="border px-2 py-1">{group.latestLog.page}</td>
                    <td className="border px-2 py-1">{group.latestLog.user?.name || '-'}</td>
                    <td className="border px-2 py-1">
                      {new Date(group.latestLog.createdAt).toLocaleString()}
                    </td>
                    <td className="border px-2 py-1 flex gap-2 justify-center">
                      {group.count > 1 && (
                        <Link href={`/admin/logs/${encodeURIComponent(group.ip_address)}`}>
                          <button className="btn-primary btn-sm">View</button>
                        </Link>
                      )}
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => handleDelete(group.ip_address)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📱 Card View for Mobile/Tablet */}
        <div className="xl:hidden flex flex-col gap-4 w-full mt-6">
          {pagedLogs.map((group) => (
            <div
              key={group.ip_address}
              className="border border-gray-300 rounded-2xl p-4 shadow-sm bg-gray-600 text-base-100"
            >
              <div>
                <strong>IP Address:</strong> {group.ip_address}
              </div>
              <div>
                <strong>Logs:</strong> {group.count}
              </div>
              <div>
                <strong>Latest Event:</strong> {group.latestLog.event}
              </div>
              <div>
                <strong>Latest User:</strong> {group.latestLog.user?.name || '-'}
              </div>
              <div>
                <strong>Latest Time:</strong> {new Date(group.latestLog.createdAt).toLocaleString()}
              </div>
              <div className="flex flex-row justify-between gap-2 mt-3">
                {group.count > 1 && (
                  <Link href={`/admin/logs/${encodeURIComponent(group.ip_address)}`}>
                    <button className="btn-primary w-full btn-glow">View</button>
                  </Link>
                )}
                <button
                  className="btn-danger w-full btn-glow"
                  onClick={() => handleDelete(group.ip_address)}
                >
                  Delete
                </button>
              </div>
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
      </div>
    </div>
  );
}
