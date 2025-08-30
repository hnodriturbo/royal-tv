/**
 * ========================== /src/app/layout.js ==========================
 * 🏠 Root App Shell (non-locale)
 * - Loads global CSS / assets
 * - Wraps children in NextIntlClientProvider so client-side translations work
 * - Leaves locale detection & messages to /app/[locale]/layout.js
 * ========================================================================
 */

import { NextIntlClientProvider } from 'next-intl';
import './styles/theme-utils.css';
import './styles/border-styles.css';
import './styles/extras.css';
import './styles/linearGradientStyles.css';
import './styles/globals.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function Layout({ children }) {
  return (
    <html>
      <body
        className="w-full min-h-screen"
        style={{
          background: "url('/images/background/background.png') no-repeat center center fixed",
          backgroundSize: 'cover'
        }}
      >
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
