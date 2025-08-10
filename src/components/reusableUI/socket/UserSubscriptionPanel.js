import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAppHandlers from '@/hooks/useAppHandlers';
import useSocketHub from '@/hooks/socket/useSocketHub';
import { paymentPackages } from '@/packages/data/packages';

const packageOptions = paymentPackages
  .filter((pkg) => !pkg.isTrial) // 👈 Exclude free trial
  .map((packageItem) => ({
    value: packageItem.slug,
    label: packageItem.order_description
  }));

export default function UserSubscriptionPanel({ user_id }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState('');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const router = useRouter();

  // ⬇️ Get all relevant socket functions
  const { fetchSubscriptions, onSubscriptionsList, onSubscriptionCreated, onPaymentStatusUpdated } =
    useSocketHub();

  // ⬇️ Fetch subscriptions via socket when mounted or user_id changes
  useEffect(() => {
    if (!user_id) return;
    setLoading(true);
    fetchSubscriptions();
    // Subscribe to subscription updates from server
    const unsub = onSubscriptionsList((subs) => {
      setSubscriptions(subs || []);
      setLoading(false);
    });
    // Also refresh on real-time creation or payment status updates
    const unsubCreated = onSubscriptionCreated(() => fetchSubscriptions());
    const unsubPayment = onPaymentStatusUpdated(() => fetchSubscriptions());
    return () => {
      unsub && unsub();
      unsubCreated && unsubCreated();
      unsubPayment && unsubPayment();
    };
  }, [
    user_id,
    fetchSubscriptions,
    onSubscriptionsList,
    onSubscriptionCreated,
    onPaymentStatusUpdated
  ]);

  // Same helper as before
  const getRelevantSubscription = useCallback(() => {
    return (
      subscriptions.find((s) => s.status === 'active') ||
      subscriptions.find((s) => s.status === 'pending') ||
      subscriptions[0] ||
      null
    );
  }, [subscriptions]);

  const relevantSub = getRelevantSubscription();

  // 🟩 "Buy Now" button handler!
  const handleBuyNow = () => {
    router.push(`/packages/${selectedPackage}/buyNow`);
  };

  // Render unchanged, except now it's all socket-driven
  if (loading) {
    return <div className="my-8">Loading subscriptions…</div>;
  }

  return (
    <div className="container-style-sm w-11/12 lg:w-[600px] mx-auto flex flex-col items-center my-6 space-y-6">
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
      <div className="bg-purple-800 rounded-xl p-6 flex flex-col items-center w-full">
        <span className="text-2xl mb-2">{relevantSub ? '🛍️' : '💡'}</span>
        <h3 className="font-semibold mb-2 text-white">
          {relevantSub ? 'Purchase Additional Subscription' : 'No Subscription Found'}
        </h3>
        {!relevantSub && (
          <p className="text-gray-300 mb-3 text-center">
            Purchase a subscription to start enjoying all premium features!
          </p>
        )}
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
        <button onClick={handleBuyNow} className="btn-primary w-2/3 mt-1">
          Buy Now
        </button>
      </div>
    </div>
  );
}
