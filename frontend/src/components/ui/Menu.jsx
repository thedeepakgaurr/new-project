import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/format.js';

// Lightweight dropdown: click/Escape/outside-click handling and arrow-key focus
export default function Menu({ trigger, children, align = 'end', side = 'bottom', className }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        rootRef.current?.querySelector('[aria-haspopup]')?.focus();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = [...(listRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') || [])];
        const i = items.indexOf(document.activeElement);
        const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
        items[next]?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    setTimeout(() => listRef.current?.querySelector('[role="menuitem"]')?.focus(), 10);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o), props: { 'aria-haspopup': 'menu', 'aria-expanded': open } })}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={listRef}
            role="menu"
            initial={{ opacity: 0, scale: 0.96, y: side === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: side === 'top' ? 4 : -4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            onClick={() => setOpen(false)}
            className={cn(
              'absolute z-40 min-w-52 rounded-xl border border-line bg-surface p-1.5 shadow-lg',
              side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
              align === 'end' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuItem({ icon: Icon, children, onClick, tone, disabled, active }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors',
        'hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none disabled:opacity-50',
        tone === 'danger' ? 'text-danger hover:bg-danger-soft focus-visible:bg-danger-soft' : 'text-fg-2 hover:text-fg',
        active && 'text-fg'
      )}
    >
      {Icon && <Icon className="size-4 shrink-0 opacity-80" />}
      <span className="flex-1">{children}</span>
      {active && <span className="size-1.5 rounded-full bg-brand" aria-hidden />}
    </button>
  );
}

export function MenuLabel({ children }) {
  return <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">{children}</div>;
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-line" />;
}
