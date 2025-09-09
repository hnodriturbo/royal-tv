/**
 * ========== src/context/SocketContext.js ==========
 * 📡 Global Socket provider (single connection)
 * 🌍 Handshake includes initial UI locale; later changes emit "set_locale"
 * 🛡️ Small guarded emit queue (flushes on connect)
 */

'use client';

import { createContext, useEffect, useRef, useState, useCallback } from 'react';
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
  const routeLocale = useNextIntlLocale?.() || 'en';
  const activeUILocale = injectedLocale || routeLocale;

  // simple queue for emits while disconnected
  const emitQueueRef = useRef([]);
  const currentLocaleRef = useRef(activeUILocale);

  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://royal-tv.tv' : 'http://localhost:3001');

  // connect once (do not depend on locale)
  useEffect(() => {
    if (status === 'loading') return;

    const user_id = session?.user?.user_id || null;
    const role = session?.user?.role || 'guest';
    const name = session?.user?.name || 'Guest';

    currentLocaleRef.current = activeUILocale;

    const socketConnection = io(SOCKET_URL, {
      transports: ['websocket'],
      path: '/socket.io',
      query: { user_id, role, name, locale: currentLocaleRef.current },
      auth: { locale: currentLocaleRef.current },
      withCredentials: true
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
    // ⛔️ intentionally exclude activeUILocale so we don't reconnect on language change
  }, [SOCKET_URL, status, session?.user?.user_id, session?.user?.role, session?.user?.name]);

  // basic lifecycle + queue flush
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      setSocketConnected(true);
      // flush queued emits
      for (const [event, data] of emitQueueRef.current) {
        socket.emit(event, data);
      }
      emitQueueRef.current = [];
    };
    const onDisconnect = () => {
      setSocketConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  // when the UI locale changes, tell the server (no reconnect churn)
  useEffect(() => {
    if (!socket) return;
    const next = injectedLocale || routeLocale;
    if (next && next !== currentLocaleRef.current) {
      currentLocaleRef.current = next;
      // emit immediately; if disconnected, it will queue below
      if (socketConnected) {
        socket.emit('set_locale', { locale: next });
      } else {
        emitQueueRef.current.push(['set_locale', { locale: next }]);
      }
    }
  }, [socket, socketConnected, injectedLocale, routeLocale]);

  const emitEvent = useCallback(
    (event, data) => {
      if (socket && socketConnected) {
        socket.emit(event, data);
      } else {
        emitQueueRef.current.push([event, data]);
      }
    },
    [socket, socketConnected]
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
