import { io } from 'socket.io-client';

// ── Socket.io URL resolution ──────────────────────────────────────────────────
//
// 1. Explicit env var: If NEXT_PUBLIC_API_URL is provided, use it.
// 2. In browser on localhost/127.0.0.1: Connect to 'http://localhost:5000'.
// 3. In browser on production (e.g. Vercel): Pass undefined so io() auto-connects
//    to current page origin, which is rewritten by Vercel to the backend service.
// 4. Transport: Force 'websocket' with 'polling' fallback for maximum compatibility.
// ─────────────────────────────────────────────────────────────────────────────
const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local');
    return isLocal ? 'http://localhost:5000' : undefined;
  }
  return process.env.BACKEND_URL || 'http://localhost:5000';
};

let socket = null;

export const getSocket = () => {
  if (!socket && typeof window !== 'undefined') {
    const targetUrl = getSocketUrl();
    socket = io(targetUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export default getSocket;
