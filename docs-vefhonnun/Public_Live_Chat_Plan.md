# Public Live Chat Plan File

## Chapters

- [Public Live Chat Plan File](#public-live-chat-plan-file)
  - [Chapters](#chapters)
- [Public Live Chat — Project Plan (Issues Board: **To Do → In Progress → Done**)](#public-live-chat--project-plan-issues-board-to-do--in-progress--done)
  - [Workflow (Quick Guide)](#workflow-quick-guide)
  - [TO DO](#to-do)
    - [2) Server: Public socket events (mirror live)](#2-server-public-socket-events-mirror-live)
    - [3) Client socket hub: add `public_*` wrappers](#3-client-socket-hub-add-public_-wrappers)
    - [4) Client hooks parity for public chat](#4-client-hooks-parity-for-public-chat)
    - [5) Admin online detector (reuse)](#5-admin-online-detector-reuse)
    - [6) AI bot endpoint](#6-ai-bot-endpoint)
    - [7) Widget UI (bottom-left)](#7-widget-ui-bottom-left)
    - [8) Glue logic (routing: AI ↔ live)](#8-glue-logic-routing-ai--live)
    - [9) AppProviders integration](#9-appproviders-integration)
    - [10) Polish: typing / unread / presence parity](#10-polish-typing--unread--presence-parity)
    - [11) QA \& Docs](#11-qa--docs)
  - [IN PROGRESS](#in-progress)
    - [1) Scaffold Public Chat DB usage](#1-scaffold-public-chat-db-usage)
  - [DONE](#done)
  - [Mini-Guide: Issues / Branches / PRs](#mini-guide-issues--branches--prs)
- [From up-to-date master](#from-up-to-date-master)


# Public Live Chat — Project Plan (Issues Board: **To Do → In Progress → Done**)

> Every item here is an **Issue** with a matching **Branch** that I create for each issue and merge that branch when finished. I move issues across columns as I work.

---

<a id="Workflow"></a>

## Workflow (Quick Guide)

- **One issue ⇒ one branch** (exact branch names below).
- I will try to keep commits small and precise.
- Open a Pull Request that **closes** the issue.
- Some items depend on another being finished (like some testing but I will update the md files on a seperate working tree)

---

<a id="DoD"></a>

**Definition of Done (global)**

- ✅ All items under **“What the finished part should do”** are true.
- ✅ I’ve tested locally and noted what I did in `UPDATES.md`.
- ✅ No conflicts to existing live chat.

---

If I need to use labels I will use these.
**Labels I use:** `public-chat`, `socket`, `db`, `ui`, `ai`

---

<a id="TO-DO"></a>

## TO DO

> I move an issue to **In Progress** the moment I create its branch.

---

<a id="2-Server-Public-socket-events"></a>

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

**What the finished part should do**
- A test client can open a **public room**, send/receive messages, and request recent history.
- Server emits the correct `public_*` events and persists to `PublicLiveChat*` tables.
- Basic validation prevents obviously invalid payloads (missing guest id, etc.) without crashing the server.

---

<a id="3-Client-socket-hub"></a>

### 3) Client socket hub: add `public_*` wrappers
**Branch:** `feature/public-socket-hub`

**Intent:** Extend `useSocketHub.js` with public variants using the same guarded/queued style as live.

**Tasks**
- [ ] Add: `publicCreateRoom`, `publicJoinRoom`, `publicLeaveRoom`.
- [ ] Add: `publicSendMessage`, `publicEditMessage`, `publicDeleteMessage`, `publicMarkRead`, `publicRefreshMessages`.
- [ ] Add listeners: `onPublicRoomReady`, `onPublicReceiveMessage`, `onPublicMessageEdited`, `onPublicMessageDeleted`, `onPublicMessagesRefreshed`.
- [ ] Ensure **pre-connect queuing** and **cleanup on unmount** match live behavior.

**What the finished part should do**
- Events emitted **before connect** are queued and delivered after the socket connects.
- All public listeners receive events reliably whether registered before or after connection.
- Unmount removes public listeners to avoid leaks/duplicates.

---

<a id="4-Client-hooks-parity"></a>

### 4) Client hooks parity for public chat
**Branch:** `feature/hooks-public-chat`

**Intent:** Thin wrappers mirroring my existing live hooks but calling `public_*` hub methods.

**Tasks**
- [ ] `usePublicMessageEvents.js`
- [ ] `usePublicRoomUsers.js`
- [ ] `usePublicTypingIndicator.js`
- [ ] `usePublicUnreadMessages.js`
- [ ] Each hook scopes updates to the current `public_conversation_id` only.

**What the finished part should do**
- Hooks update only the targeted **public** conversation.
- No cross-room bleed; switching conversations resets listeners/state appropriately.
- Typing/unread/participants hooks track only their active conversation.

---

<a id="5-Admin-online-detector"></a>

### 5) Admin online detector (reuse)
**Branch:** `feature/admin-online`

**Intent:** Reuse `useIsAdminOnline` to drive AI vs. live modes in the widget.

**Tasks**
- [ ] Mount `useIsAdminOnline` in the chat widget.
- [ ] Ensure server emits `online_users_update`; implement `request_online_users` flow if not already.
- [ ] Add a visual badge/state in the widget.

**What the finished part should do**
- The widget shows a clear “admin online/offline” state.
- State changes within ~2 seconds after admin presence toggles.
- The state is consumable by routing logic to flip AI/live modes.

---

<a id="6-AI-bot-endpoint"></a>

### 6) AI bot endpoint
**Branch:** `feature/public-ai-endpoint`

**Intent:** Provide `/api/public-chatbot` for AI replies (stub now; real model later).

**Tasks**
- [ ] Create `POST /api/public-chatbot` → `{ text, guestId, subject }` → `{ text, ts }`.
- [ ] Log requests (rate limit optional) and handle errors.
- [ ] (Optional) Persist Q&A to `PublicLiveChatMessage` (mark bot via `sender_is_bot` or `sender_is_admin = true`).

**What the finished part should do**
- The endpoint returns a reasonable text reply for valid input and a controlled error for invalid input.
- (If enabled) Bot replies are saved with a clear bot/admin marker.
- Failures don’t crash the API route; logs are helpful for debugging.

---

<a id="7-Widget-UI"></a>

### 7) Widget UI (bottom-left)
**Branch:** `feature/public-chat-widget-ui`

**Intent:** Floating, always-available panel with input, history, and status.

**Tasks**
- [ ] Floating toggle button (bottom-left) + panel; ESC closes; focus trap.
- [ ] Minimal Tailwind layout (no CLS), responsive down to ~360px.
- [ ] Message list with autoscroll + overflow handling.

**What the finished part should do**
- Toggle opens/closes the panel; focus is trapped while open; ESC closes.
- Layout remains stable across viewport sizes (including ~360px).
- Message view autoscrolls to the latest message when new items arrive.

---

<a id="8-Glue-logic-AI-live"></a>

### 8) Glue logic (routing: AI ↔ live)
**Branch:** `feature/public-chat-routing`

**Intent:** Switch behavior based on admin presence and login state.

**Tasks**
- [ ] If **admin online** & **logged in** → ensure/await `create_chat_room` (live) then use live hooks.
- [ ] If **admin online** & **guest** → ensure/await `public_create_chat_room` then use public hooks.
- [ ] If **admin offline** → call `/api/public-chatbot`; (optional) persist to `Public*`.
- [ ] Mode switches seamlessly when admin presence changes.

**What the finished part should do**
- While chatting, flipping admin presence switches AI↔live without losing the conversation thread.
- Logged-in users prefer live chat when admin is online; guests use public chat; offline falls back to AI.
- UI reflects the current mode and continues sending/receiving accordingly.

---

<a id="9-AppProviders-integration"></a>

### 9) AppProviders integration
**Branch:** `feature/add-widget-to-appproviders`

**Intent:** Mount widget globally (near `WhatsAppLogo`) so it’s available on every page.

**Tasks**
- [ ] Import and mount `<PublicLiveChatWidget />` in `AppProviders` → `AppContent`.
- [ ] Pass `session`/`user` if available; otherwise guest mode.

**What the finished part should do**
- The widget is visible on all pages/routes.
- Existing socket features (e.g., LogPageView) keep working unchanged.
- Session/guest mode is detected and forwarded to the widget.

---

<a id="10-Polish"></a>

### 10) Polish: typing / unread / presence parity
**Branch:** `feature/public-chat-polish`

**Intent:** Match live behaviors in public mode where sensible.

**Tasks**
- [ ] Hook up typing indicator in live-user mode; mirror for public if desired.
- [ ] Unread counts reset on focus/open.
- [ ] Presence indicators render consistently.

**What the finished part should do**
- Typing indicator appears correctly when the agent types.
- Unread counts clear when the widget gains focus or the conversation is opened.
- Presence visuals look consistent across the app.

---

<a id="11-Overview-of-the-project"></a>

### 11) QA & Docs
**Branch:** `Public_Live_Chat_Plan/overview`

**Intent:** Make sure everything works cleanly.

**Tasks**
- [ ] Smoke test: guest AI chat, guest live chat, logged-in live chat.
- [ ] Document architecture + event matrix + routing logic.
- [ ] Add screenshots/GIFs to UPDATES.md file.

**What the finished part should do**
- All three chat paths work end-to-end locally.
- UPDATES.md clearly explains setup, data flow, and how routing switches modes.
- Screens/GIFs show the widget behavior and flow.

---

<a id="IN-PROGRESS"></a>

## IN PROGRESS

<a id="1-Scaffold-Public-Chat-DB-usage"></a>

### 1) Scaffold Public Chat DB usage
**Branch:** `feature/public-chat-db`

**Intent:** Prepare the DB layer for public chat.

**Tasks**
- [x] (Option A) **Schema**: Add `sender_is_bot Boolean @default(false)` to `PublicLiveChatMessage` and run migration.
- [ ] (Option B) **No schema change**: Tag bot via `sender_guest_id = 'bot'` and document.
- [x] Regenerate Prisma Client.
- [ ] Minimal **data access helpers** for `PublicLiveChatConversation` and `PublicLiveChatMessage` (read/write functions used by routes/events).

**What the finished part should do**
- I have pushed the new database to the prisma client and generate again.
- The chosen bot-marking approach works
- Helpers expose simple read/write calls used by sockets/APIs.

---

<a id="DONE"></a>

## DONE

> I move issues here after PR merge and link the PR.

- *None yet*

---

<a id="Mini-Guide"></a>

## Mini-Guide: Issues / Branches / PRs

**Create an issue and its branch**
```bash
# From up-to-date master
git fetch origin
git checkout master && git pull
git checkout -b feature/public-socket-events
