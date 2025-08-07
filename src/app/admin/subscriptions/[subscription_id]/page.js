/**
 *   ====================== AdminUserSubscriptionsPage.js ======================
 * 🦸‍♂️
 * Admin page: Shows ALL subscriptions for a user in card format.
 * - Displays all new schema fields.
 * - Payments for each subscription shown below card.
 * - Admin-only actions can be added (edit, delete, etc.)
 * ========================================================================
 */

'use client';
import React from 'react';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import axiosInstance from '@/lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter, useParams } from 'next/navigation';
import { userSubscriptionSortOptions, getUserSubscriptionSortFunction } from '@/lib/sorting';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import calculateMonthsDaysLeft from '@/lib/calculateMonthsDaysLeft';
import useModal from '@/hooks/useModal';

/* =================== Main Component =================== */
export default function AdminUserSubscriptionsPage() {
  // 🦸 Admin session/auth
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  // ✨ Modal and App Handlers States
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  const params = useParams();
  const { subscription_id } = params;

  // 📦 State
  const [subscriptions, setSubscriptions] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [sortOrder, setSortOrder] = useState('status_active_first');

  /*   // Payment modal states:
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // 🪙 Handle Payment Click: open modal and set payment
  function handlePaymentClick(payment) {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  }
 */
  // 📥 Fetch all subscriptions for this user
  const fetchUserSubscriptions = async () => {
    showLoader({ text: 'Loading subscriptions...' });
    try {
      const response = await axiosInstance.get(`/api/admin/subscriptions/${subscription_id}`);
      setSubscriptions(response.data.subscriptions || []);
      setUserInfo(response.data.user || null);
      displayMessage('All subscriptions loaded!', 'success');
    } catch (err) {
      displayMessage(
        `❌ Failed to load subscriptions ${err?.response?.data?.error ? `: ${err.response.data.error}` : ''}`,
        'error'
      );
    } finally {
      hideLoader();
    }
  };

  // 🔀 Sort logic
  const sortedSubscriptions = [...subscriptions].sort(getUserSubscriptionSortFunction(sortOrder));

  // 💸 Show Payment Details Modal (admin-only)
  function handleShowPaymentDetails(payment) {
    openModal('paymentDetails', {
      title: 'Payment Details',
      description: getPaymentDetailsDescriptionJSX(payment),
      size: 'lg', // 👈 use a wider modal
      textClass: 'white', // 👈 blue text
      /* customClass: 'text-shadow-dark-2', */ // 👈 more custom
      confirmButtonText: 'Close',
      confirmButtonType: 'Secondary',
      onConfirm: hideModal
    });
  }

  // 💸 Formats payment info as a clean multi-line string
  function getPaymentDetailsDescriptionJSX(payment) {
    if (!payment) return <div>No payment data.</div>;

    const fields = [
      { label: 'Payment ID', value: payment.payment_id },
      { label: 'Purchase ID', value: payment.purchase_id },
      { label: 'Invoice ID', value: payment.invoice_id },

      { label: 'Pay Address', value: payment.pay_address },
      { label: 'Pay Currency', value: payment.pay_currency },
      { label: 'Pay Amount', value: payment.pay_amount },
      { label: 'Price Currency', value: payment.price_currency },
      { label: 'Amount Paid', value: payment.amount_paid },
      { label: 'Actually Paid', value: payment.actually_paid },
      { label: 'Outcome Amount', value: payment.outcome_amount },
      { label: 'Outcome Currency', value: payment.outcome_currency },
      { label: 'Network', value: payment.network },
      {
        label: 'Received At',
        value: payment.received_at ? new Date(payment.received_at).toLocaleString() : ''
      },
      { label: 'Status', value: payment.status },
      {
        label: 'Created At',
        value: payment.createdAt ? new Date(payment.createdAt).toLocaleString() : ''
      }
    ];

    return (
      <>
        {fields
          .filter((f) => f.value !== undefined && f.value !== null && f.value !== '')
          .map((field, idx) => (
            <span key={idx}>
              <strong>{field.label}:</strong> <span className="font-mono">{field.value}</span>
              <br />
            </span>
          ))}
      </>
    );
  }

  // 👤 Show user info if present
  const renderUserInfo = () =>
    userInfo && (
      <div className="container-style border rounded-xl shadow-md p-6 mb-6 w-full lg:w-1/2 mx-auto">
        <h2 className="text-lg font-bold mb-2">👤 User Information</h2>
        <p>
          <strong>Name:</strong> {userInfo.name || 'N/A'}
        </p>
        <p>
          <strong>Email:</strong> {userInfo.email || 'N/A'}
        </p>
        <p>
          <strong>WhatsApp:</strong> {userInfo.whatsapp || 'N/A'}
        </p>
        <p>
          <strong>Telegram:</strong> {userInfo.telegram || 'N/A'}
        </p>
        <p>
          <strong>User ID:</strong> {userInfo.user_id}
        </p>
      </div>
    );

  // 🗑️ Show Delete Subscription Modal
  const handleDelete = (subscription_id) => {
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
          displayMessage('🗑️ Subscription deleted!', 'success');
          fetchUserSubscriptions();
        } catch (err) {
          displayMessage(`❌ Delete failed: ${err.message}`, 'error');
        } finally {
          hideModal();
          hideLoader();
        }
      },
      onCancel: () => {
        displayMessage('🛑 Deletion cancelled.', 'info');
        hideModal();
      }
    });
  };

  // ⚡ Fetch user subscription(s) if admin is allowed
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchUserSubscriptions();
    }
  }, [status, isAllowed]);

  // Redirect if not allowed
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {renderUserInfo()}

      <div className="container-style lg:w-10/12 w-11/12 max-w-3xl">
        <div className="flex flex-col items-center text-center justify-center w-full">
          <h1 className="text-black lg:text-5xl text-3xl mb-0 tracking-widest font-extrabold">
            User Subscriptions
          </h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        {/* 🃏 Sorting Dropdown */}
        {subscriptions.length > 1 && (
          <div className="flex justify-end w-full mb-4">
            <SortDropdown
              options={userSubscriptionSortOptions}
              value={sortOrder}
              onChange={setSortOrder}
            />
          </div>
        )}

        {/* 🃏 All Subscription Cards */}
        <div className="flex flex-col gap-8 w-full mt-6">
          {sortedSubscriptions.map((sub) => {
            // 🕒 Calculate time left (months, days)
            const timeLeft = calculateMonthsDaysLeft(sub.expiring_at);

            // 🎨 Status badge and colors
            let borderColor = 'border-gray-400',
              bgColor = 'bg-black';
            if (sub.status === 'active') {
              borderColor = 'border-green-700';
              bgColor = 'bg-black';
            } else if (sub.status === 'pending') {
              borderColor = 'border-yellow-500';
              bgColor = 'bg-yellow-100/10';
            } else if (sub.status === 'expired' || sub.status === 'disabled') {
              borderColor = 'border-red-700';
              bgColor = 'bg-red-100/10';
            }

            let statusLabel = '';
            if (sub.status === 'active') statusLabel = '✅ ACTIVE';
            else if (sub.status === 'pending') statusLabel = '🕒 PENDING';
            else if (sub.status === 'expired') statusLabel = '❌ EXPIRED';
            else if (sub.status === 'disabled') statusLabel = '🚫 DISABLED';
            else statusLabel = `❔ ${sub.status?.toUpperCase()}`;

            return (
              <div
                key={sub.subscription_id}
                className={`relative flex flex-col ${borderColor} border-4 rounded-2xl mb-8 p-4 shadow overflow-hidden`}
              >
                {/* 🟢 Overlay */}
                <div className="absolute inset-0 bg-black/60 z-0 rounded-2xl pointer-events-none" />
                {/* 🟩 Card content */}
                <div className="relative z-10">
                  {/* === Header with status and package === */}
                  <div className="flex flex-col gap-1 items-center justify-center mb-4">
                    <span className="text-wonderful-5">
                      {statusLabel === '✅ ACTIVE'
                        ? '✅'
                        : statusLabel === '🕒 PENDING'
                          ? '🕒'
                          : statusLabel === '❌ EXPIRED'
                            ? '❌'
                            : statusLabel === '🚫 DISABLED'
                              ? '🚫'
                              : '❔'}{' '}
                      <span className="text-3xl text-glow-soft">
                        {statusLabel.replace(/^[^ ]+ /, '')}
                      </span>
                    </span>
                    <span className="font-bold text-2xl tracking-wide mt-1">
                      {sub.order_description || sub.package_name || 'Subscription'}{' '}
                      {sub.status === 'active' && sub.expiring_at && (
                        <span className="text-base text-green-200 font-semibold ms-5">
                          ({timeLeft || 'Expired'} left)
                        </span>
                      )}
                    </span>
                  </div>
                  {/* === GRID OF ALL FIELDS === */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full max-w-2xl mx-auto lg:text-lg text-base">
                    {/* Show most fields from new schema */}
                    {sub.megaott_id && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          📌 MegaOTT ID:
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.megaott_id}
                        </span>
                      </>
                    )}
                    {sub.username && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          👤 Username:
                        </span>
                        <span className="font-mono font-bold flex items-center tracking-wide">
                          {sub.username}
                        </span>
                      </>
                    )}
                    {sub.password && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          🔑 Password:
                        </span>
                        <span className="font-mono font-bold flex items-center tracking-wide">
                          {sub.password}
                        </span>
                      </>
                    )}
                    {sub.mac_address && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          💻 MAC Address:
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.mac_address}
                        </span>
                      </>
                    )}
                    {sub.package_id && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          🆔 Package ID:
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.package_id}
                        </span>
                      </>
                    )}
                    {sub.package_name && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          📦 Package Name:
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.package_name}
                        </span>
                      </>
                    )}
                    {/*                     {sub.template && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          🧩 Template:
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.template}
                        </span>
                      </>
                    )} */}
                    {sub.max_connections && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          🔢 Max Connections:
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.max_connections}
                        </span>
                      </>
                    )}
                    {sub.forced_country && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          🌍 Country:
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.forced_country}
                        </span>
                      </>
                    )}
                    <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                      🔞 Adult:
                    </span>
                    <span className="font-bold flex items-center tracking-wide">
                      {sub.adult ? '✅ Yes' : '❌ No'}
                    </span>
                    <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                      🛡️ VPN:
                    </span>
                    <span className="font-bold flex items-center tracking-wide">
                      {sub.enable_vpn ? '✅ Yes' : '❌ No'}
                    </span>
                    {sub.note && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          📝 Note:
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.note}
                        </span>
                      </>
                    )}
                    {sub.whatsapp_telegram && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          💬 WhatsApp/Telegram:
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.whatsapp_telegram}
                        </span>
                      </>
                    )}
                    <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                      💸 Paid:
                    </span>
                    <span className="font-bold flex items-center tracking-wide">
                      {sub.paid ? '💸 Yes' : '⏳ Not Paid'}
                    </span>
                    {sub.dns_link && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          🔗 DNS Link:
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.dns_link}
                        </span>
                      </>
                    )}
                    {sub.dns_link_for_samsung_lg && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          📺 Samsung/LG DNS:
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.dns_link_for_samsung_lg}
                        </span>
                      </>
                    )}
                    {sub.portal_link && (
                      <>
                        <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                          🌐 Portal Link:
                        </span>
                        <span className="font-bold flex items-center tracking-wide">
                          {sub.portal_link}
                        </span>
                      </>
                    )}
                    <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                      ⏰ Expires At:
                    </span>
                    <span className="font-bold flex items-center tracking-wide">
                      {sub.expiring_at
                        ? new Date(sub.expiring_at).toLocaleString()
                        : 'Will start on first login'}
                    </span>
                    <span className="min-w-[120px] flex items-center font-bold drop-shadow-sm">
                      📆 Created At:
                    </span>
                    <span className="font-bold flex items-center tracking-wide">
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '--'}
                    </span>
                  </div>
                  {/* === PAYMENTS FIELD BELOW === */}
                  <div className="my-4">
                    <strong className="text-lg mb-2 block">Payments:</strong>
                    <div className="flex flex-col gap-4 items-center justify-center">
                      {sub.payments && sub.payments.length > 0 ? (
                        sub.payments.map((pay) => (
                          <div
                            key={pay.id}
                            className="group flex items-center rounded-xl shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 p-3 gap-4 cursor-pointer"
                            onClick={() => handleShowPaymentDetails(pay)}
                            title="View Payment Details"
                          >
                            <div className="flex-1 flex flex-wrap gap-4">
                              <span className="text-xl">🔖 {pay.status?.toUpperCase()}</span>
                              <span className="text-xl">📄 Inv: {pay.invoice_id}</span>
                              {pay.amount_paid && (
                                <span className="text-xl">
                                  💰 {pay.amount_paid} {pay.pay_currency}
                                </span>
                              )}
                              {pay.createdAt && (
                                <span className="text-xl">
                                  ⏰ {new Date(pay.createdAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div>
                              {pay.status === 'confirmed' || pay.status === 'finished' ? (
                                <span className="text-2xl text-green-400 bg-green-800">✔️</span>
                              ) : pay.status === 'pending' ? (
                                <span className="text-2xl text-yellow-400">⏳</span>
                              ) : pay.status === 'failed' ? (
                                <span className="text-2xl text-red-400">❌</span>
                              ) : (
                                <span className="text-2xl text-gray-400">❔</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 pl-2">No payments yet.</span>
                      )}
                    </div>
                  </div>
                  {/* End of payment fields */}
                  <div className="flex flex-col bg-red-400 rounded-lg items-center justify-center p-4">
                    <div className="text-2xl font-bold tracking-widest text-outline-dark-1 text-center mb-4">
                      Danger Zone !!!
                    </div>
                    <button
                      className="btn-danger w-1/2 mx-auto"
                      onClick={handleDelete}
                      type="button"
                    >
                      🗑️ Delete Subscription
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
