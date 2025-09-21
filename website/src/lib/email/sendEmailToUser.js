// 📁 File: lib/email/sendEmailToUser.js
import transporter from './transporter.js';
import { wrapEmailContent } from './premade/layout.js';

/**
 * Send a user-facing email with layout and props
 * @param {Object} props
 * @param {string} props.to - Recipient email
 * @param {string} props.subject - Email subject line
 * @param {string} props.title - Title shown inside email
 * @param {string} props.contentHtml - Main HTML content
 * @param {boolean} [props.includeSignature=true] - Show footer
 */
export async function sendEmailToUser({
  to,
  subject,
  title,
  contentHtml,
  includeSignature = true
}) {
  const html = wrapEmailContent({ title, contentHtml, includeSignature });

  const mailOptions = {
    from: '"RoyalTV Support" <support@royal-tv.tv>',
    to,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);
}
