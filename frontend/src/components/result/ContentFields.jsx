import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { FIELDS } from '../../lib/constants.js';
import { cn, fieldText } from '../../lib/format.js';
import { inputClass } from '../ui/Field.jsx';

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts / older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function CopyButton({ text, label = 'Copy', className, size = 'sm' }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const onClick = async () => {
    if (await copyText(text)) setCopied(true);
    else toast.error('Could not copy to clipboard');
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? 'Copied' : label}
      className={cn(
        'relative inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors',
        size === 'sm' ? 'h-7 px-2 text-xs' : 'h-9 px-3 text-sm',
        copied ? 'text-success' : 'text-muted hover:bg-surface-2 hover:text-fg',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? 'y' : 'n'}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {copied ? <Check className="size-3.5" strokeWidth={2.5} /> : <Copy className="size-3.5" />}
        </motion.span>
      </AnimatePresence>
      <span className={size === 'sm' ? 'hidden sm:inline' : ''}>{copied ? 'Copied' : label}</span>
    </button>
  );
}

function AutoTextarea({ value, onChange, rows = 2, ...props }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={rows}
      value={value}
      onChange={onChange}
      className={cn(inputClass, 'scrollbar-thin resize-none overflow-hidden py-2.5 leading-relaxed')}
      {...props}
    />
  );
}

function Counter({ field, platform, value }) {
  if (field.list) {
    const n = Array.isArray(value) ? value.length : String(value || '').split(/[\s,]+/).filter(Boolean).length;
    const max = field.max?.[platform];
    return (
      <span className={cn('text-[11px] tabular-nums', max && n > max ? 'text-warning' : 'text-subtle')}>
        {n}
        {max ? ` / ${max}` : ''}
      </span>
    );
  }
  const len = String(value || '').length;
  const limit = field.limits?.[platform];
  const rec = field.recommended?.[platform];
  const tone = limit && len > limit ? 'text-danger' : rec && len > rec ? 'text-warning' : 'text-subtle';
  return (
    <span className={cn('text-[11px] tabular-nums', tone)} title={rec ? `Recommended under ${rec} characters` : undefined}>
      {len.toLocaleString()}
      {limit ? ` / ${limit.toLocaleString()}` : ''}
    </span>
  );
}

// Lists are edited as plain text and parsed by the server
export function toDraft(content) {
  const d = {};
  FIELDS.forEach(({ key, list }) => {
    d[key] = list ? fieldText(content[key] || [], key) : content[key] || '';
  });
  return d;
}

export function visibleFields(content, platform, editing) {
  return FIELDS.filter(({ key }) => {
    if (editing) return !(key === 'title' && platform === 'instagram' && !content.title);
    const v = content[key];
    return Array.isArray(v) ? v.length > 0 : !!v;
  });
}

export default function ContentFields({ content, editing, draft, onDraftChange, busy, revealKey }) {
  const platform = content.platform;
  const fields = visibleFields(content, platform, editing);

  return (
    <div className={cn('grid gap-3 transition-opacity duration-300', busy && 'pointer-events-none opacity-50')}>
      {fields.map((field, i) => {
        const value = editing ? draft[field.key] : content[field.key];
        return (
          <motion.section
            key={`${field.key}-${revealKey}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'group relative overflow-hidden rounded-2xl border bg-surface p-4 transition-colors sm:p-5',
              editing ? 'border-line-strong' : 'border-line hover:border-line-strong'
            )}
            aria-label={field.label}
          >
            {busy && <div className="skeleton absolute inset-0 opacity-40" aria-hidden />}
            <header className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">{field.label}</h3>
                {field.hint && <span className="hidden text-[11.5px] text-subtle sm:inline">{field.hint}</span>}
              </div>
              <div className="flex items-center gap-1">
                <Counter field={field} platform={platform} value={value} />
                {!editing && <CopyButton text={fieldText(value, field.key)} />}
              </div>
            </header>

            {editing ? (
              <AutoTextarea
                rows={field.rows ? 4 : 2}
                value={value}
                onChange={(e) => onDraftChange({ ...draft, [field.key]: e.target.value })}
                placeholder={field.list ? (field.key === 'hashtags' ? '#travel #sunset' : 'keyword one, keyword two') : `Add a ${field.label.toLowerCase()}`}
                aria-label={field.label}
              />
            ) : field.key === 'hashtags' ? (
              <div className="flex flex-wrap gap-1.5">
                {value.map((t) => (
                  <span key={t} className="rounded-md bg-brand-soft px-2 py-1 text-[13px] font-medium text-brand-ink">
                    #{t.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            ) : field.key === 'keywords' ? (
              <div className="flex flex-wrap gap-1.5">
                {value.map((k) => (
                  <span key={k} className="rounded-md border border-line bg-surface-2 px-2 py-1 text-[13px] text-fg-2">
                    {k}
                  </span>
                ))}
              </div>
            ) : (
              <p
                className={cn(
                  'whitespace-pre-wrap break-words text-[15px] leading-relaxed text-fg',
                  field.key === 'hook' && 'font-display text-lg font-semibold leading-snug',
                  field.key === 'title' && 'text-base font-semibold'
                )}
              >
                {value}
              </p>
            )}
          </motion.section>
        );
      })}
    </div>
  );
}
