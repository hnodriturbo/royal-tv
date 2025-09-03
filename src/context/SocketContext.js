/**
 * ========== src/context/SocketContext.js ==========
 * 📡 Global Socket provider (single connection)
 * 🌍 Handshake includes current UI locale (from next-intl)
 * 🚫 No DB locale reads/writes; runtime only
 */

'use client';

import { createContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useLocale as useNextIntlLocale } from 'next-intl';

export const SocketContext = createContext({
  socket: null,
  emitEvent: () => {},
  onEvent: () => {},
  socketConnected: false
});

export const SocketProvider = ({ children, locale: injectedLocale }) => {
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const { data: session, status } = useSession();
  const activeUILocale = injectedLocale || useNextIntlLocale?.() || 'en';

  // 🔗 allow override via env if you want to front with Nginx
  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://royal-tv.tv' : 'http://localhost:3001');

  useEffect(() => {
    if (status === 'loading') return;

    const user_id = session?.user?.user_id || null;
    const role = session?.user?.role || 'guest';
    const name = session?.user?.name || 'Guest';
    const locale = activeUILocale;

    console.log('📡 Connecting socket with:', { user_id, role, name, locale });

    const socketConnection = io(SOCKET_URL, {
      transports: ['websocket'],
      path: '/socket.io',
      query: { user_id, role, name, locale },
      auth: { locale }
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
    const onConnect = () => {
      setSocketConnected(true);
      console.log('🟢 [SocketContext] Connected');
    };
    const onDisconnect = () => {
      setSocketConnected(false);
      console.log('🔴 [SocketContext] Disconnected');
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  const emitEvent = useCallback(
    (event, data) => {
      if (socket) socket.emit(event, data);
    },
    [socket]
  );
  const onEvent = useCallback(
    (event, cb) => {
      if (!socket) return () => {};
      socket.on(event, cb);
      return () => socket.off(event, cb);
    },
    [socket]
  );

  return (
    <SocketContext.Provider value={{ socket, emitEvent, onEvent, socketConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
