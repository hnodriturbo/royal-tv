// 📁 File: lib/email/premade/layout.js

/**
 * Email layout wrapper to apply global styling and branding.
 * - Adds logo
 * - Optional signature/footer (can be toggled)
 */
export function wrapEmailContent({ title, contentHtml, includeSignature = true }) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="text-align: center; color: #333;">${title}</h2>
        <div style="margin-top: 20px; color: #444; font-size: 15px;">
          ${contentHtml}
        </div>

        ${
          includeSignature
            ? `
          <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #777;">
            Best regards,<br />
            <strong>Royal TV Support</strong><br />
            <a href="mailto:support@royal-tv.tv">support@royal-tv.tv</a>
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;
}
/* 
        <div style="text-align: center; margin-bottom: 20px;">
          <img
            src="https://royal-tv.tv/images/logo/logo.png"
            alt="Royal TV Logo"
            style="width: 120px; height: auto;"
          />
        </div>;
 */
