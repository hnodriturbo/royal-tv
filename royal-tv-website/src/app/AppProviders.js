'use client';

import { useSession } from 'next-auth/react';
import { LoaderProvider } from '@/context/LoaderContext';
import { ErrorAndMessageProvider } from '@/context/ErrorAndMessageContext';
import { ModalProvider } from '@/context/ModalContext';
import { SocketProvider } from '@/context/SocketContext';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppLogo from '@/components/ui/whatsapp/WhatsAppBS';
import ShowMessages from '@/components/ui/showErrorAndMessages/ShowMessages';
import CustomRingLoader from '@/components/ui/Loader/RingLoader';
/* 
import BubbleChat from '@/components/ui/liveChat/BubbleChat';
import AdminBubbleChat from '@/components/ui/liveChat/AdminBubbleChat';
 */
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
              {/* 🟢 Admin Chat Bubble shown only to admin users */}
              {/* 
              {session?.user?.role === 'admin' && <AdminBubbleChat />}
              {session?.user?.role !== 'admin' && <BubbleChat />}
              */}
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
