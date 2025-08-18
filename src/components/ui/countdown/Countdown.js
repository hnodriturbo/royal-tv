'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n/client'; // 🌐 get locale-bound translator

/**
 * ⏱️ SimpleCountdown
 * -------------------
 * • Shows a live seconds countdown with translated label.
 * • Calls onComplete when the timer hits 0.
 * • Uses useT() so t() is bound to current locale.
 */
const SimpleCountdown = ({ seconds, onComplete }) => {
  const t = useT(); // 🗣️ translator bound to current language
  const [timeLeft, setTimeLeft] = useState(seconds); // 🧮 track remaining seconds

  useEffect(() => {
    // 🧵 stop & notify when finished
    if (timeLeft <= 0) {
      onComplete?.(); // ✅ inform parent
      return; // 🛑 stop scheduling further intervals
    }

    // ⏳ tick the clock every second
    const timer = setInterval(() => {
      setTimeLeft((previousSeconds) => previousSeconds - 1); // ➖ decrement
    }, 1000);

    return () => clearInterval(timer); // 🧹 cleanup the interval
  }, [timeLeft, onComplete]);

  // 🗣️ pick singular/plural label
  const labelKey =
    timeLeft === 1
      ? 'components.countdown.seconds_remaining_singular'
      : 'components.countdown.seconds_remaining_plural';

  return (
    <span>
      {/* 🖨️ human-readable countdown message */}
      {t(labelKey, { seconds: timeLeft })}
    </span>
  );
};

export default SimpleCountdown; // 🚪 default export
