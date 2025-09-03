/**
 * ========== /app/[locale]/admin/freeTrials/main/page.js ==========
 * 🎁 ADMIN → FREE TRIALS LIST (Client Component)
 * - Fetches trials, supports sort + pagination, delete w/ modal.
 * - Table on desktop, cards on mobile.
 * - Text translations → next-intl useTranslations().
 * - Navigation → @/i18n Link + useRouter().
 * ================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n'; // 🌍 nav
import { useTranslations } from 'next-intl'; // 🌐 i18n
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import Pagination from '@/components/reusableUI/Pagination';
import useModal from '@/hooks/useModal';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import { freeTrialSortOptions, getFreeTrialSortFunction } from '@/lib/utils/sorting';
import useLocalSorter from '@/hooks/useLocalSorter';

export default function AdminFreeTrialsPage() {
  // 🌐 translator
  const t = useTranslations();

  // 🦸 admin session/auth
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  // 📦 list state
  const [freeTrials, setFreeTrials] = useState([]);
  const [sortOrder, setSortOrder] = useState('createdAt_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // 📥 fetch trials
  const fetchFreeTrials = async () => {
    try {
      showLoader({ text: t('app.admin.freeTrials.main.loading') });
      const res = await axiosInstance.get('/api/admin/freeTrials/main');
      setFreeTrials(res.data.trials || []);
      displayMessage(t('app.admin.freeTrials.main.loadSuccess'), 'success');
    } catch (err) {
      displayMessage(
        t('app.admin.freeTrials.main.loadFailed', {
          error: err?.response?.data?.error ? `: ${err.response.data.error}` : ''
        }),
        'error'
      );
    } finally {
      hideLoader();
    }
  };

  // 🗑️ delete item
  const handleDelete = (trial_id) => {
    openModal('deleteFreeTrial', {
      title: t('app.admin.freeTrials.main.deleteModal.title'),
      description: t('app.admin.freeTrials.main.deleteModal.description'),
      confirmButtonText: t('app.admin.freeTrials.main.deleteModal.confirm'),
      confirmButtonType: 'Danger',
      cancelButtonText: t('app.admin.freeTrials.main.deleteModal.cancel'),
      onConfirm: async () => {
        try {
          showLoader({ text: t('app.admin.freeTrials.main.deleting') });
          await axiosInstance.delete(`/api/admin/freeTrials/${trial_id}`);
          displayMessage(t('app.admin.freeTrials.main.deletedSuccess'), 'success');
          fetchFreeTrials();
        } catch {
          displayMessage(t('app.admin.freeTrials.main.deleteFailed'), 'error');
        } finally {
          hideModal();
          hideLoader();
        }
      },
      onCancel: () => {
        displayMessage(t('app.admin.freeTrials.main.deletionCancelled'), 'info');
        hideModal();
      }
    });
  };

  // ⏱️ auto-refresh controls
  const { AutoRefresh } = useAutoRefresh(fetchFreeTrials, {
    intervalSeconds: 600,
    uiOptions: { showManualButton: true, showPauseToggle: true }
  });

  // 🎨 status colors
  const STATUS_COLOR_MAP = {
    active: 'bg-green-600',
    pending: 'bg-yellow-500',
    disabled: 'bg-gray-500'
  };

  // 🧮 local sort + paginate
  const sortedTrials = useLocalSorter(freeTrials, sortOrder, getFreeTrialSortFunction);
  const pageSize = 10;
  const totalPages = Math.ceil(sortedTrials.length / pageSize);
  const pagedTrials = sortedTrials.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 🚀 fetch once
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchFreeTrials();
    }
  }, [status, isAllowed]);

  // 🔒 redirect if forbidden
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 🛡️ guard
  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        {/* 🏷️ title */}
        <div className="flex flex-col items-center text-center justify-center relative w-full">
          <h1 className="text-wonderful-5 text-2xl mb-0">{t('app.admin.freeTrials.main.title')}</h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        {/* 🔧 controls row */}
        <div className="flex justify-center items-center w-full">
          <div className="flex flex-col w-10/12 mb-3 items-center md:flex-row md:space-x-3 md:space-y-0 space-y-10">
            <div className="flex-1 flex justify-center items-center m-0">
              <SortDropdown
                options={freeTrialSortOptions}
                value={sortOrder}
                onChange={setSortOrder}
              />
            </div>
            <hr className="md:hidden border border-gray-400 w-8/12 my-4" />
            <div className="flex-1 flex justify-center items-center">
              <AutoRefresh />
            </div>
          </div>
        </div>

        {/* 💻 desktop table */}
        <div className="hidden xl:flex justify-center w-full">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[850px] w-full border-separate border-spacing-0 text-shadow-dark-1">
              <thead>
                <tr className="bg-gray-600 text-base-100 font-bold">
                  <th className="border border-gray-300 px-4 py-2">
                    {t('app.admin.freeTrials.main.table.user')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t('app.admin.freeTrials.main.table.username')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t('app.admin.freeTrials.main.table.email')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t('app.admin.freeTrials.main.table.status')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t('app.admin.freeTrials.main.table.created')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t('app.admin.freeTrials.main.table.startDate')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t('app.admin.freeTrials.main.table.endDate')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t('app.admin.freeTrials.main.table.actions')}
                  </th>
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
                      {t(`app.admin.freeTrials.status.${trial.status}`)}
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
                      <div className="flex flex-row gap-2 w-fit justify-center">
                        <Link href={`/admin/freeTrials/${trial.trial_id}`}>
                          <button className="btn-primary btn-sm">
                            {t('app.admin.freeTrials.main.action.viewEdit')}
                          </button>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(trial.trial_id)}
                          className="btn-danger"
                        >
                          <span className="inline-flex items-center gap-2">
                            <span aria-hidden="true">🗑️</span>
                            <span>{String(t('app.admin.freeTrials.main.action.delete'))}</span>
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
                  {t(`app.admin.freeTrials.status.${trial.status}`)}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>{t('app.admin.freeTrials.main.table.email')}:</strong>{' '}
                  {trial.user?.email || '-'}
                </div>
                <div>
                  <strong>{t('app.admin.freeTrials.main.table.created')}:</strong>{' '}
                  {trial.createdAt ? new Date(trial.createdAt).toLocaleString() : '—'}
                </div>
                <div>
                  <strong>{t('app.admin.freeTrials.main.table.startDate')}:</strong>{' '}
                  {trial.startDate ? new Date(trial.startDate).toLocaleString() : '—'}
                </div>
                <div>
                  <strong>{t('app.admin.freeTrials.main.table.endDate')}:</strong>{' '}
                  {trial.endDate ? new Date(trial.endDate).toLocaleString() : '—'}
                </div>
              </div>
              <div className="flex flex-row gap-3 mt-4 w-full">
                <Link
                  href={`/admin/freeTrials/${trial.trial_id}`}
                  className="flex-1 flex justify-start"
                >
                  <button className="btn-primary w-full">
                    {t('app.admin.freeTrials.main.action.viewEdit')}
                  </button>
                </Link>
                <div className="flex-1 flex justify-end">
                  <button
                    className="btn-danger w-full"
                    onClick={() => handleDelete(trial.trial_id)}
                  >
                    {t('app.admin.freeTrials.main.action.delete')}
                  </button>
                </div>
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
