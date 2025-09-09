'use client';

import React, { createContext, useState, useCallback } from 'react';
import { SafeString } from '@/lib/ui/SafeString';

const ErrorAndMessageContext = createContext();

export const ErrorAndMessageProvider = ({ children }) => {
  const [message, setMessage] = useState({ type: '', text: '', duration: 5000 });

  const addMessage = useCallback((text, type = 'info', duration = 7000) => {
    const safeText = SafeString(text, 'Message');
    setMessage((prev) => {
      if (prev.text === safeText && prev.type === type && prev.duration === duration) return prev;
      return { text: safeText, type, duration };
    });
  }, []);

  const clearMessage = useCallback(() => {
    setMessage({ text: '', type: '', duration: 0 });
  }, []);

  return (
    <ErrorAndMessageContext.Provider value={{ message, addMessage, clearMessage }}>
      {children}
    </ErrorAndMessageContext.Provider>
  );
};

export { ErrorAndMessageContext };
