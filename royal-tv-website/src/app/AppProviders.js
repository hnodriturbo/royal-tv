/**
 *   ========================= AppProviders.js =========================
 * ✨
 * APPLICATION PROVIDER:
 * For global contexts and layout.
 * Wraps the entire app in core providers (Socket, Error, Loader, Modal).
 * Renders global Sidebar, Footer, WhatsApp button, and message UI.
 * Optionally supports a full-page loader during session hydration.
 * =======================================================================
 * ⚙️
 * PROPS:
 *   children: ReactNode // All app page content/components.
 * =======================================================================
 * 📌
 * USAGE:
 *   Import and wrap your Next.js root layout or _app with <AppProviders>.
 *   Enables app-wide access to context and UI helpers.
 *   Sidebar navigation is always visible, role-based.
 * =======================================================================
 * 🗂️
 * LOCATION: /components/AppProviders.js
 * =======================================================================
 */
'use client';

import { useSession } from 'next-auth/react';
import { LoaderProvider } from '@/context/LoaderContext';
import { ErrorAndMessageProvider } from '@/context/ErrorAndMessageContext';
import { ModalProvider } from '@/context/ModalContext';
import { SocketProvider } from '@/context/SocketContext';

import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';

import WhatsAppLogo from '@/components/ui/whatsapp/WhatsAppBS';
import ShowMessages from '@/components/ui/showErrorAndMessages/ShowMessages';

export default function AppProviders({ children }) {
  const { status } = useSession();

  // 🌀 Show loader while session is hydrating
  if (status === 'loading') return null;

  return (
    <SocketProvider>
      <ErrorAndMessageProvider>
        <LoaderProvider>
          <ModalProvider>
            <div className="min-h-screen flex flex-col">
              {/* Main layout: Sidebar | Main (with footer at bottom) */}
              <div className="min-h-screen w-full">
                <Sidebar /> {/* fixed sidebar, outside flex */}
                <div className="lg:ml-64 flex flex-col min-h-screen">
                  <main className="flex-1 p-2">{children}</main>
                  <Footer />
                </div>
              </div>
              {/* WhatsApp button & messages always on top */}
              <WhatsAppLogo />
              <ShowMessages />
            </div>
          </ModalProvider>
        </LoaderProvider>
      </ErrorAndMessageProvider>
    </SocketProvider>
  );
}
