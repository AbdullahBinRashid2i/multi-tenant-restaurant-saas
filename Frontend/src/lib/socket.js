import { io } from 'socket.io-client';

// On Vercel: NEXT_PUBLIC_API_URL is "" so the socket connects to the same
// origin; the /api/(.*) rewrite forwards the Socket.io handshake to the
// backend service. Locally it falls back to http://localhost:5000.
//
// IMPORTANT: Vercel Functions do not support HTTP long-polling.
// We force the WebSocket transport so the connection upgrades immediately.
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket && typeof window !== 'undefined') {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],   // Required on Vercel – no long-polling
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export default getSocket;
