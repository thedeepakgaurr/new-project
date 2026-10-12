import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button.jsx';
import { cn } from '../../lib/format.js';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, description, children, footer, size = 'md', dismissible = true }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const restoreRef = useRef(null);
  // Read through a ref so a new onClose identity each render doesn't re-run the effect
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    restoreRef.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const first = panelRef.current?.querySelector('[data-autofocus]') || panelRef.current?.querySelector(FOCUSABLE);
      first?.focus();
    }, 30);

    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) onCloseRef.current?.();
      // Keep Tab focus inside the dialog
      if (e.key === 'Tab' && panelRef.current) {
        const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)];
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      restoreRef.current?.focus?.();
    };
  }, [open, dismissible]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => dismissible && onClose?.()}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              'relative w-full rounded-t-3xl border border-line bg-surface shadow-lg sm:rounded-2xl',
              size === 'sm' ? 'sm:max-w-md' : 'sm:max-w-lg'
            )}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <div>
                <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight">
                  {title}
                </h2>
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}
              </div>
              {dismissible && (
                <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close" className="-mr-2 -mt-1">
                  <X className="size-4" />
                </Button>
              )}
            </div>
            {children && <div className="px-6 pt-4">{children}</div>}
            {footer && <div className="flex flex-col-reverse gap-2 px-6 pb-6 pt-6 sm:flex-row sm:justify-end">{footer}</div>}
            {!footer && <div className="pb-6" />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', tone = 'danger', loading }) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      dismissible={!loading}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
