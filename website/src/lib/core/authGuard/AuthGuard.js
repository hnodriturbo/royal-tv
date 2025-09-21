// components/AuthGuard.js
'use client';

import { useEffect, useRef } from 'react';
import useAuthGuard from '@/hooks/useAuthGuard';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useTranslations } from 'next-intl';

// AuthGuard that defers redirects until session is ready,
// showing a translated loader meanwhile.
const AuthGuard = ({ role, children }) => {
  const { isAllowed } = useAuthGuard(role); // null | true | false
  const { showLoader, hideLoader } = useAppHandlers();
  const t = useTranslations(); // expects "common.loading"
  const loaderShown = useRef(false);

  // Show the loader exactly once while pending; hide it when resolved.
  useEffect(() => {
    if (isAllowed === null && !loaderShown.current) {
      let text;
      try {
        text = t('common.loader.loading'); // i18n key: common.loader.loading
      } catch {
        text = 'Loading...';
      }
      showLoader({ text });
      loaderShown.current = true;
      return;
    }

    if (loaderShown.current && isAllowed !== null) {
      hideLoader();
      loaderShown.current = false;
    }
  }, [isAllowed, t, showLoader, hideLoader]);

  // Ensure loader is cleared on unmount (e.g., during a redirect).
  useEffect(() => {
    return () => {
      if (loaderShown.current) {
        hideLoader();
        loaderShown.current = false;
      }
    };
  }, [hideLoader]);

  // ⏳ pending during hydration – render nothing (loader is visible)
  if (isAllowed === null) return null;

  // 🔒 blocked (hook already triggered a redirect)
  if (isAllowed === false) return null;

  // ✅ allowed
  return children;
};

export default AuthGuard;
