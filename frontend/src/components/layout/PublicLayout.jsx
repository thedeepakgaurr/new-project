import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ArrowRight, Monitor, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Logo } from '../Brand.jsx';
import Button from '../ui/Button.jsx';
import Menu, { MenuItem } from '../ui/Menu.jsx';
import { cn } from '../../lib/format.js';

export function ThemeMenu() {
  const { theme, setTheme, resolved } = useTheme();
  const Icon = resolved === 'dark' ? Moon : Sun;
  return (
    <Menu
      trigger={({ toggle, props }) => (
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Change theme" {...props}>
          <Icon className="size-[18px]" />
        </Button>
      )}
    >
      <MenuItem icon={Sun} onClick={() => setTheme('light')} active={theme === 'light'}>
        Light
      </MenuItem>
      <MenuItem icon={Moon} onClick={() => setTheme('dark')} active={theme === 'dark'}>
        Dark
      </MenuItem>
      <MenuItem icon={Monitor} onClick={() => setTheme('system')} active={theme === 'system'}>
        System
      </MenuItem>
    </Menu>
  );
}

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#platforms', label: 'Platforms' },
  { href: '#faq', label: 'FAQ' }
];

export default function PublicLayout() {
  const { token } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className={cn(
          'sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300',
          scrolled ? 'border-b border-line bg-bg/75 backdrop-blur-xl' : 'border-b border-transparent'
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeMenu />
            {token ? (
              <Button as={Link} to="/dashboard" size="sm" className="h-9 px-4">
                Open app
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <>
                <Button as={Link} to="/login" variant="ghost" size="sm" className="hidden h-9 sm:inline-flex">
                  Sign in
                </Button>
                <Button as={Link} to="/register" size="sm" className="h-9 px-4">
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-muted">Platform-ready social content from any photo or video.</p>
          </div>
          <div className="flex flex-col gap-1 text-sm text-muted sm:items-end">
            <div className="flex gap-5">
              <Link to="/login" className="hover:text-fg">
                Sign in
              </Link>
              <Link to="/register" className="hover:text-fg">
                Create account
              </Link>
            </div>
            <p className="text-xs text-subtle">© {new Date().getFullYear()} SocialBoost AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
