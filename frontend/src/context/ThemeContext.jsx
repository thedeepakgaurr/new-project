import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'sb-theme';
const ThemeContext = createContext(null);

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

function readTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'system';
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme);
  const [systemDark, setSystemDark] = useState(prefersDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* private mode: theme just won't persist */
    }
  }, [theme, resolved]);

  const value = useMemo(() => ({ theme, setTheme, resolved }), [theme, resolved]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
