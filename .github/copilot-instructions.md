# Copilot Instructions for Royal TV

## Project Overview
Royal TV is a bilingual (Icelandic/English) IPTV subscription service built with Next.js 15 + React 19, featuring real-time chat, Bitcoin payments via NowPayments, and Socket.IO for live features.

## Key Architecture Patterns

### Next.js 15 + App Router Conventions
- **API Routes**: Use `export const GET/POST/PATCH/DELETE = async (request) => {}` (no "handlers")
- **Server by Default**: Files are server-side unless marked with `'use client'`  
- **Locale-aware Routing**: All routes prefixed with `[locale]` (`/en/` or `/is/`)
- **Middleware**: Handles auth, locale redirection, and sticky `public_identity_id` cookies

### Internationalization (i18n) - Critical Patterns
- **next-intl**: Messages in `src/messages/{en,is}.json` with structured keys (`common`, `app`, `socket`, etc.)
- **Translation Rule**: Never put `t` function in React dependency arrays
- **DB Notifications**: Store in English, translate on-demand via Socket.IO `set_locale` events
- **Logger Strings**: Never translate `logger.*` output - always English

### Database & Prisma
- **PostgreSQL** with Prisma ORM (`prisma/schema.prisma`)
- **Key Models**: User, Subscription, SubscriptionPayment, FreeTrial, Notification, LiveChatConversation, Log
- **Commands**: `prisma migrate dev`, `prisma studio`, `prisma generate`

### Real-time Architecture (Socket.IO)
- **Separate Server**: `server.js` runs Socket.IO + expiry sweepers independently from Next.js
- **Client Hub**: `useSocketHub.js` centralizes all Socket events with connection guards
- **Live Features**: Chat, notifications, presence, payment status updates
- **Presence**: Tracks online users, admin status, typing indicators

### Authentication & Authorization
- **NextAuth v5**: Session management with role-based access
- **Roles**: `admin` (single user) and `user`
- **Guards**: `withRole()` wrapper for API routes requiring specific roles
- **Middleware**: Automatic redirects based on auth state and role

## Development Workflows

### Running the Application
```bash
# Development (Next.js only)
npm run dev

# Production (Socket.IO + Next.js)
npm run server:start  # Starts server.js with Socket.IO + expiry sweepers
npm run start         # Starts Next.js production server
```

### Key Commands
- **Database**: `npx prisma migrate dev --name description`
- **Seed Data**: `node prisma/seeds/[specific-seed].js`
- **Production**: PM2 + Nginx (see `Production/` directory)

## Code Style & Conventions

### File Documentation
- **Block comment** at top of each file describing purpose
- **Emoji one-liners** throughout code for readability
- **Descriptive variable names** - no abbreviations

### Client/Server Boundaries
- Use `'use client'` only when necessary (hooks, event handlers, browser APIs)
- API routes are server-side by default
- Socket events bridge client/server real-time communication

### UI Patterns
- **Tables**: Must have borders and `hover:bg-gray-400` effects
- **SafeString**: Use for rendering string-only content (prevents object rendering)
- **Tailwind v4**: Centralized styles in `globals.css`

### Socket Integration
- **Connection Guards**: All Socket emits/listens queued until connection ready
- **Event Naming**: Structured patterns (e.g., `public_message:create`, `user_unread_count`)
- **Locale Handling**: `set_locale` event synchronizes user language preferences

## Critical Integrations

### Payment Flow (NowPayments)
1. User selects package → Create payment → Bitcoin payment
2. **IPN webhook** updates payment status
3. Socket.IO broadcasts payment confirmation
4. Subscription activated in database

### Live Chat System
- **Private Chat**: User ↔ Admin via `LiveChatConversation`/`LiveChatMessage`
- **Public Chat**: Lobby system via `PublicLiveChatConversation`
- **Real-time**: Typing indicators, presence, unread counts

### Logging & Monitoring
- **Page Visits**: Logged via Socket.IO `log_page_visit`
- **Admin Dashboard**: IP-based log aggregation and user activity tracking
- **Error Handling**: Structured error responses with i18n support

## File Structure Highlights
- `src/hooks/socket/useSocketHub.js` - Central Socket.IO client hub
- `src/lib/server/socketServer.js` - Socket.IO server implementation
- `src/middleware.js` - Auth, locale, and cookie management
- `src/messages/` - i18n translation files
- `prisma/schema.prisma` - Database schema and relationships
- `server.js` - Main entry point for production (Socket + expiry sweepers)

## Common Gotchas
- **i18n Dependencies**: Never include `t` in useEffect/useMemo deps
- **Socket Guards**: Always use `guardedEmit`/`guardedListen` from useSocketHub
- **API Routes**: Use Next.js 15 export patterns, not handler functions  
- **Locale Persistence**: Maintained via cookies and Socket handshake
- **Role Enforcement**: Admin routes protected by middleware + API guards