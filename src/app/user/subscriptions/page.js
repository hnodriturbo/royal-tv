/**
 * ==================================
 * 📦 UserSubscriptionsMainPage.js
 * ----------------------------------
 * - Cards for each of this user's subscriptions
 * - Sorting at top (pending, active, expired, etc)
 * - Pagination at bottom
 * ==================================
 */
'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axiosInstance'; // 🪄
import useAppHandlers from '@/hooks/useAppHandlers'; // 🛠️
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
// ✅ Sorting Imports
import Pagination from '@/components/reusableUI/Pagination';
import { userSubscriptionSortOptions, getUserSubscriptionSortFunction } from '@/lib/sorting'; // 🟣 Use sub_xxx sort options only
import SortDropdown from '@/components/reusableUI/SortDropdown';

// ✅ Find the search params if there are any like success of payment
import { useSearchParams } from 'next/navigation'; // For reading the URL query
import Countdown from '@/components/ui/countdown/Countdown'; // My styled countdown
import RefreshCountdownTimer from '@/components/reusableUI/RefreshCountdownTimer';

export default function UserSubscriptionsMainPage() {
  // 👤 Session, router, guard
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('user');
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  // 📦 Subscriptions state
  const [subscriptions, setSubscriptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // 🔢
  const [sortOrder, setSortOrder] = useState('status_active_first');

  // ✅ Search params and search for paymentSuccess=1
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(searchParams.get('paymentSuccess') === '1');

  // Hide the banner after 30 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // 📥 Fetch subscriptions for user
  const fetchSubscriptions = async () => {
    try {
      showLoader({ text: 'Loading subscriptions...' }); // ⏳
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

  // 🚦 Only fetch ONCE when allowed & authenticated
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchSubscriptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed]);

  // 🚦 Redirect if not allowed
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 🧠 Sorted subscriptions (using adminUserSortOptions, but only subs)
  const sortedSubscriptions = [...subscriptions].sort(getUserSubscriptionSortFunction(sortOrder));

  // 📏 Results per page
  const pageSize = 5;
  const totalPages = Math.ceil(sortedSubscriptions.length / pageSize);

  // 🎯 Subscriptions for current page
  const pagedSubscriptions = sortedSubscriptions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 🔄 Reset to first page if sortOrder changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOrder]);

  // ---------- If not allowed, render nothing ----------
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
              This page will refresh automaticly every hour ! You will get notified of any changes.
            </p>
            <Countdown seconds={30} onComplete={() => setShowSuccess(false)} />
            <p className="text-center mt-2 text-sm text-white/80">
              This will disappear in 30 seconds.
            </p>
          </div>
        </div>
      )}

      <div className="container-style max-w-3xl w-full">
        {/* 🏷️ Title & Divider */}
        <div className="flex flex-col items-center text-center justify-center w-full">
          <h1 className="text-wonderful-5 text-2xl mb-0">Your Subscriptions</h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        {/* 🃏 Subscription Cards */}

        <div className="flex flex-col gap-6 w-full mt-6">
          {pagedSubscriptions.length === 0 && (
            <div className="flex flex-col items-center justify-center my-10">
              <RefreshCountdownTimer
                onRefresh={fetchSubscriptions}
                intervalSeconds={3600} // every hour, or use 60 for every minute
                showManualRefreshButton={true}
                className="mt-2"
              />
              <div className="text-lg text-center mt-2">
                This page will auto-refresh every hour.
                <br />
                As soon as your subscription is ready, it will appear here!
              </div>
            </div>
          )}
          {/* 🔀 Sorting Dropdown (only if there are subscriptions) */}
          {pagedSubscriptions.length > 1 && (
            <div className="flex justify-end w-full mb-4">
              <SortDropdown
                options={userSubscriptionSortOptions}
                value={sortOrder}
                onChange={setSortOrder}
              />
            </div>
          )}
          {pagedSubscriptions.map((sub) => (
            <div
              key={sub.subscription_id}
              className="border border-gray-300 rounded-2xl p-5 shadow-md bg-gray-700 text-base-100"
            >
              {/* 🆔 Product & Status */}
              <div className="flex flex-col md:flex-row justify-between mb-2 items-center">
                <div className="w-full text-center flex flex-col items-center">
                  <h3 className="font-semibold text-2xl">
                    {/* 📦 Product/Order */}
                    {sub.product || sub.order_description || 'Subscription'}
                  </h3>
                  <div className="text-lg mt-1">
                    <strong className="me-2">Status:</strong>{' '}
                    <span
                      className={
                        sub.status === 'active'
                          ? 'text-green-200 font-bold bg-green-800'
                          : sub.status === 'pending'
                            ? 'text-yellow-300 font-bold'
                            : sub.status === 'expired'
                              ? 'text-red-400 font-bold'
                              : 'text-gray-400 font-bold'
                      }
                    >
                      {sub.status?.toUpperCase() || 'Unknown'}
                    </span>
                  </div>
                  <div className="text-lg">
                    {/* 🕰️ Dates */}
                    <span>
                      Created {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '--'}
                    </span>
                    {sub.startDate && (
                      <>
                        {' '}
                        | <span>Start {new Date(sub.startDate).toLocaleString()}</span>
                      </>
                    )}
                    {sub.endDate && (
                      <>
                        {' '}
                        | <span>End {new Date(sub.endDate).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* 🧾 Username, Password, URL, Other */}
              <div className="flex flex-col gap-1 text-lg mb-2 mt-2">
                {sub.subscription_username && (
                  <span>
                    <span className="font-bold me-2">Username:</span> {sub.subscription_username}
                  </span>
                )}
                {sub.subscription_password && (
                  <span>
                    <span className="font-bold me-2">Password:</span> {sub.subscription_password}
                  </span>
                )}
                {sub.subscription_url && (
                  <span>
                    <span className="font-bold me-2">URL:</span> {sub.subscription_url}
                  </span>
                )}
                {sub.subscription_other && (
                  <span>
                    <span className="font-bold me-2">Other:</span> {sub.subscription_other}
                  </span>
                )}
                {sub.additional_info && (
                  <span>
                    <span className="font-bold me-2">Notes:</span> {sub.additional_info}
                  </span>
                )}
              </div>
              {/* 💸 Payments List - Creative Version */}
              <div className="mt-4">
                <strong className="text-lg mb-2 block">Payments:</strong>
                <div className="flex flex-col gap-4">
                  {sub.payments && sub.payments.length > 0 ? (
                    sub.payments.map((pay) => {
                      // 🎨 Pick a color for the left bar based on payment status
                      const statusColor =
                        pay.status === 'confirmed' || pay.status === 'finished'
                          ? 'bg-green-400'
                          : pay.status === 'pending'
                            ? 'bg-yellow-400'
                            : pay.status === 'failed'
                              ? 'bg-red-400'
                              : 'bg-gray-400';

                      return (
                        <div
                          key={pay.id}
                          className={`
              group flex items-center rounded-xl shadow-lg overflow-hidden 
              transition transform hover:scale-[1.03] hover:shadow-2xl
              bg-gradient-to-br from-gray-800 to-gray-900
              border border-gray-600
            `}
                        >
                          {/* 🎨 Left Status Bar */}
                          {/* <div className={`${statusColor} w-2 h-full`} /> */}

                          {/* 🧾 Payment Info Body */}
                          <div className="flex-1 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-3">
                            {/* 🔖 Status */}
                            <div className="flex items-center gap-1">
                              <span className="text-xl">🔖</span>
                              <span className="font-semibold">{pay.status?.toUpperCase()}</span>
                            </div>
                            {/* 🧾 Invoice ID */}
                            <div className="flex items-center gap-1">
                              <span className="text-xl">📄</span>
                              <span>Inv: {pay.invoice_id}</span>
                            </div>
                            {/* 🔑 Payment ID */}
                            {pay.payment_id && (
                              <div className="flex items-center gap-1">
                                <span className="text-xl">🆔</span>
                                <span>ID: {pay.payment_id}</span>
                              </div>
                            )}
                            {/* 💵 Amount Paid */}
                            {pay.amount_paid && (
                              <div className="flex items-center gap-1">
                                <span className="text-xl">💰</span>
                                <span>
                                  {pay.amount_paid} {pay.currency}
                                </span>
                              </div>
                            )}
                            {/* ⏰ Created At */}
                            {pay.createdAt && (
                              <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                                <span className="text-xl">⏰</span>
                                <span>{new Date(pay.createdAt).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                          {/* ✅ Right Side Icon */}
                          <div className="h-full flex items-center pr-4">
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
                      );
                    })
                  ) : (
                    <span className="text-gray-400 pl-2">No payments yet.</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 🔢 Pagination below cards */}
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
