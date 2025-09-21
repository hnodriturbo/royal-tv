// components/reusableUI/socket/RefreshCountdownTimer-2.js
'use client';
import RefreshCountdownTimer from '@/components/reusableUI/RefreshCountdownTimer';

export default function RefreshCountdownTimer2({ seconds = 300, onRefresh, paused = false }) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 text-sm opacity-80">Auto refresh</div>
      <RefreshCountdownTimer
        intervalSeconds={seconds}
        onRefresh={onRefresh}
        showPauseToggle
        showManualRefreshButton
        // paused is internal in the base component; if you need external control,
        // add a prop to the base component instead of passing "paused" through.
      />
    </div>
  );
}
