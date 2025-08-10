// 📡 SocketContext.js
// ✅ PROVIDE SAFE INITIAL DEFAULT VALUES
'use client';

import logger from '@/lib/core/logger';
import { createContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export const SocketContext = createContext({
  socket: null,
  emitEvent: () => {},
  onEvent: () => {},
  socketConnected: false
});

export const SocketProvider = ({ children }) => {
  // 👉 Hold the socket instance
  const [socket, setSocket] = useState(null);
  const { data: session, status } = useSession();
  const [socketConnected, setSocketConnected] = useState(false);

  const SOCKET_URL =
    process.env.NODE_ENV === 'production'
      ? 'https://royal-tv.tv' // ✅ prod
      : 'http://localhost:3001'; // ✅ dev

  // 🔌 Connect once the auth state is known
  useEffect(() => {
    if (status === 'loading') return;

    // Only make a new socket when these *core* identity values change
    const role = session?.user?.role || 'guest';
    const user_id = session?.user?.user_id || null;
    const name = session?.user?.name || 'Guest';

    logger.log('📡 Connecting socket with:', { user_id, role, name });

    const socketConnection = io(SOCKET_URL, {
      transports: ['websocket'],
      path: '/socket.io',
      query: { user_id, role, name }
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
      logger.log('🔌 Socket disconnected');
    };
  }, [SOCKET_URL, session?.user?.user_id, session?.user?.role, session?.user?.name, status]);

  useEffect(() => {
    if (!socket) return;

    // 🟢 Set connected = true when socket connects
    const handleConnect = () => {
      setSocketConnected(true);
      logger.log('🟢 [SocketContext] Socket connected!');
    };

    // 🔴 Set connected = false when socket disconnects
    const handleDisconnect = () => {
      setSocketConnected(false);
      logger.log('🔴 [SocketContext] Socket disconnected!');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // 🧹 Cleanup to avoid memory leaks
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  const emitEvent = useCallback(
    (event, data) => {
      if (socket) socket.emit(event, data);
    },
    [socket]
  );

  const onEvent = useCallback(
    (event, callback) => {
      if (socket) {
        socket.on(event, callback);
        return () => socket.off(event, callback);
      }
    },
    [socket]
  );

  // ✅ Always provide a stable object as `value`
  return (
    <SocketContext.Provider value={{ socket, emitEvent, onEvent, socketConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
