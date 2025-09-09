// File: components/reusableUI/socket/RefreshCountdownTimer.js
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function RefreshCountdownTimer({ seconds = 60, onRefresh, paused = false }) {
  const t = useTranslations();
  const [remaining, setRemaining] = useState(seconds);
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemaining((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [paused]);

  useEffect(() => {
    if (remaining === 0) {
      onRefresh?.();
      setRemaining(seconds);
    }
  }, [remaining, seconds, onRefresh]);

  return (
    <div className="flex items-center gap-3">
      <span className="tabular-nums">{remaining}s</span>
      <button type="button" className="btn-outline-primary" onClick={() => onRefresh?.()}>
        {t('socket.ui.common.refresh')}
      </button>
    </div>
  );
}
