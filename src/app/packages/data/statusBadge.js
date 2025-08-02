/**
 * ==================================
 * 🧾 StatusBadge.jsx
 * ----------------------------------
 * Renders colored status badges for crypto payments
 * Accepts a `status` prop like: waiting, confirming, completed, etc.
 * Used on BuyNow and potentially other payment pages.
 * ==================================
 */

import React from 'react';

export default function StatusBadge({ status }) {
  let badgeColor = '';
  let icon = '';
  let text = '';

  // ⏳ Waiting (invoice created, no action yet)
  if (status === 'waiting') {
    badgeColor = 'bg-yellow-400';
    icon = '⏳';
    text = (
      <>
        Waiting for your payment to begin...
        <br />
        <span className="font-normal">
          Please scan the QR code or copy the address to send your Bitcoin payment.
        </span>
      </>
    );
  }

  // ⌛ Pending (pre-broadcast from NowPayments side)
  else if (status === 'pending') {
    badgeColor = 'bg-orange-400';
    icon = '⌛';
    text = (
      <>
        Payment is pending...
        <br />
        <span className="font-normal">
          Your payment is being processed by the provider. No need to take action — this usually
          only takes a few moments.
        </span>
      </>
    );
  }

  // 🚀 Sending (broadcasted from wallet, not confirmed)
  else if (status === 'sending') {
    badgeColor = 'bg-cyan-600';
    icon = '🚀';
    text = (
      <>
        Your payment has been <span className="font-bold">sent</span> from your wallet...
        <br />
      </>
    );
  }

  // 🔄 Confirming (on-chain, but unconfirmed)
  else if (status === 'confirming') {
    badgeColor = 'bg-blue-400';
    icon = '🔄';
    text = (
      <>
        Your payment is confirming at NowPayments...
        <br />
        <span className="font-normal">
          It has been received and is waiting for enough confirmations. This usually takes a few
          minutes.
        </span>
      </>
    );
  }

  // ✅ Confirmed
  // 🎉 Completed (payment + subscription done)
  else if (
    status === 'confirmed' ||
    status === 'paid' ||
    status === 'finished' ||
    status === 'completed'
  ) {
    badgeColor = 'bg-green-500';
    icon = '✅';
    text = (
      <>
        🎉 Payment <span className="font-bold">Confirmed / Finished 🎉</span>
        <br />
        <span className="font-normal">
          Your subscription has been created and is now pending admin activation. Welcome to Royal
          IPTV !
        </span>
      </>
    );
  }

  // ❌ Failed or Expired
  else if (status === 'failed' || status === 'expired') {
    badgeColor = 'bg-red-500 text-white';
    icon = '❌';
    text = (
      <>
        Payment failed or expired.
        <br />
        <span className="font-normal">
          This can happen alot. If it says expired or failed just wait for another confirmation.
          (may take up to 1 hour to complete but be patient. It will retry automaticly)
        </span>
      </>
    );
  }

  return (
    <div
      className={`rounded-xl py-3 px-6 mb-6 mt-2 font-bold text-lg flex items-center justify-center gap-3 shadow-xl ${badgeColor}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-center">{text}</span>
      <span className="text-xl ml-3">({status})</span>
    </div>
  );
}
