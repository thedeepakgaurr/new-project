import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/format.js';

export const inputClass = cn(
  'w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-fg shadow-xs',
  'transition-[border-color,box-shadow] duration-150 outline-none',
  'hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/15',
  'disabled:cursor-not-allowed disabled:opacity-60',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15'
);

export function Label({ htmlFor, children, optional, className }) {
  return (
    <label htmlFor={htmlFor} className={cn('mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-fg', className)}>
      <span>{children}</span>
      {optional && <span className="text-xs font-normal text-subtle">Optional</span>}
    </label>
  );
}

function Message({ id, error, hint }) {
  if (error) {
    return (
      <p id={id} role="alert" className="mt-1.5 text-xs text-danger">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-xs text-muted">
        {hint}
      </p>
    );
  }
  return null;
}

export const TextField = forwardRef(function TextField(
  { label, hint, error, optional, className, inputClassName, type = 'text', id: idProp, ...props },
  ref
) {
  const autoId = useId();
  const id = idProp || autoId;
  const msgId = `${id}-msg`;
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} optional={optional}>
          {label}
        </Label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? msgId : undefined}
          className={cn(inputClass, 'h-11', isPassword && 'pr-11', inputClassName)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-subtle transition-colors hover:text-fg"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      <Message id={msgId} error={error} hint={hint} />
    </div>
  );
});

export const TextArea = forwardRef(function TextArea(
  { label, hint, error, optional, className, inputClassName, id: idProp, rows = 4, ...props },
  ref
) {
  const autoId = useId();
  const id = idProp || autoId;
  const msgId = `${id}-msg`;
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} optional={optional}>
          {label}
        </Label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? msgId : undefined}
        className={cn(inputClass, 'scrollbar-thin resize-y py-2.5 leading-relaxed', inputClassName)}
        {...props}
      />
      <Message id={msgId} error={error} hint={hint} />
    </div>
  );
});
