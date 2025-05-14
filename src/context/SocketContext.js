// 📡 SocketContext.js
// ✅ PROVIDE SAFE INITIAL DEFAULT VALUES
'use client';

import { createContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export const SocketContext = createContext({
  socket: null,
  emitEvent: () => {},
  onEvent: () => {},
});

export const SocketProvider = ({ children }) => {
  // 👉 Hold the socket instance
  const [socket, setSocket] = useState(null);
  const { data: session, status } = useSession();

  /*  🌐 Decide URL by NODE_ENV
      dev  → http://localhost:3001
      prod → https://royal-tv.tv  (change if you host elsewhere)
  */
  const SOCKET_URL =
    process.env.NODE_ENV === 'production'
      ? 'https://royal-tv.tv' // ✅ prod
      : 'http://localhost:3001'; // ✅ dev

  // 🔌 Connect once the auth state is known
  useEffect(() => {
    if (status === 'loading') return;

    const role = session?.user?.role || 'guest';
    const user_id = session?.user?.user_id || null;
    const name = session?.user?.name || 'Guest';

    console.log('📡 Connecting socket with:', { user_id, role, name });

    const socketConnection = io(SOCKET_URL, {
      transports: ['websocket'],
      path: '/socket.io',
      query: { user_id, role, name },
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
      console.log('🔌 Socket disconnected');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session?.user?.user_id,
    session?.user?.role,
    session?.user?.name,
    status,
  ]);

  const emitEvent = useCallback(
    (event, data) => {
      if (socket) socket.emit(event, data);
    },
    [socket],
  );

  const onEvent = useCallback(
    (event, callback) => {
      if (socket) {
        socket.on(event, callback);
        return () => socket.off(event, callback);
      }
    },
    [socket],
  );

  // ✅ Always provide a stable object as `value`
  return (
    <SocketContext.Provider value={{ socket, emitEvent, onEvent }}>
      {children}
    </SocketContext.Provider>
  );
};
