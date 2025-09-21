/**
 * /src/app/layout.js
 * Root shell: the ONLY place with <html> & <body>.
 */

import './styles/theme-utils.css';
import './styles/border-styles.css';
import './styles/extras.css';
import './styles/linearGradientStyles.css';
import './styles/globals.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function RootLayout({ children, params }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="w-full min-h-screen lg:mt-6 mt-16"
        style={{
          background: "url('/images/background/background.png') no-repeat center center fixed",
          backgroundSize: 'cover'
        }}
      >
        {children}
      </body>
    </html>
  );
}
