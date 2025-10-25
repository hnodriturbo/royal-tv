# Royal TV — Public Live Chat (Stutt skýrsla til kennara)

**Ég er að skila stuttri, fimm kafla skýrslu sem dregur saman Royal TV og vinnuna við Public Live Chat.**

## Chapter Block
- [Royal TV — Public Live Chat (Stutt skýrsla til kennara)](#royal-tv--public-live-chat-stutt-skýrsla-til-kennara)
  - [Chapter Block](#chapter-block)
  - [ Kafli 1 — Tilgangur (Síðan + Public Live Chat)](#-kafli-1--tilgangur-síðan--public-live-chat)
  - [ Kafli 2 — Data Model (Prisma)](#-kafli-2--data-model-prisma)
  - [ Kafli 3 — Server (Socket) — Skrár \& Events](#-kafli-3--server-socket--skrár--events)
  - [ Kafli 4 — Client (Hooks \& UI) — Skrár \& Tilgangur](#-kafli-4--client-hooks--ui--skrár--tilgangur)
  - [ Kafli 5 — REST \& Ops (plus tiny TODO)](#-kafli-5--rest--ops-plus-tiny-todo)

---

## <a id="is-ch1"></a> Kafli 1 — Tilgangur (Síðan + Public Live Chat)
- **Site:** IPTV verslun + notenda-gátt + admin. Kaupa pakka, sjá yfirlit, fá aðstoð.
- **Stack:** Next.js 15, React 19, Next-Auth v5, Prisma/PostgreSQL, Socket.IO, Tailwind v4, next-intl v3, Blockonomics.
- **Public Live Chat:** rauntíma gest/notanda herbergi fyrir fyrirspurnir; lobby, rooms, messages, presence, i18n.

---

## <a id="is-ch2"></a> Kafli 2 — Data Model (Prisma)
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

## <a id="is-ch3"></a> Kafli 3 — Server (Socket) — Skrár & Events
**Files (allar `.js`):**
- `socket-server/events/publicRoomEvents.js` — lobby/room join & leave, presence emits.
- `socket-server/events/publicMessageEvents.js` — create/update/delete/list messages; sender/admin guards.
- `socket-server/index.js` — Socket.IO init, locale í handshake (`auth.locale` → `socket.data.currentLocale`), presence arrays, room joins.

**Events:**
- **Lobby:** `public_lobby:join`, `public_lobby:leave` → emit `public_presence:update`.
- **Rooms:** `public_room:join`, `public_room:leave`.
- **Messages:** `public_message:create`, `public_message:update`, `public_message:delete`, `public_message:list`.
- **Cookies (client-triggered):** `public_cookie:set_last_room`, `public_cookie:clear_last_room`.
- **Planned:** `public_unread:count`, `public_unread:updated`.

---

## <a id="is-ch4"></a> Kafli 4 — Client (Hooks & UI) — Skrár & Tilgangur
**Files (allar `.js`):**
- `src/hooks/useSocketHub.js` — `'use client'`; connect/disconnect; **join/leave lobby & room**; **send/edit/delete/list messages**; **cookie helpers**; sendir locale í handshake; SSR-safe varnir.
- `src/components/publicChat/*` — conversation list, message list, composer; Tailwind v4; `useT()` fyrir texta.

**Cookie helpers í hook:**
- `setLastPublicRoomCookie(public_conversation_id, { cookieName='public_last_conversation_id', maxAgeDays=14 })`.
- `clearLastPublicRoomCookie(cookieName)`.

---

## <a id="is-ch5"></a> Kafli 5 — REST & Ops (plus tiny TODO)
**REST:**
- `POST /api/publicLiveChat/move-to-private/route.js` — færa public samtal yfir í private support.

**Identity & i18n:**
- Cookies: `public_identity_id` (guest), `public_last_conversation_id` (halda síðasta herbergi).
- i18n bundles: `messages/en.json`, `messages/is.json` undir `common`, `app`, `socket.{ui,hooks}`, `components`. (Aldrei þýða `logger.*`.)

**Tiny TODO (next):**
- Innleiða `public_unread:count` + UI badges; bæta rate-limits & input validation; hreinsa message body.
- Laga presence fjarlægingu með **endurskilgreiningu eftir `filter()`**; debounce presence emits.
- Tvinna **move-to-private** inn í UI; bæta prófum; index hagræðing; möguleg console-log stýring fyrir prod.
