import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import { Check, CircleAlert, PartyPopper, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import api, { getErrorMessage } from '../api/axios.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import PageHeader from '../components/PageHeader.jsx';
import Dropzone from '../components/generate/Dropzone.jsx';
import GenerationProgress from '../components/generate/GenerationProgress.jsx';
import { PlatformBadge } from '../components/Brand.jsx';
import Button from '../components/ui/Button.jsx';
import { Card } from '../components/ui/primitives.jsx';
import { TextField } from '../components/ui/Field.jsx';
import {
  AUDIENCE_SUGGESTIONS,
  CONTENT_TYPES,
  GOAL_SUGGESTIONS,
  PLATFORM_LABEL,
  PLATFORMS,
  TONES
} from '../lib/constants.js';
import { cn } from '../lib/format.js';

const BRIEF_KEY = 'sb-last-brief';

function loadBrief() {
  try {
    return JSON.parse(localStorage.getItem(BRIEF_KEY)) || {};
  } catch {
    return {};
  }
}

const fileKey = (f) => (f ? `${f.name}:${f.size}:${f.lastModified}` : '');

function Section({ step, title, description, children }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-fg text-[11px] font-semibold text-bg">{step}</span>
        <div>
          <h2 className="text-[15px] font-semibold leading-6">{title}</h2>
          {description && <p className="text-[13px] text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-8 rounded-full border px-3.5 text-[13px] font-medium transition-all duration-150 active:scale-95',
        active ? 'border-fg bg-fg text-bg shadow-sm' : 'border-line bg-surface text-fg-2 hover:border-line-strong hover:text-fg'
      )}
    >
      {children}
    </button>
  );
}

function Suggestions({ items, onPick }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="rounded-md bg-surface-2 px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-3 hover:text-fg"
        >
          + {s}
        </button>
      ))}
    </div>
  );
}

