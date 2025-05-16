'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axiosInstance';
import { useParams } from 'next/navigation';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useSession } from 'next-auth/react';

export default function AdminEditSubscriptionPage() {
  const { data: session, status } = useSession();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const router = useRouter();
  const { subscription_id } = useParams();
  const [subscription, setSubscription] = useState(null);
  const [formData, setFormData] = useState({});
  const [previousStatus, setPreviousStatus] = useState('');

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        showLoader({ text: 'Loading subscription...' });
        const res = await axiosInstance.get(
          `/api/admin/subscriptions/${subscription_id}`,
        );
        setSubscription(res.data);
        setFormData(res.data);
        setPreviousStatus(res.data.status);
      } catch (err) {
        displayMessage('Failed to load subscription', 'error');
      } finally {
        hideLoader();
      }
    };

    if (subscription_id && status === 'authenticated' && isAllowed) {
      fetchSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription_id, status, isAllowed]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      showLoader({ text: 'Updating subscription...' });
      await axiosInstance.patch(
        `/api/admin/subscriptions/${subscription_id}`,
        formData,
      );

      if (previousStatus !== 'active' && formData.status === 'active') {
        await axiosInstance.post(
          `/api/admin/subscriptions/${subscription_id}/notify-active`,
        );
      }

      displayMessage('Subscription updated successfully', 'success');
    } catch (err) {
      displayMessage('Failed to update subscription', 'error');
    } finally {
      hideLoader();
    }
  };

  /* ➡️ Redirect if not authorised once state is known */
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect)
      router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  const renderStatusBadge = (status) => {
    const colorMap = {
      active: 'bg-green-600',
      pending: 'bg-yellow-500',
      expired: 'bg-gray-500',
      canceled: 'bg-red-600',
    };
    return (
      <span
        className={`text-white px-2 py-1 rounded text-sm ${colorMap[status] || 'bg-gray-400'}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="container-style">
        <h1 className="text-2xl font-bold mb-4">
          Edit Subscription For
          {subscription.user.name || 'couldnt find username'}
        </h1>
        <div className="container-style items-center justify-center">
          {subscription?.user && (
            <div className="bg-white border rounded-xl shadow-md p-6 mb-6 w-full">
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
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-semibold">Current Status:</label>
            <div className="mt-1">{renderStatusBadge(formData.status)}</div>
          </div>

          <input
            className="input"
            name="subscription_username"
            placeholder="Username"
            value={formData.subscription_username || ''}
            onChange={handleChange}
          />
          <input
            className="input"
            name="subscription_password"
            placeholder="Password"
            value={formData.subscription_password || ''}
            onChange={handleChange}
          />
          <input
            className="input"
            name="subscription_url"
            placeholder="Portal URL"
            value={formData.subscription_url || ''}
            onChange={handleChange}
          />
          <input
            className="input"
            name="subscription_other"
            placeholder="Other short info"
            value={formData.subscription_other || ''}
            onChange={handleChange}
          />
          <textarea
            className="input"
            name="additional_info"
            placeholder="Additional details"
            value={formData.additional_info || ''}
            onChange={handleChange}
          />

          <select
            className="input"
            name="status"
            value={formData.status || ''}
            onChange={handleChange}
          >
            <option value="">Select Status</option>
            <option value="active">✅ Active</option>
            <option value="pending">🕓 Pending</option>
            <option value="expired">⌛ Expired</option>
            <option value="canceled">❌ Canceled</option>
          </select>

          <input
            type="date"
            className="input"
            name="startDate"
            value={formData.startDate ? formData.startDate.slice(0, 10) : ''}
            onChange={handleChange}
          />
          <input
            type="date"
            className="input"
            name="endDate"
            value={formData.endDate ? formData.endDate.slice(0, 10) : ''}
            onChange={handleChange}
          />

          <button
            onClick={handleUpdate}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
