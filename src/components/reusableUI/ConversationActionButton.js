// components/reusableUI/ConversationActionButton.js
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
      if (!id) return;
      router.push(`/${locale}/${isAdmin ? 'admin' : 'user'}/liveChat/${id}`);
    },
    [router, locale, isAdmin]
  );

  // Accept optional { subject, message } from the modal
  const handleCreate = useCallback(
    async ({ subject, message } = {}) => {
      try {
        // Socket first (pass extra args if your hub supports it; ignored otherwise)
        const id = (await createConversation?.(user_id, user, { subject, message })) || null;
        if (id) {
          goTo(id);
          return;
        }
        // Single unified API route for admin + user
        const res = await axiosInstance.post('/api/liveChat/create', {
          user_id,
          subject,
          message
        });
        goTo(res.data?.conversation_id || res.data?.id);
      } finally {
        hideModal();
      }
    },
    [createConversation, user_id, user, goTo, hideModal]
  );

  // ❌ Handle the delete of a single conversation
  const handleDelete = useCallback(async () => {
    try {
      const scope = isAdmin ? 'admin' : 'user';
      await axiosInstance.delete(`/api/${scope}/liveChat/${conversation_id}`);
    } finally {
      hideModal();
    }
  }, [conversation_id, isAdmin, hideModal]);

  // ❌ Only admin can delete all conversations for one user
  const handleDeleteAll = useCallback(async () => {
    try {
      if (!isAdmin) return; // UI guard; API also enforces
      await axiosInstance.delete(`/api/admin/liveChat/deleteAll`, {
        params: { user_id }
      });
    } finally {
      hideModal();
    }
  }, [isAdmin, user_id, hideModal]);

  const createModal = useMemo(() => {
    if (action === 'create') {
      // Build the form into the modal config so Subject + Message render again.
      const subjectPlaceholder = t('components.conversationActionButton.placeholder_subject');
      const messagePlaceholder = t('components.conversationActionButton.placeholder_message');

      return {
        btn: buttonClass || 'btn-primary',
        // keep your key naming
        label: buttonText || t('components.conversationActionButton.btn_start_new'),
        modal: {
          title: t('components.conversationActionButton.modal_create_title'),
          description: t('components.conversationActionButton.modal_create_description'),
          confirmText: t('components.conversationActionButton.modal_create_confirm'),

          // ✅ Shape 1: what many custom modals use
          inputs: [
            { name: 'subject', type: 'text', placeholder: subjectPlaceholder, required: true },
            {
              name: 'message',
              type: 'textarea',
              placeholder: messagePlaceholder,
              required: true
            }
          ],

          // ✅ Shape 2: alternate key your old modal may expect
          fields: [
            { name: 'subject', type: 'text', placeholder: subjectPlaceholder, required: true },
            {
              name: 'message',
              type: 'textarea',
              placeholder: messagePlaceholder,
              required: true
            }
          ],

          // ✅ Shape 3: ultimate fallback — fully custom body (no class changes)
          // If your modal supports a render/body/children prop, it will display this.
          // If not, it will be ignored harmlessly.
          render: ({ values = {}, setValue }) => (
            <div>
              <input
                name="subject"
                type="text"
                placeholder={subjectPlaceholder}
                value={values.subject ?? ''}
                onChange={(e) => setValue?.('subject', e.target.value)}
              />
              <textarea
                name="message"
                placeholder={messagePlaceholder}
                value={values.message ?? ''}
                onChange={(e) => setValue?.('message', e.target.value)}
              />
            </div>
          ),

          // Simple validation message using your i18n key
          validate: (values) => {
            if (!values?.subject?.trim() || !values?.message?.trim()) {
              return t('components.conversationActionButton.validation_subject_message_required');
            }
          },

          // onConfirm receives the form values from the modal
          onConfirm: (values) => handleCreate(values)
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
    // delete all
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

/* 
Usage of this button should be exactly like this:
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';

create:
User to start new conversation with admin support:
    <ConversationActionButton
      action="create"
      user_id={user.user_id}   // owner of the conversation (must be a normal user)
      user={user}              // passed to socket hub if used
    />

Create conversation as admin to targetUser
<ConversationActionButton
  action="create"
  user_id={targetUser.user_id} // admin is creating for this user (the user get to be the owner)
  user={targetUser}
/>


Delete Conversation by conversation_id:
  <ConversationActionButton
  action="delete"
  conversation_id={conversation.conversation_id}
/>

Delete All Conversations for admin only





*/
