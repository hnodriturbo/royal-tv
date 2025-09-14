// src/components/reusableUI/ConversationActionButton.js
'use client';

import { useCallback, useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import useModal from '@/hooks/useModal';
import useSocketHub from '@/hooks/socket/useSocketHub';
import useAppHandlers from '@/hooks/useAppHandlers';
import axiosInstance from '@/lib/core/axiosInstance';

/**
 * ConversationActionButton
 * actions: "create" | "delete" | "deleteAll"
 *
 * Props (normalized):
 * - create/deleteAll need the **owner id** via one of:
 *   { user_id, targetUid, owner_id, user?.user_id }
 * - delete needs the **conversation id** via one of:
 *   { conversation_id, conversationId }
 *
 * Optional:
 * - user (object, used by socket create)
 * - buttonClass, size ('sm'|'lg'), buttonText
 * - onActionSuccess({ action, conversation_id?, user_id?, created_id?, result })
 */
export default function ConversationActionButton(props) {
  const {
    action = 'create',
    // owner id variants
    user_id,
    targetUid,
    owner_id,
    user,
    // delete one variants
    conversation_id,
    conversationId,
    // ui
    buttonClass,
    size,
    buttonText,
    onActionSuccess
  } = props;

  const t = useTranslations('components.conversationActionButton');
  const locale = useLocale();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { openModal, hideModal } = useModal();
  const { createConversation } = useSocketHub();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  const role = session?.user?.role;
  const isAdmin = role === 'admin';
  const isUser = role === 'user';
  // ---- normalize IDs --------------------------------------------------------
  const ownerId = user_id ?? targetUid ?? owner_id ?? (user && user.user_id) ?? null;

  const convoId = conversation_id ?? conversationId ?? null;

  // ---- navigation -----------------------------------------------------------
  const goTo = useCallback(
    (id) => {
      if (!id) return;
      router.push(`/${locale}/${isAdmin ? 'admin' : 'user'}/liveChat/${id}`);
    },
    [router, locale, isAdmin]
  );

  // ---- refs used by create modal -------------------------------------------
  const subjectRef = useRef(null);
  const messageRef = useRef(null);

  // ---- helpers --------------------------------------------------------------
  const show = (msg, type = 'info') => {
    try {
      if (typeof displayMessage === 'function') displayMessage(msg, type);
    } catch (err) {
      // fall back to console in dev
      if (process.env.NODE_ENV !== 'production')
        console.error('[ConversationActionButton] toast failed:', err);
    }
  };

  // ---- actions --------------------------------------------------------------
  const handleCreate = useCallback(
    async ({ subject, message } = {}) => {
      try {
        if (!ownerId) {
          show(t('error_generic_create'), 'error');
          console.error('[ConversationActionButton] create: missing ownerId');
          return;
        }
        if (!subject || !message) {
          show(t('validation_subject_message_required'), 'error');
          return;
        }

        showLoader?.({ text: t('loader_creating') });

        // 1) Try socket first
        let createdId = null;
        try {
          if (typeof createConversation === 'function') {
            createdId = await createConversation(ownerId, user, { subject, message });
          }
        } catch (err) {
          console.error('[ConversationActionButton] socket create failed, will fallback:', err);
        }

        // 2) Fallback to REST (with timeout)
        if (!createdId) {
          try {
            const res = await axiosInstance.post(
              '/api/liveChat/create',
              { user_id: ownerId, subject, message },
              { timeout: 15000 } // 15s timeout → t('error_timeout')
            );
            createdId = res?.data?.conversation_id || res?.data?.id || null;
          } catch (err) {
            if (err?.code === 'ECONNABORTED') {
              show(t('error_timeout'), 'error');
            } else {
              show(t('error_generic_create'), 'error');
            }
            console.error('[ConversationActionButton] REST create failed:', err);
            return;
          }
        }

        if (!createdId) {
          show(t('error_generic_create'), 'error');
          console.error('[ConversationActionButton] create: no id returned');
          return;
        }

        show(t('success_created'), 'success');
        onActionSuccess?.({
          action: 'create',
          user_id: ownerId,
          created_id: createdId,
          result: 'ok'
        });
        goTo(createdId);
      } catch (err) {
        show(t('error_generic_create'), 'error');
        console.error('[ConversationActionButton] create failed:', err);
      } finally {
        hideLoader?.();
        hideModal();
      }
    },
    [ownerId, user, createConversation, goTo, onActionSuccess, show, showLoader, hideLoader, t]
  );

  const handleDelete = useCallback(async () => {
    try {
      if (!convoId) {
        show(t('error_delete_failed'), 'error');
        console.error('[ConversationActionButton] delete: missing conversation_id');
        return;
      }
      showLoader?.({ text: t('loader_deleting_one') });
      const res = await axiosInstance.delete('/api/liveChat/delete', {
        data: { conversation_id: convoId }
      });
      show(t('success_deleted_one'), 'success');
      onActionSuccess?.({ action: 'delete', conversation_id: convoId, result: res?.data });
    } catch (err) {
      show(t('error_delete_failed'), 'error');
      console.error('[ConversationActionButton] delete failed:', err);
    } finally {
      hideLoader?.();
      hideModal();
    }
  }, [convoId, onActionSuccess, show, showLoader, hideLoader, t]);

  const handleDeleteAll = useCallback(async () => {
    try {
      if (!isAdmin) {
        console.error('[ConversationActionButton] deleteAll blocked: not admin');
        return;
      }
      if (!ownerId) {
        show(t('error_delete_all_failed'), 'error');
        console.error('[ConversationActionButton] deleteAll: missing ownerId');
        return;
      }
      showLoader?.({ text: t('loader_deleting_all') });
      const res = await axiosInstance.delete('/api/liveChat/deleteAll', {
        data: { user_id: ownerId }
      });
      show(t('success_deleted_all'), 'success');
      onActionSuccess?.({ action: 'deleteAll', user_id: ownerId, result: res?.data });
    } catch (err) {
      show(t('error_delete_all_failed'), 'error');
      console.error('[ConversationActionButton] deleteAll failed:', err);
    } finally {
      hideLoader?.();
      hideModal();
    }
  }, [isAdmin, ownerId, onActionSuccess, show, showLoader, hideLoader, t]);

  // ---- modal config ---------------------------------------------------------
  const createModal = useMemo(() => {
    if (action !== 'create') return null;

    const subjectPh = t('placeholder_subject');
    const messagePh = t('placeholder_message');

    const content = (
      <div className="space-y-2">
        <input
          ref={subjectRef}
          name="subject"
          type="text"
          className="w-full border rounded p-2"
          placeholder={subjectPh}
        />
        <textarea
          ref={messageRef}
          name="message"
          className="w-full border rounded p-2 h-28"
          placeholder={messagePh}
        />
      </div>
    );

    const onConfirm = () => {
      const subject = subjectRef.current?.value?.trim();
      const message = messageRef.current?.value?.trim();
      if (!subject || !message) {
        show(t('validation_subject_message_required'), 'error');
        return; // keep modal open
      }
      handleCreate({ subject, message });
    };

    return {
      btn: buttonClass || 'btn-primary',
      label: buttonText || t('btn_start_new'),
      modal: {
        title: t('modal_create_title'),
        description: t('modal_create_description'),
        confirmButtonText: t('modal_create_confirm'),
        confirmButtonClass: 'btn-primary',
        cancelButtonText: t('modal_cancel'),
        cancelButtonType: 'Danger',
        // optional schema for consumers that render from it
        inputs: [
          { name: 'subject', type: 'text', placeholder: subjectPh, required: true },
          { name: 'message', type: 'textarea', placeholder: messagePh, required: true }
        ],
        fields: [
          { name: 'subject', type: 'text', placeholder: subjectPh, required: true },
          { name: 'message', type: 'textarea', placeholder: messagePh, required: true }
        ],
        customContent: () => content,
        body: content,
        onConfirm,
        onCancel: () => hideModal()
      }
    };
  }, [action, buttonClass, buttonText, t, handleCreate, hideModal, show]);

  const deleteOneModal = useMemo(() => {
    if (action !== 'delete') return null;
    return {
      btn: buttonClass || 'btn-danger',
      label: buttonText || t('btn_delete_one'),
      modal: {
        title: t('modal_delete_title'),
        description: t('modal_delete_description'),
        confirmButtonText: t('modal_delete_confirm'),
        confirmButtonType: 'Danger',
        cancelButtonText: t('modal_cancel'),
        onConfirm: handleDelete,
        onCancel: () => hideModal()
      }
    };
  }, [action, buttonClass, buttonText, t, handleDelete, hideModal]);

  const deleteAllModal = useMemo(() => {
    if (action !== 'deleteAll') return null;
    return {
      btn: buttonClass || 'btn-danger',
      label: buttonText || t('btn_delete_all'),
      modal: {
        title: t('modal_delete_all_title'),
        description: t('modal_delete_all_description'),
        confirmButtonText: t('modal_delete_all_confirm'),
        confirmButtonType: 'Danger',
        cancelButtonText: t('modal_cancel'),
        onConfirm: handleDeleteAll,
        onCancel: () => hideModal()
      }
    };
  }, [action, buttonClass, buttonText, t, handleDeleteAll, hideModal]);

  const cfg =
    action === 'create' ? createModal : action === 'delete' ? deleteOneModal : deleteAllModal;

  // ---- visibility guards ----------------------------------------------------
  const isAuthed = status === 'authenticated';
  const roleOK =
    (action === 'create' && (isAdmin || isUser)) ||
    (action === 'delete' && (isAdmin || isUser)) ||
    (action === 'deleteAll' && isAdmin);

  const propsOK =
    (action === 'create' && !!ownerId) ||
    (action === 'delete' && !!convoId) ||
    (action === 'deleteAll' && !!ownerId);

  if (!isAuthed || !roleOK || !cfg || !propsOK) return null;

  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const disabled = action === 'deleteAll' && !isAdmin;

  return (
    <button
      type="button"
      className={`${cfg.btn} ${sizeClass}`}
      onClick={() => openModal(`chat_${action}`, cfg.modal)}
      disabled={disabled}
    >
      {cfg.label}
    </button>
  );
}
