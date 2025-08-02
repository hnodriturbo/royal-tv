// components/FreeTrialButton.js
'use client';

import { useState } from 'react';
import axiosInstance from '@/lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';

export default function FreeTrialButton() {
  // 🟢 Track the status for button UI
  const [status, setStatus] = useState(null);
  const { displayMessage } = useAppHandlers();

  // 🚀 Handle button click to create free trial
  const createTrial = async () => {
    setStatus('pending');
    try {
      // 📨 No need to send user_id, context/middleware provides it!
      const { data } = await axiosInstance.post('/api/megaott/freeTrial');
      setStatus('success');
      displayMessage(
        `Trial created! Username: ${data.trial.username}, Password: ${data.trial.password}`,
        'success'
      );
      console.log('freeTrial response: ', data);
    } catch (error) {
      setStatus('error');
      displayMessage(error.response?.data?.error || 'Failed to create trial', 'error');
    }
  };

  return (
    <button onClick={createTrial} className="btn-primary" disabled={status === 'pending'}>
      {/* ⚡ Dynamic button label */}
      {status === 'pending' ? 'Creating…' : 'Get 4-Hour Free Trial'}
    </button>
  );
}
