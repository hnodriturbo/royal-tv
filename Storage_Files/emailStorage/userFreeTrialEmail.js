// 📁 lib/email/premade/userFreeTrialEmail.js

/**
 * Generate the user-facing “free trial was requested” email HTML
 * @param {Object} props
 * @param {Object} props.user – user record (needed for name/email)
 * @param {Object} props.trial – the newly created free trial record
 */
export function userFreeTrialEmail({ user, trial }) {
  return `
    <h2>🚀 Your Free Trial Request Has Been Received!</h2>
    <p>Hi ${user.name || 'there'},</p>
    <p>We have received your request for a free trial. A member of our team will review your request and activate it within 24 hours.</p>
    <br/>
    <p>If you have any questions, reply to this email or visit our <a href="https://www.royal-tv.tv/faq">FAQ</a> page.</p>
    <br/>
    <p>Thank you for choosing Royal TV!<br/>Royal TV Team</p>
  `;
}
