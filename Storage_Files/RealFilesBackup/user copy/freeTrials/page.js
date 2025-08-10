/**
 *   ======================= page.js ========================
 * 🛡️
 * USER FREE TRIAL DETAILS PAGE (2025 schema, full info)
 * ----------------------------------------------------------
 * - Renders user's free trial in a styled card.
 * - All fields, grouped, status always shown at the top.
 * - No auto-refresh; always says "ready" if API succeeded.
 * - Uses app-wide loader only (showLoader/hideLoader).
 * ==========================================================
 */

'use client';

import { useSession } from 'next-auth/react';
import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';

export default function UserFreeTrialDetailsPage() {
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
    if (status === 'authenticated' && isAllowed) {
      fetchFreeTrial();
    }
  }, [status, isAllowed]);

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
      <div className="container-style max-w-full lg:max-w-2xl mx-auto min-h-fit rounded-2xl shadow-lg p-6">
        {/* 🎁 Free Trial Details Heading */}
        <h1 className="font-bold mb-6 text-center text-4xl">🎁 Free Trial Details</h1>

        {/* === READY/ACTIVE TRIAL ALWAYS SHOWS AS "READY" === */}
        {/* === READY/ACTIVE TRIAL ALWAYS SHOWS AS "READY" === */}
        {!loading &&
          freeTrial &&
          freeTrial.status !== 'disabled' &&
          freeTrial.status !== 'expired' && (
            <div className="relative flex flex-col border-4 border-green-700 rounded-2xl mb-6 p-4 shadow overflow-hidden">
              {/* 🔲 Black overlay background, only affects background */}
              <div className="absolute inset-0 bg-black/60 z-0 rounded-2xl pointer-events-none" />
              {/* 💡 Card content stays fully opaque */}
              <div className="relative z-10">
                <div className="flex flex-col gap-1 items-center justify-center mb-4">
                  {/* 🏆 Title with emoji and soft glow */}
                  <span className="text-wonderful-5">
                    ✅ <span className="text-3xl text-glow-soft">Your free trial is ready!</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full max-w-lg mx-auto lg:text-lg">
                  <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                    👤 Username:
                  </span>
                  <span className="font-mono font-bold flex items-center tracking-wide">
                    {freeTrial.username}
                  </span>

                  <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                    🔑 Password:
                  </span>
                  <span className="font-mono font-bold flex items-center tracking-wide">
                    {freeTrial.password}
                  </span>

                  {freeTrial.portal_link && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        🌐 Portal Link:
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.portal_link}
                      </span>
                    </>
                  )}
                  {freeTrial.dns_link && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        🔗 DNS Link:
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.dns_link}
                      </span>
                    </>
                  )}
                  {freeTrial.dns_link_for_samsung_lg && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        📺 DNS Link (Samsung/LG):
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.dns_link_for_samsung_lg}
                      </span>
                    </>
                  )}
                  {freeTrial.package_name && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        📦 Package:
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.package_name}
                      </span>
                    </>
                  )}
                  {freeTrial.mac_address && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        💻 MAC Address:
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.mac_address}
                      </span>
                    </>
                  )}
                  {freeTrial.note && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        🗒️ Note:
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.note}
                      </span>
                    </>
                  )}
                  {freeTrial.whatsapp_telegram && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        💬 WhatsApp/Telegram:
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.whatsapp_telegram ||
                          session?.user?.whatsapp ||
                          session?.user?.telegram}
                      </span>
                    </>
                  )}

                  {/* Expiring At */}
                  <>
                    <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                      ⏰ Expiring At:
                    </span>
                    <span className="font-bold flex items-center tracking-wide">
                      {freeTrial.expiring_at
                        ? new Date(freeTrial.expiring_at).toLocaleString()
                        : 'Will start counting on first login'}
                    </span>
                  </>

                  {/* Claimed At */}
                  <>
                    <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                      🎯 Claimed At:
                    </span>
                    <span className="font-bold flex items-center tracking-wide">
                      {new Date(freeTrial.claimedAt).toLocaleString()}
                    </span>
                  </>

                  {/* Updated At */}
                  <>
                    <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                      📝 Updated At:
                    </span>
                    <span className="font-bold flex items-center tracking-wide">
                      {new Date(freeTrial.updatedAt).toLocaleString()}
                    </span>
                  </>
                </div>
              </div>
            </div>
          )}

        {/* ❌ Disabled/Expired Trial */}
        {!loading &&
          freeTrial &&
          (freeTrial.status === 'disabled' || freeTrial.status === 'expired') && (
            <div className="flex flex-col border-4 border-red-700 bg-red-300 rounded-2xl mb-6 p-4 shadow">
              <span className="text-3xl">❌</span>
              <span className="text-black font-bold">Your free trial has expired.</span>
              <span className="text-md text-black text-center">
                You have already used your free trial.
                <br />
                <span className="font-bold text-black">
                  🛒 Please purchase a subscription to continue enjoying our service!
                </span>
              </span>
            </div>
          )}

        {/* 🙅‍♂️ No Trial Found */}
        {!loading && !freeTrial && (
          <div className="flex flex-col border-4 border-orange-500 bg-orange-300 rounded-2xl mb-6 p-4 shadow">
            <span className="text-3xl">🙅‍♂️</span>
            <span className="text-2xl text-black">No free trial request found.</span>
            <span className="text-lg text-center text-black">
              <span className="font-extrabold text-black">🤔</span> If you believe this is a
              mistake, please contact support.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
