'use client';
/**
 * ================== /src/app/locale/admin/liveChat/user/[user_id]/page.js ==================
 * 👤 Admin Live Chat → Conversations for a single user (Client Component)
 * -------------------------------------------------------------------------------------------
 * 🧭 Purpose: List all live-chat conversations for a given user; quick actions to view/delete.
 * 🌍 Locale: Uses `useLocale()` so every Link/redirect is locale-aware (e.g., /{locale}/admin/...).
 * 🧱 UI: Desktop table (with borders + hover highlight), mobile cards. Keeps your custom classes.
 * 🛡️ Access: Admin-guarded; redirects if unauthorized.
 * 🔄 UX: Client-side sorting + pagination + optional auto-refresh.
 * 🧩 i18n: All text via `next-intl` translations.
 * ===========================================================================================
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl'; // 🌍 locale + i18n
import { useParams, useRouter } from 'next/navigation';

import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

import SortDropdown from '@/components/reusableUI/SortDropdown';
import useLocalSorter from '@/hooks/useLocalSorter';
import { conversationSortOptions, getConversationSortFunction } from '@/lib/utils/sorting';
import Pagination from '@/components/reusableUI/Pagination';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';

export default function AdminLiveChatUserConversationsPage() {
  // 🌍 locale & translations
  const locale = useLocale();
  const t = useTranslations();

  // 🔐 session & guard
  const { data: _session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const router = useRouter();

  // 🧭 params
  const { user_id } = useParams();

  // 🧰 app helpers
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 🗂️ state
  const [conversations, setConversations] = useState([]);
  const [username, setUsername] = useState('');
  const [user, setUser] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('updatedAt_desc');

  // 🔀 sorted + paged slices
  const sortedConversations = useLocalSorter(conversations, sortOrder, getConversationSortFunction);
  const pageSize = 5;
  const totalPages = Math.ceil(sortedConversations.length / pageSize);
  const pagedConversations = sortedConversations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 🔄 pull data for this user
  const fetchUserConversations = async () => {
    try {
      showLoader({ text: t('app.admin.liveChat.userConversations.loading') });
      const { data } = await axiosInstance.get(`/api/admin/liveChat/user/${user_id}`);
      const convs = data.conversations || [];
      setConversations(convs);

      if (data.userDetails) {
        setUsername(data.userDetails.name);
        setUser(data.userDetails);
      }

      // 🚪 If there's exactly one conversation, jump straight to it (locale-aware)
      if (convs.length === 1) {
        router.replace(`/${locale}/admin/liveChat/${convs[0].conversation_id}`);
      }
    } catch {
      displayMessage(t('app.admin.liveChat.userConversations.load_failed'), 'error');
    } finally {
      hideLoader();
    }
  };

  // ⏱️ optional auto-refresh (10m) with UI controls
  const { AutoRefresh } = useAutoRefresh(fetchUserConversations, {
    intervalSeconds: 600,
    uiOptions: { showManualButton: true, showPauseToggle: true }
  });

  // 🚦 initial load when authorized
  useEffect(() => {
    if (user_id && status === 'authenticated' && isAllowed) {
      fetchUserConversations();
    }
  }, [user_id, status, isAllowed, locale]);

  // 🛑 redirect away if forbidden
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 🛡️ guard render
  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        {/* 🏷️ Page title */}
        <div className="flex flex-col items-center text-center justify-center text-2xl text-wonderful-3 relative">
          <h1 className="text-wonderful-5">
            {t('app.admin.liveChat.userConversations.title', { username: username || 'N/A' })}
          </h1>
          <hr className="border border-gray-400 w-8/12 my-2" />
        </div>

        {/* 🔧 Controls: sort + refresh */}
        <div className="flex justify-center items-center w-full">
          <div className="flex flex-col w-10/12 mb-3 items-center md:flex-row md:space-x-3 md:space-y-0 space-y-10">
            <div className="flex-1 flex justify-center items-center m-2">
              <SortDropdown
                options={conversationSortOptions}
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

        {/* ➕ Create new conversation (admin creates for this user) */}
        <div className="flex justify-center w-full mb-6">
          <ConversationActionButton
            action="create"
            user_id={user?.user_id}
            user={user}
            chatType="live"
            buttonText={t('app.admin.liveChat.userConversations.create_new')}
            isAdmin={true}
          />
        </div>

        {/* 💻 Desktop table (with borders + hover outline) */}
        <div className="hidden xl:flex justify-center w-full">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[750px] w-full border border-gray-300 border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-600">
                  <th className="border border-gray-300 px-4 py-2">
                    {t('app.admin.liveChat.userConversations.table_id')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t('app.admin.liveChat.userConversations.table_subject')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t('app.admin.liveChat.userConversations.table_updated')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t('app.admin.liveChat.userConversations.table_unread')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    {t('app.admin.liveChat.userConversations.table_action')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-center">
                {pagedConversations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="border border-gray-300 px-4 py-4 text-gray-500">
                      {t('app.admin.liveChat.userConversations.empty')}
                    </td>
                  </tr>
                ) : (
                  pagedConversations.map((c) => (
                    <tr key={c.conversation_id} className="hover:bg-gray-400">
                      <td className="border border-gray-300 px-4 py-2">{c.conversation_id}</td>
                      <td
                        className="border border-gray-300 px-4 py-2 max-w-[200px] truncate"
                        title={c.subject}
                      >
                        {c.subject || t('app.admin.liveChat.userConversations.no_subject')}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {new Date(c.updatedAt).toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {c.unreadCount > 0 ? (
                          <span className="text-green-500 font-bold">● {c.unreadCount}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex flex-row gap-2 justify-center">
                          <Link
                            href={`/${locale}/admin/liveChat/${c.conversation_id}`}
                            className="btn-primary"
                          >
                            {t('app.admin.liveChat.userConversations.view_messages')}
                          </Link>
                          <ConversationActionButton
                            action="delete"
                            user_id={user?.user_id}
                            conversation_id={c.conversation_id}
                            chatType="live"
                            onActionSuccess={fetchUserConversations}
                            isAdmin={true}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📱 Mobile cards */}
        <div className="xl:hidden flex flex-col gap-4 w-full mt-6">
          {pagedConversations.map((c) => (
            <div key={c.conversation_id} className="border rounded-2xl p-4 bg-gray-500">
              <h3>{user.name || 'N/A'}</h3>
              <p>
                <strong>{t('app.admin.liveChat.userConversations.subject_label')}:</strong>{' '}
                {c.subject || t('app.admin.liveChat.userConversations.no_subject')}
              </p>
              <p>
                <strong>{t('app.admin.liveChat.userConversations.last_updated')}:</strong>{' '}
                {new Date(c.updatedAt).toLocaleString()}
              </p>
              <p>
                <strong>{t('app.admin.liveChat.userConversations.unread')}:</strong>{' '}
                {c.unreadCount > 0 ? (
                  <span className="text-green-500 font-bold">● {c.unreadCount}</span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Link
                  href={`/${locale}/admin/liveChat/${c.conversation_id}`}
                  className="btn-primary"
                >
                  {t('app.admin.liveChat.userConversations.view_messages')}
                </Link>
                <ConversationActionButton
                  action="delete"
                  user_id={user?.user_id}
                  conversation_id={c.conversation_id}
                  chatType="live"
                  onActionSuccess={fetchUserConversations}
                  isAdmin={true}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 🔢 Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
