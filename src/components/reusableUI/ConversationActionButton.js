'use client';

import { useCallback, useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import useModal from '@/hooks/useModal';
import useSocketHub from '@/hooks/socket/useSocketHub';
import axiosInstance from '@/lib/core/axiosInstance';

/**
 * ConversationActionButton
 * - Supports actions: create | delete | deleteAll
 * - Shows subject + message fields for `create` using your Modal's custom content API
 * - Calls optional `onActionSuccess` after a successful action
 * - Reads session and hides itself unless role is "admin" or "user"
 * - Uses unified API endpoints at /api/liveChat/{create|delete|deleteAll}
 *
 * ⚠️ i18n: All t() keys are kept exactly as provided.
 */
export default function ConversationActionButton({
  action = 'create',
  user_id,
  conversation_id,
  user,
  buttonClass,
  size,
  buttonText,
  onActionSuccess // optional: ({ action, conversation_id?, user_id?, created_id?, result }) => void
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: session, status } = useSession();

  const role = session?.user?.role;
  const isAdmin = role === 'admin';
  const isUser = role === 'user';

  // ⛔️ Do NOT return yet — call all hooks first to keep hook order consistent across renders

  const { openModal, hideModal } = useModal();
  const { createConversation } = useSocketHub();

  const goTo = useCallback(
    (id) => {
      if (!id) return;
      router.push(`/${locale}/${isAdmin ? 'admin' : 'user'}/liveChat/${id}`);
    },
    [router, locale, isAdmin]
  );

  // Refs for create modal fields
  const subjectRef = useRef(null);
  const messageRef = useRef(null);

  // CREATE
  const handleCreate = useCallback(
    async ({ subject, message } = {}) => {
      try {
        // Prefer socket (if hub returns an id)
        const createdId = (await createConversation?.(user_id, user, { subject, message })) || null;
        if (createdId) {
          onActionSuccess?.({ action: 'create', user_id, created_id: createdId, result: 'socket' });
          goTo(createdId);
          return;
        }

        // Fallback to REST API
        const res = await axiosInstance.post('/api/liveChat/create', {
          user_id,
          subject,
          message
        });
        const id = res?.data?.conversation_id || res?.data?.id;
        onActionSuccess?.({ action: 'create', user_id, created_id: id, result: res?.data });
        goTo(id);
      } finally {
        hideModal();
      }
    },
    [createConversation, user_id, user, goTo, hideModal, onActionSuccess]
  );

  // DELETE one
  const handleDelete = useCallback(async () => {
    try {
      const res = await axiosInstance.delete('/api/liveChat/delete', {
        data: { conversation_id }
      });
      onActionSuccess?.({ action: 'delete', conversation_id, result: res?.data });
    } finally {
      hideModal();
    }
  }, [conversation_id, hideModal, onActionSuccess]);

  // DELETE all (admin only)
  const handleDeleteAll = useCallback(async () => {
    try {
      if (!isAdmin) return; // UI guard; API should also enforce
      const res = await axiosInstance.delete('/api/liveChat/deleteAll', {
        data: { user_id }
      });
      onActionSuccess?.({ action: 'deleteAll', user_id, result: res?.data });
    } finally {
      hideModal();
    }
  }, [isAdmin, user_id, hideModal, onActionSuccess]);

  // Modal definitions
  const createModal = useMemo(() => {
    if (action === 'create') {
      const subjectPlaceholder = t('components.conversationActionButton.placeholder_subject');
      const messagePlaceholder = t('components.conversationActionButton.placeholder_message');

      // Shared custom content used by both `customContent` and `body` fallbacks
      const content = (
        <div className="space-y-2">
          <input
            ref={subjectRef}
            name="subject"
            type="text"
            className="w-full border rounded p-2"
            placeholder={subjectPlaceholder}
          />
          <textarea
            ref={messageRef}
            name="message"
            className="w-full border rounded p-2 h-28"
            placeholder={messagePlaceholder}
          />
        </div>
      );

      const onConfirm = () => {
        const subject = subjectRef.current?.value?.trim();
        const message = messageRef.current?.value?.trim();
        if (!subject || !message) return; // keep modal open if invalid
        handleCreate({ subject, message });
      };

      return {
        btn: buttonClass || 'btn-primary',
        label: buttonText || t('components.conversationActionButton.btn_start_new'),
        modal: {
          title: t('components.conversationActionButton.modal_create_title'),
          description: t('components.conversationActionButton.modal_create_description'),
          confirmText: t('components.conversationActionButton.modal_create_confirm'),

          // For modal implementations that read generated fields
          inputs: [
            { name: 'subject', type: 'text', placeholder: subjectPlaceholder, required: true },
            { name: 'message', type: 'textarea', placeholder: messagePlaceholder, required: true }
          ],
          fields: [
            { name: 'subject', type: 'text', placeholder: subjectPlaceholder, required: true },
            { name: 'message', type: 'textarea', placeholder: messagePlaceholder, required: true }
          ],

          // Primary: render real inputs (works like your admin page's customContent/body usage)
          customContent: () => content,
          body: content,

          onConfirm
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

    // deleteAll (admin only)
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
  const disabled = action === 'deleteAll' && !isAdmin;

  // ✅ Now it's safe to return conditionally — *after* all hooks have been called in this render
  const isAllowed = status === 'authenticated' && (isAdmin || isUser);
  if (!isAllowed) return null;
  if (action === 'deleteAll' && !isAdmin) return null;

  return (
    <button
      type="button"
      className={`${createModal.btn} ${sizeClass}`}
      onClick={() => openModal(`chat_${action}`, createModal.modal)}
      disabled={disabled}
    >
      {createModal.label}
    </button>
  );
}

/**
USAGE
------
1) Create (user or admin initiates):
<ConversationActionButton
  action="create"
  user_id={targetUser.user_id}
  user={targetUser}
  onActionSuccess={({ created_id }) => {
    // optional toast etc.; navigation is automatic via goTo(created_id)
  }}
/>

2) Delete one conversation:
<ConversationActionButton
  action="delete"
  conversation_id={conversation.conversation_id}
  onActionSuccess={() => {
    // e.g. show toast and redirect
  }}
/>

3) Delete ALL conversations for a user (admin only):
<ConversationActionButton
  action="deleteAll"
  user_id={user.user_id}
  onActionSuccess={() => {/* toast or refresh */
/*}}
/>
*/
