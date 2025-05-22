/**
 * ConversationActionButton.js
 * ----------------------------------------------------------
 * 🧩 Universal admin chat action button for conversations
 *
 * PROPS:
 *   action:         'create' | 'delete' | 'deleteAll'   // What action this button does (required)
 *   user_id:        string                               // Target user ID (required)
 *   conversation_id?:string                              // For deleting a single conversation (required for 'delete')
 *   chatType?:      'live' | 'bubble'                    // Chat type (default 'live')
 *   buttonClass?:   string                               // Optional override button CSS class (eg. 'btn-secondary')
 *   size?:          'sm' | 'lg'                          // Optional size class (eg. 'btn-sm', 'btn-lg')
 *   onActionSuccess?: (data) => void                     // Optional callback, called with API response on success (except create, which routes)
 *   buttonText?:    string                               // Optional custom label
 */

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import axiosInstance from '@/lib/axiosInstance';
import useModal from '@/hooks/useModal';
import useAppHandlers from '@/hooks/useAppHandlers';

export default function ConversationActionButton({
  action = 'create',
  user_id,
  conversation_id,
  chatType = 'live',
  buttonClass,
  size,
  onActionSuccess,
  buttonText
}) {
  // 1️⃣ Router and handlers
  const router = useRouter();
  const { hideLoader, showLoader, displayMessage } = useAppHandlers();
  const { openModal, hideModal } = useModal();
  const inputRef = useRef(null);
  const textAreaRef = useRef(null);

  // 2️⃣ Validate required IDs
  if (!user_id) return null;
  if (action === 'delete' && !conversation_id) return null;

  // 3️⃣ Button configs
  let config = {};

  if (action === 'create') {
    config = {
      buttonStyle: buttonClass || 'btn-success',
      label: buttonText || 'Start Conversation',
      modal: {
        title: 'Start New Conversation',
        description: 'Enter subject and your message below:',
        content: () => (
          <div className="flex flex-col gap-4 rounded-lg">
            <input
              ref={inputRef}
              type="text"
              className="border p-2 w-full text-black rounded-lg"
              placeholder="Enter subject"
              autoFocus
            />
            <textarea
              ref={textAreaRef}
              className="border p-2 w-full h-24 text-black rounded-lg"
              placeholder="Type your message here..."
            />
          </div>
        ),
        confirmText: 'Create Conversation',
        onConfirm: async () => {
          // 4️⃣ Read values
          const subject = inputRef.current?.value.trim();
          const message = textAreaRef.current?.value.trim();
          if (!subject || !message) {
            displayMessage('Subject and message cannot be empty', 'error');
            return;
          }
          try {
            showLoader({ text: 'Creating conversation…' });
            // 5️⃣ Create via API
            const { data } = await axiosInstance.post('/api/admin/createConversation', {
              user_id,
              subject,
              message,
              chatType
            });
            displayMessage('Conversation created successfully', 'success', 3000);
            // 6️⃣ Loader for transition, then route to new conversation page
            showLoader({ text: 'Created conversation… delivering you to it....', time: 3000 });
            router.push(`/admin/liveChat/${data.conversation_id}`);
          } catch (error) {
            displayMessage(`Failed to create conversation: ${error.message}`, 'error');
          } finally {
            setTimeout(() => {
              hideLoader();
              hideModal();
            }, 3500); // Hide loader/modal after navigation delay
          }
        }
      }
    };
  } else if (action === 'delete') {
    config = {
      buttonStyle: buttonClass || 'btn-danger',
      label: buttonText || 'Delete Conversation',
      modal: {
        title: 'Delete Conversation',
        description: 'This will permanently delete the conversation and all messages within it.',
        confirmText: 'Delete',
        onConfirm: async () => {
          try {
            showLoader({ text: 'Deleting conversation…' });
            const { data } = await axiosInstance.delete('/api/admin/deleteConversation', {
              params: { conversation_id, user_id, chatType }
            });
            displayMessage('Conversation deleted', 'success');
            if (onActionSuccess) onActionSuccess(data); // 7️⃣ Send result back up if provided
          } catch (err) {
            displayMessage('Delete failed', 'error');
          } finally {
            hideLoader();
            hideModal();
          }
        }
      }
    };
  } else if (action === 'deleteAll') {
    config = {
      buttonStyle: buttonClass || 'btn-danger',
      label: buttonText || 'Delete All Conversations',
      modal: {
        title: 'Delete ALL Conversations for User',
        description: 'This will permanently delete ALL conversations and messages for this user.',
        confirmText: 'Delete All',
        onConfirm: async () => {
          try {
            showLoader({ text: 'Deleting all conversations…', time: 3000 });
            const { data } = await axiosInstance.delete('/api/admin/deleteAllUserConversations', {
              params: { user_id, chatType }
            });
            displayMessage('All conversations deleted', 'success');
            if (onActionSuccess) onActionSuccess(data); // 7️⃣ Send result back up if provided
          } catch (err) {
            displayMessage('Delete all failed', 'error');
          } finally {
            hideLoader();
            hideModal();
          }
        }
      }
    };
  }

  // 8️⃣ Handler to open modal
  const handleOpenModal = () => {
    openModal(`${action}ConversationModal`, {
      title: config.modal.title,
      description: config.modal.description,
      customContent: config.modal.content || undefined,
      confirmButtonText: config.modal.confirmText,
      cancelButtonText: 'Cancel',
      confirmButtonType: action === 'create' ? 'Success' : 'Danger',
      onConfirm: config.modal.onConfirm,
      onCancel: hideModal
    });
  };

  // 9️⃣ Combine classes
  const buttonClasses = clsx(
    config.buttonStyle,
    size === 'sm' && 'btn-sm',
    size === 'lg' && 'btn-lg'
  );

  // 🔟 Render: just the button (wrap with Link in page if needed)
  return (
    <button type="button" className={buttonClasses} onClick={handleOpenModal}>
      {config.label}
    </button>
  );
}

// 📝 ConversationActionButton – Usage Examples
// --------------------------------------------
// ----- Create conversation (small, default style, auto-redirects to new convo on success) -----
// <ConversationActionButton
//  action="create"
//  user_id={user_id}
//  chatType="live"
//  size="sm" />
//
// Delete conversation (calls onActionSuccess after success)
// <ConversationActionButton
//   action="delete"
//   user_id={user_id}
//   conversation_id={conversation_id}
//   chatType="live"
//   size="sm"
//   onActionSuccess={() => fetchUserConversations()}
// />
//
// // Delete all user conversations
// <ConversationActionButton
//   action="deleteAll"
//   user_id={user_id}
//   chatType="live"
//   size="sm"
//   onActionSuccess={data => console.log('Deleted!', data)}
// />
//
// Use with custom button text and style
// <ConversationActionButton
//   action="create"
//   user_id={user_id}
//   buttonText="Send Email"
//   buttonClass="btn-warning"
// />
//
// Manually wrap in <Link> if you want navigation on click (not recommended for modals, but possible)
// <Link href="/admin/liveChat/main">
//   <ConversationActionButton action="create" user_id={user_id} size="sm" />
// </Link>
/* 
<ConversationActionButton
  action="deleteAll"
  user_id={user_id}
  chatType="live"
  size="sm"
  onActionSuccess={(responseData) => {
      responseData is what your API returned
      For example, reload conversation list:
    fetchUserConversations();
      Or you can log/inspect it:
    console.slog('API response:', responseData);
  }}
/>;
 */
