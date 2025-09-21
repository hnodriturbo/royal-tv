'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl'; // 🌐 components.countdownBanner.*

/**
 * 🎉 CountdownBanner
 * ------------------
 * • Displays a banner message (translated by default).
 * • Counts down and fires onComplete when done.
 * • Uses useTranslations() so t() is bound to current locale.
 */
const CountdownBanner = ({
  seconds = 10, // ⏲️ default duration
  onComplete, // 📣 callback when done
  message // 🗣️ optional caller-provided message (already translated upstream)
}) => {
  const t = useTranslations(); // 🗣️ translator bound to current language
  const [countdown, setCountdown] = useState(seconds); // 🔢 remaining seconds

  useEffect(() => {
    // ⏳ run until zero
    if (countdown > 0) {
      const timer = setTimeout(
        () => setCountdown((currentNumber) => currentNumber - 1), // ➖ decrement
        1000
      );
      return () => clearTimeout(timer); // 🧹 cleanup
    } else {
      onComplete?.(); // ✅ notify parent when finished
    }
  }, [countdown, onComplete]);

  // 🧾 use translated default if no message prop was passed
  const bannerMessage =
    typeof message === 'string' ? message : t('components.countdownBanner.default_thank_you');

  // 🧱 visual banner
  return (
    <div className="container-style p-6 text-3xl text-center mb-6 font-semibold lg:w-8/12 w-11/12">
      <p>
        {/* 🗣️ banner message + visible counter */}
        {bannerMessage} ({countdown})
      </p>
    </div>
  );
};

export default CountdownBanner; // 🚪 default export
