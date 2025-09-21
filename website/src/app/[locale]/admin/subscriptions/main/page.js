'use client';
/**
 * ================== /app/[locale]/admin/subscriptions/main/page.js ==================
 * 📦 Admin Subscriptions: Main list (Client Component)
 * ----------------------------------------------------------------------------
 * 🧭 Purpose: Show all subscriptions with sort + pagination; open detail pages.
 * 🌍 Locale: Uses `useLocale()` so every <Link> is prefixed with /{locale}.
 * 🖼️ UI: Desktop table (with borders + row hover), mobile cards. Keeps your classes.
 * 🧩 i18n: All text via `next-intl` translation keys under app.admin.subscriptions.*
 * 🛡️ Access: Admin-guarded; redirects if unauthorized.
 * 🔁 UX: Client-side sorting + pagination; fetches on mount when allowed.
 * =============================================================================
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl'; // 🌍 locale + i18n

import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';

import Pagination from '@/components/reusableUI/Pagination';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import { userSubscriptionSortOptions, getUserSubscriptionSortFunction } from '@/lib/utils/sorting';
import useLocalSorter from '@/hooks/useLocalSorter';

export default function AdminSubscriptionsPage() {
  // 🌍 locale + translator
  const locale = useLocale();
  const t = useTranslations();

  // 🔐 admin session/auth
  const { data: status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 📦 state
  const [subscriptions, setSubscriptions] = useState([]);
  const [sortOrder, setSortOrder] = useState('created_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // 📥 fetch subscriptions
  const fetchSubscriptions = async () => {
    try {
      showLoader({ text: t('app.admin.subscriptions.loading') }); // ⏳ loader
      const response = await axiosInstance.get('/api/admin/subscriptions/main');
      setSubscriptions(response.data.subscriptions || []);
      displayMessage(t('app.admin.subscriptions.loaded'), 'success'); // ✅ toast
    } catch {
      displayMessage(t('app.admin.subscriptions.load_failed'), 'error'); // 💥 toast
    } finally {
      hideLoader(); // 🧹
    }
  };

  // 🔀 local sort + slice to page
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

  // 🚦 initial load when allowed
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) fetchSubscriptions();
  }, [status, isAllowed]);

  // 🚫 redirect if forbidden
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  // 🛡️ block render if not allowed
  if (!isAllowed) return null;

  // 🎨 status color classes (kept your mapping)
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
        {/* 🏷️ Title */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold">{t('app.admin.subscriptions.title')}</h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>
        {pagedSubscriptions.length === 0 ? (
          // 🚫 No data state
          <div className="flex justify-center items-center w-full py-20">
            <p className="text-xl font-semibold text-gray-400">
              {t('app.admin.subscriptions.no_data') || 'No Subscriptions Found'}
            </p>
          </div>
        ) : (
          <>
            {/* 🔽 Sort control */}
            <div className="flex justify-center items-center">
              <SortDropdown
                options={userSubscriptionSortOptions}
                value={sortOrder}
                onChange={setSortOrder}
              />
            </div>

            {/* 💻 Desktop table (borders + hover) */}
            <div className="hidden lg:flex justify-center w-full">
              <div className="w-full max-w-full overflow-x-auto">
                <table className="min-w-[850px] w-full border border-gray-300 border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-gray-600">
                      <th className="border border-gray-300 px-2 py-1">
                        {t('app.admin.subscriptions.table_user')}
                      </th>
                      <th className="border border-gray-300 px-2 py-1">
                        {t('app.admin.subscriptions.table_product')}
                      </th>
                      <th className="border border-gray-300 px-2 py-1">
                        {t('app.admin.subscriptions.table_username')}
                      </th>
                      <th className="border border-gray-300 px-2 py-1">
                        {t('app.admin.subscriptions.table_status')}
                      </th>
                      <th className="border border-gray-300 px-2 py-1">
                        {t('app.admin.subscriptions.table_created')}
                      </th>
                      <th className="border border-gray-300 px-2 py-1">
                        {t('app.admin.subscriptions.table_expiring')}
                      </th>
                      <th className="border border-gray-300 px-2 py-1">
                        {t('app.admin.subscriptions.table_actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-center">
                    {pagedSubscriptions.map((sub) => (
                      <tr key={sub.subscription_id} className="hover:bg-gray-400">
                        <td className="border border-gray-300 px-2 py-1">
                          {sub.user?.name || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          {sub.package_name || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">{sub.username || '-'}</td>
                        <td
                          className={`border border-gray-300 px-2 py-1 font-bold ${STATUS_COLOR_MAP[sub.status]}`}
                        >
                          {sub.status}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          {sub.expiring_at ? new Date(sub.expiring_at).toLocaleString() : '—'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Link
                            href={`/${locale}/admin/subscriptions/${sub.subscription_id}`}
                            className="btn-primary"
                          >
                            {t('app.admin.subscriptions.view')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 📱 Mobile cards */}
            <div className="lg:hidden flex flex-col gap-4 w-full mt-16">
              {pagedSubscriptions.map((sub) => (
                <div
                  key={sub.subscription_id}
                  className="border rounded-2xl p-4 bg-gray-600 text-base-100"
                >
                  {/* 🧾 Top line */}
                  <div className="flex justify-between mb-2">
                    <h3>{sub.user?.name || '-'}</h3>
                    <span className={`px-4 py-2 rounded ${STATUS_COLOR_MAP[sub.status]}`}>
                      {sub.status}
                    </span>
                  </div>

                  {/* 📋 Details */}
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

                  {/* 🔗 View details */}
                  <Link
                    href={`/${locale}/admin/subscriptions/${sub.subscription_id}`}
                    className="btn-primary mt-3"
                  >
                    {t('app.admin.subscriptions.view')}
                  </Link>
                </div>
              ))}
            </div>

            {/* 🔢 Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
