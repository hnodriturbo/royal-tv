/**
 *   ======================== AdminLayout.js ===========================
 * 🏢
 * ADMIN LAYOUT:
 * Provides a styled wrapper for all admin pages.
 * - Centers and aligns admin content.
 * - Shows <OnlineUsers /> (admin only) for real‑time online admin/user info.
 * - Automatically wraps all admin subpages.
 * =====================================================================
 * ⚙️
 * PROPS:
 *   children: ReactNode // Content for the specific admin page.
 * =====================================================================
 * 📌
 * USAGE:
 *   Placed in `/app/src/admin/layout.js` to wrap all admin routes with
 *   this layout and provide the online users to all admin pages.
 * =====================================================================
 */

import OnlineUsers from '@/components/reusableUI/socket/OnlineUsers';

export default function AdminLayout({ children }) {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* 🟢 Shows live online user info for admin panel */}
      <OnlineUsers />
      {children}
    </div>
  );
}
