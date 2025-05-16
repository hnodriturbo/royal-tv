'use client';

import React, { createContext, useState, useCallback } from 'react';

const ErrorAndMessageContext = createContext();

export const ErrorAndMessageProvider = ({ children }) => {
  const [message, setMessage] = useState({
    type: '',
    text: '',
    duration: 5000,
  });

  // Memoize the addMessage function
  const addMessage = useCallback((text, type = 'info', duration = 7000) => {
    setMessage((prevMessage) => {
      // Prevent unnecessary state updates if the same message is already set
      if (
        prevMessage.text === text &&
        prevMessage.type === type &&
        prevMessage.duration === duration
      ) {
        return prevMessage;
      }
      return { text, type, duration };
    });
  }, []);

  const clearMessage = useCallback(() => {
    setMessage({ text: '', type: '', duration: 0 });
  }, []);

  return (
    <ErrorAndMessageContext.Provider
      value={{ message, addMessage, clearMessage }}
    >
      {children}
    </ErrorAndMessageContext.Provider>
  );
};

export { ErrorAndMessageContext };
