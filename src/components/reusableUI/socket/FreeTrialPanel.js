/**
 * ===========================================
 * FreeTrialPanel.js
 * 🆓 User Free Trial Status/Request Panel
 * -------------------------------------------
 * - Shows user's current free trial status
 * - Allows requesting a trial (one per user)
 * - Uses real-time socket-powered updates
 * - Handles loader, errors, and success states
 * ===========================================
 */

'use client';

import FreeTrialButton from '@/components/reusableUI/FreeTrialButton';
import useFreeTrialStatus from '@/hooks/socket/useFreeTrialStatus';
import clsx from 'clsx';
import Link from 'next/link';

export default function FreeTrialPanel({ user_id, className }) {
  // 🏷️ Hook for status, error, and refresher
  const { freeTrialStatus, error, refreshStatus } = useFreeTrialStatus(user_id);

  // 🖼️ Panel UI switches based on trial status
  return (
    <div
      className={clsx('w-full max-w-[480px] mx-auto flex flex-col items-center my-2', className)}
    >
      {/* 📝 Show ACTIVE status */}
      {freeTrialStatus === 'active' && (
        <div className="bg-green-300 text-green-900 w-full p-4 rounded-2xl mb-2 flex flex-col items-center shadow">
          <div className="font-bold text-lg">
            ✅ Your Free Trial is <span className="underline">ACTIVE</span>!
          </div>
          <div className="mt-2">
            <span className="text-green-700">Enjoy your access 🎉</span>
          </div>
        </div>
      )}

      {/* ⏳ Show PENDING status */}
      {freeTrialStatus === 'pending' && (
        <div className="bg-yellow-200 text-cyan-500 w-full p-4 rounded-2xl mb-2 flex flex-col items-center shadow">
          <div className="font-bold text-lg">
            ⏳ Your Free Trial request is <span>PENDING</span>.
          </div>
          <div className="mt-2">
            <Link href="/user/freeTrials">
              <span className="text-yellow-900">See More Info Here 🕒</span>
            </Link>
          </div>
        </div>
      )}

      {/* ❌ Show EXPIRED or DISABLED */}
      {(freeTrialStatus === 'expired' || freeTrialStatus === 'disabled') && (
        <div className="bg-red-200 text-red-900 w-full p-4 rounded-2xl mb-2 flex flex-col items-center shadow">
          <div className="font-bold text-lg">
            🚫 Your Free Trial has <span className="underline">EXPIRED</span> or is unavailable.
          </div>
        </div>
      )}

      {/* 🎟️ Show Request Button if no active/pending trial */}
      {!freeTrialStatus && <FreeTrialButton user_id={user_id} refreshStatus={refreshStatus} />}

      {/* ⚠️ Error Display */}
      {error && (
        <div className="mt-2 text-red-600 flex gap-2 items-center">
          <span>❗</span> {error}
        </div>
      )}
    </div>
  );
}
