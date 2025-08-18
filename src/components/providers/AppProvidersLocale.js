/**
 * ======================= AppProvidersLocale.js =======================
 * 🌍 Locale-aware providers shell
 * - Receives `activeLocale` from [locale]/layout
 * - Wraps UI with I18nUiProvider so all providers can read locale
 * - Preserves your exact provider order (LogPageView → ErrorAndMessage → Loader → Modal)
 * - Leaves `useT()` workflow intact; providers can also use `useUILocale()`
 */

'use client';

import { useContext } from 'react';
import { I18nUiProvider } from '@/context/storage/I18nUiContext'; // 🧭 UI-locale context
import { SocketProvider, SocketContext } from '@/context/SocketContext'; // 🔌 socket context
import { LoaderProvider } from '@/context/LoaderContext'; // ⏳ loader
import { ErrorAndMessageProvider } from '@/context/ErrorAndMessageContext'; // ⚠️ errors/messages
import { ModalProvider } from '@/context/ModalContext'; // 🪟 modal system

// 🧩 UI pieces (unchanged)
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import WhatsAppLogo from '@/components/ui/whatsapp/WhatsAppBS';
import ShowMessages from '@/components/ui/showErrorAndMessages/ShowMessages';
import LogPageView from '@/components/reusableUI/socket/LogPageView';

function AppContent({ children }) {
  // 🧲 Read live socket state
  const { socketConnected } = useContext(SocketContext);

  return (
    <>
      {/* 🪵 Track all page visits when socket is ready */}
      {socketConnected && <LogPageView />}

      {/* ⚠️ → ⏳ → 🪟  (preserve exact provider order) */}
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

export default function AppProvidersLocale({ activeLocale, children }) {
  // 🌐 Provide UI locale first so all inner providers/components can read it
  return (
    <I18nUiProvider locale={activeLocale}>
      {/* 🔌 Socket wraps AppContent so LogPageView can read socketConnected */}
      <SocketProvider>
        <AppContent>{children}</AppContent>
      </SocketProvider>
    </I18nUiProvider>
  );
}
