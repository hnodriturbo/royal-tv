/**
 *   ===================== ConversationActionButton.js =====================
 * 🧩 UNIVERSAL LIVE CHAT ACTION BUTTON (Admin/User)
 * - Translated with i18n client via useTranslations()
 * - Handles creating, deleting, and bulk-deleting conversations (live chat only).
 * - Uses socket for creation (real-time), Axios for delete actions.
 * - Works for both admin and user by passing correct props/routes.
 * ========================================================================
 * ⚙️ PROPS:
 *   action:           'create' | 'delete' | 'deleteAll'    // What action this button does (required)
 *   user_id:          string                               // Target user ID (required)
 *   conversation_id?: string                               // For deleting a single conversation (required for 'delete')
 *   user?:            object                               // Full user object (required for notifications)
 *   buttonClass?:     string                               // Optional override button CSS class (eg. 'btn-secondary')
 *   size?:            'sm' | 'lg'                          // Optional size class (eg. 'btn-sm', 'btn-lg')
 *   isAdmin?:         boolean                              // Set to true for admin pages, false for users
 *   onActionSuccess?: (data) => void                       // Callback with API response on success (except create, which routes)
 *   buttonText?:      string                               // Optional custom label
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRef } from 'react';
import { useRouter } from '@/i18n';
import clsx from 'clsx';
import useSocketHub from '@/hooks/socket/useSocketHub';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';
import axiosInstance from '@/lib/core/axiosInstance';
import { useCreateNotifications } from '@/hooks/socket/useCreateNotifications';
import { useTranslations } from 'next-intl'; // 🌐 i18n: hook

export default function ConversationActionButton({
  action = 'create',
  user_id,
  user,
  conversation_id,
  buttonClass,
  size,
  isAdmin = false,
  onActionSuccess,
  buttonText
}) {
  const t = useTranslations(); // 🔤 activate translator
  const { data: session } = useSession();
  const router = useRouter();

  // 🔄 UI handlers
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  // 🔔 Notification creators (always provide full user object!)
  const {
    createLiveChatMessageNotificationForAdminOnly,
    createLiveChatMessageNotificationForUserOnly
  } = useCreateNotifications();

  // 📝 Input refs for modal form (create)
  const inputRef = useRef(null);
  const textAreaRef = useRef(null);

  // 🛜 Socket hub for real-time creation
  const { socket, emit } = useSocketHub();

  // 🏁 API base route is always live chat now
  const baseApiRoute = '/api/liveChat';

  // 🟢 CREATE conversation handler (real-time via socket and notification)
  const handleCreateConversation = async () => {
    const subject = inputRef.current?.value.trim();
    const message = textAreaRef.current?.value.trim();

    if (!subject || !message) {
      // 🚫 Guard: both fields required
      displayMessage(
        t('components.conversationActionButton.validation_subject_message_required'),
        'error'
      );
      return;
    }

    showLoader({ text: t('components.conversationActionButton.loader_creating') }); // ⏳ Loader text

    try {
      // Emit event to create room (socket) - always live chat
      emit('create_chat_room', { chatType: 'live', subject, user_id });

      // Wait for room to be created (socket response) with a timeout fallback
      const readyEvent = 'live_chat_room_ready';

      const newConversationPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(t('components.conversationActionButton.error_timeout')));
        }, 8000);

        socket.once(readyEvent, (payload) => {
          clearTimeout(timeoutId);
          resolve(payload);
        });
      });

      const { conversation_id: new_convo_id } = await newConversationPromise;

      // Emit first message (seed conversation)
      emit('send_message', { chatType: 'live', conversation_id: new_convo_id, message });

      // 📝 Compose message and conversation objects
      const messageObj = {
        message, // 💬 Actual chat message
        sender_is_admin: isAdmin, // 🧑‍💼 Is sender admin?
        createdAt: new Date().toISOString(), // 🕒 Timestamp
        subject // 🏷️ Subject of the message
      };
      const conversationObj = {
        conversation_id: new_convo_id, // 💬 Conversation identifier
        subject // 🏷️ Repeated for safety
      };

      // 🟢 Notify correct recipient based on sender
      if (!isAdmin) {
        // 👤 User sent message → notify admin
        createLiveChatMessageNotificationForAdminOnly(user, messageObj, conversationObj);
      } else {
        if (!user || !user.user_id) {
          displayMessage(
            t('components.conversationActionButton.error_missing_user_for_notification'),
            'error'
          );
          return;
        }
        // 🧑‍💼 Admin sent message → notify user
        createLiveChatMessageNotificationForUserOnly(user, messageObj, conversationObj);
      }

      displayMessage(t('components.conversationActionButton.success_created'), 'success');
      router.push(isAdmin ? `/admin/liveChat/${new_convo_id}` : `/user/liveChat/${new_convo_id}`);

      setTimeout(() => {
        hideLoader();
        hideModal();
      }, 1300);
    } catch (error) {
      hideLoader();
      hideModal();
      displayMessage(
        error.message || t('components.conversationActionButton.error_generic_create'),
        'error'
      );
    }
  };

  // 🟠 DELETE conversation handler (API/Axios)
  const handleDeleteConversation = async () => {
    try {
      showLoader({ text: t('components.conversationActionButton.loader_deleting_one') });
      const endpoint = `${baseApiRoute}/deleteConversation?conversation_id=${conversation_id}`;
      const { data } = await axiosInstance.delete(endpoint);
      displayMessage(t('components.conversationActionButton.success_deleted_one'), 'success');
      if (onActionSuccess) onActionSuccess(data);
    } catch (error) {
      displayMessage(t('components.conversationActionButton.error_delete_failed'), 'error');
    } finally {
      hideLoader();
      hideModal();
    }
  };

  // 🟥 DELETE ALL conversations for user (admin only)
  const handleDeleteAllConversations = async () => {
    try {
      showLoader({ text: t('components.conversationActionButton.loader_deleting_all') });
      const endpoint = `${baseApiRoute}/deleteAllUserConversations?user_id=${user_id}`;
      const { data } = await axiosInstance.delete(endpoint);
      displayMessage(t('components.conversationActionButton.success_deleted_all'), 'success');
      if (onActionSuccess) onActionSuccess(data);
    } catch (error) {
      displayMessage(t('components.conversationActionButton.error_delete_all_failed'), 'error');
    } finally {
      hideLoader();
      hideModal();
    }
  };

  // ⚙️ Modal and button config based on action
  let config = {};

  // 🟩 CREATE config (modal for subject/message)
  if (action === 'create') {
    config = {
      buttonStyle: buttonClass || 'btn-success',
      label: buttonText || t('components.conversationActionButton.btn_start_new'),
      modal: {
        title: t('components.conversationActionButton.modal_create_title'),
        description: t('components.conversationActionButton.modal_create_description'),
        content: () => (
          <div className="flex flex-col gap-4 rounded-lg">
            {/* 📝 Subject field */}
            <input
              ref={inputRef}
              type="text"
              className="border p-2 w-full text-black rounded-lg"
              placeholder={t('components.conversationActionButton.placeholder_subject')}
              autoFocus
            />

            {/* 💬 First message */}
            <textarea
              ref={textAreaRef}
              className="border p-2 w-full h-24 text-black rounded-lg"
              placeholder={t('components.conversationActionButton.placeholder_message')}
            />
          </div>
        ),

        confirmText: t('components.conversationActionButton.modal_create_confirm'),
        onConfirm: handleCreateConversation
      }
    };
  }

  // 🟧 DELETE config (single conversation)
  else if (action === 'delete') {
    config = {
      buttonStyle: buttonClass || 'btn-danger',
      label: buttonText || t('components.conversationActionButton.btn_delete_one'),
      modal: {
        title: t('components.conversationActionButton.modal_delete_title'),
        description: t('components.conversationActionButton.modal_delete_description'),
        confirmText: t('components.conversationActionButton.modal_delete_confirm'),
        onConfirm: handleDeleteConversation
      }
    };
  }

  // 🟥 DELETE ALL config (admin only)
  else if (action === 'deleteAll') {
    if (!isAdmin) return null;
    config = {
      buttonStyle: buttonClass || 'btn-danger',
      label: buttonText || t('components.conversationActionButton.btn_delete_all'),
      modal: {
        title: t('components.conversationActionButton.modal_delete_all_title'),
        description: t('components.conversationActionButton.modal_delete_all_description'),
        confirmText: t('components.conversationActionButton.modal_delete_all_confirm'),
        onConfirm: handleDeleteAllConversations
      }
    };
  }

  // 🛑 Don't render if missing required fields for action
  if (!user_id || (action === 'delete' && !conversation_id)) return null;

  // 🚀 Handler to open modal
  const handleOpenModal = () => {
    openModal(`${action}ConversationModal`, {
      title: config.modal.title,
      description: config.modal.description,
      customContent: config.modal.content || undefined,
      confirmButtonText: config.modal.confirmText,
      cancelButtonText: t('components.common.cancel'),
      confirmButtonType: action === 'create' ? 'Success' : 'Danger',
      onConfirm: config.modal.onConfirm,
      onCancel: hideModal
    });
  };

  // 🎨 Button classes
  const buttonClasses = clsx(
    config.buttonStyle,
    size === 'sm' && 'btn-sm',
    size === 'lg' && 'btn-lg'
  );

  // 🖱️ Render button
  return (
    <button type="button" className={buttonClasses} onClick={handleOpenModal}>
      {String(config.label ?? '')}
    </button>
  );
}
