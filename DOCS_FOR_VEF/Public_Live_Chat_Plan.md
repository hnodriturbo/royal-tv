# Public Live Chat — Project Plan (Issues Board: **To Do → In Progress → Done**)

> **Voice:** first-person (my plan, my board). Every item here is an **Issue** with a matching **Branch**. I move issues across columns as I work.

---

## Workflow (Quick Guide)

- **One issue ⇒ one branch** (exact branch names below).
- Keep commits small and focused. Open a PR that **closes** the issue.
- If something depends on another item, I mark it **blocked** until the dependency is done.

**Definition of Done (global)**

- ✅ All success criteria for that issue met.
- ✅ Unit/smoke tests (where applicable) pass locally.
- ✅ No regressions to existing live chat.

**Labels I use:** `public-chat`, `socket`, `db`, `ui`, `ai`

---

## TO DO

> I move an issue to **In Progress** the moment I create its branch.

### 2) Server: Public socket events (mirror live)
**Branch:** `feature/public-socket-events`

**Intent:** Mirror live chat events for public rooms using `PublicLiveChat*` tables.

**Tasks**
- [ ] Create `publicRoomEvents.js` and `publicMessageEvents.js` (copy structure from live `roomEvents.js` / `messageEvents.js`).
- [ ] Prefix event names with `public_*`:
  - [ ] `public_create_chat_room`, `public_join_room`, `public_leave_room`
  - [ ] `public_send_message`, `public_edit_message`, `public_delete_message`
  - [ ] `public_mark_read`, `public_refresh_messages`
- [ ] Wire event handlers into the Socket.IO server bootstrap.
- [ ] Add minimal validation (guest id; rate limits TODO if needed).

**Success Criteria** *(I’ll log my test steps/results in `UPDATES.md`)*  
- [ ] Using a test client, I can create a **public room**, exchange messages, and refresh history without errors.

---

### 3) Client socket hub: add `public_*` wrappers
**Branch:** `feature/public-socket-hub`

**Intent:** Extend `useSocketHub.js` with public variants using the same guarded/queued style as live.

**Tasks**
- [ ] Add: `publicCreateRoom`, `publicJoinRoom`, `publicLeaveRoom`.
- [ ] Add: `publicSendMessage`, `publicEditMessage`, `publicDeleteMessage`, `publicMarkRead`, `publicRefreshMessages`.
- [ ] Add listeners: `onPublicRoomReady`, `onPublicReceiveMessage`, `onPublicMessageEdited`, `onPublicMessageDeleted`, `onPublicMessagesRefreshed`.
- [ ] Ensure **pre-connect queuing** and **cleanup on unmount** match live behavior.

**Success Criteria** *(I’ll log my test steps/results in `UPDATES.md`)*  
- [ ] Listeners registered **before or after** connect receive events; queued emits flush after connect; teardown removes listeners cleanly.

---

### 4) Client hooks parity for public chat
**Branch:** `feature/hooks-public-chat`

**Intent:** Thin wrappers mirroring my existing live hooks but calling `public_*` hub methods.

**Tasks**
- [ ] `usePublicMessageEvents.js`
- [ ] `usePublicRoomUsers.js`
- [ ] `usePublicTypingIndicator.js`
- [ ] `usePublicUnreadMessages.js`
- [ ] Each hook scopes updates to the current `public_conversation_id` only.

**Success Criteria** *(I’ll log my test steps/results in `UPDATES.md`)*  
- [ ] Events and state updates affect only the active public conversation; no cross-room leaks in manual tests.

---

### 5) Admin online detector (reuse)
**Branch:** `feature/admin-online`

**Intent:** Reuse `useIsAdminOnline` to drive AI vs. live modes in the widget.

**Tasks**
- [ ] Mount `useIsAdminOnline` in the chat widget.
- [ ] Ensure server emits `online_users_update`; implement `request_online_users` flow if not already.
- [ ] Add a visual badge/state in the widget.

**Success Criteria** *(I’ll log my test steps/results in `UPDATES.md`)*  
- [ ] Toggling admin presence updates the badge within **≤ 2s** in the widget.

---

### 6) AI bot endpoint
**Branch:** `feature/public-ai-endpoint`

**Intent:** Provide `/api/public-chatbot` for AI replies (stub now; real model later).

