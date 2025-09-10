/**
 * ============================= UserConversations.js =============================
 * 🗂️ Lists the logged‑in user’s live‑chat conversations
 * -------------------------------------------------------------------------------
 * - Shows desktop table and mobile cards responsively
 * - Local sort + client pagination
 * - Uses full-path translations: t('app.user.liveChat.main.*')
 * - Keeps `t` out of dependency arrays to avoid re-render loops
 * ===============================================================================
 */

'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SafeString } from '@/lib/ui/SafeString';

import logger from '@/lib/core/logger'; // 🪵 logging (not translated)
import { useEffect, useState, useCallback } from 'react';

import { useSession } from 'next-auth/react';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';
import useAuthGuard from '@/hooks/useAuthGuard';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';
import Pagination from '@/components/reusableUI/Pagination';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import useLocalSorter from '@/hooks/useLocalSorter';
import { conversationSortOptions, getConversationSortFunction } from '@/lib/utils/sorting';
import { useTranslations } from 'next-intl'; // 🌍 root translator (no namespace)

const UserConversations = () => {
  // 🌍 Translator root — always use full keys
  const t = useTranslations();

  // 🔐 Auth + routing
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('user');
  const router = useRouter();

  // 🧰 UI helpers
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal(); // 🪟 (kept for parity with pattern)

  // 🗃️ Local state
  const [conversations, setConversations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('updatedAt_desc');
  const [userId, setUserId] = useState('');

  // 🔎 Fetch helper
  const fetchUserConversations = useCallback(
    async (page = 1) => {
      try {
        // 🌀 Show localized loader
        showLoader({ text: t('app.user.liveChat.main.loading') });

        // 📥 Fetch main list
        const { data } = await axiosInstance.get('/api/user/liveChat/main');
        const list = Array.isArray(data.conversations) ? data.conversations : [];
        setConversations(list);

        // 👤 Derive user id from session or first conversation owner
        if (session?.user?.user_id) {
          setUserId(session.user.user_id);
        } else if (list.length > 0) {
          setUserId(list[0].user_id);
        }

        // 🚪 Auto-enter single conversation
        if (list.length === 1) {
          router.replace(`/user/liveChat/${list[0].conversation_id}`);
        }
      } catch (error) {
        console.error('❌ Fetch conversations failed:', error?.response || error);
        displayMessage(t('app.user.liveChat.main.fetch_failed'), 'error'); // ❌ toast
      } finally {
        displayMessage(t('app.user.liveChat.main.fetch_success'), 'success'); // ✅ toast
        hideLoader(); // 🧽 hide loader
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, session, showLoader, hideLoader, displayMessage]
  );

  // 🔃 Derived lists
  const sortedConversations = useLocalSorter(conversations, sortOrder, getConversationSortFunction);
  const pageSize = 5; // 📏 items per page
  const totalPages = Math.ceil(sortedConversations.length / pageSize);
  const pagedConversations = sortedConversations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    // 🛑 wait & 🔒 guard
    if (status === 'authenticated' && isAllowed) {
      fetchUserConversations(); // ✅ fetch once
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed]);

  // 🧭 Redirect if blocked
  useEffect(() => {
    if (!isAllowed && redirect) router.replace(redirect);
  }, [isAllowed, redirect, router]);

  // 🚫 Guard render
  if (!isAllowed) return null;

  // 🖼️ Render
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
              user={session?.user}
              isAdmin={false}
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
                          href={`/user/liveChat/${conversationItem.conversation_id}`}
                          className="bg-blue-500 text-white px-3 py-1 rounded-xl hover:bg-blue-600 transition text-sm inline-flex items-center gap-2"
                        >
                          <span aria-hidden="true">💬</span>
                          <span>{String(t('app.user.liveChat.main.view'))}</span>
                        </Link>
                        <ConversationActionButton
                          action="delete"
                          user_id={userId}
                          conversation_id={conversationItem.conversation_id}
                          chatType="live"
                          isAdmin={false}
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
              onClick={() => router.push(`/user/liveChat/${conversationItem.conversation_id}`)}
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
                  onClick={() => router.push(`/user/liveChat/${conversationItem.conversation_id}`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
                >
                  {SafeString(t('app.user.liveChat.main.view'), '')}
                </button>

                <ConversationActionButton
                  action="delete"
                  user_id={userId}
                  conversation_id={conversationItem.conversation_id}
                  chatType="live"
                  isAdmin={false}
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
