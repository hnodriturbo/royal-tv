'use client';
/**
 * ======================= /src/components/providers/AppProviders.js =======================
 * 🧱 App-wide client providers
 * - Order: Socket → (LogPageView) → ErrorAndMessage → Loader → Modal → App chrome
 * - Requires NextIntlClientProvider above (in /app/[locale]/layout.js)
 * =========================================================================================
 */

import { useContext } from 'react';
import { useLocale } from 'next-intl';

// 🔌 sockets
import { SocketProvider, SocketContext } from '@/context/SocketContext';

// ⚠️ messages & loaders & modals
import { ErrorAndMessageProvider } from '@/context/ErrorAndMessageContext';
import { LoaderProvider } from '@/context/LoaderContext';
import { ModalProvider } from '@/context/ModalContext';

// 🧩 UI pieces
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import LogPageView from '@/components/reusableUI/socket/LogPageView';
import WhatsAppLogo from '@/components/ui/whatsapp/WhatsAppBS';
import ShowMessages from '@/components/ui/showErrorAndMessages/ShowMessages';
import LanguageSwitcher from '@/components/languageSwitcher/LanguageSwitcher';
// 💬 Public live chat widget (small floating window)
import PublicLiveChatWidget from '@/components/reusableUI/socket/PublicLiveChatWidget';
// ❌ Error Debugger Helper
import ErrorBoundary from '@/lib/debug/ErrorBoundary';

function AppContent({ children }) {
  // live socket state for LogPageView
  const { socketConnected } = useContext(SocketContext) ?? {};

  return (
    <>
      {socketConnected && <LogPageView />}

      <ErrorAndMessageProvider>
        <LoaderProvider>
          <ModalProvider>
            <div className="min-h-screen flex flex-col">
              <div className="min-h-screen w-full">
                <LanguageSwitcher />
                <Sidebar />

                <div className="lg:ml-64 flex flex-col min-h-screen">
                  <main className="flex-1 p-2">{children}</main>
                  <Footer />
                </div>
              </div>

              <WhatsAppLogo />
              <PublicLiveChatWidget />
              <ShowMessages />
            </div>
          </ModalProvider>
        </LoaderProvider>
      </ErrorAndMessageProvider>
    </>
  );
}

export default function AppProviders({ children }) {
  // current locale from next-intl → passed to SocketProvider so server localizes notifications
  const activeLocale = (useLocale() || 'en').toLowerCase();

  return (
    <ErrorBoundary>
      <SocketProvider locale={activeLocale}>
        <AppContent>{children}</AppContent>
      </SocketProvider>
    </ErrorBoundary>
  );
}
