/**
 *   ======================= page.js ========================
 * 🛡️
 * USER FREE TRIAL REQUEST PAGE
 * ----------------------------------------------------------
 * - Renders user's free trial status in a clean card.
 * - No direct font classes—uses bold/semantic tags.
 * - Status always shown at the top if trial exists.
 * - Uses app-wide loader only (showLoader/hideLoader).
 * ==========================================================
 */

'use client';

import { useSession } from 'next-auth/react';
import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '@/lib/axiosInstance';
import RefreshCountdownTimer from '@/components/reusableUI/RefreshCountdownTimer';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';

export default function UserFreeTrialRequestPage() {
  // 🟢 Auth/session logic
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('user');
  const router = useRouter();

  // 🟡 Local state: trial + loading
  const [freeTrial, setFreeTrial] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🌀 Global loader/app message handler
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  // 🔄 Fetch latest free trial (callback to keep ref stable)
  const fetchFreeTrial = useCallback(async () => {
    setLoading(true);
    showLoader({ text: 'Checking your free trial status...' });
    try {
      const { data } = await axiosInstance.get('/api/user/freeTrials');
      setFreeTrial(data); // null if not found
    } catch (error) {
      setFreeTrial(null);
      displayMessage('Failed to load your free trial status.', 'error');
    } finally {
      setLoading(false);
      hideLoader();
    }
  }, [showLoader, hideLoader, displayMessage]);

  // 🚦 On mount: fetch trial after login
  useEffect(() => {
    if (status === 'authenticated') {
      fetchFreeTrial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // 🚧 Redirect if not allowed
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 🛑 If not allowed, render nothing
  if (!isAllowed) return null;

  // ——— MAIN RENDER —————————————————————————
  return (
    <div className="flex flex-col items-center justify-center w-full lg:mt-0 mt-20">
      {/* 🧊 Status Card */}
      <div className="container-style max-w-full lg:max-w-lg mx-auto min-h-[60vh] rounded-2xl shadow-lg p-6">
        {/* 📝 Page Title */}
        <h1 className="text-2xl font-bold mb-6 text-center">🎁 Free Trial Status</h1>
        {/* 🟦 STATUS BADGE AT TOP */}
        {!loading && freeTrial && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <span style={{ fontWeight: 700 }}>Status:</span>
            <span
              className={
                freeTrial.status === 'pending'
                  ? 'text-yellow-600 dark:text-yellow-300'
                  : freeTrial.status === 'active'
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-gray-500'
              }
              style={{ fontWeight: 700, letterSpacing: '0.02em' }}
            >
              {freeTrial.status
                ? freeTrial.status.charAt(0).toUpperCase() + freeTrial.status.slice(1)
                : 'Unknown'}
            </span>
          </div>
        )}

        {/* 🎉 TRIAL GRANTED: Show credentials */}
        {!loading &&
          freeTrial &&
          freeTrial.status === 'active' &&
          freeTrial.free_trial_username &&
          freeTrial.free_trial_password && (
            <div className="flex flex-col gap-4">
              {/* 🥳 Success Title */}
              <div className="flex flex-col gap-1 items-center justify-center">
                <span className="text-3xl">✅</span>
                <span
                  className="text-green-700 dark:text-green-400"
                  style={{ fontWeight: 700, fontSize: '1.13rem' }}
                >
                  Your free trial is ready!
                </span>
              </div>
              {/* 🔑 Credentials – Tailwind only, stylish and readable */}
              <div className="flex w-full items-center justify-center">
                <div className="flex flex-col gap-4 p-3 text-lg items-center justify-center">
                  {/* 👤 Username */}
                  <div className="flex gap-3 items-center">
                    <span className="font-bold min-w-[90px] tracking-wide text-base sm:text-lg">
                      Username:
                    </span>
                    <span className="font-mono text-base sm:text-lg break-all">
                      {freeTrial.free_trial_username}
                    </span>
                  </div>
                  {/* 🔒 Password */}
                  <div className="flex gap-3 items-center">
                    <span className="font-bold min-w-[90px] tracking-wide text-base sm:text-lg">
                      Password:
                    </span>
                    <span className="font-mono text-base sm:text-lg break-all">
                      {freeTrial.free_trial_password}
                    </span>
                  </div>
                  {/* 🌐 URL (optional) */}
                  {freeTrial.free_trial_url && (
                    <div className="flex gap-3 items-center">
                      <span className="font-bold min-w-[90px] tracking-wide text-base sm:text-lg">
                        URL:
                      </span>
                      <span className="text-base sm:text-lg break-all">
                        {freeTrial.free_trial_url}
                      </span>
                    </div>
                  )}
                  {/* 📝 Other info (optional) */}
                  {freeTrial.free_trial_other && (
                    <div className="flex gap-3 items-center">
                      <span className="font-bold min-w-[90px] tracking-wide text-base sm:text-lg">
                        Other info:
                      </span>
                      <span className="text-base sm:text-lg">{freeTrial.free_trial_other}</span>
                    </div>
                  )}
                  {/* 🗓️ Dates */}
                  <div className="flex flex-col gap-1 mt-2 text-sm text-black text-center">
                    <div>
                      <strong className="tracking-wide">Start:</strong>{' '}
                      {freeTrial.startDate ? new Date(freeTrial.startDate).toLocaleString() : '—'}
                    </div>
                    <div>
                      <strong className="tracking-wide">End:</strong>{' '}
                      {freeTrial.endDate ? new Date(freeTrial.endDate).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ⏳ PENDING: Waiting for credentials */}
        {!loading &&
          freeTrial &&
          (!freeTrial.free_trial_username || !freeTrial.free_trial_password) && (
            <div className="flex flex-col gap-5 items-center justify-center">
              <span className="text-3xl">⏳</span>
              <span className="text-yellow-600 dark:text-yellow-300" style={{ fontWeight: 600 }}>
                Your free trial request is being processed...
              </span>
              <RefreshCountdownTimer
                onRefresh={fetchFreeTrial}
                intervalSeconds={3600}
                showManualRefreshButton={true}
                className="mt-1"
              />
              <div className="text-xs text-center">
                This page will auto-refresh every hour.
                <br />
                As soon as your free trial information is ready, it will appear here!
              </div>
            </div>
          )}

        {/* 🚫 DISABLED/EXPIRED: Show expired message */}
        {!loading && freeTrial && freeTrial.status === 'disabled' && (
          <div className="flex flex-col gap-4 items-center justify-center">
            <span className="text-3xl">❌</span>
            <span className="text-red-600 dark:text-red-400 font-bold">
              Your free trial has expired.
            </span>
            <span className="text-md text-gray-400 text-center">
              You have already used your free trial. Please purchase a subscription to continue
              enjoying our service!
            </span>

            <div className="mt-2 text-md text-gray-500">
              Expired Credentials:
              <br />
              Username: {freeTrial.free_trial_username}
              <br />
              Password: {freeTrial.free_trial_password}
            </div>
          </div>
        )}

        {/* 🙅‍♂️ NO TRIAL */}
        {!loading && !freeTrial && (
          <div className="flex flex-col gap-4 items-center">
            <span className="text-3xl">🙅‍♂️</span>
            <span>No free trial request found.</span>
            <span className="text-xs text-gray-400 text-center">
              If you believe this is a mistake, please contact support.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
