/**
 * ================= usePublicMessageEvents (client) =================
 * 💬 Public chat: send / edit / delete / receive messages for ONE room
 * -------------------------------------------------------------------
 * Args:
 *   • public_conversation_id: string
 *
 * Returns:
 *   • sendPublicMessage(message_text)
 *   • editPublicMessage(message_id, new_text)
 *   • deletePublicMessage(message_id)
 *   • onPublicMessageReceived(handler)
 *   • onPublicMessageEdited(handler)
 *   • onPublicMessageDeleted(handler)
 *
 * Notes:
 *   • Cookie + server already keep last-room sticky; hook focuses on events.
 *   • Locale is handled higher up; no translations needed here.
 */
'use client';

import { useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub'; // 🧠 Central socket glue

export default function usePublicMessageEvents(public_conversation_id) {
  // 🛰️ Grab explicit public-* methods from the hub (see patch below)
  const {
    sendPublicMessage,
    editPublicMessage,
    deletePublicMessage,
    onPublicMessageReceived,
    onPublicMessageEdited,
    onPublicMessageDeleted
  } = useSocketHub();

  // 🚀 Send text message into this public room
  const send = useCallback(
    (message_text) => {
      if (!public_conversation_id || !message_text) return; // 🛡️ Guard
      sendPublicMessage(public_conversation_id, message_text);
    },
    [public_conversation_id, sendPublicMessage]
  );

  // ✏️ Edit a message by id
  const edit = useCallback(
    (message_id, new_text) => {
      if (!public_conversation_id || !message_id) return; // 🛡️ Guard
      editPublicMessage(public_conversation_id, message_id, new_text);
    },
    [public_conversation_id, editPublicMessage]
  );

  // 🗑️ Delete a message by id
  const remove = useCallback(
    (message_id) => {
      if (!public_conversation_id || !message_id) return; // 🛡️ Guard
      deletePublicMessage(public_conversation_id, message_id);
    },
    [public_conversation_id, deletePublicMessage]
  );

  // 👂 Filtered listeners that only fire for THIS room
  const onReceive = useCallback(
    (handler) =>
      onPublicMessageReceived((payload) => {
        if (payload.public_conversation_id === public_conversation_id) handler(payload);
      }),
    [public_conversation_id, onPublicMessageReceived]
  );

  const onEdited = useCallback(
    (handler) =>
      onPublicMessageEdited((payload) => {
        if (payload.public_conversation_id === public_conversation_id) handler(payload);
      }),
    [public_conversation_id, onPublicMessageEdited]
  );

  const onDeleted = useCallback(
    (handler) =>
      onPublicMessageDeleted((payload) => {
        if (payload.public_conversation_id === public_conversation_id) handler(payload);
      }),
    [public_conversation_id, onPublicMessageDeleted]
  );

  // 📦 Export the clean surface
  return {
    sendPublicMessage: send,
    editPublicMessage: edit,
    deletePublicMessage: remove,
    onPublicMessageReceived: onReceive,
    onPublicMessageEdited: onEdited,
    onPublicMessageDeleted: onDeleted
  };
}
