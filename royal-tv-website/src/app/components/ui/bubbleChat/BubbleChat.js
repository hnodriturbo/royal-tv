// 📄 src/app/BubbleChat.js
'use client';

import { BsChatDotsFill } from 'react-icons/bs';
import { useState, useEffect } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';
import { useSession } from 'next-auth/react';
import BubbleChatWindow from './BubbleChatWindow';

const BubbleChat = () => {
  const { emit, listen } = useSocketHub();
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const user_id = session?.user?.user_id;
  const name = session?.user?.name || 'Guest';
  const role = session?.user?.role || 'guest';

  useEffect(() => {
    const offReady = listen('support_room_ready', ({ conversation_id }) => {
      setConversationId(conversation_id);
      setOpen(true);
    });
    return offReady;
  }, [listen]);

  const openChat = () => {
    if (conversationId) return setOpen(true);
    emit('create_support_room', { user_id, name, role });
  };

  return (
    <>
      <div
        className="fixed bottom-8 left-8 z-50 cursor-pointer"
        onClick={openChat}
      >
        <div className="w-16 h-16 bg-blue-600 rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 transition">
          <BsChatDotsFill className="text-3xl text-white" />
        </div>
      </div>

      {open && conversationId && (
        <div className="fixed bottom-28 left-8 z-50">
          <BubbleChatWindow
            conversation_id={conversationId}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
};

export default BubbleChat;
