/**
 * src/app/not-found.js
 * --------------------
 * 🌍 Global 404 handler
 * - Shows minimal fallback so users don’t see a blank page
 * - Redirects to middlePage on mount
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // ⏩ redirect once mounted
    router.replace('/auth/middlePage?not-found=true');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* 🚧 Simple fallback */}
      <p className="text-gray-500">Redirecting…</p>
    </div>
  );
}
