/*
 * layout.js
 * Root layout for the application.
 * Wraps pages with global providers (Session, Auth, Error/Message, Loader, and Modal)
 * and includes common UI components like Header, Footer, and WhatsAppLogo.
 */
/* 
import './styles/advertisement.css';
import './styles/border-styles.css';
import './styles/linearGradientStyles.css';
import './styles/extras.css';
import './styles/text-glowing.css';
import './styles/myStyles.css';
 */
import './styles/globals.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
/* 
import Header from '@/components/mainComponents/Header';
import Footer from '@/components/mainComponents/Footer';
import WhatsAppLogo from '@/components/ui/whatsapp/WhatsAppBS';
import ShowMessages from '@/components/ui/showErrorAndMessages/ShowMessages';
 */
import { SessionProvider } from 'next-auth/react';
import AppProviders from '@/components/layout/AppProviders';

/* import { LoaderProvider } from '@/context/LoaderContext';
import { ErrorAndMessageProvider } from '@/context/ErrorAndMessageContext';
import { ModalProvider } from '@/context/ModalContext';
import { SocketProvider } from '@/context/SocketContext'; */

export default function RootLayout({ children }) {
  return (
    <html>
      <body
        className="w-full min-h-screen"
        style={{
          background: "url('/images/background/background.png') no-repeat center center fixed",
          backgroundSize: 'cover',
        }}
      >
        <SessionProvider>
          <AppProviders>{children}</AppProviders>
        </SessionProvider>
      </body>
    </html>
  );
}
