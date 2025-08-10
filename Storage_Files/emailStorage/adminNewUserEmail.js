// 📁 lib/email/premade/adminNewUserEmail.js

/**
 * Generate the admin-facing “new user” email HTML
 * @param {Object} props
 * @param {Object} props.user  – the newly created user record
 */
export function adminNewUserEmail({ user }) {
  return `
    <h2>🆕 New User Registration</h2>
    <p><strong>User ID:</strong> ${user.user_id}</p>
    <p><strong>Username:</strong> ${user.username}</p>
    <p><strong>Name:</strong> ${user.name}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Telegram:</strong> ${user.telegram || 'N/A'}</p>
    <p><strong>WhatsApp:</strong> ${user.whatsapp || 'N/A'}</p>
    <p><strong>Preferred Contact:</strong> ${user.preferredContactWay || 'N/A'}</p>
    <br/>
    <p>Please review the new user in your Admin Dashboard:</p>
    <p><a href="https://www.royal-tv.tv/admin/users">Go to Admin Users List</a></p>
    <br/>
    <p>Regards,<br/>Royal TV Automated System</p>
  `;
}
