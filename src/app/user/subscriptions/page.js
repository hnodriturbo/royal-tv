/**
 * ============================================
 * 📦 UserSubscriptionsMainPage.js
 * --------------------------------------------
 * Shows all fields for each user subscription!
 * - Fully updated to use new schema fields
 * - All info shown (if present)
 * - Payments listed per subscription
 * ============================================
 */
'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/reusableUI/Pagination';
import { userSubscriptionSortOptions, getUserSubscriptionSortFunction } from '@/lib/sorting';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import { useSearchParams } from 'next/navigation';
import Countdown from '@/components/ui/countdown/Countdown';
import RefreshCountdownTimer from '@/components/reusableUI/RefreshCountdownTimer';
import calculateMonthsDaysLeft from '@/lib/calculateMonthsDaysLeft';
import UserSubscriptionPanel from '@/components/reusableUI/socket/UserSubscriptionPanel';

export default function UserSubscriptionsMainPage() {
  // 🧑‍💻 Auth/session logic
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('user');
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  // 📦 Subscriptions state
  const [subscriptions, setSubscriptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('status_active_first');

  // ✅ Banner logic for payment
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(searchParams.get('paymentSuccess') === '1');
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // 🧪 Expiry helper — safe anywhere
  const isExpiredDate = (value) => {
    // 🧷 Parse defensively
    const d = value ? new Date(value) : null;
    // ⛔ Invalid or missing? Not expired
    if (!(d instanceof Date) || isNaN(d)) return false;
    // ⏰ Compare to now
    return d <= new Date();
  };

  // 📥 Fetch user subscriptions
  const fetchSubscriptions = async () => {
    try {
      showLoader({ text: 'Loading subscriptions...' });
      const res = await axiosInstance.get('/api/user/subscriptions');
      setSubscriptions(res.data.subscriptions || []);
      displayMessage('Subscriptions loaded!', 'success');
    } catch (err) {
      displayMessage(
        `Failed to load subscriptions${err?.response?.data?.error ? `: ${err.response.data.error}` : ''}`,
        'error'
      );
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchSubscriptions();
    }
  }, [status, isAllowed]);

  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 🔀 Sort logic
  const sortedSubscriptions = [...subscriptions].sort(getUserSubscriptionSortFunction(sortOrder));
  const pageSize = 5;
  const totalPages = Math.ceil(sortedSubscriptions.length / pageSize);
  const pagedSubscriptions = sortedSubscriptions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [sortOrder]);

  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* 🎉 Payment Success Banner */}
      {showSuccess && (
        <div className="max-w-3xl w-full">
          <div className="rounded-xl shadow-lg bg-green-600 bg-opacity-80 text-white p-6 mb-6 flex flex-col items-center">
            <span className="text-4xl mb-2">🎉</span>
            <h2 className="text-2xl font-bold mb-2 text-center">Payment Successful!</h2>
            <p className="text-center text-lg mb-2">
              Your payment was received and your subscription is now pending admin approval.
              <br />
              This page will refresh automatically every hour! You will get notified of any changes.
            </p>
            <Countdown seconds={30} onComplete={() => setShowSuccess(false)} />
            <p className="text-center mt-2 text-sm text-white/80">
              This will disappear in 30 seconds.
            </p>
          </div>
        </div>
      )}

      <div className="container-style lg:w-10/12 w-11/12 max-w-2xl">
        {/* 🏷️ Title */}
        <div className="flex flex-col items-center text-center justify-center w-full">
          <h1 className="text-black lg:text-5xl text-3xl mb-0 tracking-widest font-extrabold">
            Your Subscriptions
          </h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        {/* 🃏 Subscription Cards */}
        <div className="flex flex-col gap-8 w-full mt-6">
          {/* 🚫 No subscriptions message */}
          {pagedSubscriptions.length === 0 && (
            <div className="lg:w-[600px] w-full mx-auto">
              <UserSubscriptionPanel user_id={session?.user?.user_id} />
            </div>
          )}

          {/* 🃏 Sorting Dropdown (only if there are subscriptions) */}
          {pagedSubscriptions.length > 1 && (
            <div className="flex justify-end w-full mb-4">
              <SortDropdown
                options={userSubscriptionSortOptions}
                value={sortOrder}
                onChange={setSortOrder}
              />
            </div>
          )}

          {/* 🃏 Subscription Cards - Free Trial style for each subscription */}
          <div className="flex flex-col gap-8 w-full mt-6">
            {pagedSubscriptions.map((sub) => {
              // 🧭 Parse & guards
              const expiringDate = sub?.expiring_at ? new Date(sub.expiring_at) : null;
              const hasValidExpiry = expiringDate instanceof Date && !isNaN(expiringDate);
              const isValidFutureExpiry = hasValidExpiry && expiringDate > new Date();

              // ⏳ Time left only when truly in the future
              const timeLeft = isValidFutureExpiry ? calculateMonthsDaysLeft(expiringDate) : null;

              // 🌈 Border & background by status
              let borderColor = 'border-gray-400',
                bgColor = 'bg-black';
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

              // 🏷️ Status label
              let statusLabel = '';
              if (sub.status === 'active') statusLabel = '✅ ACTIVE';
              else if (sub.status === 'pending') statusLabel = '🕒 PENDING';
              else if (sub.status === 'expired') statusLabel = '❌ EXPIRED';
              else if (sub.status === 'disabled') statusLabel = '🚫 DISABLED';
              else statusLabel = `❔ ${sub.status?.toUpperCase()}`;

              return (
                <div
                  key={sub.subscription_id}
                  className={`relative flex flex-col ${borderColor} border-4 rounded-2xl mb-8 p-4 shadow overflow-hidden`}
                >
                  {/* 🟢 Overlay */}
                  <div className="absolute inset-0 bg-black/60 z-0 rounded-2xl pointer-events-none" />
                  {/* 🟩 Card content (fully opaque) */}
                  <div className="relative z-10">
                    {/* === HEADER - Status and Package Name === */}
                    <div className="flex flex-col gap-1 items-center justify-center mb-4">
                      <span className="text-wonderful-5">
                        {statusLabel === '✅ ACTIVE'
                          ? '✅'
                          : statusLabel === '🕒 PENDING'
                            ? '🕒'
                            : statusLabel === '❌ EXPIRED'
                              ? '❌'
                              : statusLabel === '🚫 DISABLED'
                                ? '🚫'
                                : '❔'}{' '}
                        <span className="text-3xl text-glow-soft">
                          {statusLabel.replace(/^[^ ]+ /, '')}
                        </span>
                      </span>
                      <span className="font-bold text-2xl tracking-wide mt-1">
                        {sub.order_description || sub.package_name} Subscription
                        {/* ⏳ Only show "(X left)" when we actually have time left */}
                        {timeLeft && (
                          <span className="text-base text-green-200 font-semibold ms-5">
                            ({timeLeft} left)
                          </span>
                        )}
                        {/* ❌ Only show (Expired) if date exists and is truly past */}
                        {!timeLeft && isExpiredDate(sub.expiring_at) && (
                          <span className="text-base text-red-300 font-semibold ms-5">
                            (Expired)
                          </span>
                        )}
                      </span>
                    </div>
                    {/* === GRID OF FIELDS === */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full max-w-2xl mx-auto lg:text-lg text-base">
                      {/* --- Basic fields, exactly like free trial but more --- */}
                      {sub.username && (
                        <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                            👤 Username:
                          </span>
                          <span className="font-mono font-bold flex items-center tracking-wide">
                            {sub.username}
                          </span>
                        </>
                      )}
                      {sub.password && (
                        <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                            🔑 Password:
                          </span>
                          <span className="font-mono font-bold flex items-center tracking-wide">
                            {sub.password}
                          </span>
                        </>
                      )}
                      {sub.portal_link && (
                        <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                            🌐 Portal Link:
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.portal_link}
                          </span>
                        </>
                      )}
                      {sub.dns_link && (
                        <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                            🔗 DNS Link:
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.dns_link}
                          </span>
                        </>
                      )}
                      {sub.dns_link_for_samsung_lg && (
                        <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                            📺 Samsung/LG DNS:
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.dns_link_for_samsung_lg}
                          </span>
                        </>
                      )}
                      {sub.mac_address && (
                        <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                            💻 MAC Address:
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.mac_address}
                          </span>
                        </>
                      )}
                      {/*                       {sub.package_id && (
                        <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                            🆔 Package ID:
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.package_id}
                          </span>
                        </>
                      )}
                      {sub.megaott_id && (
                        <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                            📌 MegaOTT ID:
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.megaott_id}
                          </span>
                        </>
                      )} */}
                      {sub.template && (
                        <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                            🧩 Template:
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.template}
                          </span>
                        </>
                      )}
                      {sub.max_connections && (
                        <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                            🔢 Connections:
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.max_connections}
                          </span>
                        </>
                      )}
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        🔞 Adult:
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {sub.adult ? '✅ Yes' : '❌ No'}
                      </span>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        🛡️ VPN:
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {sub.enable_vpn ? '✅ Yes' : '❌ No'}
                      </span>
                      {sub.forced_country && (
                        <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                            🌍 Country:
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.forced_country}
                          </span>
                        </>
                      )}
                      {sub.whatsapp_telegram && (
                        <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                            💬 WhatsApp/Telegram:
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.whatsapp_telegram}
                          </span>
                        </>
                      )}
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        💸 Paid:
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {sub.paid ? '💸 Yes' : '⏳ Not Paid'}
                      </span>
                      {sub.note && (
                        <>
                          <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                            📝 Additional Note:
                          </span>
                          <span className="font-bold flex items-center tracking-wide">
                            {sub.note}
                          </span>
                        </>
                      )}
                      {/* --- Dates --- */}
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        ⏰ Expires At:
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {new Date(sub.expiring_at).toLocaleString()}
                      </span>
                      <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        📆 Created At:
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '--'}
                      </span>
                      {/*                       <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                        📝 Updated At:
                      </span>
                      <span className="font-bold flex items-center tracking-wide">
                        {sub.updatedAt ? new Date(sub.updatedAt).toLocaleString() : '--'}
                      </span> */}
                    </div>
                    {/* === PAYMENTS FIELD BELOW === */}
                    <div className="mt-4">
                      <strong className="text-lg mb-2 block">Payments:</strong>
                      <div className="flex flex-col gap-4">
                        {sub.payments && sub.payments.length > 0 ? (
                          sub.payments.map((pay) => (
                            <div
                              key={pay.id}
                              className="group flex items-center rounded-xl shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 p-3 gap-4"
                            >
                              <div className="flex-1 flex flex-wrap gap-4">
                                <span className="text-xl">🔖 {pay.status?.toUpperCase()}</span>
                                <span className="text-xl">📄 Inv: {pay.invoice_id}</span>
                                {pay.amount_paid && (
                                  <span className="text-xl">
                                    💰 {pay.amount_paid} {pay.pay_currency}
                                  </span>
                                )}
                                {pay.createdAt && (
                                  <span className="text-xl">
                                    ⏰ {new Date(pay.createdAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div>
                                {pay.status === 'confirmed' || pay.status === 'finished' ? (
                                  <span className="text-2xl text-green-400 bg-green-800">✔️</span>
                                ) : pay.status === 'pending' ? (
                                  <span className="text-2xl text-yellow-400">⏳</span>
                                ) : pay.status === 'failed' ? (
                                  <span className="text-2xl text-red-400">❌</span>
                                ) : (
                                  <span className="text-2xl text-gray-400">❔</span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 pl-2">No payments yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🔢 Pagination */}
          <div className="flex justify-center mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
