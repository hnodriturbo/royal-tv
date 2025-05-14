// hooks/useAppRedirectHandler.js
import { useCallback } from 'react';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useRouter } from 'next/navigation';

const useAppRedirectHandlers = () => {
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();
  const router = useRouter();

  const redirectWithMessage = useCallback(
    ({
      target,
      message,
      color,
      messageDelay = 3000, // Default delay for messages
      loaderText,
      loaderOnly = false, // New parameter to control whether only the loader is shown
      pageDelay = 3000, // Default navigation delay
    }) => {
      // Show message if not in loaderOnly mode
      if (!loaderOnly) {
        displayMessage(message, color, messageDelay === pageDelay);
      }

      // Show loader with optional text
      showLoader({ text: loaderText || message });

      setTimeout(() => {
        router.replace(target); // Navigate to the target
      }, pageDelay); // Adjust delay if necessary

      // Cleanup loader and message
      setTimeout(() => {
        hideLoader();
        if (!loaderOnly) displayMessage(''); // Clear message if it was displayed
      }, pageDelay + 500); // Ensure cleanup happens after navigation
    },
    [showLoader, hideLoader, displayMessage, router],
  );

  return { redirectWithMessage };
};

export default useAppRedirectHandlers;
