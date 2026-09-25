import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket: Socket | null = null;

export const useSocket = (token: string | null) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      socket = null;
      return;
    }

    if (!socket || !socket.connected) {
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
      });
      socketRef.current = socket;
    }

    return () => {
      // Don't disconnect on re-render; only on logout (token = null)
    };
  }, [token]);

  return socketRef.current ?? socket;
};

export const getSocket = () => socket;
