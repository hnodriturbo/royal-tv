'use client';

import logger from '@/lib/logger';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import axiosInstance from '@/lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useSocketHub from '@/hooks/socket/useSocketHub';

const defaultUser = {
  user_id: null,
  name: 'Unknown',
  email: null,
  username: null,
  role: null,
};

const defaultLastMessage = {
  message_id: null,
  message: null,
  sender_is_admin: null,
  createdAt: null,
  updatedAt: null,
  status: null,
};

const defaultMessageData = {
  user_id: null,
  message_id: null,
  sender_is_admin: null,
  status: null,
  readAt: null,
};

const useConversationsList = ({
  role,
  selectedUserId = null,
  chatType = 'liveChat',
  initialPage = 1,
  pageSize = 5,
  routes = {},
}) => {
  // 1️⃣ State
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const firstFetchRef = useRef(true);

  // 2️⃣ App helpers
  const { displayMessage, showLoader, hideLoader, isLoading } =
    useAppHandlers();
  const { onRefreshConversations } = useSocketHub();
  const { data: session, status } = useSession();

  // 3️⃣ Compute final endpoint URL
  const endPointURL = useMemo(() => {
    const defaultRoutes = {
      adminMain: `/api/admin/${chatType}/main`,
      adminUser: selectedUserId
        ? `/api/admin/${chatType}/user/${selectedUserId}`
        : null,
      userMain: `/api/user/${chatType}/main`,
    };

    const paths = { ...defaultRoutes, ...routes };

    if (role === 'admin') {
      return selectedUserId ? paths.adminUser : paths.adminMain;
    } else {
      return paths.userMain;
    }
  }, [role, selectedUserId, chatType, routes]);

  // 4️⃣ Main fetch logic
  const fetchItems = useCallback(
    async (isSilent = false) => {
      if (!endPointURL || status !== 'authenticated' || !session) return;

      logger.log('[useConversationsList] Fetching:', endPointURL);

      if (!isSilent) {
        const loaderText = firstFetchRef.current
          ? 'Fetching Data...'
          : 'Refreshing...';
        showLoader({ text: loaderText });
      }

      try {
        const { data } = await axiosInstance.get(endPointURL, {
          params: { page: currentPage, limit: pageSize },
        });

        const normalizedItems = (data.conversations || data.items || []).map(
          (item) => {
            const isUserSummary = !item.conversation_id;
            const sourceUser = isUserSummary ? item : item.user;

            const user = {
              ...defaultUser,
              user_id: sourceUser?.user_id ?? null,
              name: sourceUser?.name ?? defaultUser.name,
              email: sourceUser?.email ?? null,
              username: sourceUser?.username ?? null,
              role: sourceUser?.role ?? null,
            };

            const lastMessageDate =
              item.lastMessage?.createdAt || // object coming from admin‑user route
              item.lastMessage || // plain Date coming from summary route
              null;

            const messageData =
              item.messageData || item.defaultMessage
                ? {
                    ...defaultMessageData,
                    ...(item.messageData || item.defaultMessage),
                  }
                : defaultMessageData;

            return {
              id:
                item.conversation_id ??
                item.user_id ??
                `summary-${user.user_id}`,
              type: isUserSummary ? 'userSummary' : 'conversation',
              conversation_id: item.conversation_id ?? null,
              subject: item.subject ?? null,
              status: item.status ?? null,
              user,
              lastMessage: lastMessageDate,
              messageData,
              updatedAt: item.updatedAt ?? lastMessage.createdAt ?? null,
              createdAt: item.createdAt ?? null,
              totalMessagesInConversation:
                item.totalMessagesInConversation ?? item.totalMessages ?? 0,
              unreadMessagesInConversation:
                item.unreadMessagesInConversation ?? item.messagesCount ?? 0,
              totalConversationsForUser: item.totalConversationsForUser ?? 0,
              unreadConversationsForUser: item.unreadConversationsForUser ?? 0,
              totalMessagesForUser: item.totalMessagesForUser ?? 0,
              unreadMessagesForUser: item.unreadMessagesForUser ?? 0,
            };
          },
        );

        setItems(normalizedItems);
        setTotalPages(data.totalPages ?? 1);

        if (!isSilent && firstFetchRef.current) {
          displayMessage('Data loaded ✔️', 'success', 3);
        }
      } catch (error) {
        logger.error('[useConversationsList] ❌ Fetch Error:', error);
        displayMessage('Failed to load data ❌', 'error');
        setItems([]);
        setTotalPages(1);
      } finally {
        hideLoader();
        firstFetchRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endPointURL, currentPage, pageSize, status],
  );
  const refetch = useCallback(
    (isSilent = true) => fetchItems(isSilent),
    [fetchItems],
  );
  // 5️⃣ Trigger fetch when ready (first load)
  useEffect(() => {
    if (status === 'authenticated') {
      fetchItems();
    }
  }, [status, fetchItems]);

  return {
    items,
    currentPage,
    totalPages,
    setCurrentPage,
    isLoading,
    endPointURL,
    refetch: fetchItems,
  };
};

export default useConversationsList;
