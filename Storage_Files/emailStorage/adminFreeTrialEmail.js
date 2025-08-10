/**
 * Generate the admin-facing “new free trial request” email HTML
 * @param {Object} props
 * @param {Object} props.trial – the newly created free trial record
 * @param {Object} props.user – the user record
 */
export function adminFreeTrialEmail({ trial, user }) {
  return `
    <h2>✅ Free Trial Requested: ${user?.name || 'Unknown User'}</h2>
    <br />
    <h3>User Details</h3>
    <p><strong>User ID:</strong> ${user?.user_id || 'N/A'}</p>
    <p><strong>Username:</strong> ${user?.username || 'N/A'}</p>
    <p><strong>Name:</strong> ${user?.name || 'N/A'}</p>
    <p><strong>Email:</strong> ${user?.email || 'N/A'}</p>
    <p><strong>Telegram:</strong> ${user?.telegram || 'N/A'}</p>
    <p><strong>WhatsApp:</strong> ${user?.whatsapp || 'N/A'}</p>
    <p><strong>Preferred Contact:</strong> ${user?.preferredContactWay || 'N/A'}</p>
    <br />
    <h3>Free Trial Info</h3>
    <p><strong>Trial ID:</strong> ${trial?.trial_id || 'N/A'}</p>
    <p><strong>Requested At:</strong> ${trial?.createdAt ? new Date(trial.createdAt).toLocaleString() : 'N/A'}</p>
    <p><strong>Status:</strong> ${trial?.status || 'N/A'}</p>
    <br />
    <p>Please process or approve the free trial in your Admin Dashboard:</p>
    <p><a href="https://www.royal-tv.tv/admin/freeTrials">Go to Free Trial Requests</a></p>
  `;
}
