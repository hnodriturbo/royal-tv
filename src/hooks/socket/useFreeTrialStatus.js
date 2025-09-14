/**
 * useFreeTrialStatus.js
 * -----------------------------------------------------
 * 🎟️ Beginner-friendly Free-Trial status hook (no dedupe).
 *
 * ✅ What it does
 *   - Subscribes to "free_trial_status" when a user_id exists
 *   - Immediately asks the server for the current status
 *   - Cleans up the listener on unmount or user change
 *   - Exposes `refreshStatus()` to manually re-request
 *
 * 🧩 Your socket hub functions (as provided):
 *   const requestFreeTrialStatus = useCallback(
 *     () => guardedEmit('fetch_free_trial_status'),
 *     [guardedEmit]
 *   );
 *   const onFreeTrialStatus = useCallback(
 *     (handler) => guardedListen('free_trial_status', handler),
 *     [guardedListen]
 *   );
 *
 * 📝 Note
 *   - We accept `user_id` to keep your panel usage unchanged.
 *   - Server identifies the user via the socket/session, so we don't send it.
 *   - In development, Fast Refresh can remount components more often than prod.
 *     This code subscribes per mount and requests once per mount.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useFreeTrialStatus(user_id) {
  // UI state
  const [freeTrialStatus, setFreeTrialStatus] = useState(null); // 'active' | 'expired' | 'disabled' | null
  const [error, setError] = useState(null);

  // Socket API (could change identity between renders depending on the hub)
  const { requestFreeTrialStatus, onFreeTrialStatus } = useSocketHub();

  // Keep latest socket functions in refs so our effect only depends on user_id.
  const requestRef = useRef(requestFreeTrialStatus);
  const onRef = useRef(onFreeTrialStatus);

  useEffect(() => {
    requestRef.current = requestFreeTrialStatus;
    onRef.current = onFreeTrialStatus;
  }, [requestFreeTrialStatus, onFreeTrialStatus]);

  // Manual refresh: only makes sense if we have a user
  const refreshStatus = useCallback(() => {
    if (!user_id) return;
    requestRef.current?.();
  }, [user_id]);

  useEffect(() => {
    // If there's no user, reset local state and do nothing.
    if (!user_id) {
      setFreeTrialStatus(null);
      setError(null);
      return;
    }

    // 1) Subscribe to server updates
    const unsubscribe = onRef.current?.((arg1, arg2) => {
      // Normalize payload shape:
      //  - handler(statusString)
      //  - handler({ status, error })
      //  - handler(status, error)
      if (typeof arg1 === 'string') {
        setFreeTrialStatus(arg1 || null);
        setError(arg2 || null);
      } else if (arg1 && typeof arg1 === 'object') {
        setFreeTrialStatus(arg1.status ?? null);
        setError(arg1.error ?? null);
      } else {
        setFreeTrialStatus(null);
        setError(null);
      }
    });

    // 2) Immediately ask the server for current status
    requestRef.current?.();

    // 3) Cleanup on unmount or when user_id changes
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user_id]); // 👈 only re-run when user_id changes

  return { freeTrialStatus, error, refreshStatus };
}
