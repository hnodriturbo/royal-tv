// 📁 lib/email/premade/userSubscriptionPaymentEmail.js

/**
 *   =========================================
 *   USER: Subscription Payment Confirmation
 *   -----------------------------------------
 *   Sent to user when their payment is received.
 *   =========================================
 */
export function userNewPaymentEmail({ user, subscription }) {
  return `
    <p>Thank you for your payment!</p>
    <ul>
      <li><strong>Plan:</strong> ${subscription.plan}</li>
      <li><strong>Order ID:</strong> ${subscription.order_id}</li>
      <li><strong>Payment ID:</strong> ${subscription.payment_id || '-'}</li>
      <li><strong>Invoice ID:</strong> ${subscription.invoice_id || '-'}</li>
      <li><strong>Amount:</strong> ${subscription.price_amount} ${subscription.price_currency}</li>
    </ul>
    <p>Your subscription is being processed. Activation usually happens within 24 hours. You will receive another email when your access is live.</p>
    <p>If you have any questions, please log in and send us a message from your dashboard.</p>
  `;
}
