/**
 * RefreshCountdownTimer.js 🧭
 * ------------------------------------------------------------
 * Visible countdown component with optional "Refresh Now" and
 * Pause / Resume controls.
 *
 * Props
 * -----
 * • onRefresh .................... callback executed when the countdown
 *                                   reaches 0 **or** when the user clicks
 *                                   "Refresh Now".
 * • intervalSeconds .............. length of one countdown cycle in
 *                                   seconds. Default → 300 (5 min).
 * • className .................... extra Tailwind classes for the outer
 *                                   wrapper.
 * • showManualRefreshButton ...... boolean → show the 🔁 button.
 * • showPauseToggle .............. boolean → show the ⏸ / ▶️ toggle.
 *
 * Usage (quick glance)
 * --------------------
 * <RefreshCountdownTimer
 *   onRefresh={() => refetch(true)}
 *   intervalSeconds={600}                // 10 min
 *   showManualRefreshButton={true}
 *   showPauseToggle={true}
 * />
 */

'use client';

// 1️⃣ React goodies
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl'; // 🌐 i18n

// 2️⃣ Helper → format seconds as "m:ss"
function formatSecondsAsMMSS(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(1, '0'); // at least one digit
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function RefreshCountdownTimer({
  onRefresh,
  intervalSeconds = 300,
  className = '',
  showManualRefreshButton = false,
  showPauseToggle = false
}) {
  const t = useTranslations(); // 🔤

  // 3️⃣ State → countdown & pause toggle
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);
  const [isPaused, setIsPaused] = useState(false);

  // 4️⃣ Ref → keep interval ID across renders
  const intervalIdRef = useRef(null);

  // 5️⃣ Tick logic
  useEffect(() => {
    // 🛑 Clear any existing interval first
    clearInterval(intervalIdRef.current);

    // ▶️ Only start ticking when NOT paused
    if (!isPaused) {
      intervalIdRef.current = setInterval(() => {
        setSecondsLeft((previousSeconds) => (previousSeconds > 0 ? previousSeconds - 1 : 0));
      }, 1_000);
    }

    // 🧹 Cleanup when component unmounts or when pause state changes
    return () => clearInterval(intervalIdRef.current);
  }, [isPaused]);

  // 6️⃣ When countdown hits 0 → run callback & restart
  useEffect(() => {
    if (secondsLeft === 0 && !isPaused) {
      onRefresh?.(); // 🔔 trigger callback
      setSecondsLeft(intervalSeconds); // 🔄 restart timer
    }
  }, [secondsLeft, isPaused, onRefresh, intervalSeconds]);

  // 7️⃣ Manual "Refresh Now" handler
  const handleManualRefresh = useCallback(() => {
    onRefresh?.(); // ⏩ user‑triggered refresh
    setSecondsLeft(intervalSeconds); // 🔄 restart timer
  }, [onRefresh, intervalSeconds]);

  // 8️⃣ Pause / Resume toggle handler
  const togglePause = useCallback(() => setIsPaused((previous) => !previous), []);

  // 9️⃣ Memoised formatted time to avoid extra calculations
  const formattedTime = useMemo(
    () =>
      isPaused ? t('components.refreshCountdownTimer.paused') : formatSecondsAsMMSS(secondsLeft),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [secondsLeft, isPaused]
  );

  // 🔟 Render
  return (
    <div className={`flex flex-col items-center gap-2 z-[30] relative ${className}`}>
      {/* 1️⃣ Display countdown */}
      <p className="text-sm text-gray-300">
        {t('components.refreshCountdownTimer.auto_refresh_in')}&nbsp;
        <span className="font-semibold text-white">{formattedTime}</span>
      </p>

      {/* 2️⃣ Optional controls */}
      {(showManualRefreshButton || showPauseToggle) && (
        <div className="flex gap-3">
          {showManualRefreshButton && (
            <button
              onClick={handleManualRefresh}
              className="px-3 py-1 text-sm rounded bg-gray-600 hover:bg-blue-700 text-white whitespace-nowrap"
            >
              🔁 {t('components.refreshCountdownTimer.refresh_now')}
            </button>
          )}

          {showPauseToggle && (
            <button
              onClick={togglePause}
              className="px-3 py-1 text-sm rounded bg-gray-600 hover:bg-gray-700 text-white whitespace-nowrap"
            >
              {isPaused
                ? `▶️ ${t('components.refreshCountdownTimer.resume')}`
                : `⏸️ ${t('components.refreshCountdownTimer.pause')}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
