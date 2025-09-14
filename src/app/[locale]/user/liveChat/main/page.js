'use client';
/**
 * ============================= /app/[locale]/user/liveChat/main/page.js =============================
 * 🗂️ UserConversations (Client)
 * ---------------------------------------------------------------------------------------------------
 * • Lists logged-in user’s conversations with sort + pagination
 * • Locale-aware navigation via `useLocale()` — all internal links & pushes use /{locale}/...
 * • Shows desktop table + mobile cards; keeps your custom classes intact
 * • Avoids unused imports (removed logger import); cleans up  lint noise
 * ===================================================================================================
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SafeString } from '@/lib/ui/SafeString';

import { useEffect, useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { useSession } from 'next-auth/react';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';
import Pagination from '@/components/reusableUI/Pagination';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import useLocalSorter from '@/hooks/useLocalSorter';
import { conversationSortOptions, getConversationSortFunction } from '@/lib/utils/sorting';

const UserConversations = () => {
  // 🌍 locale + translator
  const locale = useLocale();
  const t = useTranslations();

  // 🔐 Auth + routing
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('user');
  const router = useRouter();

  // 🧰 UI helpers
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 🗃️ Local state
  const [conversations, setConversations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('updatedAt_desc');
  const [userId, setUserId] = useState('');

  // 📥 Fetch helper
  const fetchUserConversations = useCallback(async () => {
    try {
      showLoader({ text: t('app.user.liveChat.main.loading') });

      const { data } = await axiosInstance.get('/api/user/liveChat/main');
      const list = Array.isArray(data.conversations) ? data.conversations : [];
      setConversations(list);

      // 👤 derive user id (prefer session id, fallback to first item)
      setUserId(session?.user?.user_id ?? list[0]?.user_id ?? '');

      // 🚪 auto-enter if only one
      if (list.length === 1) {
        router.replace(`/${locale}/user/liveChat/${list[0].conversation_id}`);
      }

      // ✅ success toast only on success
      displayMessage(t('app.user.liveChat.main.fetch_success'), 'success');
    } catch (e) {
      console.error('❌ Fetch conversations failed:', e?.response || e);
      displayMessage(t('app.user.liveChat.main.fetch_failed'), 'error');
    } finally {
      hideLoader();
    }
  }, [
    // deps kept focused to please react-hooks/exhaustive-deps
    router,
    locale,
    showLoader,
    hideLoader,
    displayMessage,
    t,
    session?.user?.user_id // stable primitive, not the whole session object
  ]);

  // 🔃 Derived lists
  const sortedConversations = useLocalSorter(conversations, sortOrder, getConversationSortFunction);
  const pageSize = 5;
  const totalPages = Math.ceil(sortedConversations.length / pageSize);
  const pagedConversations = sortedConversations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 🚦 mount
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchUserConversations();
    }
  }, [status, isAllowed]);

  // 🧭 redirect if blocked
  useEffect(() => {
    if (!isAllowed && redirect) router.replace(redirect);
  }, [isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full lg:mt-0 mt-12">
      <div className="container-style">
        {/* 🧾 Header */}
        <h1 className="text-3xl font-bold my-2 text-center">
          <span className="super-decorative-2 bold italic">
            {t('app.user.liveChat.main.header')}
          </span>
        </h1>
        <div className="flex justify-center">
          <hr className="border border-gray-400 w-10/12 m-2" />
        </div>

        {/* 🛠️ Actions */}
        <div className="flex flex-col lg:flex-row w-full justify-between items-center my-4 gap-4 px-4">
          {/* ➕ Create conversation */}
          <div className="w-full lg:w-auto flex lg:justify-start justify-center">
            <ConversationActionButton
              action="create"
              user_id={userId}
              buttonClass="btn-success border-radius-15"
              buttonText={t('app.user.liveChat.main.start_new')}
            />
          </div>

          {/* ↕️ Sort */}
          <div className="lg:w-auto flex lg:justify-end justify-center w-1/2">
            <SortDropdown
              options={conversationSortOptions}
              value={sortOrder}
              onChange={setSortOrder}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <hr className="border border-gray-400 w-10/12 m-2 mb-4" />
        </div>

        {/* 🖥️ Desktop table */}
        <div className="overflow-x-auto w-full lg:block hidden">
          {pagedConversations.length === 0 ? (
            <p className="text-center">{t('app.user.liveChat.main.no_conversations')}</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300 min-w-[600px] text-shadow-dark-1">
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="border px-4 py-2">{t('app.user.liveChat.main.id')}</th>
                  <th className="border px-4 py-2">{t('app.user.liveChat.main.subject')}</th>
                  <th className="border px-4 py-2">{t('app.user.liveChat.main.unread')}</th>
                  <th className="border px-4 py-2">{t('app.user.liveChat.main.last_message')}</th>
                  <th className="border px-4 py-2">{t('app.user.liveChat.main.action')}</th>
                </tr>
              </thead>
              <tbody>
                {pagedConversations.map((conversationItem) => (
                  <tr
                    key={conversationItem.conversation_id}
                    className="hover:bg-gray-400 text-white"
                  >
                    <td className="border px-4 py-2">{conversationItem.conversation_id}</td>
                    <td className="border px-4 py-2">{conversationItem.subject}</td>
                    <td className="border px-4 py-2 text-center">
                      {conversationItem.unreadCount > 0 ? (
                        <span className="bg-green-600 text-white rounded-full px-2 py-0.5">
                          {conversationItem.unreadCount}
                        </span>
                      ) : (
                        t('app.user.liveChat.main.read')
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      {new Date(conversationItem.updatedAt).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">
                      <div className="flex gap-4 justify-center">
                        <Link
                          href={
                            `/${locale}/user/liveChat/${conversationItem.conversation_id}` /* ✅ */
                          }
                          className="bg-blue-500 text-white px-3 py-1 rounded-xl hover:bg-blue-600 transition text-sm inline-flex items-center gap-2"
                        >
                          <span aria-hidden="true">💬</span>
                          <span>{String(t('app.user.liveChat.main.view'))}</span>
                        </Link>
                        <ConversationActionButton
                          action="delete"
                          user_id={userId}
                          conversation_id={conversationItem.conversation_id}
                          buttonClass="bg-red-500 text-white px-3 py-1 rounded-xl hover:bg-red-600 transition text-sm"
                          buttonText={t('app.user.liveChat.main.delete')}
                          onActionSuccess={() => fetchUserConversations(currentPage)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 📱 Mobile cards */}
        <div className="lg:hidden flex flex-col gap-4 w-full mt-6 no-wrap">
          {pagedConversations.map((conversationItem) => (
            <div
              key={conversationItem.conversation_id}
              onClick={
                () =>
                  router.push(
                    `/${locale}/user/liveChat/${conversationItem.conversation_id}`
                  ) /* ✅ */
              }
              className="border border-gray-300 rounded-lg p-4 shadow-sm bg-gray-500 text-white hover:cursor-pointer"
            >
              <h3 className="font-semibold text-lg mb-2">{conversationItem.subject}</h3>

              <p className="mb-1">
                <strong>{t('app.user.liveChat.main.id')}:</strong>{' '}
                {conversationItem.conversation_id}
              </p>

              <p className="mb-1">
                <strong>{t('app.user.liveChat.main.unread')}:</strong>{' '}
                {conversationItem.unreadCount > 0 ? (
                  <span className="bg-red-600 text-white rounded-full px-2 py-0.5">
                    {conversationItem.unreadCount}
                  </span>
                ) : (
                  t('app.user.liveChat.main.none')
                )}
              </p>

              <p className="mb-3">
                <strong>{t('app.user.liveChat.main.last_message')}:</strong>{' '}
                {new Date(conversationItem.updatedAt).toLocaleString()}
              </p>

              <div className="flex justify-end gap-2">
                <button
                  onClick={
                    () =>
                      router.push(
                        `/${locale}/user/liveChat/${conversationItem.conversation_id}`
                      ) /* ✅ */
                  }
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
                >
                  {SafeString(t('app.user.liveChat.main.view'), '')}
                </button>

                <ConversationActionButton
                  action="delete"
                  user_id={userId}
                  conversation_id={conversationItem.conversation_id}
                  buttonClass="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                  buttonText={t('app.user.liveChat.main.delete')}
                  onActionSuccess={() => fetchUserConversations(currentPage)}
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
};

export default UserConversations;
