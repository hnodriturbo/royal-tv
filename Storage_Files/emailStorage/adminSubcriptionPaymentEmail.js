// 📁 lib/email/premade/adminSubscriptionPaymentEmail.js

/**
 *   =========================================
 *   ADMIN: New Subscription Payment Email
 *   -----------------------------------------
 *   Sent to admin when a new payment is made.
 *   =========================================
 */
export function adminNewPaymentEmail({ user, subscription }) {
  return `
    <h2>🎟️ New Subscription Payment Received</h2>
    <ul>
      <li><strong>User:</strong> ${user?.name || user?.email}</li>
      <li><strong>Email:</strong> ${user?.email}</li>
      <li><strong>Plan:</strong> ${subscription.plan}</li>
      <li><strong>Order ID:</strong> ${subscription.order_id}</li>
      <li><strong>Payment ID:</strong> ${subscription.payment_id || '-'}</li>
      <li><strong>Invoice ID:</strong> ${subscription.invoice_id || '-'}</li>
      <li><strong>Amount:</strong> ${subscription.price_amount} ${subscription.price_currency}</li>
    </ul>
    <p>Please verify this payment in the admin dashboard and activate the subscription if everything is correct.</p>
    <p><em>This payment does not automatically activate the subscription. Manual approval required.</em></p>
  `;
}
