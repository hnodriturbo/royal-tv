/**
 * ================ AdminUserSubscriptionsPage.js ================
 * 👤 Admin Subscriptions: For a single user
 * - Shows all subscriptions with details & payments
 * - Uses modal for payment details and deletion
 * - Translations under app.admin.userSubscriptions.*
 * ================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n';
import { useParams } from 'next/navigation';

import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import { userSubscriptionSortOptions, getUserSubscriptionSortFunction } from '@/lib/utils/sorting';
import calculateMonthsDaysLeft from '@/lib/utils/calculateMonthsDaysLeft';
import useModal from '@/hooks/useModal';

export default function AdminUserSubscriptionsPage() {
  const t = useTranslations();
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();
  const router = useRouter();
  const { subscription_id } = useParams();

  const [subscriptions, setSubscriptions] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [sortOrder, setSortOrder] = useState('status_active_first');

  const fetchUserSubscriptions = async () => {
    showLoader({ text: t('app.admin.userSubscriptions.loading') });
    try {
      const response = await axiosInstance.get(`/api/admin/subscriptions/${subscription_id}`);
      setSubscriptions(response.data.subscriptions || []);
      setUserInfo(response.data.user || null);
      displayMessage(t('app.admin.userSubscriptions.loaded'), 'success');
    } catch {
      displayMessage(t('app.admin.userSubscriptions.load_failed'), 'error');
    } finally {
      hideLoader();
    }
  };

  const sortedSubscriptions = [...subscriptions].sort(getUserSubscriptionSortFunction(sortOrder));

  const handleShowPaymentDetails = (payment) => {
    openModal('paymentDetails', {
      title: t('app.admin.userSubscriptions.payment_details'),
      description: getPaymentDetails(payment),
      confirmButtonText: t('app.admin.userSubscriptions.close'),
      confirmButtonType: 'Secondary',
      onConfirm: hideModal
    });
  };

  const getPaymentDetails = (payment) => {
    if (!payment) return <div>{t('app.admin.userSubscriptions.no_payment')}</div>;
    return (
      <>
        {Object.entries(payment).map(
          ([key, value], idx) =>
            value && (
              <div key={idx}>
                <strong>{key}:</strong> <span className="font-mono">{value}</span>
              </div>
            )
        )}
      </>
    );
  };

  const handleDelete = (id) => {
    openModal('deleteSubscription', {
      title: t('app.admin.userSubscriptions.delete_title'),
      description: t('app.admin.userSubscriptions.delete_description'),
      confirmButtonText: t('app.admin.userSubscriptions.delete_confirm'),
      confirmButtonType: 'Danger',
      cancelButtonText: t('app.admin.userSubscriptions.cancel'),
      onConfirm: async () => {
        try {
          showLoader({ text: t('app.admin.userSubscriptions.deleting') });
          await axiosInstance.delete(`/api/admin/subscriptions/${id}`);
          displayMessage(t('app.admin.userSubscriptions.deleted'), 'success');
          fetchUserSubscriptions();
        } catch {
          displayMessage(t('app.admin.userSubscriptions.delete_failed'), 'error');
        } finally {
          hideModal();
          hideLoader();
        }
      },
      onCancel: hideModal
    });
  };

  useEffect(() => {
    if (status === 'authenticated' && isAllowed) fetchUserSubscriptions();
  }, [status, isAllowed]);

  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {userInfo && (
        <div className="container-style p-4 mb-6">
          <h2>{t('app.admin.userSubscriptions.user_info')}</h2>
          <p>
            <strong>{t('app.admin.userSubscriptions.name')}:</strong> {userInfo.name || 'N/A'}
          </p>
          <p>
            <strong>{t('app.admin.userSubscriptions.email')}:</strong> {userInfo.email || 'N/A'}
          </p>
        </div>
      )}

      <div className="container-style w-full">
        <h1 className="text-3xl font-bold text-center">{t('app.admin.userSubscriptions.title')}</h1>
        <hr className="border border-gray-400 w-8/12 my-4" />

        {subscriptions.length > 1 && (
          <SortDropdown
            options={userSubscriptionSortOptions}
            value={sortOrder}
            onChange={setSortOrder}
          />
        )}

        <div className="flex flex-col gap-6 mt-6">
          {sortedSubscriptions.map((sub) => {
            const timeLeft = calculateMonthsDaysLeft(sub.expiring_at);
            return (
              <div key={sub.subscription_id} className="border rounded-2xl p-4">
                <h2 className="font-bold">
                  {sub.package_name || t('app.admin.userSubscriptions.untitled')}
                </h2>
                <p>
                  {t('app.admin.userSubscriptions.status')}: {sub.status}
                </p>
                <p>
                  {t('app.admin.userSubscriptions.expires')}:{' '}
                  {sub.expiring_at
                    ? new Date(sub.expiring_at).toLocaleString()
                    : t('app.admin.userSubscriptions.no_expiry')}
                </p>
                {timeLeft && (
                  <p>{t('app.admin.userSubscriptions.time_left', { time: timeLeft })}</p>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(sub.subscription_id)}
                  className="btn-danger"
                >
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true">🗑️</span>
                    <span>{String(t('app.admin.userSubscriptions.delete_btn'))}</span>
                  </span>
                </button>

                {sub.payments?.length > 0 && (
                  <div className="mt-4">
                    <h3>{t('app.admin.userSubscriptions.payments')}</h3>
                    {sub.payments.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleShowPaymentDetails(p)}
                        className="cursor-pointer"
                      >
                        {p.status} – {p.amount_paid} {p.pay_currency}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
