'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n'; // 🧭 App Router
import { useTranslations } from 'next-intl'; // 🌐 components.countdownRedirect.*

/**
 * 🔀 CountdownRedirect
 * --------------------
 * • Shows a heading message (prop-controlled) and a translated "Redirecting in X seconds…" line.
 * • Pushes to `redirectTo` when the counter hits 0.
 * • Uses useTranslations() so t() is bound to current locale.
 */
const CountdownRedirect = ({
  seconds,
  redirectTo,
  message, // 🗣️ supplied by parent (can be translated upstream)
  messageSize = 'text-3xl', // 🔠 heading size
  counterSize = 'text-2xl', // 🔢 counter size
  children // 🧩 optional extra UI
}) => {
  const t = useTranslations(); // 🗣️ translator bound to current language
  const [counter, setCounter] = useState(seconds); // ⏱️ remaining seconds
  const router = useRouter(); // 🧭 programmatic navigation

  useEffect(() => {
    // ⏳ tick until reaching 0 then navigate
    const interval = setInterval(() => {
      setCounter((previousValue) => {
        if (previousValue <= 1) {
          clearInterval(interval); // 🛑 stop ticking
          setTimeout(() => router.push(redirectTo), 0); // 🚀 navigate
          return 0; // 🧮 clamp at zero
        }
        return previousValue - 1; // ➖ decrement
      });
    }, 1000);

    return () => clearInterval(interval); // 🧹 cleanup on unmount
  }, [redirectTo, router]);

  // 🗣️ pick singular/plural label for the counter line
  const counterKey =
    counter === 1
      ? 'components.countdownRedirect.redirecting_in_singular'
      : 'components.countdownRedirect.redirecting_in_plural';

  return (
    <div className="flex items-center justify-center flex-col min-h-screen">
      <div className="flex items-center justify-center">
        <div className="container-style p-6 items-center justify-center">
          {/* 🏷️ heading from parent (can be translated by caller) */}
          <h2 className={`${messageSize} font-bold text-center`}>{message}</h2>

          {/* 🔢 translated counter line */}
          <p className={`${counterSize} mt-3 items-center text-center`}>
            {t(counterKey, { seconds: counter })}
          </p>

          {/* 🧩 optional trailing UI */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default CountdownRedirect; // 🚪 default export
