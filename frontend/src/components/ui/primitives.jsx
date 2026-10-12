import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/format.js';

export function Card({ as: Comp = 'div', className, children, ...props }) {
  return (
    <Comp className={cn('rounded-2xl border border-line bg-surface shadow-xs', className)} {...props}>
      {children}
    </Comp>
  );
}

const BADGE_TONES = {
  neutral: 'bg-surface-2 text-fg-2 border-line',
  brand: 'bg-brand-soft text-brand-ink border-transparent',
  success: 'bg-success-soft text-success border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
  info: 'bg-info-soft text-info border-transparent'
};

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium leading-5',
        BADGE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-lg', className)} aria-hidden />;
}

export function Spinner({ className, label }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-muted">
      <LoaderCircle className={cn('size-4 animate-spin', className)} aria-hidden />
      {label && <span>{label}</span>}
      {!label && <span className="sr-only">Loading</span>}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-2xl bg-brand-gradient opacity-25 blur-xl" aria-hidden />
          <div className="relative flex size-14 items-center justify-center rounded-2xl border border-line bg-surface shadow-sm">
            <Icon className="size-6 text-brand" strokeWidth={1.75} />
          </div>
        </div>
      )}
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Kbd({ children }) {
  return (
    <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted">
      {children}
    </kbd>
  );
}
