'use client';
/**
 * ================== AdminLiveChatUsersPage.js ==================
 * 👥 Admin Live Chat: All users with conversations
 * - Fetches all users with live chat activity
 * - Locale-aware <Link> via useLocale()
 * - Provides ConversationActionButton for actions
 * - Tables have borders + row hover highlight
 * - Translations under app.admin.liveChat.users.*
 * ================================================================
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl'; // 🌍 locale + i18n

import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

import SortDropdown from '@/components/reusableUI/SortDropdown';
import useLocalSorter from '@/hooks/useLocalSorter';
import {
  userWithConversationsSortOptions,
  getUserWithConversationsSortFunction
} from '@/lib/utils/sorting';

import Pagination from '@/components/reusableUI/Pagination';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';

export default function AdminLiveChatUsersPage() {
  const t = useTranslations();
  const locale = useLocale();

  const { data: _session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  const [allUsers, setAllUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('lastMessage_desc');
  const pageSize = 5;

  const sortedUsers = useLocalSorter(allUsers, sortOrder, getUserWithConversationsSortFunction);
  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  const pagedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const fetchUsersWithConversations = async () => {
    try {
      showLoader({ text: t('app.admin.liveChat.users.fetching') });
      const response = await axiosInstance.get('/api/admin/liveChat/main');
      setAllUsers(response.data.users || []);
      displayMessage(t('app.admin.liveChat.users.loaded'), 'success');
    } catch (error) {
      displayMessage(`${t('app.admin.liveChat.users.fetch_failed')}: ${error.message}`, 'error');
    } finally {
      hideLoader();
    }
  };

  const { AutoRefresh } = useAutoRefresh(fetchUsersWithConversations, {
    intervalSeconds: 600,
    uiOptions: { showManualButton: true, showPauseToggle: true }
  });

  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchUsersWithConversations();
    }
  }, [status, isAllowed]);

  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        <div className="flex flex-col items-center text-center justify-center text-2xl text-wonderful-3 relative">
          <h1 className="text-wonderful-5">{t('app.admin.liveChat.users.title')}</h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        {/* 🔄 Sorting + Refresh */}
        <div className="flex justify-center items-center w-full">
          <div className="flex flex-col w-10/12 mb-3 items-center md:flex-row md:space-x-3 md:space-y-0 space-y-10">
            <div className="flex-1 flex justify-center items-center">
              <SortDropdown
                options={userWithConversationsSortOptions}
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

        {/* 💻 Desktop Table */}
        <div className="hidden xl:flex justify-center w-full">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[500px] w-full border border-gray-300 border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-600">
                  <th className="border border-gray-300 px-2 py-1">
                    {t('app.admin.liveChat.users.table_user')}
                  </th>
                  <th className="border border-gray-300 px-2 py-1">
                    {t('app.admin.liveChat.users.table_email')}
                  </th>
                  <th className="border border-gray-300 px-2 py-1">
                    {t('app.admin.liveChat.users.table_count')}
                  </th>
                  <th className="border border-gray-300 px-2 py-1">
                    {t('app.admin.liveChat.users.table_unread')}
                  </th>
                  <th className="border border-gray-300 px-2 py-1">
                    {t('app.admin.liveChat.users.table_last')}
                  </th>
                  <th className="border border-gray-300 px-2 py-1">
                    {t('app.admin.liveChat.users.table_action')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-center">
                {pagedUsers.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-400">
                    <td className="border border-gray-300 px-2 py-1">{u.name || 'N/A'}</td>
                    <td className="border border-gray-300 px-2 py-1">{u.email || 'N/A'}</td>
                    <td className="border border-gray-300 px-2 py-1">{u.conversationCount}</td>
                    <td className="border border-gray-300 px-2 py-1">
                      {u.unreadConvoCount > 0 ? (
                        <span className="text-green-500 font-bold">● {u.unreadConvoCount}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {u.lastMessage
                        ? new Date(u.lastMessage).toLocaleString()
                        : t('app.admin.liveChat.users.no_messages')}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <div className="flex flex-row gap-2 justify-center">
                        <Link
                          href={`/${locale}/admin/liveChat/user/${u.user_id}`}
                          className="btn-primary"
                        >
                          {t('app.admin.liveChat.users.view')}
                        </Link>

                        <ConversationActionButton
                          action="create"
                          user_id={u.user_id}
                          user={u}
                          onActionSuccess={fetchUsersWithConversations}
                          buttonText={t('app.admin.liveChat.users.start_new')}
                          isAdmin={true}
                        />

                        <ConversationActionButton
                          action="deleteAll"
                          user_id={u.user_id}
                          onActionSuccess={fetchUsersWithConversations}
                          isAdmin={true}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📱 Mobile Cards */}
        <div className="xl:hidden flex flex-col gap-4 w-full mt-6">
          {pagedUsers.map((u) => (
            <div key={u.user_id} className="border rounded-2xl p-4 bg-gray-500">
              <div className="flex justify-between mb-2">
                <h3>{u.name || 'N/A'}</h3>
                <span>
                  {t('app.admin.liveChat.users.table_email')}: {u.email || 'N/A'}
                </span>
              </div>
              <p>
                <strong>{t('app.admin.liveChat.users.table_count')}:</strong> {u.conversationCount}
              </p>
              <p>
                <strong>{t('app.admin.liveChat.users.table_last')}:</strong>{' '}
                {u.lastMessage
                  ? new Date(u.lastMessage).toLocaleString()
                  : t('app.admin.liveChat.users.no_messages')}
              </p>
              <p>
                <strong>{t('app.admin.liveChat.users.table_unread')}:</strong>{' '}
                {u.unreadConvoCount > 0 ? (
                  <span className="text-green-500 font-bold">● {u.unreadConvoCount}</span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Link href={`/${locale}/admin/liveChat/user/${u.user_id}`} className="btn-primary">
                  {t('app.admin.liveChat.users.view')}
                </Link>

                <ConversationActionButton
                  action="create"
                  user_id={u.user_id}
                  user={u}
                  chatType="live"
                  onActionSuccess={fetchUsersWithConversations}
                  buttonText={t('app.admin.liveChat.users.start_new')}
                  isAdmin={true}
                />

                <ConversationActionButton
                  action="deleteAll"
                  user_id={u.user_id}
                  chatType="live"
                  onActionSuccess={fetchUsersWithConversations}
                  isAdmin={true}
                />
              </div>
            </div>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