export default function Generate() {
  useDocumentTitle('New content');
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const saved = useRef(loadBrief()).current;

  const initialPlatform = PLATFORMS.some((p) => p.id === params.get('platform'))
    ? params.get('platform')
    : saved.platform || 'instagram';

  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [platform, setPlatform] = useState(initialPlatform);
  const [contentType, setContentType] = useState(CONTENT_TYPES[initialPlatform][0]);
  const [tone, setTone] = useState(saved.tone || 'Engaging');
  const [customTone, setCustomTone] = useState(!!saved.tone && !TONES.includes(saved.tone));
  const [audience, setAudience] = useState(saved.audience || '');
  const [goal, setGoal] = useState(saved.goal || '');
  const [stage, setStage] = useState(null); // null | 'uploading' | 'generating'
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState('');
  const [welcome, setWelcome] = useState(!!location.state?.welcome);
  const uploaded = useRef({ key: '', mediaId: null });
  const abortRef = useRef(null);

  // Warn before closing the tab mid-generation
  useEffect(() => {
    if (!stage) return undefined;
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [stage]);

  const choosePlatform = (p) => {
    setPlatform(p);
    if (!CONTENT_TYPES[p].includes(contentType)) setContentType(CONTENT_TYPES[p][0]);
  };

  const onFile = (f) => {
    setFileError('');
    setError('');
    setFile(f);
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!file) {
      setFileError('Add an image or video to get started.');
      document.getElementById('media-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setError('');
    const brief = { platform, tone: tone.trim(), audience: audience.trim(), goal: goal.trim() };
    try {
      localStorage.setItem(BRIEF_KEY, JSON.stringify(brief));
    } catch {
      /* storage full or disabled */
    }

    try {
      // Reuse the upload when retrying with the same file
      let mediaId = uploaded.current.key === fileKey(file) ? uploaded.current.mediaId : null;
      if (!mediaId) {
        setStage('uploading');
        setUploadPct(0);
        abortRef.current = new AbortController();
        const fd = new FormData();
        fd.append('media', file);
        const { data } = await api.post('/media/upload', fd, {
          timeout: 5 * 60_000,
          signal: abortRef.current.signal,
          onUploadProgress: (ev) => ev.total && setUploadPct(Math.round((ev.loaded / ev.total) * 100))
        });
        mediaId = data.media._id;
        uploaded.current = { key: fileKey(file), mediaId };
      }

      setStage('generating');
      const { data } = await api.post(
        '/content/generate',
        { mediaId, platform, contentType, ...brief },
        { timeout: 4 * 60_000 }
      );
      toast.success('Your content is ready');
      navigate(`/result/${data.content._id}`, { state: { fresh: true } });
    } catch (err) {
      setStage(null);
      if (axios.isCancel(err)) return;
      if (err?.response?.status === 404) uploaded.current = { key: '', mediaId: null };
      setError(getErrorMessage(err, 'Generation failed. Please try again.'));
    }
  };

  const cancelUpload = () => {
    abortRef.current?.abort();
    setStage(null);
    toast('Upload cancelled');
  };

  const summary = [
    ['Platform', PLATFORM_LABEL[platform]],
    ['Format', contentType],
    ['Tone', tone || 'Engaging'],
    ['Audience', audience || 'General'],
    ['Goal', goal || 'Maximise engagement']
  ];

  return (
    <>
      <PageHeader title="New content" description="Upload your media, set a quick brief, and let the AI write the rest." />

      <AnimatePresence>
        {welcome && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand-soft px-4 py-3 text-sm text-brand-ink">
              <PartyPopper className="size-5 shrink-0" />
              <span className="flex-1">Welcome aboard! Upload a photo or video below to create your first post.</span>
              <button type="button" onClick={() => setWelcome(false)} aria-label="Dismiss" className="rounded-md p-1 hover:bg-brand/10">
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div id="media-section">
            <Section step={1} title="Media" description="The AI looks at exactly what is in your image or video.">
              <Dropzone file={file} onFile={onFile} onError={setFileError} disabled={!!stage} />
              <AnimatePresence>
                {fileError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="alert"
                    className="mt-3 flex items-center gap-2 text-sm text-danger"
                  >
                    <CircleAlert className="size-4 shrink-0" />
                    {fileError}
                  </motion.p>
                )}
              </AnimatePresence>
            </Section>
          </div>

          <Section step={2} title="Platform & format" description="Copy is written to each platform’s conventions.">
            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Platform">
              {PLATFORMS.map((p) => {
                const active = platform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => choosePlatform(p.id)}
                    className={cn(
                      'relative flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-200 sm:flex-col sm:items-start',
                      active
                        ? 'border-brand bg-brand-soft/40 ring-4 ring-brand/10'
                        : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2/50'
                    )}
                  >
                    <PlatformBadge platform={p.id} size="md" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{p.label}</span>
                      <span className="block text-xs text-muted">{p.blurb}</span>
                    </span>
                    <AnimatePresence>
                      {active && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-brand text-white"
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <div className="mb-2 text-[13px] font-medium">Format</div>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES[platform].map((t) => (
                  <Chip key={t} active={contentType === t} onClick={() => setContentType(t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
          </Section>

          <Section step={3} title="Brief" description="Optional, but a sharper brief gets sharper copy.">
            <div>
              <div className="mb-2 text-[13px] font-medium">Tone of voice</div>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <Chip
                    key={t}
                    active={!customTone && tone === t}
                    onClick={() => {
                      setCustomTone(false);
                      setTone(t);
                    }}
                  >
                    {t}
                  </Chip>
                ))}
                <Chip
                  active={customTone}
                  onClick={() => {
                    setCustomTone(true);
                    setTone('');
                  }}
                >
                  Custom…
                </Chip>
              </div>
              <AnimatePresence>
                {customTone && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <TextField
                      className="pt-3"
                      aria-label="Custom tone"
                      autoFocus
                      maxLength={100}
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      placeholder="e.g. witty but warm, like a friend giving advice"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <TextField
                  label="Target audience"
                  optional
                  maxLength={200}
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Who is this for?"
                />
                <Suggestions items={AUDIENCE_SUGGESTIONS.slice(0, 3)} onPick={setAudience} />
              </div>
              <div>
                <TextField
                  label="Goal"
                  optional
                  maxLength={200}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="What should this post achieve?"
                />
                <Suggestions items={GOAL_SUGGESTIONS.slice(0, 3)} onPick={setGoal} />
              </div>
            </div>
          </Section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-10">
          <Card className="overflow-hidden">
            <div className="border-b border-line p-5">
              <h2 className="text-[15px] font-semibold">Summary</h2>
              <dl className="mt-4 space-y-2.5 text-[13px]">
                {summary.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-muted">{k}</dt>
                    <dd className="truncate text-right font-medium" title={v}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="p-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div role="alert" className="mb-4 flex gap-2 rounded-xl bg-danger-soft p-3 text-[13px] text-danger">
                      <CircleAlert className="mt-px size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={!!stage}>
                <Sparkles className="size-4" />
                {error ? 'Try again' : 'Generate content'}
              </Button>
              <p className="mt-3 text-center text-xs text-muted">Takes about 10–30 seconds</p>
            </div>
          </Card>
        </aside>
      </form>

      <GenerationProgress open={!!stage} stage={stage} uploadPct={uploadPct} onCancel={cancelUpload} />
    </>
  );
}
