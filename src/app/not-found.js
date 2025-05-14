'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately (or after a delay if you prefer)
    router.replace('/auth/middlePage?not-found=true');
  }, [router]);

  return null;
}
