'use client';

import { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorAndMessageContext } from '@/context/ErrorAndMessageContext';
import { useTranslations } from 'next-intl'; // 🌐 components.showMessages.*
import { SafeString } from '@/lib/ui/SafeString';

/**
 * 📨 ShowMessages
 * ---------------
 * • Displays transient toast-like messages from context.
 * • Does not translate message.text (it originates elsewhere).
 * • Adds a translated tooltip title only (visible on hover).
 */
const ShowMessages = () => {
  const t = useTranslations();
  const { message, clearMessage } = useContext(ErrorAndMessageContext);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message?.text) {
      setIsVisible(true);

      const duration = Number(message.duration) > 0 ? Number(message.duration) : 5000;
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => clearMessage(), 500);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [message, clearMessage]);

  if (!message?.text) return null;

  const backgroundColor =
    {
      success: 'bg-green-400',
      warning: 'bg-orange-400',
      error: 'bg-red-400',
      info: 'bg-blue-400'
    }[message.type || 'info'] || 'bg-blue-400';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5 }}
          className={`fixed bottom-0 left-0 w-full p-4 z-[9999] font-bold ${backgroundColor}`}
          title={SafeString(t('components.showMessages.toast_title'), 'ShowMessages.title')}
          role="status"
          aria-live="polite"
        >
          <div className="container mx-auto text-center">
            {/* ✅ SafeString prevents React #130 even if upstream sends an object */}
            <p className="text-lg">{SafeString(message.text, 'ShowMessages.text')}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShowMessages;
