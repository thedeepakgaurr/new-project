import axios from 'axios';

export const TOKEN_KEY = 'token';
export const SESSION_EXPIRED_EVENT = 'sb:session-expired';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30_000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // A 401 on an authenticated request means the session is gone; a 401 on
    // the login form is just a wrong password and must not sign anyone out.
    if (err?.response?.status === 401 && err.config?.headers?.Authorization) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(err);
  }
);

// Human-readable message for any request failure
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (axios.isCancel(err)) return 'Request cancelled.';
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (err?.response) return err.response.data?.message || fallback;
  if (err?.request) return "Can't reach the server. Check your connection and try again.";
  return err?.message || fallback;
}

export default api;
