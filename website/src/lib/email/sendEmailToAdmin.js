// 📁 File: lib/email/sendEmailToAdmin.js
import transporter from './transporter.js';
import { wrapEmailContent } from './premade/layout.js';

/**
 * Send a styled email to the admin inbox
 * @param {Object} props
 * @param {string} props.subject - Email subject line
 * @param {string} props.title - Title shown inside the email
 * @param {string} props.contentHtml - Main HTML content
 * @param {string} [props.replyTo] - Optional reply-to (user email)
 * @param {boolean} [props.includeSignature=false] - Show default footer
 */
export async function sendEmailToAdmin({
  subject,
  title,
  contentHtml,
  replyTo,
  includeSignature = false
}) {
  const html = wrapEmailContent({ title, contentHtml, includeSignature });

  const mailOptions = {
    from: '"RoyalTV Automatic Email Service" <support@royal-tv.tv>',
    to: 'support@royal-tv.tv',
    subject,
    html,
    ...(replyTo && { replyTo })
  };

  await transporter.sendMail(mailOptions);
}
