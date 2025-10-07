# Royal TV — Public Live Chat (Concise Report)

## Chapter 1 — Purpose (Site + Public Chat)

* **Site:** IPTV storefront + user portal + admin. Buy packages, manage account, get support.
* **Stack:** Next.js 15, React 19, Next‑Auth v5, Prisma/PostgreSQL, Socket.IO, Tailwind v4, next‑intl v3, Blockonomics.
* **Public Live Chat:** real‑time guest/user rooms for pre‑sale/help; lobby, rooms, messages, presence, i18n.

---

## Chapter 2 — Data Model (Prisma)

```prisma
model PublicLiveChatConversation {
  public_conversation_id String @id @default(uuid()) @db.Uuid
  owner_id               String? @db.Uuid   // registered owner (optional)
  owner_guest_id         String?           // guest owner (optional)
  subject                String?
  read                   Boolean @default(false)
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  messages PublicLiveChatMessage[]
  owner    User? @relation("UserPublicConversations", fields: [owner_id], references: [user_id], onDelete: Cascade)

  @@index([updatedAt])
  @@index([owner_id])
  @@index([owner_guest_id])
}

model PublicLiveChatMessage {
  public_message_id      String @id @default(uuid()) @db.Uuid
  public_conversation_id String @db.Uuid
  sender_user_id         String? @db.Uuid
  sender_guest_id        String?
  sender_is_admin        Boolean @default(false)
  body                   String
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  conversation PublicLiveChatConversation @relation(fields: [public_conversation_id], references: [public_conversation_id], onDelete: Cascade)

  @@index([public_conversation_id])
  @@index([sender_user_id])
  @@index([sender_guest_id])
}
```

---

## Chapter 3 — Server (Socket) — Files & Events

**Files (all `.js`):**

* `socket-server/events/publicRoomEvents.js` — lobby/room join & leave, presence emits.
* `socket-server/events/publicMessageEvents.js` — create/update/delete/list messages; sender/admin guards.
* `socket-server/index.js` — Socket.IO init, locale in handshake (`auth.locale` → `socket.data.currentLocale`), presence arrays, room joins.

**Events:**

* **Lobby:** `public_lobby:join`, `public_lobby:leave` → emit `public_presence:update`.
* **Rooms:** `public_room:join`, `public_room:leave`.
* **Messages:** `public_message:create`, `public_message:update`, `public_message:delete`, `public_message:list`.
* **Cookies (client‑triggered):** `public_cookie:set_last_room`, `public_cookie:clear_last_room`.
* **Planned:** `public_unread:count`, `public_unread:updated`.

---

## Chapter 4 — Client (Hooks & UI) — Files & Purpose

**Files (all `.js`):**

* `src/hooks/useSocketHub.js` — `'use client'`; connect/disconnect; **join/leave lobby & room**; **send/edit/delete/list messages**; **cookie helpers**; sends locale in handshake; SSR‑safe guards.
* `src/components/publicChat/*` — conversation list, message list, composer; Tailwind v4; `useT()` for text.

**Cookie helpers in hook:**

* `setLastPublicRoomCookie(public_conversation_id, { cookieName='public_last_conversation_id', maxAgeDays=14 })`.
* `clearLastPublicRoomCookie(cookieName)`.

---

## Chapter 5 — REST & Ops (plus tiny TODO)

**REST:**

* `POST /api/publicLiveChat/move-to-private/route.js` — move public convo into private support.

**Identity & i18n:**

* Cookies: `public_identity_id` (guest), `public_last_conversation_id` (resume last room).
* i18n bundles: `messages/en.json`, `messages/is.json` under `common`, `app`, `socket.{ui,hooks}`, `components`. (Never translate `logger.*`.)

**Tiny TODO (next):**

* Implement `public_unread:count` + UI badges; add rate‑limits & input validation; sanitize message body.
* Fix presence removal to **reassign after `filter()`**; debounce presence emits.
* Wire **move‑to‑private** in UI; add tests; index tuning; optional console‑log gating before prod.
