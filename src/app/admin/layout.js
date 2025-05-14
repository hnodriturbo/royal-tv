// /app/(admin) / layout.js(or wherever your admin group lives)

import OnlineUsers from '@/components/reusableUI/socket/OnlineUsers';

export default function AdminLayout({ children }) {
  return (
    <>
      <div className="flex flex-col items-center justify-center w-full">
        <OnlineUsers /> {/* 🔴 live user count */}
        {children}
      </div>
    </>
  );
}
