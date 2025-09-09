/**
 * ============================================
 * 📦 UserSubscriptionsMainPage.js
 * --------------------------------------------
 * Shows all fields for each user subscription!
 * - Uses next-intl via useT() (never in deps)
 * - Replaces hardcoded strings with i18n keys
 * - Keeps REST fetch effect safe from loops
 * ============================================
 */
'use client';import { useRouter, useSearchParams } from "next/navigation";

import { useEffect, useState, useMemo } from 'react'; // 🧰 React hooks
import { useTranslations } from 'next-intl'; // 🌍 root translator (no namespace)
import axiosInstance from '@/lib/core/axiosInstance'; // 🌐 HTTP client
import useAppHandlers from '@/hooks/useAppHandlers'; // 🧯 loaders + toasts
import { useSession } from 'next-auth/react'; // 🔐 auth
import useAuthGuard from '@/hooks/useAuthGuard'; // 🛡️ guard
// 🧭 locale-aware router (project path)
import Pagination from '@/components/reusableUI/Pagination'; // 🔢 pagination
import { userSubscriptionSortOptions, getUserSubscriptionSortFunction } from '@/lib/utils/sorting'; // 🔀 sort utils
import SortDropdown from '@/components/reusableUI/SortDropdown'; // ⬇️ sort dropdown
// 🔎 query params
import Countdown from '@/components/ui/countdown/Countdown'; // ⏳ small timer
import RefreshCountdownTimer from '@/components/reusableUI/RefreshCountdownTimer'; // 🔄 page refresh (kept)
import calculateMonthsDaysLeft from '@/lib/utils/calculateMonthsDaysLeft'; // 🗓️ human time helper
import UserSubscriptionPanel from '@/components/reusableUI/socket/UserSubscriptionPanel'; // 💬 socket panel

