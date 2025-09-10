// hooks/useAppRedirectHandler.js
'use client';
import { useRouter } from 'next/navigation';

import { useCallback } from 'react';
import useAppHandlers from '@/hooks/useAppHandlers';

import { useTranslations } from 'next-intl';

const useAppRedirectHandlers = () => {
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();
  const router = useRouter();
  const t = useTranslations();

  const redirectWithMessage = useCallback(
    ({
      target,
      message, // 📨 string OR { key: 'path', params?: {...} }
      color,
      messageDelay = 3000, // Default delay for messages
      loaderText, // 🏷️ string OR { key: 'path', params?: {...} }
      loaderOnly = false, // New parameter to control whether only the loader is shown
      pageDelay = 3000 // Default navigation delay
    }) => {
      /* 
      // Show message if not in loaderOnly mode
      if (!loaderOnly) {
        displayMessage(message, color, messageDelay === pageDelay);
      }
        // Show loader with optional text
      showLoader({ text: loaderText || message }); */

      // 🧩 resolve: accept plain string or i18n key object
      const resolveText = (maybe) => {
        if (!maybe) return '';
        if (typeof maybe === 'string') return maybe; // ✍️ raw string
        if (typeof maybe === 'object' && maybe.key) {
          return t(maybe.key, maybe.params || {}); // 🌍 lookup: e.g. { key: 'common.auth.redirect_logged_in' }
        }
        return String(maybe);
      };

      const resolvedMessage = resolveText(message);
      const resolvedLoader = resolveText(loaderText) || resolvedMessage;

      // 📨 show message (unless loaderOnly)
      if (!loaderOnly) {
        displayMessage(resolvedMessage, color, messageDelay === pageDelay);
      }

      // ⏳ show loader with optional text
      showLoader({ text: resolvedLoader });

      setTimeout(() => {
        router.replace(target); // Navigate to the target
      }, pageDelay); // Adjust delay if necessary

      // Cleanup loader and message
      setTimeout(() => {
        hideLoader();
        if (!loaderOnly) displayMessage(''); // Clear message if it was displayed
      }, pageDelay + 500); // Ensure cleanup happens after navigation
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showLoader, hideLoader, displayMessage, router]
  );

  return { redirectWithMessage };
};

export default useAppRedirectHandlers;
