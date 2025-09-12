// 📁 /src/app/hooks/useMinuteRefresher.js
/**
 * useIntervalRefresher 🕒
 * -----------------------------------------------------------
 * Props (positional, for brevity)
 * • onRefresh        → callback to run when the countdown hits0
 * • intervalSeconds  → how long the timer should run (default300s=5min)
 *
 * Returns
 * • secondsLeft      → current countdown value
 * • restart()        → manual reset helper
 *
 * Usage
 * -----
// 🔄 auto‑refresh every 5 minutes
const { secondsLeft, restart } = useIntervalRefresher(() => {
  refetch(true);            // silent background refresh
}, 300);
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

export default function useIntervalRefresher(
  onRefresh, // 🛎️ function to trigger
  intervalSeconds = 300 // ⏱️ default = 5min
) {
  /* 🧮 countdown state */
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);

  /* ⏲️ every second ‑ tick‑tock */
  useEffect(() => {
    const timerId = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1_000);
    return () => clearInterval(timerId); // 🧹 cleanup
  }, []);

  /* 🚀 when we hit 0, call the callback & restart */
  useEffect(() => {
    if (secondsLeft === 0) {
      onRefresh?.(); // 🔔 run user code
      setSecondsLeft(intervalSeconds); // 🔄 reset countdown
    }
  }, [secondsLeft, onRefresh, intervalSeconds]);

  /* 🔄 manual reset helper */
  const restart = useCallback(() => setSecondsLeft(intervalSeconds), [intervalSeconds]);

  return { secondsLeft, restart }; // 🎁 expose goodies
}

///// ***** ----- Usage ----- ***** /////
/* 
<RefreshCountdownTimer
  onRefresh={() => refetch(true)}
  intervalSeconds={600} // 10 minutes
/>; */
