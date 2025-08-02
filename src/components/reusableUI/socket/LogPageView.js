'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation'; // 🛣️ The App Router way!
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function LogPageView() {
  const { logPageVisit, socketConnected } = useSocketHub();
  const pathname = usePathname();
  const prevPathRef = useRef();

  useEffect(() => {
    if (!logPageVisit || !socketConnected) {
      return;
    }

    // Log ONLY if pathname actually changed!
    if (prevPathRef.current !== pathname) {
      // 👀 Decode the pathname for readable logs
      const decodedPath = decodeURIComponent(pathname);

      // 🪪 Get last segment (human-friendly, even if encoded in the URL)
      const segments = decodedPath.replace(/\/$/, '').split('/');
      const lastSegment = segments[segments.length - 1] || 'home';

      logPageVisit({
        page: decodedPath, // 📝 Store the DECODED path for logs!
        event: 'page_visit',
        description: `Visited "${lastSegment}" page`
      });
      prevPathRef.current = pathname;
    }
  }, [pathname, logPageVisit, socketConnected]);

  return null;
}
