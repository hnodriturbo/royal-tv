/**
 * ===========================================
 * FreeTrialPanel.js
 * 🆓 User Free Trial Status/Request Panel
 * -------------------------------------------
 * - Shows user's current free trial status
 * - Allows requesting a trial (one per user)
 * - Uses real-time socket-powered updates
 * - Localized with i18n client (`useTranslations`)
 * - Locale-aware links
 * ===========================================
 */

'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import FreeTrialButton from '@/components/reusableUI/FreeTrialButton';
import useFreeTrialStatus from '@/hooks/socket/useFreeTrialStatus';

export default function FreeTrialPanel({ user_id, className }) {
  const t = useTranslations();
  const locale = useLocale();

  // 🏷️ Hook for status, error, and refresher
  const { freeTrialStatus, error, refreshStatus } = useFreeTrialStatus(user_id);

  return (
    <div className={clsx('w-full max-w-2xl mx-auto flex flex-col items-center my-2', className)}>
      {/* 📝 ACTIVE status → deep link to credentials */}
      {freeTrialStatus === 'active' && (
        <Link
          href={`/${locale}/user/freeTrials`}
          className="w-full flex"
          aria-label={t('socket.ui.freeTrialPanel.click_to_view_credentials')}
        >
          <div className="text-2xl bg-green-300 text-green-600 w-full p-4 rounded-2xl mb-2 flex flex-col items-center shadow">
            <div className="font-bold text-2xl">
              ✅ {t('socket.ui.freeTrialPanel.your_free_trial_is')}{' '}
              <span className="underline">{t('socket.ui.freeTrialPanel.active_caps')}</span>!
            </div>
            <div className="mt-2">
              <span className="text-yellow-500 underline whitespace-nowrap">
                {t('socket.ui.freeTrialPanel.click_to_view_credentials')}
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* ❌ EXPIRED or DISABLED */}
      {(freeTrialStatus === 'expired' || freeTrialStatus === 'disabled') && (
        <div
          className="bg-red-200 text-red-900 w-full p-4 rounded-2xl mb-2 flex flex-col items-center shadow"
          role="status"
          aria-live="polite"
        >
          <div className="font-bold text-lg">
            🚫 {t('socket.ui.freeTrialPanel.your_free_trial_has')}{' '}
            <span className="underline">{t('socket.ui.freeTrialPanel.expired_caps')}</span>{' '}
            {t('socket.ui.freeTrialPanel.or_is_unavailable')}
          </div>
        </div>
      )}

      {/* 🎟️ Request Button if no active/pending trial */}
      {!freeTrialStatus && <FreeTrialButton user_id={user_id} refreshStatus={refreshStatus} />}

      {/* ⚠️ Error Display */}
      {error && (
        <div className="mt-2 text-red-600 flex gap-2 items-center" role="alert">
          <span aria-hidden>❗</span> {String(error)}
        </div>
      )}
    </div>
  );
}
