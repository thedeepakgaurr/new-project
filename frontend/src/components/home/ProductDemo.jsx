import { useEffect, useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { PlatformBadge } from '../Brand.jsx';
import { cn } from '../../lib/format.js';

// Illustrative sample used on marketing/auth screens — not real user data
const SAMPLE = {
  chips: ['Mountain lake', 'Golden hour', 'Calm', 'Travel'],
  hook: 'POV: you finally found the quiet spot.',
  caption: 'Golden hour hits different at 3,000 meters. Save this for your next escape and tag the friend you would bring.',
  hashtags: ['travelgram', 'mountainlake', 'goldenhour', 'wanderlust', 'slowtravel']
};

export function SceneArt({ className }) {
  const id = useId();
  return (
    <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" className={cn('h-full w-full', className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2a8f" />
          <stop offset=".45" stopColor="#c2418f" />
          <stop offset=".8" stopColor="#ff9a5a" />
          <stop offset="1" stopColor="#ffd29a" />
        </linearGradient>
        <linearGradient id={`${id}lake`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a5a" stopOpacity=".55" />
          <stop offset="1" stopColor="#2a1d6b" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill={`url(#${id}sky)`} />
      <circle cx="214" cy="118" r="30" fill="#ffe2b3" opacity=".95" />
      <path d="M0 150 L58 92 L96 124 L146 70 L204 132 L248 100 L320 150 V240 H0Z" fill="#5a2a7a" />
      <path d="M0 162 L44 128 L92 152 L150 112 L214 160 L270 130 L320 160 V240 H0Z" fill="#2e1b5e" />
      <rect y="164" width="320" height="76" fill={`url(#${id}lake)`} />
      <g stroke="#ffe2b3" strokeLinecap="round" opacity=".55">
        <path d="M188 178h52" strokeWidth="2.5" />
        <path d="M198 188h32" strokeWidth="2" />
        <path d="M206 198h16" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function useTyping(text, active, speed = 18) {
  const [n, setN] = useState(active ? 0 : text.length);
  useEffect(() => {
    if (!active) {
      setN(text.length);
      return undefined;
    }
    setN(0);
    const t = setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), speed);
    return () => clearInterval(t);
  }, [text, active, speed]);
  return text.slice(0, n);
}

export default function ProductDemo({ className, compact = false }) {
  const reduce = useReducedMotion();
  // 0 = scanning, 1 = analysis in, 2 = writing
  const [phase, setPhase] = useState(reduce ? 2 : 0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) return undefined;
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 1400);
    const t2 = setTimeout(() => setPhase(2), 2600);
    const t3 = setTimeout(() => setCycle((c) => c + 1), 11000);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [cycle, reduce]);

  const caption = useTyping(SAMPLE.caption, phase === 2 && !reduce);
  const captionDone = caption.length === SAMPLE.caption.length;

  return (
    <div className={cn('relative text-fg', className)}>
      <div className="absolute -inset-6 rounded-[2.5rem] bg-brand-gradient opacity-20 blur-3xl dark:opacity-25" aria-hidden />
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-lg">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2.5">
            <PlatformBadge platform="instagram" size="sm" />
            <div className="leading-tight">
              <div className="text-[13px] font-semibold">Instagram · Reel</div>
              <div className="text-[11px] text-muted">Tone: Inspirational</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-ink">
            <Sparkles className="size-3" />
            {phase < 2 ? 'Analyzing' : captionDone ? 'Ready' : 'Writing'}
          </span>
        </div>

        <div className={cn('grid gap-0', compact ? 'grid-cols-1' : 'sm:grid-cols-[1.05fr_1fr]')}>
          {/* media */}
          <div className={cn('relative overflow-hidden', compact ? 'h-40' : 'h-52 sm:h-auto sm:min-h-72')}>
            <SceneArt />
            <AnimatePresence>
              {phase === 0 && !reduce && (
                <motion.div
                  key={`scan-${cycle}`}
                  className="absolute inset-x-0 h-16 bg-linear-to-b from-transparent via-white/35 to-transparent"
                  initial={{ top: '-20%' }}
                  animate={{ top: '100%' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.3, ease: 'easeInOut' }}
                />
              )}
            </AnimatePresence>
            <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5">
              {SAMPLE.chips.map((c, i) => (
                <motion.span
                  key={`${c}-${cycle}`}
                  initial={reduce ? false : { opacity: 0, y: 8, scale: 0.9 }}
                  animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 8, scale: 0.9 }}
                  transition={{ delay: i * 0.09, type: 'spring', stiffness: 420, damping: 26 }}
                  className="rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md"
                >
                  {c}
                </motion.span>
              ))}
            </div>
          </div>

          {/* output */}
          <div className="space-y-4 p-5">
            <div>
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-subtle">Hook</div>
              <motion.p
                key={`hook-${cycle}`}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: phase >= 2 ? 1 : 0 }}
                className="font-display text-[15px] font-semibold leading-snug"
              >
                {SAMPLE.hook}
              </motion.p>
            </div>
            <div>
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-subtle">Caption</div>
              <p className="min-h-[4.5rem] text-[13px] leading-relaxed text-fg-2">
                {phase >= 2 ? caption : ''}
                {phase >= 2 && !captionDone && <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-brand" />}
                {phase < 2 && (
                  <span className="block space-y-2 pt-1">
                    <span className="skeleton block h-2.5 w-full rounded" />
                    <span className="skeleton block h-2.5 w-11/12 rounded" />
                    <span className="skeleton block h-2.5 w-2/3 rounded" />
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE.hashtags.map((h, i) => (
                <motion.span
                  key={`${h}-${cycle}`}
                  initial={reduce ? false : { opacity: 0, scale: 0.85 }}
                  animate={captionDone ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 400, damping: 24 }}
                  className="rounded-md bg-brand-soft px-2 py-0.5 text-[11.5px] font-medium text-brand-ink"
                >
                  #{h}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
