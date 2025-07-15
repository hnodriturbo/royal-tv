/**
 * ===============================
 * 💸 Buy Now Page (Single Init Pattern)
 * ---------------------------------------
 * - Creates payment init only ONCE per login/page
 * - Runs function inside useEffect, only on status change
 * ===============================
 */

'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axiosInstance from '@/lib/axiosInstance'; // 🪄 Custom axios instance
import { paymentPackages } from '@/packages/data/packages'; // 📦 All payment packages
import PaymentInstructions from '@/components/ui/paymentInstructions/PaymentInstructions'; // 📝 Crypto info
import useAuthGuard from '@/hooks/useAuthGuard'; // 🛡️ Guard
import useAppHandlers from '@/hooks/useAppHandlers'; // 🛠️ Loader/message
import useSocketHub from '@/hooks/socket/useSocketHub'; // 📡 Unified socket hub
import { useCreateNotifications } from '@/hooks/socket/useCreateNotifications'; // 🔔 Notification creator

export default function PackageBuyNowPage() {
  // 🌈 Get the slug from params
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
  const paymentPackage = useMemo(() => paymentPackages.find((pkg) => pkg.slug === slug), [slug]);

  // 🚧 If not found, 404
  if (!paymentPackage) return notFound();

  // 👂 Listen for transactionFinished event from socket server
  const { onTransactionFinished } = useSocketHub();

  // 🛠️ Create the functions for notifications
  const { createSubscriptionCreatedNotification, createPaymentReceivedNotification } =
    useCreateNotifications();

  // 💸 Payment init function (only runs ONCE after login)
  const initializePayment = useCallback(async () => {
    if (!session?.user || !paymentPackage) return;
    showLoader({ text: 'Creating secure payment record...' }); // 🌀 Show loader!
    try {
      await axiosInstance.post('/api/nowpayments/init', {
        order_id: paymentPackage.slug,
        invoice_id: paymentPackage.iid
      });
      displayMessage('Your secure payment is ready.', 'success'); // 🎉
    } catch (error) {
      console.error('❌ Payment init error:', error);
      displayMessage('Could not initialize payment. Please refresh.', 'error');
    } finally {
      hideLoader();
    }
  }, []);

  // 🕹️ Run once after login & allowed & package found
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      initializePayment(); // 🎬
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed]);

  // 👂 Listen for real-time payment success
  useEffect(() => {
    const unsubscribe = onTransactionFinished(({ user, payment, subscription }) => {
      // 🎉 Show success toast or message
      displayMessage('✅ Payment received! Subscription is pending admin approval.', 'success');
      // 🔔 Fire both user & admin notifications
      createPaymentReceivedNotification(user, payment);
      createSubscriptionCreatedNotification(user, subscription);
      // 🚦 Just redirect to subscriptions with a flag
      router.push('/user/subscriptions?paymentSuccess=1');
    });
    return unsubscribe;
  }, [onTransactionFinished, router]);

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
          Buy {paymentPackage.name} Subscription
        </h1>
        <p className="text-4xl text-cyan-200 mb-4">
          Only <span className="font-bold text-yellow-300">${paymentPackage.price}</span>
        </p>
        <p className="text-2xl text-cyan-200 mb-4">Instructions are below!</p>

        {/* 🪙 Crypto Payment Iframe */}
        <div className="w-full flex justify-center mt-8 mb-12">
          <iframe
            src={`https://nowpayments.io/embeds/payment-widget?iid=${paymentPackage.iid}`}
            width="410"
            height="696"
            frameBorder="0"
            scrolling="no"
            style={{ overflowY: 'hidden' }}
            title={`Buy ${paymentPackage.name} - Crypto Payment`}
          >
            Can't load widget
          </iframe>
        </div>
      </div>

      {/* 📄 Payment instructions always at bottom */}
      <PaymentInstructions />
    </div>
  );
}
