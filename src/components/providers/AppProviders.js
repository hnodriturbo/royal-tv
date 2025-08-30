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
import { useLocale } from 'next-intl';

// 🔌 sockets (needs locale)
import { SocketProvider, SocketContext } from '@/context/SocketContext';

// ⚠️ messages & loaders & modals
import { ErrorAndMessageProvider } from '@/context/ErrorAndMessageContext';
import { LoaderProvider } from '@/context/LoaderContext';
import { ModalProvider } from '@/context/ModalContext';

// 🧩 UI pieces
import LanguageSwitcher from '@/components/languageSwitcher/LanguageSwitcher';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import WhatsAppLogo from '@/components/ui/whatsapp/WhatsAppBS';
import ShowMessages from '@/components/ui/showErrorAndMessages/ShowMessages';
import LogPageView from '@/components/reusableUI/socket/LogPageView';
import ErrorBoundary from '@/lib/debug/ErrorBoundary';

function AppContent({ children }) {
  // 🧲 live socket state for LogPageView
  const ctx = useContext(SocketContext) ?? {};
  const { socketConnected } = ctx;

  return (
    <>
      {/* 🪵 track page views once socket is ready */}
      {socketConnected && <LogPageView />}

      {/* ⚠️ → ⏳ → 🪟 */}
      <ErrorAndMessageProvider>
        <LoaderProvider>
          {/* 🪟 modal needs locale (prop is injected by parent) */}
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
  // 🧭 current locale from next-intl (used by socket & modal providers)
  const activeLocale = (useLocale() || 'en').toLowerCase();

  // 🔌 socket context wraps AppContent so children can consume it anywhere
  //    pass locale down so providers that need it can read from context/hook
  return (
    <ErrorBoundary>
      <SocketProvider locale={activeLocale}>
        {/* 🔁 ModalProvider inside will read locale via its own hook or from props if your impl expects it */}
        <AppContent>{children}</AppContent>
      </SocketProvider>
    </ErrorBoundary>
  );
}
