/**
 * ===========================================
 * FreeTrialButton.js
 * 🎟️ Free Trial Request Button (with Modal)
 * -------------------------------------------
 * - Lets user request a free trial (one time)
 * - Shows confirmation modal before action
 * - Uses app-wide loader and displayMessage
 * - Notifies user on success/fail
 * ===========================================
 */

'use client';

import { useState } from 'react';
import useModal from '@/hooks/useModal'; // 🌟 Modal hook for confirmation
import useAppHandlers from '@/hooks/useAppHandlers'; // 🛠️ App handler for loader/messages
import axiosInstance from '@/lib/axiosInstance';

export default function FreeTrialButton({ user_id, refreshStatus }) {
  // 🌀 Local loading state
  const [loading, setLoading] = useState(false);

  // 🔮 Modal handlers
  const { openModal, hideModal } = useModal();

  // 🛠️ App-wide feedback
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  // 🖱️ Button click: open confirm modal first!
  const handleOpenModal = () => {
    openModal('confirmFreeTrial', {
      title: 'Confirm Free Trial Request',
      description:
        'Are you sure you want to request your free trial? You can only get one per account. You will be notified as soon as it is ready! 🎉',
      confirmButtonType: 'Purple',
      confirmButtonText: 'Yes, request my free trial!',
      cancelButtonText: 'Cancel',
      onConfirm: handleRequestTrial, // Will call the actual API logic below
      onCancel: () => hideModal()
    });
  };

  // 🚀 The actual free trial API logic (called from modal onConfirm)
  const handleRequestTrial = async () => {
    setLoading(true);
    showLoader({ text: 'Requesting your free trial…' }); // ⏳

    try {
      await axiosInstance.post('/api/megaott/freeTrial', {});
      displayMessage(
        '✅ Free trial requested! You will receive a notification when it is ready.',
        'success'
      );
      refreshStatus && refreshStatus(); // 🔄
      hideModal(); // 🧹
    } catch (err) {
      displayMessage(
        `❗ ${err.response?.data?.error || 'Trial request failed. Try again later.'}`,
        'error'
      );
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  return (
    <button
      className="w-full py-4 mt-4 text-xl font-bold rounded-2xl shadow-lg 
                flex items-center justify-center transition-all duration-300 
                bg-purple-600 hover:bg-purple-800 active:bg-purple-900 
                ring-2 ring-purple-400 hover:scale-105 focus:outline-none 
                focus:ring-4 focus:ring-purple-500"
      disabled={loading}
      onClick={handleOpenModal} // or handleRequestTrial, if no modal
    >
      {loading ? (
        <>
          <span className="animate-spin mr-3">⏳</span>
          Requesting…
        </>
      ) : (
        <>
          <span>🎟️</span>
          <span className="ml-3">Request Free Trial</span>
        </>
      )}
    </button>
  );
}
