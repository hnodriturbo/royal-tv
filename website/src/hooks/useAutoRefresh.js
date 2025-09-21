'use client'; // ✅ required: this file runs on the client

/**
 * 🔄 useAutoRefresh — bulletproof auto-refresh helper (JavaScript / ESM)
 *
 * 🌟 What it does
 * • Wraps your data loader so it's called on a schedule
 * • Aborts overlapping requests via AbortController
 * • Avoids stale closures (always calls the latest fetch function)
 * • Optional: refresh on mount / window focus / when tab becomes visible
 *
 * 🧰 Props forwarded to your UI
 * • showCountdown ........ toggles rendering of <RefreshCountdownTimer />
 * • showManualRefreshButton / showPauseToggle pass through to the UI component
 *
 * 🧪 Usage (unchanged)
 * const { AutoRefresh } = useAutoRefresh(fetchUserConversations, {
 *   intervalSeconds: 600,
 *   uiOptions: { showManualButton: true, showPauseToggle: true },
 *   extras (optional):
 *    - refreshOnMount: true,
 *    - refreshOnWindowFocus: true,
 *    - pauseWhenHidden: true,
 * });
 * <AutoRefresh />
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import RefreshCountdownTimer from '@/components/reusableUI/RefreshCountdownTimer';

export function useAutoRefresh(fetchFunction, options = {}) {
  // 🎛️ options + safe defaults
  const {
    intervalSeconds = 600, // ⏲️ 10 minutes by default
    uiOptions: {
      showCountdown = true, // 👁️ show countdown widget
      showManualButton = false, // 🧑‍💻 "Refresh now" button
      showPauseToggle = false // ⏸️ pause/resume toggle
    } = {},
    refreshOnMount = false, // 🚀 refresh once when the UI mounts
    refreshOnWindowFocus = false, // 👀 refresh when window regains focus
    pauseWhenHidden = false, // 💤 skip background refresh; refresh once on visible
    minIntervalSeconds = 600 // 🛡️ don't hammer your API
  } = options;

  // 🧠 keep the latest fetch function (prevents stale closures)
  const latestFetchRef = useRef(fetchFunction);
  useEffect(() => {
    latestFetchRef.current = fetchFunction;
  }, [fetchFunction]);

  // 🧯 track the in-flight request and cancel safely
  const inFlightAbortRef = useRef(null);
  useEffect(() => {
    // 🧹 abort any in-flight request on unmount/HMR
    return () => {
      if (inFlightAbortRef.current) {
        inFlightAbortRef.current.abort();
        inFlightAbortRef.current = null;
      }
    };
  }, []);

  // 🔁 unified refresh handler (stable)
  const handleRefresh = useCallback(async () => {
    // 💤 if hidden and policy says pause, do nothing now
    if (
      pauseWhenHidden &&
      typeof document !== 'undefined' &&
      document.visibilityState === 'hidden'
    ) {
      return;
    }

    // 🔪 abort previous run before starting a new one
    if (inFlightAbortRef.current) inFlightAbortRef.current.abort();
    const ac = new AbortController();
    inFlightAbortRef.current = ac;

    try {
      const fn = latestFetchRef.current;
      if (typeof fn === 'function') {
        const maybePromise = fn({ signal: ac.signal });
        // ⏳ support both sync and async loaders
        if (maybePromise && typeof maybePromise.then === 'function') {
          await maybePromise;
        }
      } else if (process.env.NODE_ENV !== 'production') {
        console.warn('useAutoRefresh: fetchFunction is not a function');
      }
    } catch (err) {
      // 🙈 ignore aborts; surface other errors in dev
      if (!(err && err.name === 'AbortError') && process.env.NODE_ENV !== 'production') {
        console.error('useAutoRefresh: fetch error', err);
      }
    } finally {
      // 🧽 clear only if it's still our controller
      if (inFlightAbortRef.current === ac) {
        inFlightAbortRef.current = null;
      }
    }
  }, [pauseWhenHidden]);

  // 🧰 normalize props once (clamp interval + map UI props)
  const normalized = useMemo(() => {
    const raw = Number.isFinite(intervalSeconds) ? intervalSeconds : 600;
    const safeInterval = Math.max(raw, minIntervalSeconds);
    return {
      intervalSeconds: safeInterval,
      showCountdown,
      showManualRefreshButton: showManualButton,
      showPauseToggle
    };
  }, [intervalSeconds, minIntervalSeconds, showCountdown, showManualButton, showPauseToggle]);

  // 🎛️ the small component you render in pages
  function AutoRefresh() {
    // ✅ always call hooks
    useEffect(() => {
      if (!refreshOnMount) return;
      // run after mount
      handleRefresh();
    }, [refreshOnMount, handleRefresh]);

    useEffect(() => {
      if (typeof window === 'undefined') return;

      const onFocus = () => handleRefresh();
      const onVisibility = () => {
        if (document.visibilityState === 'visible' && pauseWhenHidden) handleRefresh();
      };

      if (refreshOnWindowFocus) window.addEventListener('focus', onFocus);
      if (pauseWhenHidden) document.addEventListener('visibilitychange', onVisibility);

      return () => {
        if (refreshOnWindowFocus) window.removeEventListener('focus', onFocus);
        if (pauseWhenHidden) document.removeEventListener('visibilitychange', onVisibility);
      };
    }, [refreshOnWindowFocus, pauseWhenHidden, handleRefresh]);

    // ✅ conditional *render*, not conditional hooks
    if (!normalized.showCountdown) return null;
    return (
      <RefreshCountdownTimer
        onRefresh={handleRefresh}
        intervalSeconds={normalized.intervalSeconds}
        showManualRefreshButton={normalized.showManualRefreshButton}
        showPauseToggle={normalized.showPauseToggle}
      />
    );
  }

  // 🎁 expose the component
  return { AutoRefresh };
}
