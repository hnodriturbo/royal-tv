'use client';
import { useContext, useCallback } from 'react';
import { ErrorAndMessageContext } from '@/context/ErrorAndMessageContext';

const useMessageHandler = () => {
  const context = useContext(ErrorAndMessageContext);
  if (!context) {
    throw new Error('useMessageHandler must be used within an ErrorAndMessageProvider');
  }

  const { addMessage } = context;

  // Ensure stability of displayMessage
  const displayMessage = useCallback(
    (text, type = 'info', duration = 5) => {
      if (addMessage) {
        addMessage(text, type, duration * 1000); // Convert seconds to milliseconds
      } else {
        console.error('addMessage is not defined in ErrorAndMessageContext.');
      }
    },
    [addMessage]
  );

  return { displayMessage };
};

export default useMessageHandler;
