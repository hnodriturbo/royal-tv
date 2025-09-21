// app/[locale]/faq/FaqClient.js  — CLIENT
'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { useTranslations } from 'next-intl';
import { SafeString } from '@/lib/ui/SafeString';

function AccordionItem({ id, isOpen, onToggle, questionText, answerText }) {
  const contentRef = useRef(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    setMaxH(isOpen ? contentRef.current?.scrollHeight || 0 : 0);
  }, [isOpen]);

  const panelId = `${id}-panel`;
  const buttonId = `${id}-button`;

  return (
    <div className="border-b border-gray-300">
      <button
        id={buttonId}
        type="button"
        onClick={onToggle}
        className="w-full text-left flex justify-between items-center py-4"
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-controls={panelId}
      >
        <span className="text-lg font-semibold">{SafeString(questionText, '')}</span>
        <span className="text-xl" aria-hidden>
          {isOpen ? '−' : '+'}
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        ref={contentRef}
        style={{ maxHeight: `${maxH}px` }}
        className="overflow-hidden transition-all duration-500"
      >
        <p className="text-gray-300 pb-4">{SafeString(answerText, '')}</p>
      </div>
    </div>
  );
}

export default function FaqClient() {
  const t = useTranslations();
  const baseId = useId(); // stable ids per mount

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

  const [activeIndex, setActiveIndex] = useState(null);
  const toggle = (i) => setActiveIndex((prev) => (prev === i ? null : i));

  return (
    <div className="container-style lg:w-8/12 w-11/12 mx-auto p-6 mt-20">
      <h2 className="text-3xl font-bold mb-6 text-center">{t('app.faq.heading')}</h2>

      <div className="flex flex-col items-center">
        <hr className="border border-gray-400 w-8/12 mb-4" />
      </div>

      {faqItems.map(([q, a], i) => (
        <AccordionItem
          key={q}
          id={`${baseId}-${i}`}
          isOpen={activeIndex === i}
          onToggle={() => toggle(i)}
          questionText={t(`app.faq.items.${q}`)}
          answerText={t(`app.faq.items.${a}`)}
        />
      ))}
    </div>
  );
}
