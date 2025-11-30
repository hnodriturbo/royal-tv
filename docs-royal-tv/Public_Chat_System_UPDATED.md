# Public Chat System - Complete Implementation Guide

## 🎯 Overview

The public chat system enables real-time communication between guests/users and admin(s). It features:

- **Guest/User Widget**: Single conversation window
- **Admin Widget**: Multiple simultaneous conversation windows (5+)
- **Automatic room creation**: Room created immediately when widget opens
- **Auto-join admins**: All online admins automatically join new conversations
- **Real-time notifications**: Admins get instant notifications of new messages and conversations

---

## 🏗️ Architecture

### Flow Diagram

```
Guest Opens Widget
      ↓
Room Created Immediately (not on first message)
      ↓
All Online Admins Auto-Join Room
      ↓
Admin Gets Notification (new_conversation event)
      ↓
Admin Opens Window for That Conversation
      ↓
Messages Flow Real-time Between Guest & Admin
```

### Key Design Decisions

1. **No Lobby System** - Removed complexity; rooms created directly
2. **Immediate Room Creation** - Widget open → room ready (no lost first messages)
3. **Auto-Admin Join** - Admins automatically join all new rooms
4. **Multi-Window Admin UI** - Admin can handle 5+ conversations simultaneously
5. **Horizontal Stacking** - Chat windows appear side-by-side (not overlapping)

---

## 📦 Components

### For Guests/Users: `PublicLiveChatWidget`

**Location**: `src/components/reusableUI/socket/PublicLiveChatWidget.js`

**Usage**:
```jsx
import PublicLiveChatWidget from '@/components/reusableUI/socket/PublicLiveChatWidget';

// In your layout or page
<PublicLiveChatWidget />
```

**Features**:
- Single chat window in bottom-left corner
- Admin online/offline indicator
- Message history persistence (cookies)
- Typing indicators
- Unread count when minimized
- Auto-reconnect on page refresh

---

### For Admin: `AdminPublicChatWidget`

**Location**: `src/components/reusableUI/socket/AdminPublicChatWidget.js`

**Usage**:
```jsx
import AdminPublicChatWidget from '@/components/reusableUI/socket/AdminPublicChatWidget';

// In admin dashboard or layout
<AdminPublicChatWidget />
```

**Features**:
- Main widget button (shows total unread across all conversations)
- Conversation list panel (click to open/maximize windows)
- Multiple chat windows (horizontally stacked)
- Per-conversation unread counts
- Individual minimize/close controls per window
- Real-time notifications for new conversations

**Layout**:
```
[👑 Admin Chat (3)]  [Conv1]  [Conv2]  [Conv3]
     ↑ Main           ↑ Chat windows stack horizontally
     Widget           (320px wide each, 16px gap)
```

---

## 🔧 Server-Side Events

### Room Events (`publicRoomEvents.js`)

#### Incoming:
- `public_room:create` - Create new conversation
- `public_room:join` - Join existing room
- `public_room:leave` - Leave room

#### Outgoing:
- `public_room:ready` - Room created and ready (to creator)
- `public_room:created` - Broadcast to all in room
- `public_room:new_conversation` - Notify all admins (NEW)
- `public_presence:update` - User list updates

### Message Events (`publicMessageEvents.js`)

#### Incoming:
- `public_message:create` - Send message
- `public_message:edit` - Edit message
- `public_message:delete` - Delete message
- `public_message:refresh` - Get message history
- `public_message:mark_read` - Mark messages as read
- `public_message:typing` - Typing indicator

#### Outgoing:
- `public_message:created` - New message broadcast
- `public_message:edited` - Message edited
- `public_message:deleted` - Message deleted
- `public_message:refreshed` - Message list
- `public_message:marked_read` - Confirmation
- `public_message:user_typing` - Typing status
- `public_message:unread_user` - Unread count for user
- `public_message:unread_admin` - Global unread for admin (NEW)
- `public_message:new_unread_notification` - Instant admin notification (NEW)