export default function UserSubscriptionsMainPage() {
  // 🌍 translator (never in deps)
  const t = useTranslations();

  // 🔐 session + router + guards
  const { data: session, status } = useSession(); // 👤 user session
  const router = useRouter(); // 🧭 locale-aware navigation
  const { isAllowed, redirect } = useAuthGuard('user'); // 🛡️ only users

  // 🧯 UI helpers
  const { showLoader, hideLoader, displayMessage } = useAppHandlers(); // 🍭 toasts + loader

  // 📦 state
  const [subscriptions, setSubscriptions] = useState([]); // 📚 list
  const [currentPage, setCurrentPage] = useState(1); // 🔢 page index
  const [sortOrder, setSortOrder] = useState('status_active_first'); // 🔀 default sort

  // 🎉 banner state from query string
  const searchParams = useSearchParams(); // 🔎 read "?paymentSuccess=1"
  const [showSuccess, setShowSuccess] = useState(searchParams.get('paymentSuccess') === '1'); // ✅ banner toggle
  useEffect(() => {
    // ⏲️ auto-hide after 30s
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]); // ⏳ only depends on flag

  // 🧪 expiry checker (pure)
  const isExpiredDate = (value) => {
    // 🧷 parse defensively
    const d = value ? new Date(value) : null;
    // 🚫 invalid → not expired
    if (!(d instanceof Date) || isNaN(d)) return false;
    // ⏰ compare with now
    return d <= new Date();
  };

  // 📥 fetch subscriptions (REST + i18n messages)
  const fetchSubscriptions = async () => {
    try {
      showLoader({ text: t('app.user.subscriptions.page.loading') }); // 🚚 i18n loading
      const res = await axiosInstance.get('/api/user/subscriptions'); // 🌐 GET
      setSubscriptions(res.data.subscriptions || []); // 🧺 store list
      displayMessage(t('app.user.subscriptions.page.loaded'), 'success'); // ✅ toast
    } catch (err) {
      // ❗ compose error UI text with translated prefix
      const prefix = t('app.user.subscriptions.page.load_failed');
      const serverError = err?.response?.data?.error ? `: ${err.response.data.error}` : '';
      displayMessage(`${prefix}${serverError}`, 'error');
    } finally {
      hideLoader(); // 🧹 cleanup
    }
  };

  // 🔀 sorted + paged views (memo keeps it snappy)
  const sortedSubscriptions = useMemo(
    () => [...subscriptions].sort(getUserSubscriptionSortFunction(sortOrder)),
    [subscriptions, sortOrder]
  ); // 🧮 order list

  const pageSize = 5; // 📏 items per page
  const totalPages = Math.ceil(sortedSubscriptions.length / pageSize); // 🔢 total
  const pagedSubscriptions = useMemo(
    () => sortedSubscriptions.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedSubscriptions, currentPage]
  ); // 🧩 window

  // 🔁 reset page when sort changes
  useEffect(() => {
    setCurrentPage(1); // ⤴️ back to first
  }, [sortOrder]);

  // 🚪 run fetch once when allowed
  useEffect(() => {
    // 🔒 only after auth resolves and guard allows
    if (status === 'authenticated' && isAllowed) {
      fetchSubscriptions(); // 📡 fetch
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed]); // 🧵 minimal deps

  // ↩️ redirect when not allowed (after auth settles)
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect); // 🧭 send away
    }
  }, [status, isAllowed, redirect, router]); // ✅ safe deps

  // 🛡️ SSR-safe guard
  if (!isAllowed) return null; // 🚪 nothing if not allowed

  return (
    <div className="flex flex-col items-center justify-center w-full lg:mt-0 mt-12">
      {/* 🎉 Payment Success Banner */}
      {showSuccess &&
      <div className="max-w-3xl w-full">
          <div className="rounded-xl shadow-lg bg-green-600 bg-opacity-80 text-white p-6 mb-6 flex flex-col items-center">
            <span className="text-4xl mb-2">🎉</span>
            <h2 className="text-2xl font-bold mb-2 text-center">
              {t('app.user.subscriptions.page.payment_success_title')}
            </h2>
            <p className="text-center text-lg mb-2 whitespace-pre-line">
              {t('app.user.subscriptions.page.payment_success_message')}
            </p>
            <Countdown seconds={30} onComplete={() => setShowSuccess(false)} />
            <p className="text-center mt-2 text-sm text-white/80">
              {t('app.user.subscriptions.page.disappear_notice')}
            </p>
          </div>
        </div>
      }

      <div className="container-style lg:w-10/12 w-11/12 max-w-3xl">
        {/* 🏷️ Title */}
        <div className="flex flex-col items-center text-center justify-center w-full">
          <h1 className="text-black lg:text-5xl text-3xl mb-0 tracking-widest font-extrabold">
            {t('app.user.subscriptions.page.title')}
          </h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        {/* 🃏 Subscription Cards */}
        <div className="flex flex-col gap-8 w-full mt-6">
          {/* 🚫 No subscriptions message → show socket panel */}
          {subscriptions.length === 0 && // ✅ compare length, not array to number
          <div className="lg:w-[600px] w-full mx-auto">
              <UserSubscriptionPanel user_id={session?.user?.user_id} />
            </div>
          }

          {/* 🔽 Sorter (only if there are multiple on this page) */}
          {pagedSubscriptions.length > 1 &&
          <div className="flex justify-end w-full mb-4">
              <SortDropdown
              options={userSubscriptionSortOptions}
              value={sortOrder}
              onChange={setSortOrder} />
            
            </div>
          }

          {/* 🗂️ Subscription items */}
          <div className="flex flex-col gap-8 w-full mt-6">
            {pagedSubscriptions.map((sub) => {
              // 🧭 parse + guards
              const expiringDate = sub?.expiring_at ? new Date(sub.expiring_at) : null; // 📅 raw to Date
              const hasValidExpiry = expiringDate instanceof Date && !isNaN(expiringDate); // ✅ validity
              const isValidFutureExpiry = hasValidExpiry && expiringDate > new Date(); // 🔮 future?
              const timeLeft = isValidFutureExpiry ? calculateMonthsDaysLeft(expiringDate) : null; // 🗓️ human

              // 🎨 card color by status
              let borderColor = 'border-gray-400';
              let bgColor = 'bg-black';
              if (sub.status === 'active') {
                borderColor = 'border-green-700';
                bgColor = 'bg-black';
              } else if (sub.status === 'pending') {
                borderColor = 'border-yellow-500';
                bgColor = 'bg-yellow-100/10';
              } else if (sub.status === 'expired' || sub.status === 'disabled') {
                borderColor = 'border-red-700';
                bgColor = 'bg-red-100/10';
              }

              return (
                <div
                  key={sub.subscription_id}
                  className={`relative flex flex-col ${borderColor} border-4 rounded-2xl mb-8 p-4 shadow overflow-hidden`}>
                  
                  {/* 🟢 Overlay */}
                  <div className="absolute inset-0 bg-black/60 z-0 rounded-2xl pointer-events-none" />

                  {/* 📦 Content */}
                  <div className="relative z-10">
                    {/* === HEADER === */}
                    <div className="flex flex-col gap-1 items-center justify-center mb-4">
                      {/* 🏷️ Status label */}
                      <span className="text-wonderful-5">
                        <span className="text-3xl text-glow-soft">
                          {t(`app.user.subscriptions.status.${sub.status || 'unknown'}`)}
                        </span>
                      </span>

                      <span className="font-bold text-2xl tracking-wide mt-1">
                        {sub.order_description || sub.package_name}{' '}
                        {t('app.user.subscriptions.page.pageTitle')}
                        {/* ⏳ show left-time only when valid */}
                        {timeLeft &&
                        <span className="text-base text-green-200 font-semibold ms-5">
                            ({timeLeft} {t('common.time.left')})
                          </span>
                        }
                        {/* ❌ show expired when past */}
                        {!timeLeft && isExpiredDate(sub.expiring_at) &&
                        <span className="text-base text-red-300 font-semibold ms-5">
                            ({t('app.user.subscriptions.status.expired')})
                          </span>
                        }
                      </span>
                    </div>

                    {/* === GRID OF FIELDS (localized labels) === */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full max-w-2xl mx-auto lg:text-lg text-base">
                      {/* 🔤 username */}
                      {sub.username &&
                      <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2">
                            <span className="me-2">👤</span>{' '}
                            {t('app.user.subscriptions.fields.username_label')}
                          </span>
                          <span className="font-mono font-bold flex items-center tracking-wide">
                            {sub.username}
                          </span>
                        </>
                      }

                      {/* 🔐 password */}
                      {sub.password &&
                      <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2">
                            <span className="me-2">🔑</span>{' '}
                            {t('app.user.subscriptions.fields.password_label')}
                          </span>
                          <span className="font-mono font-bold flex items-center tracking-wide">
                            {sub.password}
                          </span>
                        </>
                      }

                      {/* 🌐 portal link */}
                      {sub.portal_link &&
                      <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2 text-left">
                            <span className="me-2">🌐</span>{' '}
                            {t('app.user.subscriptions.fields.portal_link_label')}
                          </span>
                          <span className="font-bold flex items-center tracking-wide break-all text-left">
                            {sub.portal_link}
                          </span>
                        </>
                      }

                      {/* 🔗 DNS link */}
                      {sub.dns_link &&
                      <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2 text-left">
                            <span className="me-2">🔗</span>{' '}
                            {t('app.user.subscriptions.fields.dns_link_label')}
                          </span>
                          <span className="font-bold flex items-center tracking-wide break-all text-left">
                            {sub.dns_link}
                          </span>
                        </>
                      }

                      {/* 📺 Samsung/LG DNS */}
                      {sub.dns_link_for_samsung_lg &&
                      <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2 text-left">
                            <span className="me-2">📺</span>{' '}
                            {t('app.user.subscriptions.fields.samsung_lg_dns_label')}
                          </span>
                          <span className="font-bold flex items-center tracking-wide break-all text-left">
                            {sub.dns_link_for_samsung_lg}
                          </span>
                        </>
                      }

                      {/* 💻 MAC address */}
                      {sub.mac_address &&
                      <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2 text-left">
                            <span className="me-2">💻</span>{' '}
                            {t('app.user.subscriptions.fields.mac_address_label')}
                          </span>
                          <span className="font-bold flex items-center tracking-wide text-left">
                            {sub.mac_address}
                          </span>
                        </>
                      }

                      {/* 🧩 template */}
                      {sub.template &&
                      <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2">
                            <span className="me-2">🧩</span>{' '}
                            {t('app.user.subscriptions.fields.template_label')}
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.template}
                          </span>
                        </>
                      }

                      {/* 🔢 connections */}
                      {sub.max_connections &&
                      <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2">
                            <span className="me-2">🔢</span>{' '}
                            {t('app.user.subscriptions.fields.connections_label')}
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.max_connections}
                          </span>
                        </>
                      }

                      {/* 🔞 adult */}
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2">
                          <span className="me-2">🔞</span>{' '}
                          {t('app.user.subscriptions.fields.adult_label')}
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.adult ?
                          t('app.user.subscriptions.fields.yes') :
                          t('app.user.subscriptions.fields.no')}
                        </span>
                      </>

                      {/* 🛡️ VPN protection */}
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2">
                          <span className="me-2">🛡️</span>{' '}
                          {t('app.user.subscriptions.fields.vpn_label')}
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.enable_vpn ?
                          t('app.user.subscriptions.fields.yes') :
                          t('app.user.subscriptions.fields.no')}
                        </span>
                      </>

                      {/* 🌍 country */}
                      {sub.forced_country &&
                      <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2">
                            <span className="me-2">🌍</span>{' '}
                            {t('app.user.subscriptions.fields.country_label')}
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.forced_country === 'ALL' ?
                          t('app.user.subscriptions.fields.country_all') :
                          sub.forced_country}
                          </span>
                        </>
                      }

                      {/* 💬 WhatsApp / Telegram */}
                      {sub.whatsapp_telegram &&
                      <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2">
                            <span className="me-2">💬</span>{' '}
                            {t('app.user.subscriptions.fields.whatsapp_telegram_label')}
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.whatsapp_telegram}
                          </span>
                        </>
                      }

                      {/* 💸 paid */}
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2">
                          <span className="me-2">💸</span>{' '}
                          {t('app.user.subscriptions.fields.paid_label')}
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.paid ?
                          t('app.user.subscriptions.fields.paid_yes') :
                          t('app.user.subscriptions.fields.paid_no')}
                        </span>
                      </>

                      {/* 📝 note */}
                      {sub.note &&
                      <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2">
                            <span className="me-2">📝</span>{' '}
                            {t('app.user.subscriptions.fields.note_label')}
                          </span>
                          <span className="font-bold flex items-center tracking-wide text-left">
                            {sub.note}
                          </span>
                        </>
                      }

                      {/* ⏰ expires at */}
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2">
                        <span className="me-2">⏰</span>{' '}
                        {t('app.user.subscriptions.fields.expires_at_label')}
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {sub.expiring_at ? new Date(sub.expiring_at).toLocaleString() : '--'}
                      </span>

                      {/* 📆 created at */}
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm me-2">
                        <span className="me-2">📆</span>{' '}
                        {t('app.user.subscriptions.fields.created_at_label')}
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '--'}
                      </span>
                    </div>

                    {/* ⚡ Divider between bottom of subscription and top of payment info  */}
                    <div className="col-span-2 my-4">
                      <hr className="border-gray-500 border-1" />
                    </div>

                    {/* 💳 payments list */}
                    <div className="mt-4">
                      <strong className="text-lg mb-2 block">
                        {t('app.user.subscriptions.fields.payment_title')}
                      </strong>
                      <div className="flex flex-col gap-4 justify-center items-center p-1">
                        {sub.payments && sub.payments.length > 0 ?
                        sub.payments.map((pay) =>
                        <div
                          key={pay.id}
                          className="flex items-center justify-between text-center rounded-xl shadow-lg bg-gradient-to-br from-gray-600 to-gray-900 border border-gray-600 p-3 gap-4 w-full">
                          
                              {/* 📊 Payment info block */}
                              <div className="grid grid-cols-2 gap-4 justify-center text-center flex-1">
                                {/* ✅ Payment status */}
                                <span className="text-lg">
                                  <span className="me-1">🔖</span>
                                  {t('app.user.subscriptions.fields.payment_status_label')}
                                  <br />
                                  {pay.status}
                                </span>

                                {/* Invoice ID */}
                                <span className="text-lg">
                                  <span className="me-1">📄</span>
                                  {t('app.user.subscriptions.fields.payment_invoice_label')}
                                  <br />
                                  {pay.invoice_id}
                                </span>

                                {/* ⚡ Divider */}
                                <div className="col-span-2 my-1">
                                  <hr className="border-gray-500 border-1" />
                                </div>

                                {/* Amount paid */}
                                {pay.amount_paid &&
                            <span className="text-lg">
                                    <span className="me-1">💰</span>
                                    {t('app.user.subscriptions.fields.payment_amount_label')}
                                    <br />
                                    {pay.amount_paid} {pay.pay_currency}
                                  </span>
                            }

                                {/* Paid At */}
                                {pay.updatedAt &&
                            <span className="text-lg">
                                    <span className="me-1">⏰</span>
                                    {t('app.user.subscriptions.fields.payment_created_label')}
                                    <br />
                                    {new Date(pay.updatedAt).toLocaleString()}
                                  </span>
                            }
                              </div>

                              {/* 🟢 Status emoji (always right) */}
                              <div className="shrink-0">
                                {pay.status === 'confirmed' ||
                            pay.status === 'finished' ||
                            pay.status === 'completed' ?
                            <span className="text-2xl">✅</span> :
                            pay.status === 'pending' ?
                            <span className="text-2xl">⏳</span> :
                            pay.status === 'failed' ?
                            <span className="text-2xl">❌</span> :

                            <span className="text-2xl">❔</span>
                            }
                              </div>
                            </div>
                        ) :

                        <span className="text-gray-400 pl-2">
                            {t('app.user.subscriptions.fields.payment_none')}
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                </div>);

            })}
          </div>

          {/* 🔢 Pagination */}
          <div className="flex justify-center mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage} />
            
          </div>
        </div>
      </div>
    </div>);

}