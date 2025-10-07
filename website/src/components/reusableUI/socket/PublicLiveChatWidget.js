/**
 * ================= PublicChatLauncher (client) =================
 * 🟣 Floating button that opens/closes the Public Chat panel
 * - No translations inside; keep hooks pure and UI decides wording.
 */
'use client';

import { useState } from 'react';

export default function PublicChatLauncher() {
  // 🎛️ Local toggle for panel visibility
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 🔘 Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="rounded-2xl px-4 py-2 shadow-md border bg-white hover:bg-neutral-50"
      >
        {isOpen ? '🟣 Close Chat' : '🟣 Open Chat'}
      </button>

      {/* 🪟 Simple panel placeholder */}
      {isOpen && (
        <div className="mt-2 w-[360px] h-[520px] rounded-2xl shadow-xl border bg-white overflow-hidden">
          <div className="h-full grid place-items-center text-sm text-neutral-500">
            {/* 🧪 Placeholder so you can wire hooks */}
            Public Chat – hook playground
          </div>
        </div>
      )}
    </div>
  );
}
