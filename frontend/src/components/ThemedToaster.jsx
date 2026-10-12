import { Toaster } from 'sonner';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemedToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster
      theme={resolved}
      position="bottom-right"
      closeButton
      toastOptions={{
        style: {
          background: 'var(--surface)',
          color: 'var(--fg)',
          border: '1px solid var(--line)',
          borderRadius: '14px',
          fontFamily: 'var(--font-sans)'
        }
      }}
    />
  );
}
