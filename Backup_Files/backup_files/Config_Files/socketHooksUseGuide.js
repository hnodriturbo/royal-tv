// 📁 src/app/hooks/socket/socketHooksGuide.js
/*
🧠 Socket Hooks Usage Guide
───────────────────────────

1️⃣ useSendMessage()
  const sendMessage = useSendMessage();
  sendMessage(conversation_id, message);

2️⃣ useSubscribeReceiveMessage(conversation_id, setMessages)
  useSubscribeReceiveMessage(conversation_id, setMessages);

3️⃣ useTypingIndicator(conversation_id)
  const { startTyping, subscribeTypingIndicator } = useTypingIndicator(conversation_id);
  useEffect(() => subscribeTypingIndicator(setOthersTyping), []);
  // use startTyping() inside textarea onChange

4️⃣ useJoinRoom(conversation_id, includeGlobal)
  useJoinRoom(conversation_id); // joins both GlobalUsers and convo room

5️⃣ useEditMessage()
  const editMessage = useEditMessage();
  editMessage(conversation_id, message_id, message);

6️⃣ useDeleteMessage()
  const deleteMessage = useDeleteMessage();
  deleteMessage(conversation_id, message_id);

7️⃣ useMarkMessagesRead()
  const markRead = useMarkMessagesRead();
  markRead(conversation_id);

8️⃣ useOnlineUsers(setOnlineUsers)
  useOnlineUsers(setOnlineUsers);

9️⃣ useRoomUsers(conversation_id, setRoomUsers)
  useRoomUsers(conversation_id, setRoomUsers);
*/
