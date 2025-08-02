/**
 *   ========================== RootLayout.js ==========================
 * 🏠
 * APPLICATION ROOT LAYOUT:
 * Main entry point for the entire website.
 * - Wraps all pages with global context providers (Session, Auth, Error/Message, Loader, Modal).
 * - Loads global CSS and style files for the whole app.
 * - Includes universal UI: Header, Footer, WhatsApp button, and more.
 * - Applies a custom background image for branding and style.
 * =====================================================================
 * ⚙️
 * PROPS:
 *   children: ReactNode // All page content rendered inside the layout.
 * =====================================================================
 * 📌
 * USAGE:
 *   Place in `/app/layout.js` to ensure all pages are wrapped.
 *   Imports and renders <AppProviders>, enabling global context and UI helpers.
 * =====================================================================
 */

// Import CSS Styles Files
import './styles/theme-utils.css';
import './styles/border-styles.css';
import './styles/extras.css';
import './styles/linearGradientStyles.css';
// End With Importing The Global CSS File And Bootstrap Icons
import './styles/globals.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { SessionProvider } from 'next-auth/react';
import AppProviders from './AppProviders';

export default function RootLayout({ children }) {
  return (
    <html>
      <body
        className="w-full min-h-screen"
        style={{
          background: "url('/images/background/background.png') no-repeat center center fixed",
          backgroundSize: 'cover'
        }}
      >
        <SessionProvider>
          <AppProviders>{children}</AppProviders>
        </SessionProvider>
      </body>
    </html>
  );
}
