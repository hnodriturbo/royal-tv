// 📦 UserSubscriptionPanel.js — localized text, socket-powered
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link, useRouter } from '@/i18n';
import useAppHandlers from '@/hooks/useAppHandlers';
import useSocketHub from '@/hooks/socket/useSocketHub';
import { paymentPackages } from '@/components/packages/data/packages';
import { useTranslations } from 'next-intl';

const packageOptions = paymentPackages
  .filter((pkg) => !pkg.isTrial) // 🛑 exclude free trial
  .map((packageItem) => ({
    value: packageItem.slug,
    label: packageItem.order_description // ⚠️ show translated below in render
  }));

export default function UserSubscriptionPanel({ user_id }) {
  const t = useTranslations(); // 🌍 translator
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState('');
  const { displayMessage } = useAppHandlers();
  const router = useRouter();

  // 🔌 socket functions
  const { fetchSubscriptions, onSubscriptionsList, onSubscriptionCreated, onPaymentStatusUpdated } =
    useSocketHub();

  // 📥 load + subscribe to changes
  useEffect(() => {
    if (!user_id) return;
    setLoading(true);
    fetchSubscriptions();
    const unsub = onSubscriptionsList((subs) => {
      setSubscriptions(subs || []);
      setLoading(false);
    });
    const unsubCreated = onSubscriptionCreated(() => fetchSubscriptions());
    const unsubPayment = onPaymentStatusUpdated(() => fetchSubscriptions());
    return () => {
      unsub && unsub();
      unsubCreated && unsubCreated();
      unsubPayment && unsubPayment();
    };
    // ⚠️ no `t` in deps — avoid churn
  }, [
    user_id,
    fetchSubscriptions,
    onSubscriptionsList,
    onSubscriptionCreated,
    onPaymentStatusUpdated
  ]);

  // 🔎 pick the most relevant subscription
  const getRelevantSubscription = useCallback(() => {
    return (
      subscriptions.find((s) => s.status === 'active') ||
      subscriptions.find((s) => s.status === 'pending') ||
      subscriptions[0] ||
      null
    );
  }, [subscriptions]);

  const relevantSub = getRelevantSubscription();

  // 🛒 buy now handler
  const handleBuyNow = () => {
    if (!selectedPackage) {
      displayMessage(t('socket.ui.subscriptions.select_first'), 'warning');
      return;
    }
    router.push(`/packages/${selectedPackage}/buyNow`);
  };

  // ⏳ loading state
  if (loading) {
    return <div className="my-8">{t('socket.ui.subscriptions.loading')}</div>;
  }

  // 🔤 translate a status token safely
  const transStatus = (status) => {
    const key = `socket.ui.subscriptions.status.${status || 'unknown'}`;
    return t(key);
  };

  return (
    <div className="container-style-sm w-11/12 lg:max-w-2xl mx-auto flex flex-col items-center my-6 space-y-6">
      {relevantSub && (
        <div className="bg-blue-900 rounded-xl p-5 w-full flex flex-col items-center">
          <span className="text-2xl mb-2">📦</span>
          <h3 className="font-semibold mb-1">{t('socket.ui.subscriptions.have_one')}</h3>
          <div className="mb-2">
            {t('socket.ui.subscriptions.status_label')}{' '}
            <span
              className={
                relevantSub.status === 'active'
                  ? 'text-green-400 font-bold'
                  : relevantSub.status === 'pending'
                    ? 'text-yellow-300 font-bold'
                    : 'text-gray-400 font-bold'
              }
            >
              {transStatus(relevantSub.status)}
            </span>
          </div>
          <Link href="/user/subscriptions" className="btn-success w-2/3 mt-2 text-center">
            {t('socket.ui.subscriptions.view_yours')}
          </Link>
        </div>
      )}

      <div className="bg-purple-800 rounded-xl p-6 flex flex-col items-center w-full">
        <span className="text-2xl mb-2">{relevantSub ? '🛍️' : '💡'}</span>
        <h3 className="font-semibold mb-2 text-white">
          {relevantSub
            ? t('socket.ui.subscriptions.buy_additional')
            : t('socket.ui.subscriptions.none_title')}
        </h3>
        {!relevantSub && (
          <p className="text-gray-300 mb-3 text-center">
            {t('socket.ui.subscriptions.none_blurb')}
          </p>
        )}

        <select
          value={selectedPackage}
          onChange={(e) => setSelectedPackage(e.target.value)}
          className="w-full mb-3 p-2 rounded-lg text-gray-900 text-center"
        >
          <option value="" disabled>
            {t('socket.ui.subscriptions.select_package')}
          </option>
          {packageOptions.map((pkg) => (
            <option key={pkg.value} value={pkg.value}>
              {/* 🏷️ if you later add per-package keys, translate here */}
              {pkg.label}
            </option>
          ))}
        </select>

        <button onClick={handleBuyNow} className="btn-primary w-2/3 mt-1">
          {t('socket.ui.subscriptions.buy_now')}
        </button>
      </div>
    </div>
  );
}
