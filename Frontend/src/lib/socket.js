import { io } from 'socket.io-client';

// ── Socket.io URL resolution ──────────────────────────────────────────────────
//
// Local dev  : NEXT_PUBLIC_API_URL=http://localhost:5000
//              → socket connects directly to the Express server on port 5000
//
// Vercel     : NEXT_PUBLIC_API_URL="" (empty string)
//              → _rawUrl is "", which is falsy, so SOCKET_URL becomes undefined
//              → io(undefined) auto-connects to the current page's origin
//              → The /api/(.*) rewrite in vercel.json forwards the Socket.io
//                WebSocket upgrade handshake to the backend service
//
// ?? vs || : We use ?? so an intentional "" from the env is not overridden by
// the localhost fallback; then we use || undefined so that "" (same-origin)
// is passed to socket.io as undefined (its native "auto-detect origin" mode).
//
// IMPORTANT: Vercel does not support Socket.io's HTTP long-polling transport.
// Always force 'websocket' so the connection upgrades immediately on first try.
// ─────────────────────────────────────────────────────────────────────────────
const _rawUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

// Empty string → undefined so io() auto-connects to current host (Vercel)
// Non-empty string (localhost URL) → passed through as-is for local dev
const SOCKET_URL = _rawUrl || undefined;

let socket = null;

export const getSocket = () => {
  if (!socket && typeof window !== 'undefined') {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],    // Required on Vercel – no long-polling fallback
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export default getSocket;
