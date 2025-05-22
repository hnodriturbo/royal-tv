'use client';

import { useState, useEffect } from 'react';
import useAppHandlers from '@/hooks/useAppHandlers';

const useLoaderCountdown = () => {
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();
  const [countdown, setCountdown] = useState(null);
  const [isActive, setIsActive] = useState(false);

  const loaderCountdown = (
    seconds,
    loaderText = 'Processing...',
    finalMessage = null,
  ) => {
    setCountdown(seconds);
    setIsActive(true);

    // Show loader with initial countdown
    showLoader({ text: `${loaderText} in ${seconds}` });

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          hideLoader(); // Hide the loader when done
          setIsActive(false);

          if (finalMessage) {
            displayMessage(finalMessage, 'success');
          }

          return null;
        }

        showLoader({ text: `${loaderText} in ${prev - 1}` }); // Update countdown
        return prev - 1;
      });
    }, 1000);
  };

  return { loaderCountdown, isActive, countdown };
};

export default useLoaderCountdown;
