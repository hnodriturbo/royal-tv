import { useCallback } from 'react';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useRouter } from 'next/navigation';

const useRedirectHandler = () => {
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();
  const router = useRouter();

  const redirectImmediately = useCallback(
    ({ target, message, loaderText, color }) => {
      displayMessage(message, color); // Only display the message once
      showLoader({ text: loaderText || message });

      setTimeout(() => {
        router.push(target);
        hideLoader();
      }, 5000); // Adjust delay as needed
    },
    [showLoader, hideLoader, displayMessage, router],
  );

  return { redirectImmediately };
};

export default useRedirectHandler;
