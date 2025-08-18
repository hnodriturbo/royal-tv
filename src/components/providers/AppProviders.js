/**
 * ======================= /src/components/providers/AppProviders.js =======================
 * 🧱 Merged providers shell (single file)
 * - Renders under NextIntlClientProvider (from [locale]/layout.js)
 * - Preserves order: LogPageView → ErrorAndMessage → Loader → Modal
 * - Keeps SocketProvider outer so LogPageView can read `socketConnected`
 * ========================================================================================
 */

'use client';

import { useContext } from 'react';

// 🔌 sockets
import { SocketProvider, SocketContext } from '@/context/SocketContext';

// ⚠️ messages & loaders & modals
import { ErrorAndMessageProvider } from '@/context/ErrorAndMessageContext';
import { LoaderProvider } from '@/context/LoaderContext';
import { ModalProvider } from '@/context/ModalContext';

// 🧩 UI pieces
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import WhatsAppLogo from '@/components/ui/whatsapp/WhatsAppBS';
import ShowMessages from '@/components/ui/showErrorAndMessages/ShowMessages';
import LogPageView from '@/components/reusableUI/socket/LogPageView';

function AppContent({ children }) {
  // 🧲 live socket state for LogPageView
  const { socketConnected } = useContext(SocketContext);

  return (
    <>
      {/* 🪵 track page views once socket is ready */}
      {socketConnected && <LogPageView />}

      {/* ⚠️ → ⏳ → 🪟 */}
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

              {/* 💬 global helpers */}
              <WhatsAppLogo />
              <ShowMessages />
            </div>
          </ModalProvider>
        </LoaderProvider>
      </ErrorAndMessageProvider>
    </>
  );
}

export default function AppProviders({ children }) {
  // 🔌 socket context wraps AppContent so children can consume it anywhere
  return (
    <SocketProvider>
      <AppContent>{children}</AppContent>
    </SocketProvider>
  );
}
