'use client';

import React, { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorAndMessageContext } from '@/context/ErrorAndMessageContext';

const ShowMessages = () => {
  const { message, clearMessage } = useContext(ErrorAndMessageContext);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message?.text) {
      setIsVisible(true);

      const timeout = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => clearMessage(), 500);
      }, message.duration);

      return () => clearTimeout(timeout);
    }
  }, [message, clearMessage]);

  if (!message?.text) return null;

  const backgroundColor = {
    success: 'bg-green-400',
    warning: 'bg-orange-400',
    error: 'bg-red-400',
    info: 'bg-blue-400',
  }[message.type || 'info'];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5 }}
          className={`fixed bottom-0 left-0 w-full p-4 z-50 font-bold ${backgroundColor}`}
        >
          <div className="container mx-auto text-center">
            <p className="text-lg">{message.text}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShowMessages;
