'use client';
/**
 * useAutoRefresh.js 🔄
 * --------------------------------------------
 * Simplify periodic data fetching:
 *   ① Call your <fetchFunction> once every N seconds
 *   ② (Optionally) render a visible ⏲️ countdown with
 *      “Refresh Now” + Pause / Resume buttons.
 *
 * Parameters
 * ----------
 * • fetchFunction ........ async () => void   ← the thing that loads data
 * • intervalSeconds ...... number (default 600 = 10 min)
 * • uiOptions ............ {
 *       showCountdown:       boolean  (default true)
 *       showManualButton:    boolean  (default false)
 *       showPauseToggle:     boolean  (default false)
 *   }
 *
 * Returns
 * -------
 * • AutoRefresh .......... React component — render <AutoRefresh /> anywhere
 *
 * Usage
 * -----
 * const { AutoRefresh } = useAutoRefresh(fetchConversations, {
 *   intervalSeconds: 600,
 *   uiOptions: { showManualButton: true, showPauseToggle: true },
 * });
 */

import { useCallback } from 'react';
import RefreshCountdownTimer from '@/components/reusableUI/RefreshCountdownTimer';

export const useAutoRefresh = (
  fetchFunction,
  {
    intervalSeconds = 600, // ⏲️ 10 min default
    uiOptions: { showCountdown = true, showManualButton = false, showPauseToggle = false } = {}
  } = {}
) => {
  // 🪝 Stable wrapper so RefreshCountdownTimer never re-creates the interval
  const handleRefresh = useCallback(() => {
    fetchFunction(); // ➡️ caller-supplied loader
  }, [fetchFunction]);

  // 🎛️ Define a real component (not a JSX literal!)
  function AutoRefresh() {
    if (!showCountdown) return null;
    return (
      <RefreshCountdownTimer
        onRefresh={handleRefresh}
        intervalSeconds={intervalSeconds}
        showManualRefreshButton={showManualButton}
        showPauseToggle={showPauseToggle}
      />
    );
  }

  // 🎁 Expose the component
  return { AutoRefresh };
};
