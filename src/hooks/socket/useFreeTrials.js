/**
 *   ========== useFreeTrialStatus.js ==========
 * 🆓
 * Centralized free trial status hook with real-time socket updates.
 * - Handles auto-fetch on mount, user change, and on push events from backend.
 * - Listens for both "push new status" and "refresh now" socket events.
 * =============================================
 */

import { useState, useEffect, useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useFreeTrialStatus(userId) {
  // 🟣 1️⃣ Local state for the current user's free trial status (pending, active, etc.)
  const [freeTrialStatus, setFreeTrialStatus] = useState(null);

  // 🟡 2️⃣ Grab all relevant socket event handlers from our central hub
  const {
    requestFreeTrialStatus, // Emit: asks backend for current status (for this user)
    onFreeTrialStatus, // Listen: receives server push with latest status object
    onFreeTrialStatusUpdate // Listen: receives "refresh now!" push, triggers refetch
  } = useSocketHub();

  // 🟢 3️⃣ Manual status refetcher, so other components can trigger an update
  const refreshFreeTrialStatus = useCallback(() => {
    // Emit fetch request for the latest status (uses userId in context/session)
    requestFreeTrialStatus();
  }, [requestFreeTrialStatus]);

  useEffect(() => {
    // 🟠 4️⃣ Listen for direct server status push (status object sent)
    // Server calls this when the user requests, or when a change is pushed
    const unregisterFreeTrialStatusListener = onFreeTrialStatus((status) => {
      setFreeTrialStatus(status); // Update our local state immediately
    });

    // 🔵 5️⃣ Listen for "status update now" event (no data, just a trigger)
    // This happens when the admin activates your trial or changes it in any way
    const unregisterFreeTrialStatusUpdate = onFreeTrialStatusUpdate(() => {
      // When server tells us "your status changed," refetch from backend
      requestFreeTrialStatus();
    });

    // 🟤 6️⃣ On mount (or userId changes), immediately request the latest status
    if (userId) requestFreeTrialStatus();

    // 🔚 7️⃣ Cleanup: Unregister listeners when unmounting or userId changes
    return () => {
      unregisterFreeTrialStatusListener();
      unregisterFreeTrialStatusUpdate();
    };
  }, [userId, requestFreeTrialStatus, onFreeTrialStatus, onFreeTrialStatusUpdate]);

  // 🟩 8️⃣ Return current status and manual refresh function
  return {
    freeTrialStatus, // Latest known status (for this user)
    refreshFreeTrialStatus // Function to trigger a refetch via socket
  };
}
