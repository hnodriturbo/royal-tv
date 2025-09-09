// File: app/[locale]/packages/[slug]/buyNow/page.js
'use client';

/**
 * 💸 Buy Now Page (Dynamic Invoice)
 * - Creates NowPayments invoice and shows widget
 * - Listens for real-time payment/subscription updates
 * - Safe hooks: locale captured at top level
 */

import logger from '@/lib/core/logger';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { useParams, notFound, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import axiosInstance from '@/lib/core/axiosInstance';
import useAuthGuard from '@/hooks/useAuthGuard';
import useAppHandlers from '@/hooks/useAppHandlers';
import useSocketHub from '@/hooks/socket/useSocketHub';

import { paymentPackages } from '@/components/packages/data/packages';
import StatusBadge from '@/components/packages/data/statusBadge';
import PaymentInstructions from '@/components/packages/data/PaymentInstructions';

import { useTranslations, useLocale } from 'next-intl';

export default function PackageBuyNowPage() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('user');

  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  const {
    onPaymentStatusUpdated,
    fetchSubscriptionPaymentStatus,
    onSubscriptionPaymentStatus,
    onTransactionFinished
  } = useSocketHub();

  const t = useTranslations();
  const locale = useLocale(); // ✅ top-level

  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState('waiting');
  const [widgetUrl, setWidgetUrl] = useState(null);

  const paymentPackage = useMemo(() => paymentPackages.find((p) => p.slug === slug), [slug]);

  const adult = searchParams.get('adult') === '1';
  const enable_vpn = searchParams.get('vpn') === '1';
  const price =
    searchParams.has('price') && searchParams.get('price') !== ''
      ? Number(searchParams.get('price'))
      : paymentPackage?.price;

  const initializePaymentSession = useCallback(async () => {
    if (!session?.user || !paymentPackage) return;

    showLoader({ text: t('app.buyNow.creatingInvoice') });
    try {
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

  // socket status updates
  useEffect(() => {
    if (!currentOrderId) return;

    const unsub = onPaymentStatusUpdated(({ order_id, status }) => {
      if (order_id === currentOrderId) {
        setCurrentPaymentStatus(status);
      }
    });

    fetchSubscriptionPaymentStatus(currentOrderId);

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

  // redirect after transaction finished
  useEffect(() => {
    const unsubscribe = onTransactionFinished(() => {
      displayMessage(t('app.buyNow.paymentComplete'), 'success');
      router.push(`/${locale}/user/subscriptions?paymentSuccess=1`); // ✅ locale captured
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTransactionFinished, router, displayMessage, locale]);

  // kick off on auth ready
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      initializePaymentSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed]);

  // guard redirects
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!paymentPackage) return notFound();
  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center w-full lg:mt-0 mt-12">
      <div className="container-style max-w-3xl mb-6 text-center">
        {/* Title */}
        <span className="text-4xl font-bold text-outline-glow-dark-1 mb-2">
          {t('app.buyNow.title', { package: paymentPackage.order_description })}
        </span>

        {/* Price */}
        <p className="text-4xl text-cyan-200 mb-4">{t('app.buyNow.price', { price })}</p>

        {/* Status */}
        <div className="w-full flex justify-center mt-2">
          <StatusBadge status={currentPaymentStatus} />
        </div>

        {/* Widget */}
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

        {/* Extra info */}
        <PaymentInstructions />
      </div>
    </div>
  );
}
