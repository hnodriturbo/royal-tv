/**
 *   ========================== /src/app/layout.js ==========================
 * 🏠 Root app shell (non-locale)
 * - Loads global CSS (relative imports only)
 * - Leaves *all* providers to /app/[locale]/layout.js
 */

import './styles/theme-utils.css'; // 🎨 global
import './styles/border-styles.css'; // 🎨 global
import './styles/extras.css'; // 🎨 global
import './styles/linearGradientStyles.css'; // 🎨 global
import './styles/globals.css'; // 🎨 tailwind v4 entry
import 'bootstrap-icons/font/bootstrap-icons.css'; // 🔤 icons

export default function RootLayout({ children }) {
  // 🧱 bare shell so hydration is stable and locale providers can wrap below
  return (
    <html /* 🧭 neutral; actual lang set under [locale]/layout */>
      <body
        className="w-full min-h-screen"
        style={{
          background: "url('/images/background/background.png') no-repeat center center fixed",
          backgroundSize: 'cover'
        }}
      >
        {/* 🌱 child tree is wrapped by providers in /app/[locale]/layout.js */}
        {children}
      </body>
    </html>
  );
}
