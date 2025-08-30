'use client';

import { React } from 'react';
import { useTranslations } from 'next-intl'; // 🌐 components.whatsAppBS.*

/**
 * 💬 WhatsAppLogo
 * ---------------
 * • Floating WhatsApp button.
 * • Adds translated title + aria-label (visible tooltip on hover).
 */
export default function WhatsAppLogo() {
  const t = useTranslations(); // 🗣️ translator bound to current language

  return (
    <a
      href="https://wa.me/3547624845"
      target="_blank"
      rel="noopener noreferrer"
      className=""
      title={t('components.whatsAppBS.open_whatsapp')} // 🏷️ translated tooltip
      aria-label={t('components.whatsAppBS.chat_with_us')} // ♿ screen readers
    >
      <i className="bi-whatsapp w-16 h-16 text-4xl z-[500] fixed bottom-6 right-6 bg-green-500 flex items-center justify-center rounded-full shadow-lg hover:bg-green-700 transition duration-300"></i>
    </a>
  );
}
