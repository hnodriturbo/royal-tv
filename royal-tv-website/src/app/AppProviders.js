'use client';

import { useSession } from 'next-auth/react';
import { LoaderProvider } from '@/context/LoaderContext';
import { ErrorAndMessageProvider } from '@/context/ErrorAndMessageContext';
import { ModalProvider } from '@/context/ModalContext';
import { SocketProvider, SocketContext } from '@/context/SocketContext';
import { useContext } from 'react';

import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';

import WhatsAppLogo from '@/components/ui/whatsapp/WhatsAppBS';
import ShowMessages from '@/components/ui/showErrorAndMessages/ShowMessages';
import LogPageView from '@/components/reusableUI/socket/LogPageView';

function AppContent({ children }) {
  const { socketConnected } = useContext(SocketContext);

  return (
    <>
      {/* 🪵 Track all page visits! */}
      {socketConnected && <LogPageView />}
      <ErrorAndMessageProvider>
        <LoaderProvider>
          <ModalProvider>
            <div className="min-h-screen flex flex-col">
              <div className="min-h-screen w-full">
                <Sidebar />
                <div className="lg:ml-64 flex flex-col min-h-screen">
                  <main className="flex-1 p-2">{children}</main>
                  <Footer />
                </div>
              </div>
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
  const { status } = useSession();

  if (status === 'loading') return null;

  return (
    <SocketProvider>
      <AppContent>{children}</AppContent>
    </SocketProvider>
  );
}
