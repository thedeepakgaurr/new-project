import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, LoaderCircle } from 'lucide-react';
import { LogoMark } from '../Brand.jsx';
import Button from '../ui/Button.jsx';
import { cn } from '../../lib/format.js';

// The AI call is a single request, so its sub-steps advance on a timer while
// the upload step reflects real progress.
const AI_STEPS = [
  { label: 'Analyzing your media', after: 0 },
  { label: 'Writing hooks & captions', after: 5000 },
  { label: 'Picking hashtags & keywords', after: 11000 },
  { label: 'Polishing the final copy', after: 17000 }
];

export default function GenerationProgress({ open, stage, uploadPct, onCancel }) {
  const [aiStep, setAiStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (stage !== 'generating') {
      setAiStep(0);
      setElapsed(0);
      return undefined;
    }
    const started = Date.now();
    const timers = AI_STEPS.slice(1).map((s, i) => setTimeout(() => setAiStep(i + 1), s.after));
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(tick);
    };
  }, [stage]);

  const steps = [
    { label: stage === 'uploading' ? `Uploading media · ${uploadPct}%` : 'Media uploaded', state: stage === 'uploading' ? 'active' : 'done' },
    ...AI_STEPS.map((s, i) => ({
      label: s.label,
      state: stage === 'uploading' ? 'pending' : i < aiStep ? 'done' : i === aiStep ? 'active' : 'pending'
    }))
  ];

  const progress = stage === 'uploading' ? uploadPct * 0.25 : 25 + Math.min(70, (elapsed / 25) * 70);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Generating content"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface p-7 shadow-lg"
          >
            <div className="absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-brand-gradient opacity-20 blur-3xl" aria-hidden />
            <div className="relative">
              <div className="relative mx-auto flex size-16 items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-brand-gradient opacity-40 blur-lg"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.6, 0.35] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <LogoMark className="relative size-14" />
              </div>
              <h2 className="mt-5 text-center font-display text-xl font-semibold tracking-tight">Creating your content</h2>
              <p className="mt-1 text-center text-sm text-muted" aria-live="polite">
                {stage === 'uploading' ? 'Uploading your file securely…' : `Usually 10–30 seconds · ${elapsed}s`}
              </p>

              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  className="h-full rounded-full bg-brand-gradient"
                  animate={{ width: `${Math.max(4, progress)}%` }}
                  transition={{ ease: 'easeOut', duration: 0.6 }}
                />
              </div>

              <ol className="mt-6 space-y-3">
                {steps.map((s) => (
                  <li key={s.label.split(' ·')[0]} className="flex items-center gap-3 text-sm">
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-300',
                        s.state === 'done' && 'border-transparent bg-success text-white',
                        s.state === 'active' && 'border-brand/30 bg-brand-soft text-brand',
                        s.state === 'pending' && 'border-line text-subtle'
                      )}
                    >
                      {s.state === 'done' ? (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
                          <Check className="size-3.5" strokeWidth={3} />
                        </motion.span>
                      ) : s.state === 'active' ? (
                        <LoaderCircle className="size-3.5 animate-spin" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span className={cn('transition-colors', s.state === 'pending' ? 'text-subtle' : s.state === 'active' ? 'font-medium text-fg' : 'text-fg-2')}>
                      {s.label}
                    </span>
                  </li>
                ))}
              </ol>

              {stage === 'uploading' && onCancel && (
                <div className="mt-6 flex justify-center">
                  <Button variant="ghost" size="sm" onClick={onCancel}>
                    Cancel upload
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
