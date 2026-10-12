import { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/format.js';

// Pill-style tab switcher with a sliding active indicator
export default function Segmented({ options, value, onChange, size = 'md', className, label }) {
  const layoutId = useId();
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('inline-flex items-center gap-0.5 rounded-xl border border-line bg-surface-2 p-1', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              active ? 'text-fg' : 'text-muted hover:text-fg'
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg border border-line bg-surface shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {Icon && <Icon className="size-3.5" />}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
