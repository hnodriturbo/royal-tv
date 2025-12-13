'use client';
/**
 * usePublicLiveChatModals.js
 * ==========================
 * 💬 Centralized modal logic for Public Live Chat widget (guest + user)
 *
 * I only use these keys from socket.ui.publicLiveChat:
 *   • close_title / close_description / close_confirm / close_cancel
 *   • edit_title / edit_hint / edit_message_label / edit_confirm / edit_cancel / edit_error
 *   • delete_title / delete_description / delete_confirm / delete_cancel / delete_error
 */

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

import useAppHandlers from '@/hooks/useAppHandlers'; // 🔔 toast helper
import useModal from '@/hooks/useModal'; // 🪟 global modal helper

export default function usePublicLiveChatModals({ editMessage, deleteMessage }) {
  const t = useTranslations(); // 🌍 socket.ui.publicLiveChat.*
  const { displayMessage } = useAppHandlers(); // 🔔 toast feedback
  const { openModal, hideModal } = useModal(); // 🪟 open/close modals

  // ✏️ Local edit state for a single message
  const [messageBeingEdited, setMessageBeingEdited] = useState(null);
  /* const [editDraftMessage, setEditDraftMessage] = useState(''); */

  // 🗑️ Local delete state for a single message
  const [messageBeingDeleted, setMessageBeingDeleted] = useState(null);

  // ✅ Confirm edit handler (socket + toast on error only)
  const handleConfirmEdit = useCallback(
    async (message, currentDraft) => {
      console.log('[usePublicLiveChatModals] handleConfirmEdit', {
        hasEditMessage: typeof editMessage === 'function',
        messageId: message?.public_message_id,
        draft: currentDraft
      });

      if (!message || !message.public_message_id) return;

      const trimmed = (currentDraft || '').trim();
      if (!trimmed) {
        displayMessage(
          t('socket.ui.publicLiveChat.edit_error', {
            defaultValue: 'Failed to edit message, please try again.'
          }),
          'error'
        );
        return;
      }

      try {
        await editMessage?.(message.public_message_id, trimmed); // ✏️ socket emit

        setMessageBeingEdited(null);
        hideModal();
      } catch (error) {
        console.error('[usePublicLiveChatModals] edit error:', error);
        displayMessage(
          t('socket.ui.publicLiveChat.edit_error', {
            defaultValue: 'Failed to edit message, please try again.'
          }),
          'error'
        );
      }
    },
    [displayMessage, editMessage, hideModal] // ⚠️ keep t out
  );

  // ✏️ Open edit modal for a specific message (old widget behaviour)
  const openEditModal = useCallback(
    (message) => {
      if (!message?.public_message_id) return; // 🚧 Guard

      setMessageBeingEdited(message);

      // 🧠 Local mutable draft that both textarea and onConfirm share
      let localDraft = message.message || '';

      openModal('editPublicMessage', {
        title: t('socket.ui.publicLiveChat.edit_title', { defaultValue: 'Edit message' }),
        customContent: () => (
          <div className="space-y-3">
            <p className="text-sm opacity-80">
              {t('socket.ui.publicLiveChat.edit_hint', {
                defaultValue: 'Update the message and confirm to save changes.'
              })}
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold">
                {t('socket.ui.publicLiveChat.edit_message_label', {
                  defaultValue: 'Message'
                })}
              </label>
              <textarea
                rows={4}
                defaultValue={message.message || ''}
                onChange={(event) => {
                  localDraft = event.target.value; // 🧠 always keep latest text
                }}
                className="w-full rounded-md border border-slate-500 bg-slate-900 text-sm text-white px-2 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        ),
        confirmButtonType: 'info',
        confirmButtonText: t('socket.ui.publicLiveChat.edit_confirm', {
          defaultValue: 'Save changes'
        }),
        cancelButtonText: t('socket.ui.publicLiveChat.edit_cancel', {
          defaultValue: 'Cancel'
        }),
        onConfirm: () => handleConfirmEdit(message, localDraft),
        onCancel: () => {
          setMessageBeingEdited(null);
          hideModal();
        }
      });
    },
    [openModal, hideModal, handleConfirmEdit] // ⚠️ no t here
  );

  // 🗑️ Open delete confirmation modal for a specific message (old widget behaviour)
  const openDeleteModal = useCallback(
    (message) => {
      if (!message?.public_message_id) return; // 🚧 Guard

      setMessageBeingDeleted(message); // 🧵 Track what is being deleted

      openModal('deletePublicMessage', {
        title: t('socket.ui.publicLiveChat.delete_title', {
          defaultValue: 'Delete message?'
        }),
        description: t('socket.ui.publicLiveChat.delete_description', {
          defaultValue: 'This action cannot be undone.'
        }),
        confirmButtonType: 'danger',
        confirmButtonText: t('socket.ui.publicLiveChat.delete_confirm', {
          defaultValue: 'Delete message'
        }),
        cancelButtonText: t('socket.ui.publicLiveChat.delete_cancel', {
          defaultValue: 'Cancel'
        }),
        onConfirm: async () => {
          try {
            await deleteMessage?.(message.public_message_id); // 🗑️ Send delete via socket
            setMessageBeingDeleted(null); // 🧹 Clear local state
            hideModal();
          } catch (error) {
            displayMessage(
              t('socket.ui.publicLiveChat.delete_error', {
                defaultValue: 'Failed to delete message, please try again.'
              }),
              'error'
            );
          }
        },
        onCancel: () => {
          setMessageBeingDeleted(null); // 🔄 Reset if user cancels
          hideModal();
        }
      });
    },
    [openModal, hideModal, deleteMessage, displayMessage] // ⚠️ t intentionally left out
  );

  // ❌ Close chat confirmation modal (same as old hard close)
  const openCloseChatModal = useCallback(
    ({ onConfirmClose }) => {
      openModal('closePublicChat', {
        title: t('socket.ui.publicLiveChat.close_title', {
          defaultValue: 'Close chat?'
        }),
        description: t('socket.ui.publicLiveChat.close_description', {
          defaultValue: 'This will end the current chat session.'
        }),
        overlayClassName: 'z-[100050]',
        confirmButtonType: 'danger', // 🔴 Same style as before
        confirmButtonText: t('socket.ui.publicLiveChat.close_confirm', {
          defaultValue: 'Close chat'
        }),
        cancelButtonText: t('socket.ui.publicLiveChat.close_cancel', {
          defaultValue: 'Cancel'
        }),
        onConfirm: async () => {
          try {
            await onConfirmClose?.(); // 🧹 Widget does leaveRoom + state + cookies
          } finally {
            hideModal();
          }
        },
        onCancel: hideModal
      });
    },
    [openModal, hideModal] // ⚠️ t intentionally left out
  );

  return {
    openEditModal, // ✏️ Used in widget: onClick={() => openEditModal(message)}
    openDeleteModal, // 🗑️ Used in widget: onClick={() => openDeleteModal(message)}
    openCloseChatModal // ❌ Used in widget: handleHardClose ➜ openCloseChatModal({ onConfirmClose })
  };
}
