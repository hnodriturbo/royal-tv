/**
 *   ========== FreeTrials.js ==========
 * 🆓
 * USER FREE TRIAL DASHBOARD PANEL
 * - Uses useFreeTrialStatus for status and refresh.
 * - Uses unified notification refresh (no resort hack).
 * ========================================
 */
'use client';
import { useState } from 'react';
import useFreeTrialStatus from '@/hooks/socket/useFreeTrials'; // 🟢 Rename for clarity!
import FreeTrialButton from '@/components/reusableUI/FreeTrialButton';
import axiosInstance from '@/lib/axiosInstance';
import useNotifications from '@/hooks/socket/useNotifications';
import useModal from '@/hooks/useModal';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useCreateNotifications } from '@/hooks/socket/useCreateNotifications';
import clsx from 'clsx';

export default function FreeTrials({ user_id, className }) {
  const { freeTrialStatus, refreshFreeTrialStatus } = useFreeTrialStatus(user_id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { openModal, hideModal } = useModal();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 🟢 Get the unified Notification stuff
  const { createFreeTrialRequestedNotification } = useCreateNotifications();
  const { refreshNotifications } = useNotifications(user_id);

  const handleFreeTrialClick = () => {
    openModal('confirmFreeTrial', {
      title: 'Confirm Free Trial Request',
      description:
        'Are you sure you want to request a free trial? You can only request one free trial per account.',
      confirmButtonText: 'Yes, Request',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        setLoading(true);
        setError(null);
        showLoader({ text: 'Submitting Free Trial Request…' });

        try {
          // ⬇️ Call the API
          const response = await axiosInstance.post('/api/user/freeTrials', {});

          // ⬇️ Destructure user and freeTrial from response
          const { user, freeTrial } = response.data;

          // ⬇️ Create notification using the socket hook
          if (user && freeTrial) {
            createFreeTrialRequestedNotification(user, freeTrial);
          }

          displayMessage(
            '✅ Free trial requested! You will receive email or notification when its active.',
            'success'
          );
          refreshFreeTrialStatus();
          refreshNotifications();
        } catch (err) {
          setError(err.response?.data?.error || 'Request failed');
        } finally {
          setLoading(false);
          hideLoader();
          hideModal();
        }
      },
      onCancel: () => hideModal()
    });
  };

  return (
    <div
      className={clsx('w-11/12 lg:w-[600px] mx-auto flex flex-col items-center my-2', className)}
    >
      <FreeTrialButton
        freeTrialStatus={freeTrialStatus}
        loading={loading}
        error={error}
        onClick={handleFreeTrialClick}
      />
    </div>
  );
}
