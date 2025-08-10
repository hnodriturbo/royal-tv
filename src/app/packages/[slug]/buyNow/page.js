/**
 * ===============================
 * 💸 Buy Now Page (Dynamic Invoice Pattern)
 * ---------------------------------------
 * - On page load: creates a new invoice via NowPayments API
 * - Fee is always paid by the user
 * - Always BTC, always unique invoice per payment
 * - Stores widget_url for user session
 * - Handles real-time subscription notifications!
 * ===============================
 */

'use client';

// ✅ Import core logic for this page
import logger from '@/lib/core/logger';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { useParams, notFound, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import axiosInstance from '@/lib/core/axiosInstance';
import useAuthGuard from '@/hooks/useAuthGuard'; // 🛡️ Guard
import useAppHandlers from '@/hooks/useAppHandlers'; // 🛠️ Loader/message
import useSocketHub from '@/hooks/socket/useSocketHub'; // 📡 Unified socket hub

// ⚡ Imports from packages/data folder
import { paymentPackages } from '@/packages/data/packages'; // 📦 All payment packages
import StatusBadge from '@/packages/data/statusBadge'; // 📌 Status badge
import PaymentInstructions from '@/packages/data/PaymentInstructions'; // 📝 Crypto info

export default function PackageBuyNowPage() {
  // 🌈 Get the slug from URL params
  const { slug } = useParams();

  // 🖥️ Search params for getting values from the url
  const searchParams = useSearchParams();

  // 🗺️ Next router for navigation
  const router = useRouter();

  // 👤 User session & status
  const { data: session, status } = useSession();
  // 🛡️ User auth guard
  const { isAllowed, redirect } = useAuthGuard('user');

  // 🛠️ App loader/message
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  // ✅ Payment status
  const [currentOrderId, setCurrentOrderId] = useState(null); // Store latest order_id
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState('waiting');

  const { onPaymentStatusUpdated, fetchSubscriptionPaymentStatus, onSubscriptionPaymentStatus } =
    useSocketHub();

  // 📦 Find current payment package by slug
  const paymentPackage = useMemo(
    () => paymentPackages.find((packageItem) => packageItem.slug === slug),
    [slug]
  );

  // 🚧 If package not found, show 404
  if (!paymentPackage) return notFound();

  // 🧠 Get user-selected options from query params in the URL
  const adult = searchParams.get('adult') === '1';
  const enable_vpn = searchParams.get('vpn') === '1';
  const price =
    searchParams.has('price') && searchParams.get('price') !== ''
      ? Number(searchParams.get('price'))
      : paymentPackage.price;

  // 👂 Listen for transactionFinished event from socket server
  const { onTransactionFinished } = useSocketHub();

  // 🌐 Store widgetUrl for iframe
  const [widgetUrl, setWidgetUrl] = useState(null);

  // 💸 Create invoice (and payment record) as soon as possible
  const initializePaymentSession = useCallback(async () => {
    if (!session?.user || !paymentPackage) return;
    showLoader({ text: 'Creating secure BTC invoice...' });

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
      console.log(`
        package_slug: ${paymentPackage.slug}
        order_description: ${paymentPackage.order_description}
        price: ${price}
        adult: ${adult}
        enable_vpn: ${enable_vpn}
        package_id: ${paymentPackage.package_id}
        max_connections: ${paymentPackage.devices}
        `);
      if (data.widget_url && data.order_id) {
        setWidgetUrl(data.widget_url);
        setCurrentOrderId(data.order_id); // <- Set UUID anchor for all status!
        setCurrentPaymentStatus(data.payment_status || 'waiting'); // set initial
        displayMessage('Your secure BTC invoice is ready.', 'success');
      } else {
        displayMessage('Could not load payment widget.', 'error');
      }
    } catch (error) {
      logger.error('❌ Invoice creation error:', error);
      displayMessage('Could not initialize payment. Please refresh.', 'error');
    } finally {
      hideLoader();
    }
  }, [session?.user, paymentPackage, price, adult, enable_vpn]);

  // 🕹️ Run once after login & allowed & package found
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      initializePaymentSession(); // 🎬
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed]);

  // 🚦 Handle real-time UI updates - UPDATE PAYMENT STATUS &
  useEffect(() => {
    if (!currentOrderId) return;
    // 1. Listen for backend real-time updates
    const unsub = onPaymentStatusUpdated(({ order_id, status }) => {
      if (order_id === currentOrderId) {
        setCurrentPaymentStatus(status);
        logger.log('Payment Status Updated Through Socket, new status: ', status);
      }
    });
    // 2. Fetch current status (useful if user reloads or comes back later)
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

  // Send the notifications and emails using backend when transactionFinished
  useEffect(() => {
    const unsubscribeFromTransactionFinished = onTransactionFinished(() => {
      // 🎉 Show user a toast and redirect to their subscriptions page
      displayMessage(
        '✅ Payment complete! Your subscription will now be created and admin will activate it as soon as possible..',
        'success'
      );
      router.push('/user/subscriptions?paymentSuccess=1');
    });
    return unsubscribeFromTransactionFinished;
  }, [onTransactionFinished, router, displayMessage]);

  // 🛑 Guard: Only render after allowed!
  if (!isAllowed) return null;

  // 🚦 Redirect user if not allowed (use dashboard logic)
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // ——— MAIN RENDER ——————————————————————
  return (
    <div className="flex flex-col items-center w-full lg:mt-0 mt-12">
      <div className="container-style max-w-3xl mb-6 text-center">
        <h1 className="text-4xl font-bold text-wonderful-5 mb-2">
          Buy {paymentPackage.order_description} Subscription
        </h1>
        <p className="text-4xl text-cyan-200 mb-4">
          Only <span className="font-bold text-yellow-300">${price}</span>
        </p>
        {/* ⚠️ User pays all BTC transaction fees - transparent info */}
        <p className="text-lg text-red-400 mb-4 border border-red-600 bg-red-950 rounded-xl p-3 font-semibold">
          {/*/ This is the official payment policy - very clear! /*/}
          <span className="font-bold text-yellow-200">Note:</span> The total amount you will pay
          includes both your subscription price and all required Bitcoin payment network fees.
          <br />
          <br />{' '}
          <span className="text-cyan-200">
            Crypto payments may sometimes take several minutes to be confirmed, depending on network
            congestion.
          </span>
          {/*/ Remind user to keep this window open until payment is fully processed /*/}
          <br />
          <br />
          <span className="font-bold">Patience is key!</span> This window will automatically update
          when your payment is received.
          <br />
          <span className="font-bold text-yellow-200">Important:</span> Please{' '}
          <span className="underline underline-offset-4 text-yellow-400">do not close</span> or
          navigate away from this page while your payment is processing.
          <br />
          <br />
          <p className="text-2xl text-cyan-200 mb-4">Instructions are below!</p>
        </p>

        <div className="w-full flex justify-center mt-2">
          <StatusBadge status={currentPaymentStatus} />
        </div>
        {/* 🪙 Crypto Payment Iframe (dynamic BTC invoice) */}
        <div className="w-full flex justify-center mt-2 mb-4">
          {widgetUrl ? (
            <iframe
              src={widgetUrl}
              width="410"
              height="696"
              frameBorder="0"
              scrolling="no"
              style={{ overflowY: 'hidden' }}
              title={`Buy ${paymentPackage.name} - Crypto Payment`}
            >
              Can't load widget
            </iframe>
          ) : (
            <div className="flex items-center justify-center w-full h-[400px]">
              <span className="text-lg text-yellow-300 font-bold animate-pulse">
                Loading BTC payment widget...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 📄 Payment instructions always at bottom */}
      <PaymentInstructions />
    </div>
  );
}
