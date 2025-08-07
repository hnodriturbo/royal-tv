/**
 * ===========================================
 * useFreeTrialStatus.js
 * 🎟️ Custom React Hook for Free Trial Status
 * -------------------------------------------
 * - Handles real-time free trial status for a user.
 * - Communicates via Socket.IO (socketHub).
 * - Provides live updates & manual refresh.
 * - Returns status, errors, and refreshers.
 * ===========================================
 */

import { useState, useEffect, useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useFreeTrialStatus(user_id) {
  // 🌟 State for trial status & errors
  const [freeTrialStatus, setFreeTrialStatus] = useState(null); // ⏳, ✅, ❌
  const [error, setError] = useState(null);

  // 🚦 SocketHub actions & listeners
  const {
    requestFreeTrialStatus, // 🔗 Requests current status from backend
    onFreeTrialStatus, // 🎧 Subscribes to status updates
    offFreeTrialStatus // 🛑 Unsubscribes from status updates
  } = useSocketHub();

  // 🔁 Refresh function (safe)
  const refreshStatus = useCallback(() => {
    if (user_id) requestFreeTrialStatus(user_id);
  }, [user_id, requestFreeTrialStatus]);

  // 🎯 Effect: Listen for updates, request on mount/change
  useEffect(() => {
    if (!user_id) {
      setFreeTrialStatus(null);
      return;
    }

    // 📝 Listen for trial status updates
    const unsubscribe = onFreeTrialStatus((status, err) => {
      setFreeTrialStatus(status || null);
      setError(err || null);
    });

    // 🚀 Request status immediately
    requestFreeTrialStatus(user_id);

    // 🧹 Cleanup listener on unmount/change
    return () => {
      unsubscribe && unsubscribe();
      offFreeTrialStatus && offFreeTrialStatus();
    };
  }, [user_id, onFreeTrialStatus, requestFreeTrialStatus, offFreeTrialStatus]);

  // 🎁 Return status, error, and manual refresh
  return { freeTrialStatus, error, refreshStatus };
}
