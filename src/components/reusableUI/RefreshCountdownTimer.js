'use client'; // ✅ client component

/**
 * ⏲️ RefreshCountdownTimer
 * - Safely handles both number and string props
 * - Renders countdown as minutes:seconds
 * - Stacks optional buttons below counter
 * - Pause/Resume works reliably
 */
import { useEffect, useRef, useState } from 'react';

export default function RefreshCountdownTimer({
  intervalSeconds = 600, // ⏲️ default 10 minutes
  onRefresh,
  showManualRefreshButton = false, // 🔘 "Refresh now"
  showPauseToggle = false // 🔘 Pause/Resume toggle
}) {
  // 🛡️ always coerce to a safe positive number
  const safeInterval = Math.max(Number(intervalSeconds) || 600, 1);

  // 👀 countdown state
  const [remaining, setRemaining] = useState(safeInterval);
  // ⏸️ drive pause/resume UI + logic
  const [paused, setPaused] = useState(false);
  // ⏱️ store interval id
  const tickRef = useRef(null);

  // 🔁 ticker
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    setRemaining(safeInterval);

    tickRef.current = setInterval(() => {
      if (paused) return; // skip when paused
      setRemaining((s) => {
        if (s > 1) return s - 1;
        onRefresh?.(); // 🚀 fire refresh
        return safeInterval; // ♻️ reset
      });
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [safeInterval, onRefresh, paused]);

  // 🧮 format M:SS
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* ⏲️ countdown */}
      <span aria-live="polite" className="font-mono text-lg">
        ⏲️ {formatted}
      </span>

      {/* 🔘 controls below */}
      <div className="flex flex-row items-center gap-2">
        {showManualRefreshButton && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              onRefresh?.();
              setRemaining(safeInterval); // reset countdown
            }}
          >
            🔄 Refresh now
          </button>
        )}
        {showPauseToggle && (
          <button type="button" className="btn-secondary" onClick={() => setPaused((p) => !p)}>
            {paused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
        )}
      </div>
    </div>
  );
}
