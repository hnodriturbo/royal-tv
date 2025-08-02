/**
 *   ====================== AdminEditFreeTrialPage.js ======================
 * 🎁
 * HEADLINE: Admin Free Trial Detail/Edit
 * - Shows and edits a single free trial for a user.
 * - Allows status, username, password, URL, etc, to be changed.
 * - User info displayed at top.
 * - Uses admin guard, loader, and modal for delete.
 * ========================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axiosInstance from '@/lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useSession } from 'next-auth/react';
import useModal from '@/hooks/useModal';
import useSocketHub from '@/hooks/socket/useSocketHub';
import { useCreateNotifications } from '@/hooks/socket/useCreateNotifications';

export default function AdminEditFreeTrialPage() {
  // 🦸 Admin session/auth setup
  const { data: session, status } = useSession();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const [loading, setLoading] = useState(false);
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { openModal, hideModal } = useModal();
  const router = useRouter();
  const params = useParams();
  const { trial_id } = params;
  const { freeTrialStatusUpdate } = useSocketHub();
  const { createFreeTrialActivatedNotification } = useCreateNotifications();
  // 📝 State
  const [freeTrial, setFreeTrial] = useState(null);
  const [formData, setFormData] = useState({});
  const [previousStatus, setPreviousStatus] = useState('');

  // 1️⃣ Fetch Free Trial
  const fetchFreeTrial = async () => {
    try {
      showLoader({ text: 'Loading free trial...' });
      const response = await axiosInstance.get(`/api/admin/freeTrials/${trial_id}`);
      setFreeTrial(response.data.freeTrial);
      setFormData(response.data.freeTrial);
      setPreviousStatus(response.data.freeTrial.status);
    } catch (err) {
      displayMessage('❌ Failed to load free trial', 'error');
    } finally {
      hideLoader();
    }
  };

  // 2️⃣ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Converts a Date (or ISO string) to "YYYY-MM-DDTHH:mm" in local time,
   * perfect for <input type="datetime-local" /> value.
   */
  function toDatetimeLocalString(dateInput) {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    const pad = (n) => n.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // 3️⃣ Handle the Update process
  const handleUpdate = async () => {
    showLoader({ text: 'Updating free trial...' });
    setLoading(true);
    try {
      const { user, ...patchData } = formData;
      if (patchData.startDate) patchData.startDate = new Date(patchData.startDate).toISOString();
      if (patchData.endDate) patchData.endDate = new Date(patchData.endDate).toISOString();

      // 1️⃣ PATCH: get response with updated trial & previousStatus
      const response = await axiosInstance.patch(`/api/admin/freeTrials/${trial_id}`, patchData);

      const { trial: updatedTrial, previousStatus } = response.data;

      displayMessage('✅ Free trial updated successfully', 'success');

      // 2️⃣ Notify if status changed to active
      if (previousStatus !== updatedTrial.status && updatedTrial.status === 'active') {
        // 🟢 1. Send notification to user and admin
        createFreeTrialActivatedNotification(updatedTrial.user, updatedTrial);
        // 🟢 2. Emit a status update socket event to user, so their UI refreshes instantly
        freeTrialStatusUpdate(updatedTrial.user.user_id);
      }

      setTimeout(() => {
        router.push('/admin/freeTrials/main');
      }, 2000);
    } catch (err) {
      displayMessage('❌ Failed to update free trial', 'error');
    } finally {
      hideLoader();
      setLoading(false);
    }
  };

  // 4️⃣ Handle delete (modal)
  const handleDelete = () => {
    openModal('deleteFreeTrial', {
      title: 'Delete Free Trial',
      description: 'Are you sure you want to delete this free trial? This cannot be undone.',
      confirmButtonText: 'Delete',
      confirmButtonType: 'Danger',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        try {
          showLoader({ text: 'Deleting free trial...' });
          await axiosInstance.delete(`/api/admin/freeTrials/${trial_id}`);
          displayMessage('✅ Free trial deleted!', 'success');
          hideModal();
          router.replace('/admin/freeTrial/main');
        } catch (err) {
          displayMessage('❌ Delete failed: ' + err.message, 'error');
        } finally {
          hideLoader();
        }
      },
      onCancel: () => {
        displayMessage('🛑 Deletion cancelled.', 'info');
        hideModal();
      }
    });
  };

  useEffect(() => {
    if (formData.startDate) {
      // Calculate endDate (startDate + 1 day) and set it in state
      setFormData((prev) => ({
        ...prev,
        endDate: new Date(new Date(prev.startDate).getTime() + 24 * 60 * 60 * 1000).toISOString()
      }));
    }
  }, [formData.startDate]);

  // 5️⃣ Status badge
  const renderStatusBadge = (status) => {
    const colorMap = {
      active: 'bg-green-600',
      pending: 'bg-yellow-500',
      disabled: 'bg-gray-500'
    };
    return (
      <span
        className={`text-white text-center px-4 py-2 rounded text-sm ${colorMap[status] || 'bg-gray-400'}`}
      >
        {status}
      </span>
    );
  };

  // 6️⃣ useEffect to fetch & guard
  useEffect(() => {
    if (trial_id && status === 'authenticated') {
      fetchFreeTrial();
    }
  }, [trial_id, status]);

  // 4️⃣ Redirect if not allowed
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 7️⃣ Render
  if (!isAllowed || !freeTrial) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        <h1 className="text-2xl font-bold mb-4">
          Edit Free Trial For {freeTrial.user?.name || 'unknown user'}
        </h1>
        {/* 👤 User info */}
        {freeTrial.user && (
          <div className="flex justify-center">
            <div className="container-style border rounded-xl shadow-md p-6 mb-6 w-1/2">
              <h2 className="text-lg font-bold mb-2">👤 User Information</h2>
              <p>
                <strong>Name:</strong> {freeTrial.user.name || 'N/A'}
              </p>
              <p>
                <strong>Email:</strong> {freeTrial.user.email || 'N/A'}
              </p>
              <p>
                <strong>WhatsApp:</strong> {freeTrial.user.whatsapp || 'N/A'}
              </p>
              <p>
                <strong>Telegram:</strong> {freeTrial.user.telegram || 'N/A'}
              </p>
              <p>
                <strong>User ID:</strong> {freeTrial.user.user_id}
              </p>
            </div>
          </div>
        )}

        {/* ================= Responsive Edit Block ================= */}
        <div className="flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-2xl bg-gray-900/90 border border-gray-700 rounded-2xl shadow-md p-4 sm:p-6 md:p-8 mb-8">
            {/* 1️⃣ Status badge */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                Current Status
              </label>
              <div>{renderStatusBadge(formData.status)}</div>
            </div>
            {/* 2️⃣ Username */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                Free Trial Username
              </label>
              <input
                className="input w-full lg:max-w-md"
                name="free_trial_username"
                placeholder="Username"
                value={formData.free_trial_username || ''}
                onChange={handleChange}
              />
            </div>
            {/* 3️⃣ Password */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                Free Trial Password
              </label>
              <input
                className="input w-full lg:max-w-md"
                name="free_trial_password"
                placeholder="Password"
                value={formData.free_trial_password || ''}
                onChange={handleChange}
              />
            </div>
            {/* 4️⃣ Portal URL */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">Portal URL</label>
              <input
                className="input w-full lg:max-w-md"
                name="free_trial_url"
                placeholder="Portal URL"
                value={formData.free_trial_url || ''}
                onChange={handleChange}
              />
            </div>
            {/* 5️⃣ Other Short Info */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                Other Short Info
              </label>
              <input
                className="input w-full lg:max-w-md"
                name="free_trial_other"
                placeholder="Other short info"
                value={formData.free_trial_other || ''}
                onChange={handleChange}
              />
            </div>
            {/* 6️⃣ Additional Details */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                Additional Details
              </label>
              <textarea
                className="input w-full lg:max-w-md"
                name="additional_info"
                placeholder="Additional details"
                value={formData.additional_info || ''}
                onChange={handleChange}
              />
            </div>
            {/* 7️⃣ Status Select */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">Status</label>
              <select
                className="input w-full lg:max-w-md"
                name="status"
                value={formData.status || ''}
                onChange={handleChange}
              >
                <option value="">Select Status</option>
                <option value="active">✅ Active</option>
                <option value="pending">🕓 Pending</option>
                <option value="disabled">🚫 Disabled</option>
              </select>
            </div>
            {/* 8️⃣ Start Date (editable) */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">Start Date</label>
              <input
                type="datetime-local"
                className="input w-full"
                name="startDate"
                value={toDatetimeLocalString(formData.startDate)}
                onChange={handleChange}
              />
            </div>
            {/* 9️⃣ End Date (informational only, not editable) */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0 text-gray-400">
                End Date (auto)
              </label>
              <input
                type="datetime-local"
                className="input w-full lg:max-w-md bg-gray-800 text-gray-400 cursor-not-allowed"
                name="endDate"
                value={
                  formData.startDate
                    ? toDatetimeLocalString(
                        new Date(new Date(formData.startDate).getTime() + 24 * 60 * 60 * 1000)
                      )
                    : ''
                }
                disabled
                readOnly
                tabIndex={-1}
              />
            </div>
            {/* 🔟 Buttons */}
            <div className="flex flex-row gap-2 mt-6 w-full justify-between">
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-1/4"
                type="button"
              >
                Delete Trial
              </button>
              <button
                onClick={handleUpdate}
                className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-1/4 transition-all duration-200 ${
                  loading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                type="button"
                disabled={loading}
              >
                {loading ? (
                  // Show a spinner or loader text
                  <>
                    <span className="loader mr-2"></span> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
          <div className="w-full flex justify-center">
            <button
              className="btn-secondary btn-lg"
              onClick={() => router.push('/admin/freeTrials/main')}
              type="button"
            >
              Return To Free Trials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
