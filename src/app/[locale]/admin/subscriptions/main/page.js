/**
 * ================== AdminSubscriptionsPage.js ==================
 * 📦 Admin Subscriptions: Main list
 * - Paginated & sortable
 * - Table for desktop, cards for mobile
 * - Uses <Link> for view actions
 * - Translations under app.admin.subscriptions.*
 * ===============================================================
 */

'use client';import Link from "next/link";import { useRouter } from "next/navigation";

import { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';

import Pagination from '@/components/reusableUI/Pagination';
import useModal from '@/hooks/useModal';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import { userSubscriptionSortOptions, getUserSubscriptionSortFunction } from '@/lib/utils/sorting';
import useLocalSorter from '@/hooks/useLocalSorter';

export default function AdminSubscriptionsPage() {
  const t = useTranslations();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  const [subscriptions, setSubscriptions] = useState([]);
  const [sortOrder, setSortOrder] = useState('created_desc');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSubscriptions = async () => {
    try {
      showLoader({ text: t('app.admin.subscriptions.loading') });
      const response = await axiosInstance.get('/api/admin/subscriptions/main');
      setSubscriptions(response.data.subscriptions || []);
      displayMessage(t('app.admin.subscriptions.loaded'), 'success');
    } catch {
      displayMessage(t('app.admin.subscriptions.load_failed'), 'error');
    } finally {
      hideLoader();
    }
  };

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

  useEffect(() => {
    if (status === 'authenticated' && isAllowed) fetchSubscriptions();
  }, [status, isAllowed]);

  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
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
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold">{t('app.admin.subscriptions.title')}</h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        <div className="flex justify-center items-center">
          <SortDropdown
            options={userSubscriptionSortOptions}
            value={sortOrder}
            onChange={setSortOrder} />
          
        </div>

        {/* 💻 Table */}
        <div className="hidden xl:flex justify-center w-full">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[850px] w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-600">
                  <th>{t('app.admin.subscriptions.table_user')}</th>
                  <th>{t('app.admin.subscriptions.table_product')}</th>
                  <th>{t('app.admin.subscriptions.table_username')}</th>
                  <th>{t('app.admin.subscriptions.table_status')}</th>
                  <th>{t('app.admin.subscriptions.table_created')}</th>
                  <th>{t('app.admin.subscriptions.table_expiring')}</th>
                  <th>{t('app.admin.subscriptions.table_actions')}</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {pagedSubscriptions.map((sub) =>
                <tr key={sub.subscription_id} className="hover:bg-gray-400">
                    <td>{sub.user?.name || '-'}</td>
                    <td>{sub.package_name || '-'}</td>
                    <td>{sub.username || '-'}</td>
                    <td className={`font-bold ${STATUS_COLOR_MAP[sub.status]}`}>{sub.status}</td>
                    <td>{sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '—'}</td>
                    <td>{sub.expiring_at ? new Date(sub.expiring_at).toLocaleString() : '—'}</td>
                    <td>
                      <Link
                      href={`/admin/subscriptions/${sub.subscription_id}`}
                      className="btn-primary">
                      
                        {t('app.admin.subscriptions.view')}
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📱 Cards */}
        <div className="xl:hidden flex flex-col gap-4 w-full mt-6">
          {pagedSubscriptions.map((sub) =>
          <div
            key={sub.subscription_id}
            className="border rounded-2xl p-4 bg-gray-600 text-base-100">
            
              <div className="flex justify-between mb-2">
                <h3>{sub.user?.name || '-'}</h3>
                <span className={`px-4 py-2 rounded ${STATUS_COLOR_MAP[sub.status]}`}>
                  {sub.status}
                </span>
              </div>
              <p>
                <strong>{t('app.admin.subscriptions.table_product')}:</strong>{' '}
                {sub.package_name || '-'}
              </p>
              <p>
                <strong>{t('app.admin.subscriptions.table_username')}:</strong>{' '}
                {sub.username || '-'}
              </p>
              <p>
                <strong>{t('app.admin.subscriptions.table_created')}:</strong>{' '}
                {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '—'}
              </p>
              <p>
                <strong>{t('app.admin.subscriptions.table_expiring')}:</strong>{' '}
                {sub.expiring_at ? new Date(sub.expiring_at).toLocaleString() : '—'}
              </p>
              <Link
              href={`/admin/subscriptions/${sub.subscription_id}`}
              className="btn-primary mt-3">
              
                {t('app.admin.subscriptions.view')}
              </Link>
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage} />
        
      </div>
    </div>);

}