/**
 *   ========================= AppProviders.js =========================
 * ✨
 * APPLICATION PROVIDER:
 * For global contexts and layout.
 * Wraps the entire app in core providers (Socket, Error, Loader, Modal).
 * Renders global Header, Footer, WhatsApp button, and message UI.
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
 * =======================================================================
 */
'use client';

import { useSession } from 'next-auth/react';
import { LoaderProvider } from '@/context/LoaderContext';
import { ErrorAndMessageProvider } from '@/context/ErrorAndMessageContext';
import { ModalProvider } from '@/context/ModalContext';
import { SocketProvider } from '@/context/SocketContext';

// Header & Footer Imports
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Custom Imports
import WhatsAppLogo from '@/components/ui/whatsapp/WhatsAppBS';
import ShowMessages from '@/components/ui/showErrorAndMessages/ShowMessages';

export default function AppProviders({ children }) {
  const { data: session, status } = useSession();

  // 🌀 Show loader while session is hydrating
  if (status === 'loading') return;

  /* {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-800">
        <CustomRingLoader
          text="Preparing your session..."
          size="large"
          color="#3b82f6"
          textClassName="text-white text-lg font-semibold"
        />
      </div>
    );
  } */

  return (
    <SocketProvider>
      <ErrorAndMessageProvider>
        <LoaderProvider>
          <ModalProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1 pt-14 flex items-center justify-center">{children}</main>
              <WhatsAppLogo />
              <Footer />
              <ShowMessages />
            </div>
          </ModalProvider>
        </LoaderProvider>
      </ErrorAndMessageProvider>
    </SocketProvider>
  );
}

/* ==================================================================== */

// The following loader import and block are kept for learning/testing //
// This shows RingLoader spinner while the page loads in the beginning //

/* import CustomRingLoader from '@/components/ui/Loader/RingLoader'; */

/* 🌀 Full-page loader (shows while session is hydrating) */
/* 
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-800">
        <CustomRingLoader
          text="Preparing your session..."
          size="large"
          color="#3b82f6"
          textClassName="text-white text-lg font-semibold"
        />
      </div>
    );
  } 
*/

/* ==================================================================== */
