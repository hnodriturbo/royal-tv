// 📁 lib/email/premade/adminSubscriptionChangeEmail.js

import { wrapEmailContent } from '../../src/lib/email/premade/layout';

/**
 *   =========================================
 *   ADMIN: Subscription Change Notification
 *   -----------------------------------------
 *   Sent to admin when a subscription is updated.
 *   =========================================
 */
export default function adminSubscriptionChangeEmail({ user, subscription }) {
  return wrapEmailContent({
    title: `Subscription Updated – ${subscription.order_id}`,
    contentHtml: `
      <p>Hi Admin,</p>
      <p>The subscription for <b>${user?.name || user?.email}</b> (${user?.email}) has been <b>${subscription.status === 'active' ? 'activated' : 'updated'}</b> by an admin.</p>
      <ul>
        <li><b>Plan:</b> ${subscription.plan}</li>
        <li><b>Order ID:</b> ${subscription.order_id}</li>
        <li><b>Status:</b> ${subscription.status}</li>
        <li><b>Start:</b> ${subscription.startDate ? new Date(subscription.startDate).toLocaleString() : '-'}</li>
        <li><b>End:</b> ${subscription.endDate ? new Date(subscription.endDate).toLocaleString() : '-'}</li>
        <li><b>Payment ID:</b> ${subscription.payment_id || '-'}</li>
        <li><b>Invoice ID:</b> ${subscription.invoice_id || '-'}</li>
        <li><b>Amount:</b> ${subscription.price_amount} ${subscription.price_currency}</li>
      </ul>
      <p>All subscription credentials must be viewed from the admin dashboard for security.</p>
      <p><em>This update was logged for auditing.</em></p>
    `,
    includeSignature: true
  });
}