---

## 🪝 Client Hooks

### `usePublicLiveChat` (Aggregator Hook)

Combines all dedicated hooks into one clean API.

**Import**:
```javascript
import usePublicLiveChat from '@/hooks/socket/usePublicLiveChat';
```

**API**:
```javascript
const chat = usePublicLiveChat();

// Room Management
chat.createPublicRoom({ subject: 'Public Chat' });
chat.joinPublicRoom(roomId);
chat.leavePublicRoom(roomId);

// Messages
chat.sendPublicMessage(roomId, message);
chat.editPublicMessage(messageId, newText);
chat.deletePublicMessage(messageId);
chat.refreshPublicMessages(roomId, limit);
chat.markPublicMessagesRead(roomId);

// Typing
chat.sendPublicTyping(roomId, isTyping);

// Listeners (return cleanup functions)
chat.setupRoomReadyListener({ onRoomReady: (roomId) => {} });
chat.setupMessageListeners({
  activeRoomId,
  onMessageCreated,
  onMessageEdited,
  onMessageDeleted,
  onMessagesRefreshed
});
chat.setupTypingListener({ activeRoomId, onTypingUpdate });
chat.setupUnreadListener({ activeRoomId, onUnreadUpdate });

// Admin-Only
chat.onNewConversation((payload) => {
  // { public_conversation_id, subject, owner_name, createdAt }
});
chat.onPublicUnreadAdmin((payload) => {
  // { total: number }
});
```

---

## 🔄 Key Workflows

### Guest Opens Widget & Sends First Message

1. Guest clicks widget button
2. **Widget opens → Room created immediately** (not on first message)
3. All online admins auto-join the room
4. Admin receives `public_room:new_conversation` event
5. Admin's widget shows notification badge
6. Guest types first message → sends instantly (room already ready)
7. Admin receives message notification
8. Admin clicks conversation in list → window opens
9. Real-time chat begins

### Admin Handles Multiple Conversations

1. Admin receives `public_room:new_conversation` for Conv1
2. Admin opens window for Conv1 (positioned at 216px from left)
3. New conversation Conv2 arrives
4. Admin opens Conv2 window (positioned at 552px from left)
5. Admin can type in both windows simultaneously
6. Minimize any window → unread count appears
7. Click conversation in list → window maximizes
8. Close window → leaves room, removes from list

### Unread Count System

**For Users/Guests**:
- Count = Admin messages not yet read
- Shown when widget minimized
- Reset when widget opened and `markPublicMessagesRead` called

**For Admin**:
- **Per-conversation**: User/guest messages not read in that room
- **Global total**: All unread messages across all conversations
- Shown on main widget button
- Real-time updates via `public_message:unread_admin`

---

## 🍪 Cookie Persistence

### Cookies Used:
- `public_identity_id` - Stable guest identity (set by middleware)
- `public_last_conversation_id` - Last active room
- `public_chat_open` - Whether widget was open

### Behavior:
- Guest opens widget → cookie saved
- Guest refreshes page → widget reopens, rejoins room
- Admin refreshes → all conversations restored (if implemented)

---

## 🐛 Debugging

### Common Issues:

**1. Admin doesn't receive messages**
- ✅ Check admin is in 'admins' room: `io.in('admins').fetchSockets()`
- ✅ Verify auto-join logic in `publicRoomEvents.js` line ~147
- ✅ Check admin role in socket.userData

**2. First message gets lost**
- ✅ Verify room created on widget open (not on first message)
- ✅ Check `bootstrappedRef` logic in widget
- ✅ Ensure `public_room:ready` listener exists

**3. Unread counts not updating**
- ✅ Verify `broadcastUnreadCounts` called after message create
- ✅ Check admin listening to `public_message:unread_admin`
- ✅ Ensure `readAt` field updated in database

**4. Multiple windows overlap**
- ✅ Check `getWindowPosition` calculation
- ✅ Verify `WIDGET_WIDTH` and `WIDGET_SPACING` constants
- ✅ Ensure `position: absolute` with correct `left` value

