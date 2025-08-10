/**
 * Generate the user-facing “free trial activated” email HTML
 * @param {Object} props
 * @param {Object} props.user – user record (needed for name/email)
 * @param {Object} props.trial – the updated free trial record
 */
export function userFreeTrialUpdateEmail({ user, trial }) {
  return `
    <h2>🎉 Your Free Trial is Now Active!</h2>
    <p>Hi ${user.name || 'there'},</p>
    <p>Your free trial has just been activated. You can now login and access your credentials under your Free Trial section on your dashboard.</p>
    <br/>
    <p><strong>Note:</strong> For your security, we do not send login credentials by email. Please login at <a href="https://www.royal-tv.tv/login">Royal TV Login</a> to view your access info.</p>
    <br/>
    <p>Thank you for choosing Royal TV!</p>
  `;
}
