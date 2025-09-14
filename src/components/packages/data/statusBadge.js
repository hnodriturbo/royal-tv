/**
 * ==================================
 * 🧾 StatusBadge.jsx
 * ----------------------------------
 * Renders colored status badges for crypto payments
 * Accepts a `status` prop like: waiting, confirming, completed, etc.
 * Uses app.payments.status.* translations
 * ==================================
 */

'use client';
import _React from 'react';
import { useTranslations } from 'next-intl';

export default function StatusBadge({ status }) {
  const t = useTranslations();
  const upper = (s) => (s ? String(s).toUpperCase() : '');
  const safeLabel = (() => {
    try {
      const v = t(`app.payments.status.${status}.label`);
      return typeof v === 'string' ? v : upper(status);
    } catch {
      return upper(status);
    }
  })();

  let badgeColor = '';
  let icon = '';
  let text = null;

  if (status === 'waiting') {
    badgeColor = 'bg-yellow-400';
    icon = '⏳';
    text = (
      <>
        <strong>{t('app.payments.status.waiting.title')}</strong>
        <br />
        <span className="font-normal">{t('app.payments.status.waiting.desc')}</span>
      </>
    );
  } else if (status === 'pending') {
    badgeColor = 'bg-orange-400';
    icon = '⌛';
    text = (
      <>
        <strong>{t('app.payments.status.pending.title')}</strong>
        <br />
        <span className="font-normal">{t('app.payments.status.pending.desc')}</span>
      </>
    );
  } else if (status === 'sending') {
    badgeColor = 'bg-cyan-600';
    icon = '🚀';
    text = <>{t('app.payments.status.sending.title')}</>;
  } else if (status === 'confirming') {
    badgeColor = 'bg-blue-400';
    icon = '🔄';
    text = (
      <>
        <strong>{t('app.payments.status.confirming.title')}</strong>
        <br />
        <span className="font-normal">{t('app.payments.status.confirming.desc')}</span>
      </>
    );
  } else if (['confirmed', 'paid', 'finished', 'completed'].includes(status)) {
    badgeColor = 'bg-green-500';
    icon = '✅';
    text = (
      <>
        <strong>🎉 {t('app.payments.status.completed.title')} 🎉</strong>
        <br />
        <span className="font-normal">{t('app.payments.status.completed.desc')}</span>
      </>
    );
  } else if (status === 'failed' || status === 'expired') {
    badgeColor = 'bg-red-500 text-white';
    icon = '❌';
    text = (
      <>
        <strong>{t('app.payments.status.failed.title')}</strong>
        <br />
        <span className="font-normal">{t('app.payments.status.failed.desc')}</span>
      </>
    );
  } else {
    badgeColor = 'bg-gray-400';
    icon = '❔';
    let unknown = 'Unknown status';
    try {
      unknown = t('app.payments.status.unknown');
    } catch {}
    text = unknown;
  }

  return (
    <div
      className={`rounded-xl py-3 px-6 mb-6 mt-2 font-bold text-lg flex items-center justify-center gap-3 shadow-xl ${badgeColor}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-center">{text}</span>+{' '}
      <span className="text-xl ml-3">({safeLabel})</span>
    </div>
  );
}
