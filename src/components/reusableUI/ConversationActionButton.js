// File: components/reusableUI/ConversationActionButton.js
'use client';

import { useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import useModal from '@/hooks/useModal';
import useSocketHub from '@/hooks/socket/useSocketHub';
import axiosInstance from '@/lib/core/axiosInstance';

export default function ConversationActionButton({
  action = 'create',
  user_id,
  conversation_id,
  user,
  buttonClass,
  size,
  buttonText
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const { openModal, hideModal } = useModal();
  const { createConversation } = useSocketHub();

  const goTo = useCallback(
    (id) => {
      router.push(`/${locale}/${isAdmin ? 'admin' : 'user'}/liveChat/${id}`);
    },
    [router, locale, isAdmin]
  );

  const handleCreate = useCallback(async () => {
    try {
      // Try socket first
      const id = (await createConversation?.(user_id, user)) || null;
      if (id) {
        goTo(id);
        return;
      }
      // Fallback to API
      const res = await axiosInstance.post(`/api/${isAdmin ? 'admin' : 'user'}/liveChat/create`, {
        user_id
      });
      goTo(res.data?.conversation_id || res.data?.id);
    } finally {
      hideModal();
    }
  }, [createConversation, user_id, user, isAdmin, goTo, hideModal]);

  const handleDelete = useCallback(async () => {
    try {
      await axiosInstance.delete(`/api/${isAdmin ? 'admin' : 'user'}/liveChat/${conversation_id}`);
    } finally {
      hideModal();
    }
  }, [conversation_id, isAdmin, hideModal]);

  const handleDeleteAll = useCallback(async () => {
    try {
      await axiosInstance.delete(`/api/${isAdmin ? 'admin' : 'user'}/liveChat`);
    } finally {
      hideModal();
    }
  }, [isAdmin, hideModal]);

  const cfg = useMemo(() => {
    if (action === 'create') {
      return {
        btn: buttonClass || 'btn-primary',
        label: buttonText || t('components.conversationActionButton.btn_create'),
        modal: {
          title: t('components.conversationActionButton.modal_create_title'),
          description: t('components.conversationActionButton.modal_create_description'),
          confirmText: t('components.conversationActionButton.modal_create_confirm'),
          onConfirm: handleCreate
        }
      };
    }
    if (action === 'delete') {
      return {
        btn: buttonClass || 'btn-danger',
        label: buttonText || t('components.conversationActionButton.btn_delete_one'),
        modal: {
          title: t('components.conversationActionButton.modal_delete_title'),
          description: t('components.conversationActionButton.modal_delete_description'),
          confirmText: t('components.conversationActionButton.modal_delete_confirm'),
          onConfirm: handleDelete
        }
      };
    }
    return {
      btn: buttonClass || 'btn-danger',
      label: buttonText || t('components.conversationActionButton.btn_delete_all'),
      modal: {
        title: t('components.conversationActionButton.modal_delete_all_title'),
        description: t('components.conversationActionButton.modal_delete_all_description'),
        confirmText: t('components.conversationActionButton.modal_delete_all_confirm'),
        onConfirm: handleDeleteAll
      }
    };
  }, [action, buttonClass, buttonText, t, handleCreate, handleDelete, handleDeleteAll]);

  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <button
      type="button"
      className={`${cfg.btn} ${sizeClass}`}
      onClick={() => openModal(`chat_${action}`, cfg.modal)}
    >
      {cfg.label}
    </button>
  );
}
