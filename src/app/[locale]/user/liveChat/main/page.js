/**
 * Lists the logged‑in user’s live‑chat conversations
 * with pagination and responsive (table ↔ mobile‑card) layout.
 */

'use client';

import logger from '@/lib/core/logger';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/lib/language';
import { useSession } from 'next-auth/react';
import { Link } from '@/lib/language';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';
import useAuthGuard from '@/hooks/useAuthGuard';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';
import Pagination from '@/components/reusableUI/Pagination';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import useLocalSorter from '@/hooks/useLocalSorter';
import { conversationSortOptions, getConversationSortFunction } from '@/lib/utils/sorting';
import { useT } from '@/lib/i18n/client'; // 🌍 translator

const UserConversations = () => {
  // 🗣️ Namespace
  const t = useT('app.user.liveChat.main');

  // 🔐 Auth
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('user');
  const router = useRouter();
  const [userId, setUserId] = useState('');

  // 🧰 Handlers
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 🗃️ State
  const [conversations, setConversations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('updatedAt_desc');

  // 🔎 Fetch helper
  const fetchUserConversations = useCallback(
    async (page = 1) => {
      try {
        showLoader({ text: t('loading') });
        const { data } = await axiosInstance.get('/api/user/liveChat/main');
        setConversations(Array.isArray(data.conversations) ? data.conversations : []);
        if (session?.user?.user_id) setUserId(session.user.user_id);
        else if (data.conversations?.length > 0) setUserId(data.conversations[0].user_id);
        if (data.conversations?.length === 1)
          router.replace(`/user/liveChat/${data.conversations[0].conversation_id}`);
      } catch (err) {
        logger.error('❌ Fetch conversations failed:', err?.response || err);
        displayMessage(t('fetch_failed'), 'error');
      } finally {
        displayMessage(t('fetch_success'), 'success');
        hideLoader();
      }
    },
    [router, session, t, showLoader, hideLoader, displayMessage]
  );

  // 🔃 Derived lists
  const sortedConversations = useLocalSorter(conversations, sortOrder, getConversationSortFunction);
  const pageSize = 5;
  const totalPages = Math.ceil(sortedConversations.length / pageSize);
  const pagedConversations = sortedConversations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    if (status === 'authenticated' && isAllowed) fetchUserConversations();
  }, [status, isAllowed]);
  useEffect(() => {
    if (!isAllowed && redirect) router.replace(redirect);
  }, [isAllowed, redirect, router]);
  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full lg:mt-0 mt-12">
      <div className="container-style">
        {/* 🧾 Header */}
        <h1 className="text-3xl font-bold my-2 text-center">
          <span className="super-decorative-2 bold italic">{t('header')}</span>
        </h1>
        <div className="flex justify-center">
          <hr className="border border-gray-400 w-10/12 m-2" />
        </div>

        {/* 🛠️ Actions */}
        <div className="flex flex-col lg:flex-row w-full justify-between items-center my-4 gap-4 px-4">
          <div className="w-full lg:w-auto flex lg:justify-start justify-center">
            <ConversationActionButton
              action="create"
              user_id={userId}
              user={session?.user}
              isAdmin={false}
              buttonClass="btn-success border-radius-15"
              buttonText={t('start_new')}
            />
          </div>
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
            <p className="text-center">{t('no_conversations')}</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300 min-w-[600px] text-shadow-dark-1">
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="border px-4 py-2">{t('id')}</th>
                  <th className="border px-4 py-2">{t('subject')}</th>
                  <th className="border px-4 py-2">{t('unread')}</th>
                  <th className="border px-4 py-2">{t('last_message')}</th>
                  <th className="border px-4 py-2">{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {pagedConversations.map((conv) => (
                  <tr key={conv.conversation_id} className="hover:bg-gray-400 text-white">
                    <td className="border px-4 py-2">{conv.conversation_id}</td>
                    <td className="border px-4 py-2">{conv.subject}</td>
                    <td className="border px-4 py-2 text-center">
                      {conv.unreadCount > 0 ? (
                        <span className="bg-green-600 text-white rounded-full px-2 py-0.5">
                          {conv.unreadCount}
                        </span>
                      ) : (
                        t('read')
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      {new Date(conv.updatedAt).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => router.push(`/user/liveChat/${conv.conversation_id}`)}
                          className="bg-blue-500 text-white px-3 py-1 rounded-xl hover:bg-blue-600 transition text-sm"
                        >
                          {t('view')}
                        </button>
                        <ConversationActionButton
                          action="delete"
                          user_id={userId}
                          conversation_id={conv.conversation_id}
                          chatType="live"
                          isAdmin={false}
                          buttonClass="bg-red-500 text-white px-3 py-1 rounded-xl hover:bg-red-600 transition text-sm"
                          buttonText={t('delete')}
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
          {pagedConversations.map((conv) => (
            <div
              key={conv.conversation_id}
              onClick={() => router.push(`/user/liveChat/${conv.conversation_id}`)}
              className="border border-gray-300 rounded-lg p-4 shadow-sm bg-gray-500 text-white hover:cursor-pointer"
            >
              <h3 className="font-semibold text-lg mb-2">{conv.subject}</h3>
              <p className="mb-1">
                <strong>{t('id')}:</strong> {conv.conversation_id}
              </p>
              <p className="mb-1">
                <strong>{t('unread')}:</strong>{' '}
                {conv.unreadCount > 0 ? (
                  <span className="bg-red-600 text-white rounded-full px-2 py-0.5">
                    {conv.unreadCount}
                  </span>
                ) : (
                  t('none')
                )}
              </p>
              <p className="mb-3">
                <strong>{t('last_message')}:</strong> {new Date(conv.updatedAt).toLocaleString()}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => router.push(`/user/liveChat/${conv.conversation_id}`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
                >
                  {t('view')}
                </button>
                <ConversationActionButton
                  action="delete"
                  user_id={userId}
                  conversation_id={conv.conversation_id}
                  chatType="live"
                  isAdmin={false}
                  buttonClass="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                  buttonText={t('delete')}
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
