/**
 * ======================= /src/app/AppProvidersLocale.js =======================
 * 🗣️ AppProvidersLocale (client)
 * - Locale-scoped UI providers that need the active locale
 * - Order matters so consumers always see their context:
 *   Loader → ErrorAndMessage → Socket(locale) → WhatsApp(locale) → Modal(locale)
 * - Mounts <ShowMessages/> under ErrorAndMessageProvider so toasts work globally
 */

'use client';

import { useContext } from 'react';

// ⬇️ Contexts
import { ErrorAndMessageProvider, ErrorAndMessageContext } from '@/context/ErrorAndMessageContext';
import { LoaderProvider } from '@/context/LoaderContext';
import { ModalProvider } from '@/context/ModalContext';
import { SocketProvider } from '@/context/SocketContext';
import WhatsApp from '@/components/ui/whatsapp/WhatsAppBS';

// ⬇️ Toast surface (consumer of ErrorAndMessageContext)
import ShowMessages from '@/components/ui/showErrorAndMessages/ShowMessages';

// 🛡️ Prevent hard crash if consumer renders before provider for any reason
function SafeShowMessages() {
  const ctx = useContext(ErrorAndMessageContext) ?? { message: null, clearMessage: () => {} };
  const { message } = ctx; // keep hook used
  return <ShowMessages />;
}

export default function AppProvidersLocale({ children, locale = 'en' }) {
  return (
    <LoaderProvider>
      <ErrorAndMessageProvider locale={locale}>
        <SocketProvider locale={locale}>
          <ModalProvider locale={locale}>
            {/* 🔔 global toasts UI */}
            <SafeShowMessages />
            {/* 🌳 app tree */}
            {children}
          </ModalProvider>
          <WhatsApp />
        </SocketProvider>
      </ErrorAndMessageProvider>
    </LoaderProvider>
  );
}
