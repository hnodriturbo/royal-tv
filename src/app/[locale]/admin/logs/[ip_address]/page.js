/**
 * ========== /app/[locale]/admin/logs/[ip_address]/page.js ==========
 * 📜 Admin Logs by IP
 * - Lists logs for one IP (table desktop, cards mobile), client-side sort/pagination.
 * - Danger zone: delete ALL logs for this IP.
 * - All text via next-intl: t('app.admin.logs.byIp.*').
 * ================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n';
import { useTranslations } from 'next-intl';

import useAuthGuard from '@/hooks/useAuthGuard';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';

import Pagination from '@/components/reusableUI/Pagination';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import useLocalSorter from '@/hooks/useLocalSorter';
import { logSortOptions, getLogSortFunction } from '@/lib/utils/sorting';

export default function AdminLogsByIpPage() {
  // 🌐 translator
  const t = useTranslations();

  // 🔐 session & nav & guard
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  // 🪵 state
  const [logs, setLogs] = useState([]);
  const [sortOrder, setSortOrder] = useState('createdAt_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // 🏷️ IP from params
  const ip_address = decodeURIComponent(params.ip_address || '');

  // 📥 fetch logs for this IP
  const fetchLogs = async () => {
    try {
      showLoader({ text: t('app.admin.logs.byIp.loading') });
      const response = await axiosInstance.get(`/api/admin/logs/${encodeURIComponent(ip_address)}`);
      setLogs(response.data.logs || []);
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

  // 🧮 sorted logs
  const sortedLogs = useLocalSorter(logs, sortOrder, (order) => {
    const sortFn = getLogSortFunction(order);
    return (a, b) => sortFn(a, b);
  });

  // 📑 pagination
  const pageSize = 10;
  const totalPages = Math.ceil(sortedLogs.length / pageSize);
  const pagedLogs = sortedLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 🚀 initial load
  useEffect(() => {
    if (status === 'authenticated' && isAllowed && ip_address) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed, ip_address]);

  // 🚫 redirect if forbidden
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  // 🗑️ delete all for this IP
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
            router.push('/admin/logs/main');
          }, 1200);
        } catch (err) {
          displayMessage(t('app.admin.logs.byIp.deleteFailed'), 'error');
        } finally {
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
        {/* 🏷️ title */}
        <div className="flex flex-col items-center text-center w-full">
          <h1 className="text-wonderful-5 text-2xl mb-0">
            {t('app.admin.logs.byIp.title', { ip: ip_address })}
          </h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        {/* 🔧 sort (row on desktop, stacked on mobile) */}
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

        {/* 💻 table (desktop) */}
        <div className="hidden xl:flex justify-center w-full">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[950px] w-full border-separate border-spacing-0 text-shadow-dark-1">
              <thead>
                <tr className="bg-gray-600 text-base-100 font-bold">
                  <th className="border px-2 py-1">{t('app.admin.logs.byIp.table.time')}</th>
                  <th className="border px-2 py-1">{t('app.admin.logs.byIp.table.user')}</th>
                  <th className="border px-2 py-1">{t('app.admin.logs.byIp.table.event')}</th>
                  <th className="border px-2 py-1">{t('app.admin.logs.byIp.table.page')}</th>
                  <th className="border px-2 py-1">{t('app.admin.logs.byIp.table.description')}</th>
                  <th className="border px-2 py-1">{t('app.admin.logs.byIp.table.userAgent')}</th>
                </tr>
              </thead>
              <tbody>
                {pagedLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-gray-400 text-center">
                    <td className="border px-2 py-1">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="border px-2 py-1 whitespace-nowrap">
                      👤 {log.user?.name ? log.user.name : t('app.admin.logs.byIp.guest')}
                    </td>
                    <td className="border px-2 py-1">{log.event}</td>
                    <td className="border px-2 py-1">{log.page || '—'}</td>
                    <td className="border px-2 py-1">{log.description || '—'}</td>
                    <td className="border px-2 py-1 truncate max-w-[220px]">
                      {log.userAgent || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📱 cards (mobile/tablet) */}
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
                  👤 {log.user?.name ? log.user.name : t('app.admin.logs.byIp.guest')}
                </span>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="font-bold">
                  {t('app.admin.logs.byIp.card.event')}: {log.event}
                </span>
                <span className="text-gray-200 font-bold truncate max-w-[60%] text-right">
                  {t('app.admin.logs.byIp.card.pageVisited')}: {log.page || '—'}
                </span>
              </div>

              {log.description && (
                <div className="mt-1 mb-1 text-wonderful-3 italic text-lg">{log.description}</div>
              )}

              <div className="my-2 border-t border-gray-500" />
              <div className="text-xs text-gray-400">ID: {log.log_id}</div>
            </div>
          ))}
        </div>

        {/* 🔢 pagination */}
        <div className="flex justify-center mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* 🚩 danger zone */}
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
              className="btn-danger font-bold py-3 px-7 text-xl rounded-xl w-full max-w-md btn-glow transition-all duration-150"
              onClick={handleDeleteAllForIp}
              style={{ letterSpacing: '1px' }}
            >
              {t('app.admin.logs.byIp.dangerZone.button')}
            </button>
          </div>
        </div>

        {/* ← back to all logs */}
        <div className="w-full flex justify-center">
          <Link href="/admin/logs/main" className="w-full mt-5">
            <button
              className="btn-secondary font-bold py-2 px-4 btn-glow w-1/2"
              style={{ fontSize: '18px' }}
            >
              {t('app.admin.logs.byIp.backToAll')}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
