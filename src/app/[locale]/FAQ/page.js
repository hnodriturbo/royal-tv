/**
 * ===========================================================
 * ❓ /app/[locale]/faq/page.js
 * -----------------------------------------------------------
 * FAQ page with a simple accordion.
 * - All headings, questions, and answers translated via useTranslations().
 * - Keeps Tailwind transitions with content height measurement.
 * ===========================================================
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl'; // 🌍 i18n — requested import path & style

function AccordionItem({ itemIndex, isOpen, toggleItem, questionText, answerText }) {
  // 📏 content height controller for smooth expand/collapse
  const contentRef = useRef(null);
  const [contentMaxHeight, setContentMaxHeight] = useState(0);

  useEffect(() => {
    // 🎚️ set max-height based on content when open; collapse to zero when closed
    if (isOpen) {
      setContentMaxHeight(contentRef.current?.scrollHeight || 0);
    } else {
      setContentMaxHeight(0);
    }
  }, [isOpen]);

  // 🧩 item UI
  return (
    <div className="border-b border-gray-300">
      <button
        onClick={() => toggleItem(itemIndex)}
        className="w-full text-left flex justify-between items-center py-4"
      >
        <span className="text-lg font-semibold">{questionText}</span>
        <span className="text-xl">{isOpen ? '-' : '+'}</span>
      </button>

      <div
        ref={contentRef}
        style={{ maxHeight: `${contentMaxHeight}px` }}
        className="overflow-hidden transition-all duration-500"
      >
        <p className="text-gray-300 pb-4">{answerText}</p>
      </div>
    </div>
  );
}

export default function FaqPage() {
  // 🗣️ translation handle
  const t = useTranslations();

  // 🧾 build the list from translation keys for full i18n control
  const faqItems = [
    ['what_is_iptv_q', 'what_is_iptv_a'],
    ['getting_started_q', 'getting_started_a'],
    ['icelandic_channels_q', 'icelandic_channels_a'],
    ['free_trial_q', 'free_trial_a'],
    ['simultaneous_streams_q', 'simultaneous_streams_a'],
    ['requirements_q', 'requirements_a'],
    ['special_equipment_q', 'special_equipment_a'],
    ['works_everywhere_q', 'works_everywhere_a'],
    ['channel_issue_q', 'channel_issue_a'],
    ['refunds_q', 'refunds_a'],
    ['renew_q', 'renew_a'],
    ['multi_device_q', 'multi_device_a'],
    ['stability_q', 'stability_a'],
    ['channels_count_q', 'channels_count_a'],
    ['apple_android_tv_q', 'apple_android_tv_a'],
    ['support_q', 'support_a'],
    ['commitment_q', 'commitment_a'],
    ['content_types_q', 'content_types_a'],
    ['hd_4k_q', 'hd_4k_a'],
    ['slow_internet_q', 'slow_internet_a'],
    ['legal_q', 'legal_a']
  ];

  // 🎚️ which index is open (null = all closed)
  const [activeIndex, setActiveIndex] = useState(null);
  const toggleItem = (indexToToggle) =>
    setActiveIndex((previousIndex) => (previousIndex === indexToToggle ? null : indexToToggle));

  return (
    <div className="container-style lg:w-8/12 w-11/12 mx-auto p-6 mt-20">
      {/* 🏷️ page heading */}
      <h2 className="text-3xl font-bold mb-6 text-center">{t('app.faq.heading')}</h2>

      <div className="flex flex-col items-center">
        {/* 📏 visual divider */}
        <hr className="border border-gray-400 w-8/12 text-center items-center justify-center mb-4" />
      </div>

      {/* 📚 accordion items from translations */}
      {faqItems.map(([questionKey, answerKey], loopIndex) => (
        <AccordionItem
          key={questionKey}
          itemIndex={loopIndex}
          isOpen={activeIndex === loopIndex}
          toggleItem={toggleItem}
          questionText={t(`app.faq.items.${questionKey}`)}
          answerText={t(`app.faq.items.${answerKey}`)}
        />
      ))}
    </div>
  );
}
