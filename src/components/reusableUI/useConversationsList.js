// File: hooks/socket/useConversationsList.js
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useConversationsList({
  role = 'user',
  chatType = 'liveChat',
  selectedUserId = null,
  routes = {},
  page = 1,
  pageSize = 20
} = {}) {
  const { data: session } = useSession();
  const { displayMessage } = useAppHandlers();
  const { onRefreshConversations } = useSocketHub();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const endPointURL = useMemo(() => {
    const base = role === 'admin' ? '/api/admin' : '/api/user';
    if (role === 'admin' && selectedUserId) return `${base}/${chatType}/user/${selectedUserId}`;
    return `${base}/${chatType}/main`;
  }, [role, chatType, selectedUserId]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(endPointURL, { params: { page, pageSize } });
      setItems(res.data?.items || res.data?.conversations || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      displayMessage('Failed to load conversations', 'error');
    } finally {
      setLoading(false);
    }
  }, [endPointURL, page, pageSize, displayMessage]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const stop = onRefreshConversations?.(fetchItems);
    return () => {
      if (typeof stop === 'function') stop();
    };
  }, [onRefreshConversations, fetchItems]);

  return {
    items,
    total,
    loading,
    refetch: fetchItems
  };
}
