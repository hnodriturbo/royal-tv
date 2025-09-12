/**
 *   ======================= page.js ========================
 * 🛡️ USER FREE TRIAL DETAILS PAGE (2025 schema, full info)
 * ----------------------------------------------------------
 * - Renders user's free trial in a styled card.
 * - All fields, grouped, status always shown at the top.
 * - No auto-refresh; always says "ready" if API succeeded.
 * - Uses app-wide loader only (showLoader/hideLoader).
 * ==========================================================
 */

'use client';
import { useRouter } from 'next/navigation';

import { useSession } from 'next-auth/react';
import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';

import { useTranslations } from 'next-intl'; // 🌍 translation

export default function UserFreeTrialDetailsPage() {
  // 🔐 Session & auth guard
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('user');
  const router = useRouter();

  // 🧠 Local state
  const [freeTrial, setFreeTrial] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🧰 Global handlers
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  // 🌍 Translator root
  const t = useTranslations();

  // 🔄 Fetch trial from API
  const fetchFreeTrial = useCallback(async () => {
    setLoading(true);
    showLoader({ text: t('app.user.freeTrials.page.checking_status') }); // 🌀 localized loader
    try {
      const { data } = await axiosInstance.get('/api/user/freeTrials');
      setFreeTrial(data || null);
    } catch {
      setFreeTrial(null);
      displayMessage(t('app.user.freeTrials.page.load_failed'), 'error');
    } finally {
      setLoading(false);
      hideLoader();
    }
  }, [showLoader, hideLoader, displayMessage, t]);

  // 🚦 On mount if authenticated
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchFreeTrial();
    }
  }, [status, isAllowed]);

  // ↩️ redirect when not allowed (after auth settles)
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect); // 🧭 send away
    }
  }, [status, isAllowed, redirect, router]); // ✅ safe deps

  // 🛡️ SSR-safe guard
  if (!isAllowed) return null; // 🚪 nothing if not allowed

  // ——— RENDER ———
  return (
    <div className="flex flex-col items-center justify-center w-full lg:mt-0 mt-20">
      <div className="container-style max-w-full lg:max-w-2xl mx-auto min-h-fit rounded-2xl shadow-lg p-6">
        {/* 🎁 Heading */}
        <h1 className="font-bold mb-6 text-center text-4xl">
          {t('app.user.freeTrials.page.details_heading')}
        </h1>

        {/* ✅ Active Trial */}
        {!loading &&
          freeTrial &&
          freeTrial.status !== 'disabled' &&
          freeTrial.status !== 'expired' && (
            <div className="relative flex flex-col border-4 border-green-700 rounded-2xl mb-6 p-4 shadow overflow-hidden">
              <div className="absolute inset-0 bg-black/60 z-0 rounded-2xl pointer-events-none" />
              <div className="relative z-10 whitespace-nowrap">
                <div className="flex flex-col gap-1 items-center justify-center mb-4">
                  <span className="text-wonderful-5">
                    ✅{' '}
                    <span className="text-3xl text-glow-soft">
                      {t('app.user.freeTrials.page.ready_title')}
                    </span>
                  </span>
                </div>

                {/* ℹ️ Trial details */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full max-w-lg mx-auto lg:text-lg">
                  {/* 👤 Username */}
                  <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                    👤 {t('app.user.freeTrials.page.username')}
                  </span>
                  <span className="font-mono font-bold flex items-center tracking-wide">
                    {freeTrial.username}
                  </span>

                  {/* 🔑 Password */}
                  <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                    🔑 {t('app.user.freeTrials.page.password')}
                  </span>
                  <span className="font-mono font-bold flex items-center tracking-wide">
                    {freeTrial.password}
                  </span>

                  {/* 🌐 Portal Link */}
                  {freeTrial.portal_link && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        🌐 {t('app.user.freeTrials.page.portal_link')}
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.portal_link}
                      </span>
                    </>
                  )}

                  {/* 🔗 DNS Link */}
                  {freeTrial.dns_link && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        🔗 {t('app.user.freeTrials.page.dns_link')}
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.dns_link}
                      </span>
                    </>
                  )}

                  {/* 📺 Samsung/LG DNS */}
                  {freeTrial.dns_link_for_samsung_lg && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        📺 {t('app.user.freeTrials.page.dns_link_samsung_lg')}
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.dns_link_for_samsung_lg}
                      </span>
                    </>
                  )}

                  {/* 📦 Package */}
                  {freeTrial.package_name && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        📦 {t('app.user.freeTrials.page.package')}
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.package_name}
                      </span>
                    </>
                  )}

                  {/* 💻 MAC */}
                  {freeTrial.mac_address && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        💻 {t('app.user.freeTrials.page.mac_address')}
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.mac_address}
                      </span>
                    </>
                  )}

                  {/* 🗒️ Note */}
                  {freeTrial.note && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        🗒️ {t('app.user.freeTrials.page.note')}
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.note}
                      </span>
                    </>
                  )}

                  {/* 💬 WhatsApp/Telegram */}
                  {freeTrial.whatsapp_telegram && (
                    <>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        💬 {t('app.user.freeTrials.page.whatsapp_telegram')}
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {freeTrial.whatsapp_telegram ||
                          session?.user?.whatsapp ||
                          session?.user?.telegram}
                      </span>
                    </>
                  )}

                  {/* ⏰ Expiring At */}
                  <>
                    <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                      ⏰ {t('app.user.freeTrials.page.expiring_at')}
                    </span>
                    <span className="font-bold flex items-center tracking-wide">
                      {freeTrial.expiring_at
                        ? new Date(freeTrial.expiring_at).toLocaleString()
                        : t('app.user.freeTrials.page.expiring_on_login')}
                    </span>
                  </>

                  {/* 🎯 Claimed At */}
                  <>
                    <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                      🎯 {t('app.user.freeTrials.page.claimed_at')}
                    </span>
                    <span className="font-bold flex items-center tracking-wide">
                      {new Date(freeTrial.claimedAt).toLocaleString()}
                    </span>
                  </>

                  {/* 📝 Updated At */}
                  <>
                    <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                      📝 {t('app.user.freeTrials.page.updated_at')}
                    </span>
                    <span className="font-bold flex items-center tracking-wide">
                      {new Date(freeTrial.updatedAt).toLocaleString()}
                    </span>
                  </>
                </div>
              </div>
            </div>
          )}

        {/* ❌ Expired */}
        {!loading &&
          freeTrial &&
          (freeTrial.status === 'disabled' || freeTrial.status === 'expired') && (
            <div className="flex flex-col border-4 border-red-700 bg-red-300 rounded-2xl mb-6 p-4 shadow">
              <span className="text-3xl">❌</span>
              <span className="text-black font-bold">
                {t('app.user.freeTrials.page.expired_title')}
              </span>
              <span className="text-md text-black text-center">
                {t('app.user.freeTrials.page.used_trial')}
                <br />
                <span className="font-bold text-black">
                  {t('app.user.freeTrials.page.purchase_prompt')}
                </span>
              </span>
            </div>
          )}

        {/* 🙅‍♂️ No Trial */}
        {!loading && !freeTrial && (
          <div className="flex flex-col border-4 border-orange-500 bg-orange-300 rounded-2xl mb-6 p-4 shadow">
            <span className="text-3xl">🙅‍♂️</span>
            <span className="text-2xl text-black">
              {t('app.user.freeTrials.page.no_trial_title')}
            </span>
            <span className="text-lg text-center text-black">
              {t('app.user.freeTrials.page.no_trial_message')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
