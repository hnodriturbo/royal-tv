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

import RenderErrorCatcher from '@/components/dev/RenderErrorCatcher';
import DevClientBridge from '@/components/dev/DevClientBridge';

export default function RootLayout({ children, params }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="w/full min-h-screen"
        style={{
          background: "url('/images/background/background.png') no-repeat center center fixed",
          backgroundSize: 'cover'
        }}
      >
        {/* Dev-only UI hints & console enrichment */}
        {process.env.NEXT_PUBLIC_DEBUG_INVALID_ELEMENT === '1' ? <DevClientBridge /> : null}
        {/* Your existing providers can wrap here if needed */}
        <RenderErrorCatcher>{children}</RenderErrorCatcher>
      </body>
    </html>
  );
}
