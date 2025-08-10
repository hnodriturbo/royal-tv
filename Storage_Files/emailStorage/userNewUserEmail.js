// 📁 lib/email/premade/userNewUserEmail.js

/**
 * Generate the user-facing “welcome” email HTML
 * @param {Object} props
 * @param {Object} props.user – the newly created user record
 */
export function userNewUserEmail({ user }) {
  return `
    <h2>🎉 Welcome to Royal TV, ${user.name}!</h2>
    <p>Thank you for registering. Your account has been created successfully.</p>
    <p>You can now <a href="https://www.royal-tv.tv/login">log in</a> and start exploring our content.</p>
    <br/>
    <p>If you have any questions, reply to this email or visit our <a href="https://yourdomain.com/faq">Support Page</a>.</p>
    <br/>
    <p>Enjoy!<br/>Royal TV Team</p>
  `;
}
