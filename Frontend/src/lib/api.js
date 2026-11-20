import axios from 'axios';

// ── URL resolution strategy ───────────────────────────────────────────────────
//
// 1. Explicit env var: If NEXT_PUBLIC_API_URL is set (and not empty), use it.
// 2. In browser on localhost/127.0.0.1: Default to 'http://localhost:5000'.
// 3. In browser on production (e.g. Vercel *.vercel.app or custom domain):
//    Default to '' (empty string) so all requests are relative (/api/...) and
//    routed automatically by Vercel's top-level rewrite to the backend service.
// 4. Server-side (SSR): Fallback to BACKEND_URL (service binding) or localhost.
// ─────────────────────────────────────────────────────────────────────────────
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local');
    return isLocal ? 'http://localhost:5000' : '';
  }
  return process.env.BACKEND_URL || 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
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
