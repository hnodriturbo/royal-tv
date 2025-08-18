/**
 * ========== src/context/SocketContext.js ==========
 * 📡 Global Socket provider
 * - Connects once with user identity + next-intl locale in the handshake
 * - No cookie fallbacks; locale comes from next-intl + session (if present)
 * - Exposes: socket, emitEvent, onEvent, socketConnected
 */

'use client';

import { createContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useLocale as useNextIntlLocale } from 'next-intl'; // 🌍 authoritative UI locale

export const SocketContext = createContext({
  socket: null,
  emitEvent: () => {},
  onEvent: () => {},
  socketConnected: false
});

export const SocketProvider = ({ children }) => {
  // 🔌 socket state
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // 👤 session info
  const { data: session, status } = useSession();

  // 🌍 locale from next-intl
  const activeUILocale = useNextIntlLocale?.() || 'en';

  // 🌐 server url
  const SOCKET_URL =
    process.env.NODE_ENV === 'production' ? 'https://royal-tv.tv' : 'http://localhost:3001';

  useEffect(() => {
    // ⏳ wait for session to settle to avoid reconnect loops
    if (status === 'loading') return;

    // 👤 identity for handshake
    const user_id = session?.user?.user_id || null; // 🆔 null → server will assign guest-<socket.id>
    const role = session?.user?.role || 'guest'; // 👥 default role
    const name = session?.user?.name || 'Guest'; // 🏷️ fallback name
    const locale = activeUILocale; // 🌍 authoritative UI language

    // 🧾 visibility
    console.log('📡 Connecting socket with:', { user_id, role, name, locale });

    // 🔌 connect with query + auth.locale (browser ignores extraHeaders)
    const socketConnection = io(SOCKET_URL, {
      transports: ['websocket'],
      path: '/socket.io',
      query: { user_id, role, name, locale }, // 🧾 server seeds socket.userData from here
      auth: { locale } // 🌍 also place in auth for completeness
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
      console.log('🔌 Socket disconnected');
    };
  }, [
    SOCKET_URL,
    status,
    session?.user?.user_id,
    session?.user?.role,
    session?.user?.name,
    activeUILocale
  ]);

  useEffect(() => {
    if (!socket) return;

    // 🟢 on connect
    const handleConnect = () => {
      setSocketConnected(true);
      console.log('🟢 [SocketContext] Socket connected!');
    };

    // 🔴 on disconnect
    const handleDisconnect = () => {
      setSocketConnected(false);
      console.log('🔴 [SocketContext] Socket disconnected!');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  // 📤 emit wrapper
  const emitEvent = useCallback(
    (event, data) => {
      if (socket) socket.emit(event, data);
    },
    [socket]
  );

  // 📥 on wrapper
  const onEvent = useCallback(
    (event, callback) => {
      if (!socket) return () => {};
      socket.on(event, callback);
      return () => socket.off(event, callback);
    },
    [socket]
  );

  return (
    <SocketContext.Provider value={{ socket, emitEvent, onEvent, socketConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
