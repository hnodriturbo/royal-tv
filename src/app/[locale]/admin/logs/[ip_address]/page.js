// File: app/[locale]/admin/logs/[ip_address]/page.js
'use client';

/**
 * 📜 Admin Logs by IP
 * - Lists logs for one IP (table desktop, cards mobile), client-side sort/pagination.
 * - Danger zone: delete ALL logs for this IP.
 * - Safe: no hooks inside callbacks; locale is captured at top level.
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

import axiosInstance from '@/lib/core/axiosInstance';
import useAuthGuard from '@/hooks/useAuthGuard';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';
import useLocalSorter from '@/hooks/useLocalSorter';

import Pagination from '@/components/reusableUI/Pagination';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import { SafeString } from '@/lib/ui/SafeString';
import { logSortOptions, getLogSortFunction } from '@/lib/utils/sorting';

export default function AdminLogsByIpPage() {
  const t = useTranslations();
  const locale = useLocale(); // ✅ top-level
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  // state
  const [logs, setLogs] = useState([]);
  const [sortOrder, setSortOrder] = useState('createdAt_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // ip from params
  const ip_address = SafeString(decodeURIComponent(params.ip_address || ''), '');

  // fetch logs
  const fetchLogs = async () => {
    try {
      showLoader({ text: t('app.admin.logs.byIp.loading') });
      const res = await axiosInstance.get(`/api/admin/logs/${encodeURIComponent(ip_address)}`);
      setLogs(res.data.logs || []);
      displayMessage(t('app.admin.logs.byIp.loadSuccess'), 'success');
    } catch (err) {
      displayMessage(
        t('app.admin.logs.byIp.loadFailed', {
          error: err?.response?.data?.error ? `: ${err.response.data.error}` : ''
        }),
        'error'
      );
    } finally {
      hideLoader();
    }
  };

  // sort & paginate
  const sortedLogs = useLocalSorter(logs, sortOrder, (order) => {
    const sortFn = getLogSortFunction(order);
    return (a, b) => sortFn(a, b);
  });

  const pageSize = 10;
  const totalPages = Math.ceil(sortedLogs.length / pageSize);
  const pagedLogs = sortedLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // initial load
  useEffect(() => {
    if (status === 'authenticated' && isAllowed && ip_address) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed, ip_address]);

  // redirect if forbidden
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  // delete all for IP
  const handleDeleteAllForIp = () => {
    openModal('deleteLogsByIp', {
      title: t('app.admin.logs.byIp.deleteModal.title'),
      description: t('app.admin.logs.byIp.deleteModal.description', { ip: ip_address }),
      confirmButtonText: t('app.admin.logs.byIp.deleteModal.confirm'),
      confirmButtonType: 'Danger',
      cancelButtonText: t('app.admin.logs.byIp.deleteModal.cancel'),
      onConfirm: async () => {
        try {
          showLoader({ text: t('app.admin.logs.byIp.deleting') });
          await axiosInstance.delete(`/api/admin/logs/${encodeURIComponent(ip_address)}`);
          displayMessage(t('app.admin.logs.byIp.deletedSuccess'), 'success');
          setTimeout(() => {
            router.push(`/${locale}/admin/logs/main`); // ✅ locale captured
          }, 1200);
        } catch {
          displayMessage(t('app.admin.logs.byIp.deleteFailed'), 'error');
        } finally {
          hideModal();
          hideLoader();
        }
      },
      onCancel: () => {
        displayMessage(t('app.admin.logs.byIp.deletionCancelled'), 'info');
        hideModal();
        hideLoader();
      }
    });
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="container-style">
        {/* Title */}
        <div className="flex flex-col items-center text-center w-full">
          <h1 className="text-wonderful-5 text-2xl mb-0">
            {t('app.admin.logs.byIp.title', { ip: ip_address })}
          </h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        {/* Controls */}
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

        {/* Desktop table (with explicit borders) */}
        <div className="hidden xl:flex justify-center w-full">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[950px] w-full border border-gray-300 border-separate border-spacing-0 text-shadow-dark-1">
              <thead>
                <tr className="bg-gray-600 text-base-100 font-bold">
                  <th className="border border-gray-300 px-2 py-1">
                    {t('app.admin.logs.byIp.table.time')}
                  </th>
                  <th className="border border-gray-300 px-2 py-1">
                    {t('app.admin.logs.byIp.table.user')}
                  </th>
                  <th className="border border-gray-300 px-2 py-1">
                    {t('app.admin.logs.byIp.table.event')}
                  </th>
                  <th className="border border-gray-300 px-2 py-1">
                    {t('app.admin.logs.byIp.table.page')}
                  </th>
                  <th className="border border-gray-300 px-2 py-1">
                    {t('app.admin.logs.byIp.table.description')}
                  </th>
                  <th className="border border-gray-300 px-2 py-1">
                    {t('app.admin.logs.byIp.table.userAgent')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-gray-400 text-center">
                    <td className="border border-gray-300 px-2 py-1">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">
                      👤 {SafeString(log.user?.name, t('app.admin.logs.byIp.guest'))}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {SafeString(log.event, '—')}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {SafeString(log.page, '—')}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {SafeString(log.description, '—')}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 truncate max-w-[220px]">
                      {SafeString(log.userAgent, '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="xl:hidden flex flex-col gap-4 w-full mt-6">
          {pagedLogs.map((log) => (
            <div
              key={log.log_id}
              className="border border-gray-300 rounded-2xl p-4 shadow-md bg-gray-600 text-base-100"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-200">
                  {new Date(log.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span className="text-xs font-semibold text-gray-200">
                  👤 {SafeString(log.user?.name, t('app.admin.logs.byIp.guest'))}
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold">
                  {t('app.admin.logs.byIp.card.event')}: {SafeString(log.event, '—')}
                </span>
                <span className="text-gray-200 font-bold truncate max-w-[60%] text-right">
                  {t('app.admin.logs.byIp.card.pageVisited')}: {SafeString(log.page, '—')}
                </span>
              </div>
              {log.description != null && (
                <div className="mt-1 mb-1 text-wonderful-3 italic text-lg">
                  {SafeString(log.description, '')}
                </div>
              )}
              <div className="my-2 border-t border-gray-500" />
              <div className="text-xs text-gray-400">ID: {SafeString(log.log_id, '')}</div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Danger zone */}
        <div className="flex justify-center mt-8 w-full">
          <div className="border border-red-600 bg-red-50 dark:bg-red-900/20 rounded-2xl px-6 py-6 flex flex-col items-center shadow-md lg:w-1/2 w-full">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-700 dark:text-red-400 text-xl font-bold">
                {t('app.admin.logs.byIp.dangerZone.title')}
              </span>
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-red-600 dark:text-red-300 text-center mb-4 text-base font-medium">
              {t('app.admin.logs.byIp.dangerZone.description')}
            </p>
            <button
              type="button"
              className="btn-danger font-bold py-3 px-7 text-xl rounded-xl w-full max-w-md btn-glow transition-all duration-150"
              onClick={handleDeleteAllForIp}
            >
              {t('app.admin.logs.byIp.dangerZone.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
