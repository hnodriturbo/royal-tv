'use client';

import { useContext, useCallback } from 'react';
import { SocketContext } from '@/context/SocketContext';

const useSocket = () => {
  const { socket, emitEvent, onEvent, socketConnected } = useContext(SocketContext);

  const listen = useCallback(
    (event, cb) => {
      if (!socket) return () => {};
      socket.on(event, cb);
      return () => socket.off(event, cb);
    },
    [socket]
  );

  const emit = useCallback((event, data) => emitEvent(event, data), [emitEvent]);

  return { socket, listen, emit, onEvent, socketConnected };
};

export default useSocket;
