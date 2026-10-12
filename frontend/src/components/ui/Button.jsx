import { forwardRef } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/format.js';

const VARIANTS = {
  primary: 'bg-fg text-bg hover:bg-fg/90 shadow-sm',
  brand: 'bg-brand text-brand-fg hover:bg-brand/90 shadow-[0_6px_20px_-6px_var(--brand)]',
  gradient:
    'bg-brand-gradient text-white shadow-[0_8px_28px_-8px_rgba(217,70,168,0.65)] hover:shadow-[0_10px_32px_-6px_rgba(217,70,168,0.75)] hover:brightness-[1.06]',
  secondary: 'bg-surface text-fg border border-line hover:bg-surface-2 hover:border-line-strong shadow-xs',
  ghost: 'text-fg-2 hover:bg-surface-2 hover:text-fg',
  light: 'bg-white text-[#0c0a1d] hover:bg-white/90 shadow-sm',
  danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
  'danger-ghost': 'text-danger hover:bg-danger-soft'
};

const SIZES = {
  sm: 'h-8 px-3 text-[13px] rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-[15px] rounded-xl gap-2',
  icon: 'h-9 w-9 rounded-lg',
  'icon-sm': 'h-8 w-8 rounded-lg'
};

const Button = forwardRef(function Button(
  { as: Comp = 'button', variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props },
  ref
) {
  const isButton = Comp === 'button';
  return (
    <Comp
      ref={ref}
      type={isButton ? props.type || 'button' : undefined}
      disabled={isButton ? disabled || loading : undefined}
      aria-disabled={!isButton && (disabled || loading) ? true : undefined}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium',
        'transition-[background-color,border-color,color,box-shadow,transform,filter] duration-150 ease-out',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden />}
      {children}
    </Comp>
  );
});

export default Button;
