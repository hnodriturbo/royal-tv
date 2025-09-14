'use client';
/**
 * ========== /app/[locale]/admin/users/main/page.js ==========
 * 👤 ADMIN USERS MAIN (Client Component)
 * ------------------------------------------------------------
 * 🎯 Purpose: List users, allow sorting & pagination, and provide
 *     quick navigation/actions (Free Trials, Live Chat, Subs, Profile).
 * 🌍 Locale: Uses `useLocale()` so every <Link> is prefixed with /{locale}.
 * 🧩 i18n: All strings via next-intl (namespace: app.admin.users.main.*).
 * 🔐 Guard: Admin-only; redirects if unauthorized.
 * 🔁 UX: Fetch on mount, client-side sort & pagination.
 * 🧼 Hygiene: Keep your custom classes; no raw fragments in buttons.
 * ============================================================
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl'; // 🌍 locale + i18n
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { adminUserSortOptions, getAdminUserSortFunction } from '@/lib/utils/sorting';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import useLocalSorter from '@/hooks/useLocalSorter';
import Pagination from '@/components/reusableUI/Pagination';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';
import { SafeString } from '@/lib/ui/SafeString';

export default function AdminUsersMainPage() {
  // 🌍 locale & translator
  const locale = useLocale();
  const t = useTranslations();

  // 🔐 admin session/auth
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 📦 state
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('livechat_unread_first');

  // 📥 fetch users
  const fetchUsers = async () => {
    try {
      showLoader({ text: t('app.admin.users.main.loading') }); // ⏳ show loader
      const response = await axiosInstance.get('/api/admin/users/main'); // 🌐 request
      setUsers(response.data.users || []); // 📦 store list
      displayMessage(t('app.admin.users.main.loadSuccess'), 'success'); // ✅ toast
    } catch (error) {
      // ❌ toast with optional server error detail
      displayMessage(
        t('app.admin.users.main.loadFailed', {
          error: error?.response?.data?.error ? `: ${error.response.data.error}` : ''
        }),
        'error'
      );
    } finally {
      hideLoader(); // 🧽 hide loader
    }
  };

  // 🚦 fetch once when allowed
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchUsers();
    }
  }, [status, isAllowed]);

  // 🚦 redirect if forbidden
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // ➕ enrich for sorting (ensure safe defaults)
  const usersWithSortFields = users.map((singleUser) => ({
    ...singleUser,
    freeTrials: singleUser.freeTrials || [],
    subscriptions: singleUser.subscriptions || [],
    unreadLiveChats: singleUser.unreadLiveChats || 0,
    unreadBubbleChats: singleUser.unreadBubbleChats || 0,
    name: singleUser.name || ''
  }));

  // 🔀 sort
  const sortedUsers = useLocalSorter(usersWithSortFields, sortOrder, getAdminUserSortFunction);

  // 📏 page size
  const pageSize = 5;
  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  const pagedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 🔄 reset page on sort change
  useEffect(() => {
    setCurrentPage(1); // 🔁 reset to first page on sort change
  }, [sortOrder]);

  // 🛡️ block render if not allowed
  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style max-w-3xl w-full">
        {/* 🏷️ title */}
        <div className="flex flex-col items-center text-center justify-center w-full">
          <h1 className="text-wonderful-5 text-2xl mb-0">
            {SafeString(t('app.admin.users.main.title'))}
          </h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        {/* 🔀 sort */}
        <div className="flex justify-end w-full mb-4">
          <SortDropdown options={adminUserSortOptions} value={sortOrder} onChange={setSortOrder} />
        </div>

        {/* 🃏 user cards */}
        <div className="flex flex-col gap-6 w-full mt-6">
          {pagedUsers.length === 0 && (
            <div className="text-center text-gray-400 my-8">
              {SafeString(t('app.admin.users.main.noUsers')) /* 🫥 empty state */}
            </div>
          )}

          {pagedUsers.map((singleUser) => (
            <div
              key={singleUser.user_id}
              className="border border-gray-300 rounded-2xl p-5 shadow-md bg-gray-600 text-base-100 relative"
            >
              {/* 🆔 top info */}
              <div className="flex flex-col md:flex-row justify-between mb-2 items-center">
                <div className="w-full text-center flex flex-col items-center">
                  <h3 className="font-semibold text-lg">
                    {SafeString(singleUser.name, '')}
                    <span className="ml-2 text-xs text-muted">({singleUser.username})</span>
                  </h3>
                  <div className="text-sm mt-1">
                    <span>
                      {SafeString(t('app.admin.users.main.email'))}: (
                      {SafeString(singleUser.email, '')})
                    </span>
                  </div>
                  <div className="text-xs text-muted">
                    <span>
                      {SafeString(
                        t('app.admin.users.main.joined', {
                          date: new Date(singleUser.createdAt).toLocaleDateString()
                        })
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end mt-2 md:mt-0">
                  {/* 🏷️ role badge */}
                  <span className="absolute right-2 top-2 px-3 py-1 rounded-lg bg-purple-800 text-sm font-bold uppercase tracking-wider">
                    {SafeString(singleUser.role)}
                  </span>
                </div>
              </div>

              {/* 📱 contact info */}
              <div className="flex flex-row gap-4 text-sm mb-2 justify-center">
                {singleUser.whatsapp && (
                  <span>
                    <span className="font-bold">
                      {SafeString(t('app.admin.users.main.whatsapp'))}:
                    </span>{' '}
                    {SafeString(singleUser.whatsapp, '')}
                  </span>
                )}
                {singleUser.telegram && (
                  <span>
                    <span className="font-bold">
                      {SafeString(t('app.admin.users.main.telegram'))}:
                    </span>{' '}
                    {SafeString(singleUser.telegram, '')}
                  </span>
                )}
                <span>
                  <span className="font-bold">
                    {SafeString(t('app.admin.users.main.preferredContact'))}:
                  </span>{' '}
                  {SafeString(singleUser.preferredContactWay, '')}
                </span>
              </div>

              {/* 🔗 actions */}
              <div className="flex flex-col gap-3 mt-4 w-full">
                {/* 🎁 free trials */}
                {singleUser.freeTrials && singleUser.freeTrials.length > 0 ? (
                  <Link
                    href={`/${locale}/admin/freeTrials/${singleUser.freeTrials[0].trial_id}`}
                    className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                  >
                    {/* 🧱 wrap contents to avoid fragment children */}
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true">🎁</span>
                      <span className="inline-flex items-center gap-2">
                        <span>{SafeString(t('app.admin.users.main.freeTrials'))}</span>
                        <span className="ml-1 font-normal">({singleUser.totalFreeTrials})</span>
                      </span>
                      {singleUser.freeTrials[0].status && (
                        <span
                          className={`ml-2 text-xs font-bold ${
                            singleUser.freeTrials[0].status === 'disabled'
                              ? 'text-red-400'
                              : singleUser.freeTrials[0].status === 'pending'
                                ? 'text-yellow-400'
                                : 'text-green-400'
                          }`}
                        >
                          ({SafeString(singleUser.freeTrials[0].status, '')})
                        </span>
                      )}
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button" // ✅ explicit button type
                    className="w-full opacity-50 cursor-not-allowed flex flex-col items-center py-2 border border-white rounded-md"
                    disabled
                    aria-disabled="true" // ♿ reflect disabled state
                  >
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true">🎁</span>
                      <span>{SafeString(t('app.admin.users.main.freeTrials'))} (0)</span>
                    </span>
                  </button>
                )}

                {/* 💬 live chats */}
                {singleUser.totalLiveChats > 0 && singleUser.role !== 'admin' ? (
                  <Link
                    href={`/${locale}/admin/liveChat/user/${singleUser.user_id}`}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2 py-2"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true">💬</span>
                      <span>{SafeString(t('app.admin.users.main.liveChats'))}</span>
                    </span>
                    <span className="font-normal mt-1">
                      {SafeString(t('app.admin.users.main.total'))}: {singleUser.totalLiveChats} -{' '}
                      <span className={singleUser.unreadLiveChats > 0 ? 'font-bold' : 'text-muted'}>
                        {SafeString(t('app.admin.users.main.unread'))}: {singleUser.unreadLiveChats}
                      </span>
                    </span>
                  </Link>
                ) : (
                  singleUser.role !== 'admin' && (
                    <ConversationActionButton
                      action="create"
                      user_id={singleUser.user_id}
                      size="lg"
                      buttonText={`💬 ${t('app.admin.users.main.startConversation')}`}
                    />
                  )
                )}

                {/* 📦 subscriptions */}
                {singleUser.subscriptions && singleUser.subscriptions.length > 0 ? (
                  <Link
                    href={`/${locale}/admin/subscriptions/${singleUser.subscriptions[0].subscription_id}`}
                    className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true">📦</span>
                      <span className="inline-flex items-center gap-2">
                        <span>{SafeString(t('app.admin.users.main.subscriptions'))}</span>
                        <span className="ml-1 font-normal">({singleUser.totalSubscriptions})</span>
                      </span>
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button" // ✅ explicit button type
                    className="w-full opacity-50 cursor-not-allowed flex flex-col items-center py-2 border border-white rounded-md"
                    disabled
                    aria-disabled="true"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true">📦</span>
                      <span>{SafeString(t('app.admin.users.main.subscriptions'))} (0)</span>
                    </span>
                  </button>
                )}

                {/* 🪪 profile (always navigation) */}
                <Link
                  href={`/${locale}/admin/users/${singleUser.user_id}`}
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true">🪪</span>
                    <span>{SafeString(t('app.admin.users.main.profile'))}</span>
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 🔢 pagination */}
        <div className="flex justify-center mt-6">
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
