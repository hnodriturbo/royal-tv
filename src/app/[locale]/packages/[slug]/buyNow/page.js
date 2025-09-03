'use client';
/**
 * ===============================
 * 💸 Buy Now Page (Dynamic Invoice Pattern)
 * ---------------------------------------
 * - Creates a new invoice via NowPayments API
 * - Always BTC, fee always paid by user
 * - Stores widget_url for current user session
 * - Listens for real-time subscription + payment status
 * ===============================
 */

import logger from '@/lib/core/logger';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from '@/i18n';
import { useSession } from 'next-auth/react';

import axiosInstance from '@/lib/core/axiosInstance';
import useAuthGuard from '@/hooks/useAuthGuard'; // 🛡️ Guard user access
import useAppHandlers from '@/hooks/useAppHandlers'; // 🛠️ Loader + message system
import useSocketHub from '@/hooks/socket/useSocketHub'; // 📡 Socket unified hub

import { paymentPackages } from '@/components/packages/data/packages'; // 📦 All packages
import StatusBadge from '@/components/packages/data/statusBadge'; // 🏷️ Status component
import PaymentInstructions from '@/components/packages/data/PaymentInstructions'; // 📝 Extra info

// 🌍 i18n
import { useTranslations } from 'next-intl';

export default function PackageBuyNowPage() {
  // 🧾 Grab slug from params (/packages/[slug]/buyNow)
  const { slug } = useParams();

  // 🔎 Get query params (adult, vpn, price overrides)
  const searchParams = useSearchParams();

  // 🛣️ Router for navigation
  const router = useRouter();

  // 👤 User session
  const { data: session, status } = useSession();

  // 🛡️ User must be allowed (role = user)
  const { isAllowed, redirect } = useAuthGuard('user');

  // 🛠️ Show/hide loader + global messages
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  // 📡 Socket events
  const { onPaymentStatusUpdated, fetchSubscriptionPaymentStatus, onSubscriptionPaymentStatus } =
    useSocketHub();
  const { onTransactionFinished } = useSocketHub();

  // 🌍 Translations
  const t = useTranslations();

  // 💾 State for payment
  const [currentOrderId, setCurrentOrderId] = useState(null); // store order id
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState('waiting'); // track status
  const [widgetUrl, setWidgetUrl] = useState(null); // NowPayments iframe url

  // 🔎 Find package data by slug
  const paymentPackage = useMemo(
    () => paymentPackages.find((packageItem) => packageItem.slug === slug),
    [slug]
  );

  // 🧮 Read query params (adult, vpn, price override)
  const adult = searchParams.get('adult') === '1';
  const enable_vpn = searchParams.get('vpn') === '1';
  const price =
    searchParams.has('price') && searchParams.get('price') !== ''
      ? Number(searchParams.get('price'))
      : paymentPackage.price;

  // 💸 Start payment process
  const initializePaymentSession = useCallback(async () => {
    if (!session?.user || !paymentPackage) return;

    // 🕐 Show loader
    showLoader({ text: t('app.buyNow.creatingInvoice') });

    try {
      // 📡 Call API to create invoice
      const { data } = await axiosInstance.post('/api/nowpayments/create-invoice', {
        package_slug: paymentPackage.slug,
        order_description: paymentPackage.order_description,
        price,
        customer_email: session.user.email || undefined,
        adult,
        enable_vpn,
        package_id: paymentPackage.package_id,
        max_connections: paymentPackage.devices,
        forced_country: 'ALL'
      });

      // ✅ Success → store widget + orderId
      if (data.widget_url && data.order_id) {
        setWidgetUrl(data.widget_url);
        setCurrentOrderId(data.order_id);
        setCurrentPaymentStatus(data.payment_status || 'waiting');
        displayMessage(t('app.buyNow.invoiceReady'), 'success');
      } else {
        displayMessage(t('app.buyNow.widgetError'), 'error');
      }
    } catch (error) {
      logger.error('❌ Invoice creation error:', error);
      displayMessage(t('app.buyNow.initError'), 'error');
    } finally {
      hideLoader();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session?.user,
    paymentPackage,
    price,
    adult,
    enable_vpn,
    showLoader,
    hideLoader,
    displayMessage
  ]);

  // 📡 Real-time updates for payment status
  useEffect(() => {
    if (!currentOrderId) return;

    // 1. Socket: listen for updates
    const unsub = onPaymentStatusUpdated(({ order_id, status }) => {
      if (order_id === currentOrderId) {
        setCurrentPaymentStatus(status);
        logger.log('Payment Status Updated Through Socket, new status: ', status);
      }
    });

    // 2. Fetch latest status in case of reload
    fetchSubscriptionPaymentStatus(currentOrderId);

    // 3. Subscription status updates
    const unsub2 = onSubscriptionPaymentStatus(({ order_id, status }) => {
      if (order_id === currentOrderId && status) {
        setCurrentPaymentStatus(status);
      }
    });

    return () => {
      unsub && unsub();
      unsub2 && unsub2();
    };
  }, [
    currentOrderId,
    onPaymentStatusUpdated,
    fetchSubscriptionPaymentStatus,
    onSubscriptionPaymentStatus
  ]);

  // 🎉 When payment finishes → notify + redirect
  useEffect(() => {
    const unsubscribeFromTransactionFinished = onTransactionFinished(() => {
      displayMessage(t('app.buyNow.paymentComplete'), 'success');
      router.push('/user/subscriptions?paymentSuccess=1');
    });
    return unsubscribeFromTransactionFinished;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTransactionFinished, router, displayMessage]);

  // 🎬 Run once when logged in + allowed
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      initializePaymentSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed]);

  // 🔄 Redirect if not allowed
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 🚧 If package not found → 404
  if (!paymentPackage) return notFound();
  // 🚫 Not allowed → show nothing
  if (!isAllowed) return null;

  // ——— MAIN RENDER ——————————————————————
  return (
    <div className="flex flex-col items-center w-full lg:mt-0 mt-12">
      <div className="container-style max-w-3xl mb-6 text-center">
        {/* 🏷️ Title */}
        <span className="text-4xl font-bold text-outline-glow-dark-1 mb-2">
          {t('app.buyNow.title', { package: paymentPackage.order_description })}
        </span>

        {/* 💲 Price */}
        <p className="text-4xl text-cyan-200 mb-4">{t('app.buyNow.price', { price })}</p>

        {/* 📌 Status Badge */}
        <div className="w-full flex justify-center mt-2">
          <StatusBadge status={currentPaymentStatus} />
        </div>

        {/* 🪙 BTC Invoice Widget */}
        <div className="w-full flex justify-center mt-2 mb-4">
          {widgetUrl ? (
            <iframe
              src={widgetUrl}
              width="410"
              height="696"
              frameBorder="0"
              scrolling="no"
              style={{ overflowY: 'hidden' }}
              title={t('app.buyNow.iframeTitle', { package: paymentPackage.name })}
            >
              {t('app.buyNow.widgetFallback')}
            </iframe>
          ) : (
            <div className="flex items-center justify-center w-full h-[400px]">
              <span className="text-lg text-yellow-300 font-bold animate-pulse">
                {t('app.buyNow.loadingWidget')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ⚠️ Important Notes */}
      <div className="flex flex-col text-center lg:w-10/12 w-11/12">
        <p className="text-lg text-white mb-4 border border-red-600 bg-red-500 rounded-xl p-3 font-semibold">
          <span className="font-bold text-yellow-200 text-3xl text-outline-glow-dark-1">
            {t('app.buyNow.note')}
          </span>
          <br />
          {t('app.buyNow.policy')}
          <br />
          <br />
          {t('app.buyNow.network')}
          <br />
          <br />
          <span className="font-bold">{t('app.buyNow.patienceTitle')}</span>{' '}
          {t('app.buyNow.patienceText')}
          <br />
          <span className="font-bold text-yellow-200">{t('app.buyNow.important')}</span>{' '}
          {t('app.buyNow.doNotClose')}
          <br />
          <br />
          <span className="text-2xl mb-4">{t('app.buyNow.instructions')}</span>
        </p>
      </div>

      {/* 📄 Always show instructions at bottom */}
      <PaymentInstructions />
    </div>
  );
}
