'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import CountdownBanner from '@/components/ui/countdown/countdownBanner';

const MoreInfoPage = () => {
  // The states for thank you message
  const [showThankYou, setShowThankYou] = useState(false);
  /* const [countdown, setCountdown] = useState(10); */

  // Search parameters to check if user came through the form page
  const searchParams = useSearchParams();
  const submitted = searchParams.get('submitted');

  useEffect(() => {
    if (submitted === 'true') {
      setShowThankYou(true);
    }
  }, [submitted]);

  /*
  useEffect(() => {
    // Create a timer that counts from 10 to 0
    if (showThankYou && countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }

    // Hide the countdown container after the countdown
    if (countdown === 0) {
      setShowThankYou(false);
    }
  }, [showThankYou, countdown]);  */

  return (
    <>
      <div className="flex flex-col items-center w-full lg:mt-0 mt-12">
        {/* ✅ Thank you banner */}
        {/*         {showThankYou && (
          <div className="p-6 mb-6 text-3xl font-semibold text-center container-style lg:w-8/12 w-11/12">
            <p>
              Thank you for contacting us! We’ll get back to you as soon as
              possible. ({countdown})
            </p>
          </div>
        )} */}
        {showThankYou && (
          <CountdownBanner
            seconds={10}
            message="Thank you for contacting us! We’ll get back to you as soon as possible."
            onComplete={() => setShowThankYou(false)}
          />
        )}
        <div className="container-style lg:w-8/12 w-11/12 p-6 text-center mb-6">
          {/* ✅ Section: Choose your IPTV app */}
          <h2 className="text-3xl font-bold mb-4">Choose Your IPTV App</h2>
          <p className="mb-4">
            We highly recommend that you explore the IPTV app you plan to use with your subscription
            or trial. Once we’re in contact, the process is quick and easy. After completing your
            purchase, we’ll send your login credentials.
          </p>
          <p className="mb-4">
            Our top recommendation is <strong>MaxPlayer</strong> (compatible with all devices).
          </p>
          <p className="mb-4">
            We also suggest <strong>TiviMate</strong> (works on Android, Firestick, and Android TV)
            and <strong>Smarters Player Lite</strong> (compatible with iOS, Android, Firestick,
            Windows, and macOS).
          </p>
        </div>
        <div className="p-6 text-center container-style lg:w-8/12 w-11/12">
          {/* ✅ Section: Choose your IPTV app */}
          <h2 className="mb-4 text-3xl font-bold">Choose Your IPTV App</h2>
          <p className="mb-4">
            We highly recommend that you explore the IPTV app you plan to use with your subscription
            or trial. Once we’re in contact, the process is quick and easy. After completing your
            purchase, we’ll send your login credentials.
          </p>
          <p className="mb-4">
            Our top recommendation is <strong>MaxPlayer</strong> (compatible with all devices).
          </p>
          <p className="mb-8">
            We also suggest <strong>TiviMate</strong> (works on Android, Firestick, and Android TV)
            and <strong>Smarters Player Lite</strong> (compatible with iOS, Android, Firestick,
            Windows, and macOS).
          </p>

          {/* ✅ Section: Bitcoin payment guide */}

          <h2 className="mb-4 text-3xl font-bold">How to Buy Bitcoin & Pay Us</h2>
          <p className="mb-4">
            Paying with Bitcoin is very simple. Follow the steps below to get started:
          </p>
          <ol className="mb-8 space-y-2 list-decimal list-inside">
            <li>
              Visit a trusted crypto exchange like <strong>Coinbase</strong> or{' '}
              <strong>Binance</strong>.
            </li>
            <li>Create an account if you don’t have one already.</li>
            <li>Purchase Bitcoin using a debit card, credit card, or bank transfer.</li>
            <li>Return to our website and choose your preferred subscription option.</li>
            <li>
              Fill in your details and follow the instructions to complete the Bitcoin payment.
            </li>
          </ol>
        </div>
      </div>
    </>
  );
};

export default MoreInfoPage;