**Tasks**
- [ ] Create `POST /api/public-chatbot` → `{ text, guestId, subject }` → `{ text, ts }`.
- [ ] Log requests (rate limit optional) and handle errors.
- [ ] (Optional) Persist Q&A to `PublicLiveChatMessage` (mark bot via `sender_is_bot` or `sender_is_admin = true`).

**Success Criteria** *(I’ll log my test steps/results in `UPDATES.md`)*  
- [ ] Calling from the widget returns a sensible response; error cases return controlled error payloads.

---

### 7) Widget UI (bottom-left)
**Branch:** `feature/public-chat-widget-ui`

**Intent:** Floating, always-available panel with input, history, and status.

**Tasks**
- [ ] Floating toggle button (bottom-left) + panel; ESC closes; focus trap.
- [ ] Minimal Tailwind layout (no CLS), responsive down to ~360px.
- [ ] Message list with autoscroll + overflow handling.

**Success Criteria** *(I’ll log my test steps/results in `UPDATES.md`)*  
- [ ] Toggle works reliably; layout stays stable; message list autoscrolls to the latest message.

---

### 8) Glue logic (routing: AI ↔ live)
**Branch:** `feature/public-chat-routing`

**Intent:** Switch behavior based on admin presence and login state.

**Tasks**
- [ ] If **admin online** & **logged in** → ensure/await `create_chat_room` (live) then use live hooks.
- [ ] If **admin online** & **guest** → ensure/await `public_create_chat_room` then use public hooks.
- [ ] If **admin offline** → call `/api/public-chatbot`; (optional) persist to `Public*`.
- [ ] Mode switches seamlessly when admin presence changes.

**Success Criteria** *(I’ll log my test steps/results in `UPDATES.md`)*  
- [ ] Flipping presence mid-chat preserves conversation and switches mode without message loss or UI glitches.

---

### 9) AppProviders integration
**Branch:** `feature/add-widget-to-appproviders`

**Intent:** Mount widget globally (near `WhatsAppLogo`) so it’s available on every page.

**Tasks**
- [ ] Import and mount `<PublicLiveChatWidget />` in `AppProviders` → `AppContent`.
- [ ] Pass `session`/`user` if available; otherwise guest mode.

**Success Criteria** *(I’ll log my test steps/results in `UPDATES.md`)*  
- [ ] Widget appears across routes; existing socket features remain unaffected (manual navigation test).

---

### 10) Polish: typing / unread / presence parity
**Branch:** `feature/public-chat-polish`

**Intent:** Match live behaviors in public mode where sensible.

**Tasks**
- [ ] Hook up typing indicator in live-user mode; mirror for public if desired.
- [ ] Unread counts reset on focus/open.
- [ ] Presence indicators render consistently.

**Success Criteria** *(I’ll log my test steps/results in `UPDATES.md`)*  
- [ ] Typing indicator shows as expected; unread counters reset on focus; presence renders consistently across views.

---

### 11) QA & Docs
**Branch:** `chore/public-chat-readme`

**Intent:** Stabilize and document the system.

**Tasks**
- [ ] Smoke test: guest AI chat, guest live chat, logged-in live chat.
- [ ] Document architecture + event matrix + routing logic.
- [ ] Add screenshots/GIFs to README.

**Success Criteria** *(I’ll log my test steps/results in `UPDATES.md`)*  
- [ ] README explains setup, event names, data flow, and mode switching clearly; smoke tests pass.

---

## IN PROGRESS

### 1) Scaffold Public Chat DB usage
**Branch:** `feature/public-chat-db`

**Intent:** Prepare the DB layer for public chat.

**Tasks**
- [ ] (Option A) **Schema**: Add `sender_is_bot Boolean @default(false)` to `PublicLiveChatMessage` and run migration.
- [ ] (Option B) **No schema change**: Tag bot via `sender_guest_id = 'bot'` and document.
- [ ] Regenerate Prisma Client.
- [ ] Minimal **data access helpers** for `PublicLiveChatConversation` and `PublicLiveChatMessage` (read/write functions used by routes/events).

**Success Criteria** *(I’ll log my test steps/results in `UPDATES.md`)*  
- [ ] I can create/read a Public conversation and messages via Prisma (manual script or route) with predictable results.

---

## DONE

> I move issues here after PR merge and link the PR.

- *None yet*

---

## Mini-Guide: Issues / Branches / PRs

**Create an issue and its branch**
```bash
# From up-to-date master
git fetch origin
git checkout master && git pull
git checkout -b feature/public-socket-events
