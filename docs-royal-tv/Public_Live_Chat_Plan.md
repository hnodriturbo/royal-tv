# Public Live Chat — Master Plan (Checklist)

**Master Plan file :**  
https://github.com/hnodriturbo/royal-tv/blob/master/DOCS_FOR_VEF/Public_Live_Chat_Plan.md

**Updates markdown file :**  
https://github.com/hnodriturbo/royal-tv/blob/master/DOCS_FOR_VEF/UPDATES.md

This issue stays open until all issues related to this (steps 1–11) are done.

I update the two docs above as the **source of truth**.

> I keep the **full plan (with chapters)** in the repo. This comment is a quick checklist for tracking.

## Status Checklist (Issues → Branches)
- [x] **1) Scaffold Public Chat DB usage** — `feature/public-chat-db`
- [x] **2) Server: Public socket events** — `feature/public-socket-events`
- [ ] **3) Client socket hub: add public_* wrappers** — `feature/public-socket-hub`
- [ ] **4) Client hooks parity for public chat** — `feature/hooks-public-chat`
- [ ] **5) Widget UI (bottom-left)** — `feature/public-chat-widget-ui`
- [ ] **6) Admin online detector (reuse)** — `feature/admin-online`
- [ ] **7) AppProviders integration** — `feature/add-widget-to-appproviders`
- [ ] **8) AI bot endpoint** — `feature/public-ai-endpoint`
- [ ] **9) Glue logic (routing: AI ↔ live)** — `feature/public-chat-routing`
- [ ] **10) Polish: typing / unread / presence** — `feature/public-chat-polish`
- [ ] **11) QA & Docs** — `chore/public-chat-readme`

---

### Consolidated Tasks Checklist (quick view)

- **1) Scaffold Public Chat DB usage** — `feature/public-chat-db`  
  - [x] (Option A) **Schema**: Add `sender_is_bot Boolean @default(false)` to `PublicLiveChatMessage` and run db push.  
  - [ ] (Option B) **No schema change**: Tag bot via `sender_guest_id = 'bot'` and document.  
  - [x] Regenerate Prisma Client.

- **2) Server: Public socket events** — `feature/public-socket-events`  
  - [x] Create `publicRoomEvents.js` and `publicMessageEvents.js`.  
  - [ ] Prefix all `public_*` events: create/join/leave/send/edit/delete/mark_read/refresh.  
  - [ ] Register them in Socket.IO bootstrap.

- **3) Client socket hub: add `public_*` wrappers** — `feature/public-socket-hub`  
  - [ ] Emitters: `publicCreateRoom`, `publicJoinRoom`, `publicLeaveRoom`.  
  - [ ] Emitters: `publicSendMessage`, `publicEditMessage`, `publicDeleteMessage`, `publicMarkRead`, `publicRefreshMessages`.  
  - [ ] Listeners: `onPublicRoomReady`, `onPublicReceiveMessage`, `onPublicMessageEdited`, `onPublicMessageDeleted`, `onPublicMessagesRefreshed`.  
  - [ ] Pre-connect queue + cleanup on unmount.

- **4) Client hooks parity for public chat** — `feature/hooks-public-chat`  
  - [ ] `usePublicMessageEvents.js`, `usePublicRoomUsers.js`, `usePublicTypingIndicator.js`, `usePublicUnreadMessages.js`.  
  - [ ] Scope by `public_conversation_id`; reset on switch.

- **5) Widget UI (bottom-left)** — `feature/public-chat-widget-ui`  
  - [ ] Floating toggle + panel; ESC; focus trap.  
  - [ ] Minimal Tailwind layout; responsive to ~360px.  
  - [ ] Message list autoscroll + overflow handling.

- **6) Admin online detector (reuse)** — `feature/admin-online`  
  - [ ] Use `useIsAdminOnline` inside widget.  
  - [ ] Ensure `online_users_update` + `request_online_users` flow.  
  - [ ] Visible online/offline badge/state.

- **7) AppProviders integration** — `feature/add-widget-to-appproviders`  
  - [ ] Mount `<PublicLiveChatWidget />` globally in `AppProviders` → `AppContent`.  
  - [ ] Wire session/guest mode.

- **8) AI bot endpoint** — `feature/public-ai-endpoint`  
  - [ ] `POST /api/public-chatbot` → `{ text, guestId, subject }` → `{ text, ts }`.  
  - [ ] Logging + basic rate limit; safe errors.  
  - [ ] (Optional) Persist bot replies with `sender_is_bot` or `sender_is_admin`.

- **9) Glue logic (routing: AI ↔ live)** — `feature/public-chat-routing`  
  - [ ] Admin online + logged in → live `create_chat_room` + live hooks.  
  - [ ] Admin online + guest → `public_create_chat_room` + public hooks.  
  - [ ] Admin offline → call AI endpoint; (optional) persist to `Public*`.  
  - [ ] Seamless mode switches.

- **10) Polish** — `feature/public-chat-polish`  
  - [ ] Typing indicators; unread resets on focus/open.  
  - [ ] Consistent presence visuals.

- **11) Overview and succesful testing**
  - [ ] Smoke tests: guest AI, guest live, logged-in live.
  - [ ] Document architecture + event matrix + routing.
  - [ ] Screenshots/GIFs in `UPDATES.md`.

**Rules**  
- One issue ⇒ one branch ⇒ PR closes the issue.  
- I’ll log what I do in the files that are linked at the top.
