/**
 *   ========================== UserSubscriptionPanel.js ==========================
 * 🛒
 * USER SUBSCRIPTION DASHBOARD PANEL
 * - Shows current subscription (active/pending) status with a friendly card.
 * - Always renders the package dropdown and Buy Now button so users can
 *   purchase additional subscriptions even when one is already active.
 * ===========================================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axiosInstance';
import Link from 'next/link';
import useAppHandlers from '@/hooks/useAppHandlers';
import useSocketHub from '@/hooks/socket/useSocketHub';
import { paymentPackages } from '@/packages/data/packages';

// 🏷️ Dynamically map packages into select options using slug + description!
const packageOptions = paymentPackages.map((packageItem) => ({
  value: packageItem.slug, // 🆔 Used in routing
  label: packageItem.order_description // 🏷️ Human-friendly label
}));

export default function UserSubscriptionPanel({ user_id }) {
  // 🔄 Subscriptions array (loaded from API)
  const [subscriptions, setSubscriptions] = useState([]);
  // 🌀 Loading state while fetching data
  const [loading, setLoading] = useState(true);
  // 🎯 Currently selected package slug
  const [selectedPackage, setSelectedPackage] = useState('');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const router = useRouter();
  // 📡 Get transaction finished listener from our socket hub
  const { onTransactionFinished } = useSocketHub();

  // 🔎 Fetch user’s subscriptions whenever the user_id changes
  useEffect(() => {
    if (!user_id) return;
    setLoading(true);
    axiosInstance
      .get('/api/user/subscriptions')
      .then((res) => setSubscriptions(res.data.subscriptions || []))
      .catch(() => setSubscriptions([]))
      .finally(() => setLoading(false));
  }, [user_id]);

  // 🟢 Helper: Pick most relevant subscription (active > pending > any)
  const getRelevantSubscription = () => {
    return (
      subscriptions.find((s) => s.status === 'active') ||
      subscriptions.find((s) => s.status === 'pending') ||
      subscriptions[0] ||
      null
    );
  };

  const relevantSub = getRelevantSubscription();

  // 🟩 "Buy Now" button handler! Sends user to correct purchase page
  const handleBuyNow = () => {
    // 📦 Route to /packages/[slug]/buyNow with selected slug
    router.push(`/packages/${selectedPackage}/buyNow`);
  };

  // ——— RENDER ———
  if (loading) {
    // ⏳ Loading state
    return <div className="my-8">Loading subscriptions…</div>;
  }

  // Main container holds both the subscription status card (if any) and the buy-new section
  return (
    <div className="container-style-sm w-11/12 lg:w-[600px] mx-auto flex flex-col items-center my-6 space-y-6">
      {/* 🟢 Show current subscription status if one exists */}
      {relevantSub && (
        <div className="bg-blue-900 rounded-xl p-5 w-full flex flex-col items-center">
          <span className="text-2xl mb-2">📦</span>
          <h3 className="font-semibold mb-1">You have a subscription!</h3>
          <div className="mb-2">
            Status:{' '}
            <span
              className={
                relevantSub.status === 'active'
                  ? 'text-green-400 font-bold'
                  : relevantSub.status === 'pending'
                    ? 'text-yellow-300 font-bold'
                    : 'text-gray-400 font-bold'
              }
            >
              {relevantSub.status.toUpperCase()}
            </span>
          </div>
          <Link href="/user/subscriptions" className="btn-success w-2/3 mt-2 text-center">
            View Your Subscription
          </Link>
        </div>
      )}
      {/* 💡 Purchase panel: always render the dropdown and buy now button */}
      <div className="bg-purple-800 rounded-xl p-6 flex flex-col items-center w-full">
        {/* Show different headline based on whether a subscription exists */}
        <span className="text-2xl mb-2">{relevantSub ? '🛍️' : '💡'}</span>
        <h3 className="font-semibold mb-2 text-white">
          {relevantSub ? 'Purchase Additional Subscription' : 'No Subscription Found'}
        </h3>
        {/* Show guidance text only when no subscription */}
        {!relevantSub && (
          <p className="text-gray-300 mb-3 text-center">
            Purchase a subscription to start enjoying all premium features!
          </p>
        )}
        {/* 🏷️ Package dropdown */}
        <select
          value={selectedPackage}
          onChange={(e) => setSelectedPackage(e.target.value)}
          className="w-full mb-3 p-2 rounded-lg text-gray-900 text-center"
        >
          <option value="" disabled>
            -- Select a subscription package to buy !
          </option>
          {packageOptions.map((pkg) => (
            <option key={pkg.value} value={pkg.value}>
              {pkg.label}
            </option>
          ))}
        </select>
        {/* 🛒 Buy Now button */}
        <button onClick={handleBuyNow} className="btn-primary w-2/3 mt-1">
          Buy Now
        </button>
      </div>
    </div>
  );
}