### Logging:
All server events log with prefixes:
- `[Public Room]` - Room operations
- `[Public Messages]` - Message operations
- `[Admin]` - Admin-specific events

---

## 🚀 Deployment Checklist

- [ ] Deploy server code (`publicRoomEvents.js`, `publicMessageEvents.js`)
- [ ] Deploy client widgets (`PublicLiveChatWidget`, `AdminPublicChatWidget`)
- [ ] Update Socket.IO hooks (`useSocketHub`, `usePublicLiveChat`)
- [ ] Test guest → admin flow
- [ ] Test multiple simultaneous conversations (admin)
- [ ] Test page refresh (cookie persistence)
- [ ] Test unread notifications
- [ ] Verify admin auto-join on room creation

---

## 📊 Database Schema

### `PublicLiveChatConversation`
```prisma
model PublicLiveChatConversation {
  public_conversation_id String   @id @default(uuid())
  subject                String?
  owner_user_id          String?  // If authenticated user
  owner_guest_id         String?  // If guest
  status                 String   @default("active")
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  
  messages PublicLiveChatMessage[]
  
  @@index([owner_user_id])
  @@index([owner_guest_id])
}
```

### `PublicLiveChatMessage`
```prisma
model PublicLiveChatMessage {
  public_message_id      String   @id @default(uuid())
  public_conversation_id String
  message                String
  sender_user_id         String?  // If authenticated
  sender_guest_id        String?  // If guest
  sender_is_admin        Boolean  @default(false)
  sender_is_bot          Boolean  @default(false)
  readAt                 DateTime?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  
  conversation PublicLiveChatConversation @relation(fields: [public_conversation_id], references: [public_conversation_id], onDelete: Cascade)
  user         User?                      @relation(fields: [sender_user_id], references: [user_id])
  
  @@index([public_conversation_id])
  @@index([sender_user_id])
  @@index([readAt])
}
```

---

## 🎨 Styling Customization

### Guest Widget Colors:
- Header: `from-slate-900 to-slate-700`
- Send button: `bg-slate-900`
- User messages: `from-slate-700 to-slate-900`

### Admin Widget Colors:
- Header: `from-purple-900 to-purple-700`
- Send button: `bg-purple-900`
- Admin messages: `from-purple-700 to-purple-900`

### Layout Constants (in `AdminPublicChatWidget.js`):
```javascript
const WIDGET_WIDTH = 320;      // Width of each chat window
const WIDGET_SPACING = 16;     // Gap between windows
const MAIN_BUTTON_WIDTH = 200; // Main widget button width
```

---

## 🔮 Future Enhancements

- [ ] Rich text / markdown support
- [ ] File/image uploads
- [ ] Emoji picker
- [ ] Message reactions
- [ ] Conversation search/filter
- [ ] Message history export
- [ ] Conversation assignment (specific admin)
- [ ] Auto-responses / bot messages
- [ ] Conversation tagging/categorization
- [ ] Admin notes (internal, not visible to guest)

---

## 📚 Related Files

**Components**:
- `src/components/reusableUI/socket/PublicLiveChatWidget.js`
- `src/components/reusableUI/socket/AdminPublicChatWidget.js`

**Hooks**:
- `src/hooks/socket/usePublicLiveChat.js`
- `src/hooks/socket/usePublicRoomUsers.js`
- `src/hooks/socket/usePublicMessageEvents.js`
- `src/hooks/socket/usePublicTypingIndicator.js`
- `src/hooks/socket/usePublicUnreadMessages.js`
- `src/hooks/socket/useSocketHub.js`

**Server**:
- `src/server/publicRoomEvents.js`
- `src/server/publicMessageEvents.js`
- `src/server/cookieEvents.js`
- `src/server/index.js`

**Database**:
- `prisma/schema.prisma` (PublicLiveChatConversation, PublicLiveChatMessage)

---

✅ **System Status**: Fully implemented and ready for testing
