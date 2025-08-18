/**
 * ==================================
 * 🧾 StatusBadge.jsx
 * ----------------------------------
 * Renders colored status badges for crypto payments
 * Accepts a `status` prop like: waiting, confirming, completed, etc.
 * Used on BuyNow and potentially other payment pages.
 * ==================================
 */
'use client';
import React from 'react';
import { useT } from '@/lib/i18n/client';

export default function StatusBadge({ status }) {
  const t = useT('app.payments.status'); // 🏷️ scope

  let badgeColor = '';
  let icon = '';
  let text = null;

  if (status === 'waiting') {
    badgeColor = 'bg-yellow-400';
    icon = '⏳';
    text = (
      <>
        <strong>{t('waiting.title')}</strong>
        <br />
        <span className="font-normal">{t('waiting.desc')}</span>
      </>
    );
  } else if (status === 'pending') {
    badgeColor = 'bg-orange-400';
    icon = '⌛';
    text = (
      <>
        <strong>{t('pending.title')}</strong>
        <br />
        <span className="font-normal">{t('pending.desc')}</span>
      </>
    );
  } else if (status === 'sending') {
    badgeColor = 'bg-cyan-600';
    icon = '🚀';
    text = <>{t('sending.title')}</>;
  } else if (status === 'confirming') {
    badgeColor = 'bg-blue-400';
    icon = '🔄';
    text = (
      <>
        <strong>{t('confirming.title')}</strong>
        <br />
        <span className="font-normal">{t('confirming.desc')}</span>
      </>
    );
  } else if (['confirmed', 'paid', 'finished', 'completed'].includes(status)) {
    badgeColor = 'bg-green-500';
    icon = '✅';
    text = (
      <>
        <strong>🎉 {t('completed.title')} 🎉</strong>
        <br />
        <span className="font-normal">{t('completed.desc')}</span>
      </>
    );
  } else if (status === 'failed' || status === 'expired') {
    badgeColor = 'bg-red-500 text-white';
    icon = '❌';
    text = (
      <>
        <strong>{t('failed.title')}</strong>
        <br />
        <span className="font-normal">{t('failed.desc')}</span>
      </>
    );
  } else {
    badgeColor = 'bg-gray-400';
    icon = '❔';
    text = <>{t('unknown', 'Unknown status')}</>;
  }

  return (
    <div
      className={`rounded-xl py-3 px-6 mb-6 mt-2 font-bold text-lg flex items-center justify-center gap-3 shadow-xl ${badgeColor}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-center">{text}</span>
      <span className="text-xl ml-3"> ({t(`${status}.label`, status)})</span>
    </div>
  );
}
