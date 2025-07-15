/**
 *   ========================== UserSubscriptionPanel.js ==========================
 * 🛒
 * USER SUBSCRIPTION DASHBOARD PANEL
 * - Shows current sub or buy-now advert.
 * - Lets user see details, or buy new.
 * ===========================================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axiosInstance';
import Link from 'next/link';
import useAppHandlers from '@/hooks/useAppHandlers';

// 🏷️ All possible packages and their labels!
const packageOptions = [
  { value: '6m', label: '6 Months' },
  { value: '6m_extra', label: '6 Months (Extra)' },
  { value: '12m', label: '12 Months' },
  { value: '12m_extra', label: '12 Months (Extra)' },
  { value: 'tester', label: 'Tester Package' }
];

export default function UserSubscriptionPanel({ user_id }) {
  // 🔄 Subscription state
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(packageOptions[0].value);
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const router = useRouter();

  // 🔎 Fetch user’s subscriptions
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

  // 🟩 "Buy Now" button handler!
  const handleBuyNow = () => {
    // 📦 Route to /packages/[slug]/buyNow with selected slug
    router.push(`/packages/${selectedPackage}/buyNow`);
  };

  // ——— RENDER ———
  if (loading) {
    // ⏳ Loading state
    return <div className="my-8">Loading subscriptions…</div>;
  }

  // 1️⃣ User has an active/pending subscription
  if (relevantSub) {
    return (
      <div className="container-style-sm w-11/12 lg:w-[600px] mx-auto flex flex-col items-center my-6">
        {/* 🟢 Sub status card */}
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
      </div>
    );
  }

  // 2️⃣ No subscription: Show Buy Now advert!
  return (
    <div className="container-style-sm w-11/12 lg:w-[600px] mx-auto flex flex-col items-center my-6">
      {/* 💡 Ad panel */}
      <div className="bg-purple-800 rounded-xl p-6 flex flex-col items-center w-full">
        <span className="text-2xl mb-2">💡</span>
        <h3 className="font-semibold mb-2 text-white">No Subscription Found</h3>
        <p className="text-gray-300 mb-3 text-center">
          Purchase a subscription to start enjoying all premium features!
        </p>
        {/* 🏷️ Package dropdown */}
        <select
          value={selectedPackage}
          onChange={(e) => setSelectedPackage(e.target.value)}
          className="w-full mb-3 p-2 rounded-lg text-gray-900"
        >
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

// 📝 Every package you requested is included and mapped cleanly!
