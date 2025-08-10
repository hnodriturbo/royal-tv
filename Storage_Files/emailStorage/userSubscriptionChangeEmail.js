// 📁 lib/email/premade/userSubscriptionChangeEmail.js

import { wrapEmailContent } from '../../src/lib/email/premade/layout';

/**
 *   =========================================
 *   USER: Subscription Activation/Change
 *   -----------------------------------------
 *   Sent to user when admin activates or updates their subscription.
 *   =========================================
 */
export default function userSubscriptionChangeEmail({ user, subscription }) {
  return wrapEmailContent({
    title: `Your Subscription is Now Active!`,
    contentHtml: `
      <p>Hello ${user?.name || ''},</p>
      <p>Your subscription <b>${subscription.order_id}</b> is now <b>${subscription.status === 'active' ? 'active' : 'updated'}</b>!</p>
      <ul>
        <li><b>Plan:</b> ${subscription.plan}</li>
        <li><b>Status:</b> ${subscription.status}</li>
        <li><b>Start:</b> ${subscription.startDate ? new Date(subscription.startDate).toLocaleString() : '-'}</li>
        <li><b>End:</b> ${subscription.endDate ? new Date(subscription.endDate).toLocaleString() : '-'}</li>
      </ul>
      <p>To view your subscription credentials, please <a href="https://royal-tv.tv/login" style="color:#195ae6;text-decoration:underline;">log in to your account</a>.</p>
      <p>You can always view your subscriptions from your user dashboard.</p>
      <p>If you have any questions, reply to this email or contact us from your dashboard.</p>
    `,
    includeSignature: true
  });
}
