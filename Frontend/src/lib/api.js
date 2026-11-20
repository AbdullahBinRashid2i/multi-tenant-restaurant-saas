import axios from 'axios';

// ── URL resolution strategy ───────────────────────────────────────────────────
//
// Local dev  : set NEXT_PUBLIC_API_URL=http://localhost:5000 in .env.local
//              → API calls go to   http://localhost:5000/api/...
//              → Image URLs become http://localhost:5000/uploads/...
//
// Vercel     : set NEXT_PUBLIC_API_URL="" (empty string) in project env vars
//              → API_BASE_URL becomes "" so the axios baseURL is "/api"
//              → All /api/* browser requests hit the same Vercel domain
//              → The top-level rewrite in vercel.json routes them to the backend service
//              → Image URLs become /uploads/... (also routed to backend via rewrite)
//
// IMPORTANT: We use ?? (nullish coalescing) not || so that an intentional
// empty string is preserved. '' || fallback = fallback (wrong); '' ?? fallback = '' (correct).
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: inject Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: response error logging + 401 redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      if (
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/restaurant')
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
