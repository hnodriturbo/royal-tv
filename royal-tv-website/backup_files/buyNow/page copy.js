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

import logger from '@/lib/logger';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axiosInstance from '@/lib/axiosInstance'; // 🪄 Custom axios instance
import { paymentPackages } from '@/packages/data/packages'; // 📦 All payment packages
import PaymentInstructions from '@/packages/data/PaymentInstructions'; // 📝 Crypto info
import useAuthGuard from '@/hooks/useAuthGuard'; // 🛡️ Guard
import useAppHandlers from '@/hooks/useAppHandlers'; // 🛠️ Loader/message
import useSocketHub from '@/hooks/socket/useSocketHub'; // 📡 Unified socket hub
import { useCreateNotifications } from '@/hooks/socket/useCreateNotifications'; // 🔔 Notification creator

export default function PackageBuyNowPage() {
  // 🌈 Get the slug from URL params
  const { slug } = useParams();

  // 🗺️ Next router for navigation
  const router = useRouter();

  // 👤 User session & status
  const { data: session, status } = useSession();
  // 🛡️ User auth guard
  const { isAllowed, redirect } = useAuthGuard('user');

  // 🛠️ App loader/message
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  // 📦 Find current payment package by slug
  const paymentPackage = useMemo(
    () => paymentPackages.find((packageItem) => packageItem.slug === slug),
    [slug]
  );

  // 🚧 If package not found, show 404
  if (!paymentPackage) return notFound();

  // 👂 Listen for transactionFinished event from socket server
  const { onTransactionFinished } = useSocketHub();

  // 🛠️ Create notification helpers
  const { createSubscriptionCreatedNotification, createPaymentReceivedNotification } =
    useCreateNotifications();

  // 🌐 Store widgetUrl for iframe
  const [widgetUrl, setWidgetUrl] = useState(null);

  // 💸 Create invoice (and payment record) as soon as possible
  const initializePaymentSession = useCallback(async () => {
    if (!session?.user || !paymentPackage) return;
    showLoader({ text: 'Creating secure BTC invoice...' }); // ⏳

    try {
      // 📨 Call backend to create a unique invoice
      const { data } = await axiosInstance.post('/api/nowpayments/create-invoice', {
        package_slug: paymentPackage.slug,
        order_description: paymentPackage.order_description,
        price: paymentPackage.price,
        customer_email: session.user.email || undefined
      });

      if (data.widget_url) {
        setWidgetUrl(data.widget_url); // 🪄 Ready for iframe!
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
  }, [session?.user, paymentPackage, showLoader, hideLoader, displayMessage]);

  // 🕹️ Run once after login & allowed & package found
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      initializePaymentSession(); // 🎬
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed]);
  /* 
  // 👂 Listen for real-time payment success
  useEffect(() => {
    const unsubscribe = onTransactionFinished(({ user, payment, subscription }) => {
      displayMessage('✅ Payment received! Subscription is pending admin approval.', 'success');
      createPaymentReceivedNotification(user, payment);
      createSubscriptionCreatedNotification(user, subscription);
      router.push('/user/subscriptions?paymentSuccess=1');
    });
    return unsubscribe;
  }, [
    onTransactionFinished,
    router,
    createPaymentReceivedNotification,
    createSubscriptionCreatedNotification,
    displayMessage
  ]);
 */
  // 🚦 Only handle real-time UI updates, do NOT trigger notification/email here!
  // All notifications/emails are now sent from the backend when transaction is finished.

  useEffect(() => {
    const unsubscribeFromTransactionFinished = onTransactionFinished(() => {
      // 🎉 Show user a toast and redirect to their subscriptions page
      displayMessage('✅ Payment received! Subscription is pending admin approval.', 'success');
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
          Only <span className="font-bold text-yellow-300">${paymentPackage.price}</span>
        </p>
        {/* ⚠️ User pays all BTC transaction fees - transparent info */}
        <p className="text-lg text-red-400 mb-4 border border-red-600 bg-red-950 rounded-xl p-3 font-semibold">
          {/*/ This is the official payment policy - very clear! /*/}
          <span className="font-bold text-yellow-200">Note:</span> The total amount you will pay
          includes both your subscription price and all required Bitcoin payment network fees.
          <br />
          <br />
          <span className="text-cyan-200 font-normal">
            These fees are paid by you to ensure a secure, fast, and verifiable blockchain
            transaction. You will see the exact total before you confirm payment.
          </span>
          {/* 🕰️ Patience notice: Don’t close window during crypto payment */}
          {/*/ Remind user to keep this window open until payment is fully processed /*/}
          <br />
          <br />
          <span className="text-cyan-200 font-normal">
            Crypto payments may sometimes take several minutes to be confirmed, depending on network
            congestion.
            <br />
            <span className="font-bold">Patience is key!</span> This window will automatically
            update when your payment is received.
            <br />
          </span>
          <br />
          <br />
          <span className="font-bold text-yellow-200">Important:</span> Please{' '}
          <span className="underline underline-offset-4 text-yellow-400">do not close</span> or
          navigate away from this page while your payment is processing.
        </p>
        <p className="text-2xl text-cyan-200 mb-4">Instructions are below!</p>

        {/* 🪙 Crypto Payment Iframe (dynamic BTC invoice) */}
        <div className="w-full flex justify-center mt-8 mb-12">
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
