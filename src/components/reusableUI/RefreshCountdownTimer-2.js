// File: components/reusableUI/socket/RefreshCountdownTimer-2.js
'use client';

import RefreshCountdownTimer from '@/components/reusableUI/socket/RefreshCountdownTimer';

export default function RefreshCountdownTimer2({ seconds = 300, onRefresh, paused = false }) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 text-sm opacity-80">Auto refresh</div>
      <RefreshCountdownTimer seconds={seconds} onRefresh={onRefresh} paused={paused} />
    </div>
  );
}
