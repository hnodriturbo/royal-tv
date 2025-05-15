'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAppHandlers from '@/hooks/useAppHandlers';

const useLoaderCountdownRedirect = () => {
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();
  const router = useRouter();
  const [countdown, setCountdown] = useState(null);
  const [isActive, setIsActive] = useState(false);

  const startLoaderCountdownRedirect = (
    seconds,
    loaderText = 'You are being redirected...',
    redirectTo = '/',
    finalMessage = null
  ) => {
    setCountdown(seconds);
    setIsActive(true);

    // Show loader with initial countdown
    showLoader({ text: `${loaderText} in ${seconds}` });

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          hideLoader();
          setIsActive(false);
          router.replace(redirectTo); // Redirect user

          if (finalMessage) {
            displayMessage(finalMessage, 'success');
          }

          return null;
        }

        showLoader({ text: `${loaderText} in ${prev - 1}` });
        return prev - 1;
      });
    }, 1000);
  };

  return { startLoaderCountdownRedirect, isActive, countdown };
};

export default useLoaderCountdownRedirect;
