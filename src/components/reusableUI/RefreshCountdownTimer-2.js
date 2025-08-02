/**
 * RefreshCountdownTimer.js 🧭
 * ------------------------------------------------------------
 * A self-contained component that:
 * • counts down visibly (e.g. “auto‑refresh in 292s”)
 * • refreshes silently when timer hits 0
 * • restarts countdown after each refresh
 *
 * Props
 * -----
 * • onRefresh        → callback when timer hits 0
 * • intervalSeconds  → how long the timer should run (default 300s)
 * • className        → optional style override for outer <p>
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export default function RefreshCountdownTimer({
  onRefresh,
  intervalSeconds = 300,
  className = ''
}) {
  // 🧮 current countdown value (starts full)
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);

  // ⏱️ interval tick — every 1000 ms
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setSecondsLeft((seconds) => (seconds > 0 ? s - 1 : 0));
    }, 1_000);
    return () => clearInterval(countdownTimer);
  }, []);

  // 🚀 when countdown hits 0, trigger refresh + reset
  useEffect(() => {
    if (secondsLeft === 0) {
      onRefresh?.(); // 🔔 refresh now
      setSecondsLeft(intervalSeconds); // 🔄 reset countdown
    }
  }, [secondsLeft, onRefresh, intervalSeconds]);

  // 🛠️ expose reset manually if you want to control it from outside (optional)
  const restart = useCallback(() => {
    setSecondsLeft(intervalSeconds);
  }, [intervalSeconds]);
}
// ✅ Return the html we use for the nice looking timer
return (
  <p className={`text-center text-sm mb-4 text-gray-300 ${className}`}>
    auto refresh in&nbsp;
    <span className="font-semibold text-white">{secondsLeft}</span>
  </p>
);

/* ----------- HOW TO USE IN A PAGE AS A COMPONENT ----------- */
/* 
import RefreshCountdownTimer from '@/components/reusableUI/RefreshCountdownTimer';

function AdminLiveChatMain() {
  return (
    <div>
      <h1>👥 Live Chat</h1>

      <RefreshCountdownTimer
        onRefresh={() => refetch(true)} // 👈 silent refresh
        intervalSeconds={300} // ⏲️ 5 min
      />
      
    </div>
  );
}
 */
