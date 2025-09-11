# Royal TV

Staðbundin og alþjóðleg IPTV veflausn með greiðslum í gegnum Bitcoin, rauntíma spjalli og admin-yfirsýn.

**Lénið:** https://www.royal-tv.tv  (ekki virkt í augnablikinu vegna uppfærslu tungumála og annarra uppfærslna)
**Markmið:** Selja IPTV-áskriftir, sýna pakka, taka við greiðslum, styðja tvö tungumál (is/en) og veita hraða þjónustu í rauntíma.

---

## Innihald

- [Helstu eiginleikar](#helstu-eiginleikar)
- [Tæknistafli (Tech Stack) – hvað & af hverju](#tæknistafli-tech-stack--hvað--af-hverju)
- [Kerfisarkitektúr](#kerfisarkitektúr)
- [Alþjóðavæðing (i18n)](#alþjóðavæðing-i18n)
- [Greiðslur](#greiðslur)
- [Innskráning & öryggi](#innskráning--öryggi)
- [Rauntími & LiveChat](#rauntími--livechat)
- [Skráningar & greining (logging)](#skráningar--greining-logging)
- [Gæðareglur & kóðastíll](#gæðareglur--kóðastíll)
- [Vinnulisti / Næstu skref](#vinnulisti--næstu-skref)

---

## Helstu eiginleikar

- 🎯 **Söluvefur fyrir IPTV-áskriftir** með „Packages“ yfirliti (einnig birt á forsíðu) og „Show More“/FAQ síðum.
- 👤 **Notendakerfi**: Skráning/innskráning, notendasvæði og admin-svæði (einn admin með fulla yfirsýn).
- 💬 **LiveChat** í rauntíma (Socket.IO): Sýnir hver er online, einkaspjall notanda við admin á sínu svæði.
- ₿ **Bitcoin greiðslur** í gegnum **NowPayments** með IPN til að staðfesta og uppfæra stöður.
- 🌍 **Tvítyngt** (íslenska/enska) með next-intl, samræmdir textar í JSON skrám.
- 🧭 **Locale-væn leiðarkerfi**: Allar slóðir virða valið tungumál.
- 🧾 **Logger**: Skráir heimsóknir og atburði; admin sér yfirlit.
- 📱 **Hannað fyrir skjáborð og síma**; töflur með útlínum og hover-áherslum.

---

## Tæknistafli (Tech Stack) – hvað & af hverju

**Frontend**
- **Next.js 15 + React 19** – nýjustu App Router möguleikar, betri perf & bundling.
- **Tailwind CSS v4** – létt, fljótlegt stílað; mest stillt í `globals`.
- **next-intl** – hreint i18n, server/client, key sem tryggja stöðugleika texta.
- **Axios** – stöðluð HTTP köll frá client → API.
- **Framer Motion** (valkvætt) – mjúkar hreyfingar í viðmóti.

**Bakendi / Gagnagrunnur**
- **Prisma** – gagnalíkan + migrations; mannanlegt schema (`prisma/schema.prisma`).
- **PostgreSQL** – áreiðanlegur gagnagrunnur fyrir áskriftir, notendur, greiðslur, tilkynningar.

**Auðkenning**
- **NextAuth v5** – innskráning, session tokens; einföld samvinna við Next.js 15.

**Rauntími**
- **Socket.IO (aðskilinn þjónn)** – online/presence, LiveChat, tilkynningar í rauntíma.

**Greiðslur**
- **NowPayments (Bitcoin)** – IPN til að staðfesta greiðslur og kveikja viðeigandi uppfærslur.

**Keyrsla**
- **PM2 + Nginx** – stöðug framleiðsla, loggar og endurræsingu á þjónustum.

---

## Kerfisarkitektúr

- **Next.js forrit** þjónar vefnum (App Router).
- **Aðskilinn Socket.IO þjónn** (Node) heldur utan um tengingar, presence og spjall.
- **Prisma** tengir þjónana við Postgres.
- **NowPayments IPN** hittir API og/eða Socket þjón, uppfærir stöður og ýtir tilkynningum.
- **Admin** hefur yfirsýn: notendur, áskriftir, atburðir, loggar.

Einfalt flæði (kaup):
1) Notandi velur pakka → 2) Býr til greiðslu → 3) Notandi greiðir BTC →  
4) **IPN** kemur → 5) DB uppfært + notandi/admín fá tilkynningu → 6) Aðgangur virkjaður/skráður.

---

## Alþjóðavæðing (i18n)

- **next-intl** sér um tungumál á server/client.
- **Skilaboð í JSON**: `messages/en.json` og `messages/is.json` (eða `src/language/...`); samræmd lyklaskipan:
  - `common`, `app`, `socket`, `components`
  - undir `socket`: aðeins `ui` og `hooks`
- **Regla**: ekki setja `t` í dependency-fylki í React hooks.
- **Leiðarkerfi**: Allar slóðir bera `[locale]`. `Link` og `useRouter` (locale-aware) halda tungumáli á ferðalaginu.
- **Bakenda-svör**: skilaboð samræmd og hlaðin úr i18n JSON; **logger.*** strengir _ekki_ þýddir.

---

## Greiðslur

- **NowPayments** (BTC) er vinnsluaðili.
- **IPN** uppfærir stöðu greiðslu/áskriftar.
- Viðmót birtir **greiðsluárangur við „confirmed“ stöðu** (til að bæta upplifun).
- **BuyNow** endurhleður viðskiptagögn eftir fyrstu IPN (til að sýna stöðuna á síðunni).

---

## Innskráning & öryggi

- **NextAuth v5**: Sessions, tokens og verndaðar síður.
- **Cookies**: aðeins notaðar fyrir `locale`.
- **Aðeins einn admin** með aðgang að admin-svæði.
- **API-route conventions (Next.js 15)**:
  - Notum **GET/POST/PATCH/DELETE** exports (engin „handlers“).
  - Allt er **server by default** nema skrár með `'use client'`.

---

## Rauntími & LiveChat

- **Socket.IO** heldur utan um:
  - Presence (hver er online, hvort admin er online).
  - Einkaspjall notanda ↔ admin (á notendasvæði).
  - Tilkynningar (t.d. greiðslustaða).
- **useSocketHub.js** er miðlægi hnútpunkurinn (client) fyrir Socket atburði.

---

## Skráningar & greining (logging)

- **Logger** skráir heimsóknir og atburði.
- **Admin** fær yfirlit yfir logga og getur rýnt.
- **Regla**: `logger.*` strengir _ekki_ þýddir.

---

## Gæðareglur & kóðastíll

- **'use client'** ef og aðeins ef viðmót/hookar krefjast þess; annars er skrá server-by-default.
- **API-routes** nota `export const GET/POST/... = async (request) => {}` (ekki „handlers“).
- **Lýsing efst í hverri skrá** (blokkar-athugasemd) + **emoji one-liners** í kóðanum til að auka læsileika.
- **Ekki stytta breytuheiti**; lýsandi og mannlesanleg nöfn.
- **Töflur** á admin/notendasíðum eiga að hafa **útlínur** og **hover-bakgrunn (bg-gray-400)**.
- **SafeString** hjálpar við að **rendera aðeins streng** (ver gegn óvæntum object/function í UI).
- **i18n**: Halda `t` utan dependency-array; geyma tilkynningar í DB á ensku en senda notendum á þeirra `locale` í rauntíma (Socket handshake `set_locale`).

---

## Vinnulisti / Næstu skref

- ✅ Loka tvítyngdri uppfærslu (is/en) í öllum síðum/leiðum. (mikil vinna eftir þar)
- 🔄 Fullklára AI-spjallmenni sem „morphar“ í admin þegar admin er online.
- 📊 Bæta admin-yfirlit (fleiri síur/samantektir - mögulega)
- 🛡️ Herða öryggi (rate limiting á sensitive API o.fl.).

---

### Af hverju þessi uppsetning?

- **Next.js 15 + React 19** gefur modern server-first grunn með skýrum aðskilnaði client/server.
- **Prisma + Postgres** veitir sterkt gagnalíkan og auðveldar þróun.
- **Socket.IO** leysir presence/livechat á einfaldan og áreiðanlegan hátt.
- **next-intl** heldur heildstæðri i18n sögu á server og client án óþarfa flækju.
- **NowPayments (BTC)** einfaldar greiðslur og IPN gerir stöðustjórnun sjálfvirka.
