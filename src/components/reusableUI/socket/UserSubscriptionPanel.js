'use client';

/**
 * UserSubscriptionPanel.js
 * Shows current subscription and lets the user pick a paid plan.
 * Keeps behavior simple and integrates with locale-aware navigation.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

import { paymentPackages } from '@/components/packages/data/packages';
import { SafeString } from '@/lib/ui/SafeString';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';

export default function UserSubscriptionPanel() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  const userId = session?.user?.user_id;

  const plans = useMemo(() => paymentPackages.filter((p) => !p.isTrial), []);

  const [current, setCurrent] = useState(null);

  // Fetch current subscription
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const res = await axiosInstance.get('/api/user/subscriptions/current');
        if (on) setCurrent(res.data?.subscription || null);
      } catch {
        // fail silently on display
      }
    })();
    return () => {
      on = false;
    };
  }, []);

  const startCheckout = async (slug) => {
    try {
      showLoader({ text: t('socket.ui.subscription.starting_checkout') });
      const res = await axiosInstance.post('/api/user/subscriptions/checkout', { plan: slug });
      const url = res.data?.checkoutUrl || `/${locale}/user/billing`;
      router.push(url);
    } catch {
      displayMessage(t('socket.ui.subscription.checkout_failed'), 'error');
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="container-style flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-2">{t('socket.ui.subscription.title')}</h2>
      <div className="text-sm text-gray-300 mb-4">
        {current ? (
          <>
            {t('socket.ui.subscription.current')} <b>{SafeString(current.plan_name)}</b>
          </>
        ) : (
          <>{t('socket.ui.subscription.no_active')}</>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {plans.map((p) => (
          <div key={p.slug} className="border border-gray-700 rounded-2xl p-4 bg-gray-900/60">
            <div className="text-xl font-bold mb-1">{SafeString(p.name)}</div>
            <div className="text-sm text-gray-300 mb-3">{SafeString(p.description)}</div>
            <div className="text-lg font-semibold mb-3">{SafeString(p.priceLabel)}</div>
            <button className="btn-primary" type="button" onClick={() => startCheckout(p.slug)}>
              {t('socket.ui.subscription.choose')}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link href={`/${locale}/user/billing`} className="underline">
          {t('socket.ui.subscription.manage_billing')}
        </Link>
      </div>
    </div>
  );
}
