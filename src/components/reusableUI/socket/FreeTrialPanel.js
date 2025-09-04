/**
 * ===========================================
 * FreeTrialPanel.js
 * 🆓 User Free Trial Status/Request Panel
 * -------------------------------------------
 * - Shows user's current free trial status
 * - Allows requesting a trial (one per user)
 * - Uses real-time socket-powered updates
 * - Localized with i18n client (`useT`)
 * ===========================================
 */

'use client';

import FreeTrialButton from '@/components/reusableUI/FreeTrialButton';
import useFreeTrialStatus from '@/hooks/socket/useFreeTrialStatus';
import clsx from 'clsx';
import { Link } from '@/i18n';
import { useTranslations } from 'next-intl';
import { SafeString } from '@/lib/ui/SafeString';

export default function FreeTrialPanel({ user_id, className }) {
  const t = useTranslations(); // 🌱 root-level translator'use client';
  // 🏷️ Hook for status, error, and refresher
  const { freeTrialStatus, error, refreshStatus } = useFreeTrialStatus(user_id);

  // 🖼️ Panel UI switches based on trial status
  return (
    <div className={clsx('w-full max-w-2xl mx-auto flex flex-col items-center my-2', className)}>
      {/* 📝 Show ACTIVE status */}
      {freeTrialStatus === 'active' && (
        <Link href="/user/freeTrials" className="w-full flex">
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
          </div>{' '}
        </Link>
      )}

      {/* ❌ Show EXPIRED or DISABLED */}
      {(freeTrialStatus === 'expired' || freeTrialStatus === 'disabled') && (
        <div className="bg-red-200 text-red-900 w-full p-4 rounded-2xl mb-2 flex flex-col items-center shadow">
          <div className="font-bold text-lg">
            🚫 {t('socket.ui.freeTrialPanel.your_free_trial_has')}{' '}
            <span className="underline">{t('socket.ui.freeTrialPanel.expired_caps')}</span>{' '}
            {t('socket.ui.freeTrialPanel.or_is_unavailable')}
          </div>
        </div>
      )}

      {/* 🎟️ Show Request Button if no active/pending trial */}
      {!freeTrialStatus && <FreeTrialButton user_id={user_id} refreshStatus={refreshStatus} />}

      {/* ⚠️ Error Display */}
      {error && (
        <div className="mt-2 text-red-600 flex gap-2 items-center">
          {/* <span>❗</span> {error} */}
          <span>❗</span> {SafeText(error, 'FreeTrialPanel.error')}
        </div>
      )}
    </div>
  );
}
