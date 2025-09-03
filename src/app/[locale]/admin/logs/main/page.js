/**
 *   ================== /app/[locale]/admin/logs/main/page.js ==================
 * 📜 Admin Logs Main
 * - Lists grouped logs by IP (table on desktop, cards on mobile).
 * - Client-side sort & pagination; auto-refresh every 10 minutes.
 * - All text via next-intl: t('app.admin.logs.main.*' & shared status).
 * ============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, Link } from '@/i18n'; // 🌍 locale-aware nav
import { useTranslations } from 'next-intl'; // 🌐 i18n (full keys)

import useAuthGuard from '@/hooks/useAuthGuard';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';

import Pagination from '@/components/reusableUI/Pagination';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import useLocalSorter from '@/hooks/useLocalSorter';
import { logSortOptions, getLogSortFunction } from '@/lib/utils/sorting';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

export default function AdminLogsMainPage() {
  // 🌐 translator
  const t = useTranslations();

  // 🔐 session & guard
  const { status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  // 🪵 state
  const [logs, setLogs] = useState([]);
  const [sortOrder, setSortOrder] = useState('createdAt_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // 📥 fetch logs
  const fetchLogs = async () => {
    try {
      showLoader({ text: t('app.admin.logs.main.loading') }); // ⏳ loader text
      const response = await axiosInstance.get('/api/admin/logs/main');
      setLogs(response.data.logs || []);
      displayMessage(t('app.admin.logs.main.loadSuccess'), 'success');
    } catch (err) {
      displayMessage(
        t('app.admin.logs.main.loadFailed', {
          error: err?.response?.data?.error ? `: ${err.response.data.error}` : ''
        }),
        'error'
      );
    } finally {
      hideLoader();
    }
  };

  // ⏱️ auto-refresh (10 minutes)
  const { AutoRefresh } = useAutoRefresh(fetchLogs, {
    intervalSeconds: 600,
    uiOptions: { showManualButton: true, showPauseToggle: true }
  });

  // 🗂️ group logs by IP
  const logsByIp = {};
  logs.forEach((singleLog) => {
    const ip = singleLog.ip_address || '—';
    if (!logsByIp[ip]) logsByIp[ip] = [];
    logsByIp[ip].push(singleLog);
  });

  // 🧱 build grouped array
  const groupedLogs = Object.keys(logsByIp).map((ip) => {
    const sortedForThisIp = logsByIp[ip]
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return {
      ip_address: ip,
      logs: sortedForThisIp,
      count: sortedForThisIp.length,
      latestLog: sortedForThisIp[0]
    };
  });

  // 🧮 sort groups by latest log fields
  const sortedGroupLogs = useLocalSorter(groupedLogs, sortOrder, (order) => {
    const sortFn = getLogSortFunction(order);
    return (a, b) => sortFn(a.latestLog, b.latestLog);
  });

  // 📑 pagination
  const pageSize = 10;
  const totalPages = Math.ceil(sortedGroupLogs.length / pageSize);
  const pagedLogs = sortedGroupLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 🗑️ delete all logs for an IP
  const handleDelete = (ip_address) => {
    openModal('deleteLogsByIp', {
      title: t('app.admin.logs.main.deleteModal.title'),
      description: t('app.admin.logs.main.deleteModal.description', { ip: ip_address }),
      confirmButtonText: t('app.admin.logs.main.deleteModal.confirm'),
      confirmButtonType: 'Danger',
      cancelButtonText: t('app.admin.logs.main.deleteModal.cancel'),
      onConfirm: async () => {
        try {
          showLoader({ text: t('app.admin.logs.main.deleting') });
          await axiosInstance.delete(`/api/admin/logs/${encodeURIComponent(ip_address)}`);
          displayMessage(t('app.admin.logs.main.deletedSuccess'), 'success');
          fetchLogs();
        } catch (err) {
          displayMessage(t('app.admin.logs.main.deleteFailed'), 'error');
        } finally {
          hideLoader();
        }
      },
      onCancel: () => {
        displayMessage(t('app.admin.logs.main.deletionCancelled'), 'info');
        hideModal();
        hideLoader();
      }
    });
  };

  // 🚀 initial load when allowed
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed]);

  // 🚫 redirect if forbidden
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 🛡️ guard
  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="container-style">
        {/* 🏷️ title */}
        <div className="flex flex-col items-center text-center w-full">
          <h1 className="text-wonderful-5 text-2xl mb-0">{t('app.admin.logs.main.title')}</h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        {/* 🔧 controls row */}
        <div className="flex justify-center items-center w-full">
          <div className="flex flex-col w-10/12 mb-3 items-center md:flex-row md:space-x-3 md:space-y-0 space-y-10">
            {/* 🔽 sort */}
            <div className="flex-1 flex justify-center items-center m-0">
              <SortDropdown options={logSortOptions} value={sortOrder} onChange={setSortOrder} />
            </div>
            {/* 📏 mobile divider */}
            <hr className="md:hidden border border-gray-400 w-8/12 my-4" />
            {/* ⏱️ auto refresh */}
            <div className="flex-1 flex justify-center items-center">
              <AutoRefresh />
            </div>
          </div>
        </div>

        {/* 💻 desktop table */}
        <div className="hidden xl:flex justify-center w-full">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[950px] w-full border-separate border-spacing-0 text-shadow-dark-1">
              <thead>
                <tr className="bg-gray-600 text-base-100 font-bold">
                  <th className="border px-2 py-1">{t('app.admin.logs.main.table.ip')}</th>
                  <th className="border px-2 py-1">{t('app.admin.logs.main.table.logs')}</th>
                  <th className="border px-2 py-1">{t('app.admin.logs.main.table.latestPage')}</th>
                  <th className="border px-2 py-1">{t('app.admin.logs.main.table.latestUser')}</th>
                  <th className="border px-2 py-1">{t('app.admin.logs.main.table.latestTime')}</th>
                  <th className="border px-2 py-1">{t('app.admin.logs.main.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pagedLogs.map((group) => (
                  <tr key={group.ip_address} className="hover:bg-gray-400 text-center">
                    <td className="border px-2 py-1">{group.ip_address}</td>
                    <td className="border px-2 py-1">{group.count}</td>
                    <td className="border px-2 py-1">{group.latestLog.page}</td>
                    <td className="border px-2 py-1">{group.latestLog.user?.name || '-'}</td>
                    <td className="border px-2 py-1">
                      {new Date(group.latestLog.createdAt).toLocaleString()}
                    </td>
                    <td className="border px-2 py-1">
                      <div className="flex gap-2 justify-center">
                        {group.count > 1 && (
                          <Link href={`/admin/logs/${encodeURIComponent(group.ip_address)}`}>
                            <button className="btn-primary btn-sm">
                              {t('app.admin.logs.main.action.view')}
                            </button>
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(group.ip_address)}
                          className="btn-danger"
                        >
                          <span className="inline-flex items-center gap-2">
                            <span aria-hidden="true">🗑️</span>
                            <span>{String(t('app.admin.logs.main.action.delete'))}</span>
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📱 mobile cards */}
        <div className="xl:hidden flex flex-col gap-4 w-full mt-6">
          {pagedLogs.map((group) => (
            <div
              key={group.ip_address}
              className="border border-gray-300 rounded-2xl p-4 shadow-sm bg-gray-600 text-base-100"
            >
              <div>
                <strong>{t('app.admin.logs.main.card.ip')}:</strong> {group.ip_address}
              </div>
              <div>
                <strong>{t('app.admin.logs.main.card.logs')}:</strong> {group.count}
              </div>
              <div>
                <strong>{t('app.admin.logs.main.card.latestEvent')}:</strong>{' '}
                {group.latestLog.event}
              </div>
              <div>
                <strong>{t('app.admin.logs.main.card.latestUser')}:</strong>{' '}
                {group.latestLog.user?.name || '-'}
              </div>
              <div>
                <strong>{t('app.admin.logs.main.card.latestTime')}:</strong>{' '}
                {new Date(group.latestLog.createdAt).toLocaleString()}
              </div>

              <div className="flex flex-row justify-between gap-2 mt-3">
                {group.count > 1 && (
                  <Link href={`/admin/logs/${encodeURIComponent(group.ip_address)}`}>
                    {/* eslint-disable-next-line react/jsx-no-comment-textnodes */}
                    <button className="btn-primary w-full btn-glow">
                      {t('app.admin.logs.main.action.view')}
                    </button>
                  </Link>
                )}
                <button
                  className="btn-danger w-full btn-glow"
                  onClick={() => handleDelete(group.ip_address)}
                >
                  {t('app.admin.logs.main.action.delete')}
                </button>
              </div>
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
      </div>
    </div>
  );
}
