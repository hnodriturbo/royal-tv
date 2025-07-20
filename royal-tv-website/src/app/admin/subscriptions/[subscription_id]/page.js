/**
 *   ====================== AdminEditSubscriptionPage.js ======================
 * 📦
 * HEADLINE: Admin Subscription Detail/Edit
 * - Shows and edits a single subscription for a user.
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
/* import useSocketHub from '@/hooks/socket/useSocketHub'; */
import { useCreateNotifications } from '@/hooks/socket/useCreateNotifications';

export default function AdminEditSubscriptionPage() {
  // 🦸 Admin session/auth setup
  const { data: session, status } = useSession();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const [loading, setLoading] = useState(false);
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { openModal, hideModal } = useModal();
  const router = useRouter();
  const params = useParams();
  const { subscription_id } = params;
  /* const { subscriptionStatusUpdate } = useSocketHub(); */
  const { createSubscriptionActivatedNotification } = useCreateNotifications();

  const [subscription, setSubscription] = useState(null);
  const [formData, setFormData] = useState({});
  const [previousStatus, setPreviousStatus] = useState('');

  // 1️⃣ Fetch Subscription
  const fetchSubscription = async () => {
    try {
      showLoader({ text: 'Loading subscription...' });
      const response = await axiosInstance.get(`/api/admin/subscriptions/${subscription_id}`);
      setSubscription(response.data.subscription);
      setFormData(response.data.subscription);
      setPreviousStatus(response.data.subscription.status);
    } catch (err) {
      displayMessage('❌ Failed to load subscription', 'error');
    } finally {
      hideLoader();
    }
  };

  // 2️⃣ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
    // ⛔ Don't proceed if subscription/formData isn't loaded yet!
    if (!formData.subscription_id) {
      displayMessage('⏳ Please wait, loading subscription data...', 'info');
      return;
    }
    showLoader({ text: 'Updating subscription...' });
    setLoading(true);
    try {
      // 🧹 Clean PATCH data: Remove 'user' and 'payments'
      const { user, payments, ...patchData } = formData;
      if (patchData.startDate) patchData.startDate = new Date(patchData.startDate).toISOString();
      if (patchData.endDate) patchData.endDate = new Date(patchData.endDate).toISOString();

      // 🛰️ PATCH request: Send update to backend API
      const response = await axiosInstance.patch(
        `/api/admin/subscriptions/${subscription_id}`,
        patchData
      );

      // 🧩 Destructure and rename 'subscription' to 'updatedSubscription'
      const { subscription: updatedSubscription, previousStatus } = response.data;

      // 🕵️‍♂️ DEBUG: Log what comes back from backend
      console.log('🔎 [DEBUG] updatedSubscription:', updatedSubscription);
      console.log('🔎 [DEBUG] previousStatus:', previousStatus);

      // 🎉 UI feedback
      displayMessage('✅ Subscription updated successfully', 'success');

      // 2️⃣ Notify if status changed to active
      if (
        previousStatus !== updatedSubscription.status &&
        updatedSubscription.status === 'active'
      ) {
        // 🕵️‍♂️ DEBUG: Log what is being sent to notification
        console.log('📬 [DEBUG] Notifying with user:', updatedSubscription.user);
        console.log('📬 [DEBUG] Notifying with subscription:', updatedSubscription);

        // 🚨 Trigger notification for subscription activation
        createSubscriptionActivatedNotification(updatedSubscription.user, updatedSubscription);
        // 🔄 Let sockets/other tabs know user subscription status updated
        /* await subscriptionStatusUpdate(updatedSubscription.user.user_id); */
      }

      setTimeout(() => {
        router.push('/admin/subscriptions/main');
      }, 2000);
    } catch (err) {
      displayMessage('❌ Failed to update subscription', 'error');
      // Log every possible detail!
      console.error('❌ [DEBUG] PATCH error:', err, err?.response, err?.toJSON?.());
      alert(
        JSON.stringify(
          {
            message: err.message,
            responseData: err?.response?.data,
            responseStatus: err?.response?.status,
            responseHeaders: err?.response?.headers
          },
          null,
          2
        )
      ); // TEMP for dev!
    } finally {
      hideLoader();
      setLoading(false);
    }
  };

  // 4️⃣ Handle delete (modal)
  const handleDelete = () => {
    openModal('deleteSubscription', {
      title: 'Delete Subscription',
      description: 'Are you sure you want to delete this subscription? This cannot be undone.',
      confirmButtonText: 'Delete',
      confirmButtonType: 'Danger',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        try {
          showLoader({ text: 'Deleting subscription...' });
          await axiosInstance.delete(`/api/admin/subscriptions/${subscription_id}`);
          displayMessage('✅ Subscription deleted!', 'success');
          hideModal();
          router.replace('/admin/subscriptions/main');
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

  const renderStatusBadge = (status) => {
    const colorMap = {
      active: 'bg-green-600',
      pending: 'bg-yellow-500',
      expired: 'bg-gray-400',
      canceled: 'bg-red-500',
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

  useEffect(() => {
    if (subscription_id && status === 'authenticated') {
      fetchSubscription();
    }
  }, [subscription_id, status]);

  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed || !subscription) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        {/*         <h1 className="text-2xl font-bold mb-4">
          Edit Subscription For {subscription.user?.name || 'unknown user'}
        </h1> */}
        {/* ================= Responsive Info + Payments Row ================= */}
        <div className="flex flex-col gap-6 w-full">
          {/* 👤 User info */}
          {subscription.user && (
            <div className="flex justify-center">
              <div className="container-style border rounded-xl shadow-md p-6 mb-6 w-1/2">
                <h2 className="text-lg font-bold mb-2">👤 User Information</h2>
                <p>
                  <strong>Name:</strong> {subscription.user.name || 'N/A'}
                </p>
                <p>
                  <strong>Email:</strong> {subscription.user.email || 'N/A'}
                </p>
                <p>
                  <strong>WhatsApp:</strong> {subscription.user.whatsapp || 'N/A'}
                </p>
                <p>
                  <strong>Telegram:</strong> {subscription.user.telegram || 'N/A'}
                </p>
                <p>
                  <strong>User ID:</strong> {subscription.user.user_id}
                </p>
              </div>
            </div>
          )}
        </div>

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
            {/* 2️⃣ Product/Order */}
            <div className="flex flex-row items-start lg:items-center justify-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">Product :</label>
              <span className="w-full lg:max-w-md text-left font-bold underline text-2xl">
                {formData.order_id || ''}
              </span>
            </div>
            {/* 3️⃣ Username */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                Subscription Username
              </label>
              <input
                className="input w-full lg:max-w-md"
                name="subscription_username"
                placeholder="Username"
                value={formData.subscription_username || ''}
                onChange={handleChange}
              />
            </div>
            {/* 4️⃣ Password */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                Subscription Password
              </label>
              <input
                className="input w-full lg:max-w-md"
                name="subscription_password"
                placeholder="Password"
                value={formData.subscription_password || ''}
                onChange={handleChange}
              />
            </div>
            {/* 5️⃣ Portal URL */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">Portal URL</label>
              <input
                className="input w-full lg:max-w-md"
                name="subscription_url"
                placeholder="Portal URL"
                value={formData.subscription_url || ''}
                onChange={handleChange}
              />
            </div>
            {/* 6️⃣ Other Short Info */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">
                Other Short Info
              </label>
              <input
                className="input w-full lg:max-w-md"
                name="subscription_other"
                placeholder="Other short info"
                value={formData.subscription_other || ''}
                onChange={handleChange}
              />
            </div>
            {/* 7️⃣ Additional Details */}
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
            {/* 8️⃣ Status Select */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">Status</label>
              <select
                className="input w-full lg:max-w-md"
                name="status"
                value={formData.status || ''}
                onChange={handleChange}
              >
                <option value="">Select Status</option>
                <option value="pending">🕓 Pending</option>
                <option value="active">✅ Active</option>
                <option value="expired">⏳ Expired</option>
                <option value="canceled">❌ Canceled</option>
                <option value="disabled">🚫 Disabled</option>
              </select>
            </div>
            {/* 9️⃣ Start Date */}
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
            {/* 9️⃣ End Date (editable) */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-2 mb-4">
              <label className="block font-semibold min-w-[160px] mb-1 lg:mb-0">End Date</label>
              <input
                type="datetime-local"
                className="input w-full"
                name="endDate"
                value={toDatetimeLocalString(formData.endDate)}
                onChange={handleChange}
              />
            </div>
            {/* 🔟 Buttons */}
            <div className="flex flex-row gap-2 mt-6 w-full justify-between">
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-1/4"
                type="button"
              >
                Delete Subscription
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
                  <>
                    <span className="loader mr-2"></span> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center w-full">
            <div className="w-full max-w-2xl bg-gray-900/90 border border-gray-700 rounded-2xl shadow-md p-4 sm:p-6 md:p-8 mb-8">
              {/* 💸 Payments container */}
              <PaymentsDetails payments={subscription.payments || []} />
            </div>{' '}
          </div>
          <div className="w-full flex justify-center">
            <button
              className="btn-secondary btn-lg"
              onClick={() => router.push('/admin/subscriptions/main')}
              type="button"
            >
              Return To Subscriptions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 💸 PaymentsDetails – shows ALL payment fields in a readable format
 */
function PaymentsDetails({ payments }) {
  if (!payments || payments.length === 0) {
    return (
      <div className="container-style border rounded-xl shadow-md p-6 mb-6 w-full lg:w-1/2">
        <h2 className="text-lg font-bold mb-2">💸 Payment Information</h2>
        <p className="text-gray-300">No payments found for this subscription.</p>
      </div>
    );
  }

  return (
    <div className="container-style border rounded-xl shadow-md p-6 mb-6 w-full overflow-x-auto">
      <h2 className="text-lg font-bold mb-4">💸 Payment Information</h2>
      {payments.map((payment, index) => (
        <div
          key={payment.id}
          className="mb-4 border-b border-gray-700 pb-4 last:mb-0 last:border-b-0"
        >
          {/* 🔍 Payment detail rows */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
            <div className="font-bold">Payment ID:</div>
            <div>{payment.payment_id || 'N/A'}</div>
            <div className="font-bold">Order ID:</div>
            <div>{payment.order_id}</div>
            <div className="font-bold">Invoice ID:</div>
            <div>{payment.invoice_id || 'N/A'}</div>
            <div className="font-bold">Status:</div>
            <div>{payment.status}</div>
            <div className="font-bold">Currency:</div>
            <div>{payment.currency || 'N/A'}</div>
            <div className="font-bold">Amount Paid:</div>
            <div>{payment.amount_paid != null ? payment.amount_paid : 'N/A'}</div>
            <div className="font-bold">Amount Received:</div>
            <div>{payment.amount_received != null ? payment.amount_received : 'N/A'}</div>
            <div className="font-bold">Pay Currency:</div>
            <div>{payment.pay_currency || 'N/A'}</div>
            <div className="font-bold">Pay Address:</div>
            <div>{payment.pay_address || 'N/A'}</div>
            <div className="font-bold">Network:</div>
            <div>{payment.network || 'N/A'}</div>
            <div className="font-bold">Received At:</div>
            <div>
              {payment.received_at ? new Date(payment.received_at).toLocaleString() : 'N/A'}
            </div>
            <div className="font-bold">Created At:</div>
            <div>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'}</div>
            <div className="font-bold">Updated At:</div>
            <div>{payment.updatedAt ? new Date(payment.updatedAt).toLocaleString() : 'N/A'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
