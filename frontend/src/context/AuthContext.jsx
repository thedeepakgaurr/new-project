import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import api, { SESSION_EXPIRED_EVENT, TOKEN_KEY } from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY));

  const saveAuth = useCallback((tok, usr) => {
    if (tok) localStorage.setItem(TOKEN_KEY, tok);
    else localStorage.removeItem(TOKEN_KEY);
    setToken(tok || null);
    setUser(usr || null);
  }, []);

  const logout = useCallback(() => {
    // Stateless JWT: tell the server for completeness, but never block on it
    api.post('/auth/logout').catch(() => {});
    saveAuth(null, null);
  }, [saveAuth]);

  // Validate a stored token once on load
  useEffect(() => {
    if (!token) return;
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => saveAuth(null, null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any 401 from an authenticated call ends the session everywhere
  useEffect(() => {
    const onExpired = () => {
      setToken((current) => {
        if (current) toast.error('Your session has expired. Please sign in again.', { id: 'session-expired' });
        return null;
      });
      setUser(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // Keep multiple tabs in sync on sign in / sign out
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== TOKEN_KEY) return;
      if (!e.newValue) {
        setToken(null);
        setUser(null);
      } else if (e.newValue !== token) {
        setToken(e.newValue);
        api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => {});
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [token]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      saveAuth(data.token, data.user);
      return data;
    },
    [saveAuth]
  );

  const register = useCallback(
    async (name, email, password) => {
      const { data } = await api.post('/auth/register', { name, email, password });
      saveAuth(data.token, data.user);
      return data;
    },
    [saveAuth]
  );

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, setUser, saveAuth }),
    [user, token, loading, login, register, logout, saveAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
