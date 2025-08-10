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

import logger from '@/lib/core/logger';
import { useState } from 'react';
import useModal from '@/hooks/useModal'; // 🌟 Modal hook for confirmation
import useAppHandlers from '@/hooks/useAppHandlers'; // 🛠️ App handler for loader/messages
import axiosInstance from '@/lib/core/axiosInstance';
import { useCreateNotifications } from '@/hooks/socket/useCreateNotifications';

export default function FreeTrialButton({ user_id, refreshStatus }) {
  // 🌀 Local loading state
  const [loading, setLoading] = useState(false);

  const { createFreeTrialCreatedNotification } = useCreateNotifications();
  const [freeTrial, setFreeTrial] = useState([]);
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
    try {
      showLoader({ text: 'Requesting your free trial…' }); // ⏳
      // ✨ Call the endpoint and get the user and trial from the response
      const response = await axiosInstance.post('/api/megaott/freeTrial', {});
      const { user, trial } = response.data;

      // ✅ Set the free trial and display a success message
      setFreeTrial(trial);
      displayMessage('✅ Free trial requested! You can start watching right now!', 'success');

      // ♻️ Refresh the status of the free trial
      refreshStatus && refreshStatus();

      // 📌 Create the notification both for admin and user (plus emails)
      createFreeTrialCreatedNotification(user, trial);
      logger.log('Created free trial notifications!');
    } catch (err) {
      displayMessage(
        `❗ ${err.response?.data?.error || 'Trial request failed. Try again later.'}`,
        'error'
      );
    } finally {
      hideLoader();
      hideModal(); // ⚡ Hide the modal
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
