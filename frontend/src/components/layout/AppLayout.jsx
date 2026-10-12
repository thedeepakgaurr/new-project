import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import {
  Bookmark,
  ChevronsUpDown,
  History as HistoryIcon,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Monitor,
  Moon,
  Plus,
  Settings,
  Sun,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Logo } from '../Brand.jsx';
import Button from '../ui/Button.jsx';
import Menu, { MenuItem, MenuLabel, MenuSeparator } from '../ui/Menu.jsx';
import { cn, initials } from '../../lib/format.js';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/saved', label: 'Library', icon: Bookmark },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export function Avatar({ name, className }) {
  return (
    <span
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[12px] font-semibold text-white',
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
              isActive ? 'text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl border border-line bg-surface shadow-xs"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <Icon className={cn('relative size-[18px]', isActive && 'text-brand')} strokeWidth={isActive ? 2.2 : 1.9} />
              <span className="relative">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  return (
    <Menu
      side="top"
      align="start"
      className="w-[calc(100%)] min-w-56"
      trigger={({ toggle, props }) => (
        <button
          type="button"
          onClick={toggle}
          {...props}
          className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-surface-2"
        >
          <Avatar name={user?.name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{user?.name || 'Account'}</span>
            <span className="block truncate text-xs text-muted">{user?.email}</span>
          </span>
          <ChevronsUpDown className="size-4 text-subtle" />
        </button>
      )}
    >
      <MenuLabel>Appearance</MenuLabel>
      <MenuItem icon={Sun} onClick={() => setTheme('light')} active={theme === 'light'}>
        Light
      </MenuItem>
      <MenuItem icon={Moon} onClick={() => setTheme('dark')} active={theme === 'dark'}>
        Dark
      </MenuItem>
      <MenuItem icon={Monitor} onClick={() => setTheme('system')} active={theme === 'system'}>
        System
      </MenuItem>
      <MenuSeparator />
      <MenuItem icon={Settings} onClick={() => navigate('/settings')}>
        Settings
      </MenuItem>
      <MenuItem
        icon={LogOut}
        tone="danger"
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        Sign out
      </MenuItem>
    </Menu>
  );
}

function SidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-1">
        <Logo to="/dashboard" />
      </div>
      <Button as={NavLink} to="/generate" variant="gradient" className="w-full" onClick={onNavigate}>
        <Plus className="size-4" strokeWidth={2.5} />
        New content
      </Button>
      <NavItems onNavigate={onNavigate} />
      <div className="mt-auto border-t border-line pt-3">
        <UserMenu />
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();

  useEffect(() => setDrawer(false), [location.pathname]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface/70 backdrop-blur-xl lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/80 px-4 backdrop-blur-xl lg:hidden">
        <Logo to="/dashboard" />
        <div className="flex items-center gap-1">
          <Button as={NavLink} to="/generate" variant="primary" size="sm">
            <Plus className="size-4" />
            New
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDrawer(true)} aria-label="Open menu">
            <MenuIcon className="size-5" />
          </Button>
        </div>
      </header>

      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-surface shadow-lg"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              aria-label="Menu"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrawer(false)}
                className="absolute right-3 top-4"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </Button>
              <LayoutGroup id="drawer">
                <SidebarContent onNavigate={() => setDrawer(false)} />
              </LayoutGroup>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="lg:pl-64">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10"
        >
          {children || <Outlet />}
        </motion.div>
      </main>
    </div>
  );
}
