'use client';

import { useContext, useCallback } from 'react';
import { SocketContext } from '../../context/SocketContext';

const useSocket = () => {
  const { socket, emitEvent, onEvent, socketConnected } = useContext(SocketContext);

  // 🎧 Subscribe + auto‑cleanup
  const listen = useCallback(
    (event, cb) => {
      if (!socket) return () => {};
      socket.on(event, cb);
      return () => socket.off(event, cb);
    },
    [socket]
  );

  // 📤 Emit alias (kept for backwards compatibility)
  const emit = useCallback((event, data) => emitEvent(event, data), [emitEvent]);

  return { socket, listen, emit, onEvent, socketConnected };
};

export default useSocket;
