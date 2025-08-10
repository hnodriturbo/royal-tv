/**
 * Generate the admin-facing “free trial updated/activated” email HTML
 * @param {Object} props
 * @param {Object} props.trial – the updated free trial record
 * @param {Object} props.user – the user record
 */
export function adminFreeTrialUpdateEmail({ trial, user }) {
  return `
    <h2>🎁 Free Trial Activated for: ${user?.name || 'Unknown User'}</h2>
    <br />
    <h3>User Details</h3>
    <p><strong>User ID:</strong> ${user?.user_id || 'N/A'}</p>
    <p><strong>Username:</strong> ${user?.username || 'N/A'}</p>
    <p><strong>Name:</strong> ${user?.name || 'N/A'}</p>
    <p><strong>Email:</strong> ${user?.email || 'N/A'}</p>
    <p><strong>Telegram:</strong> ${user?.telegram || 'N/A'}</p>
    <p><strong>WhatsApp:</strong> ${user?.whatsapp || 'N/A'}</p>
    <br />
    <h3>Free Trial Info</h3>
    <p><strong>Trial ID:</strong> ${trial?.trial_id || 'N/A'}</p>
    <p><strong>Status:</strong> ${trial?.status || 'N/A'}</p>
    <p><strong>Activated At:</strong> ${trial?.updatedAt ? new Date(trial.updatedAt).toLocaleString() : 'N/A'}</p>
    <br />
    <p>Free trial has been <strong>activated</strong>. You may review all trial accounts in your admin panel.</p>
  `;
}
