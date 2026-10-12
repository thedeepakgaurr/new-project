import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/format.js';

export default function PageHeader({ title, description, actions, eyebrow, className }) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted sm:text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// Animated count-up for dashboard numbers
export function CountUp({ value = 0, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!inView || !ref.current) return undefined;
    if (reduce) {
      ref.current.textContent = value.toLocaleString();
      return undefined;
    }
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString();
      }
    });
    return () => controls.stop();
  }, [value, inView, reduce]);
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      0
    </span>
  );
}
