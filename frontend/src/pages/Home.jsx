import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  Copy,
  Eye,
  Hash,
  PenLine,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Wand
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import ProductDemo from '../components/home/ProductDemo.jsx';
import { PlatformBadge } from '../components/Brand.jsx';
import Button from '../components/ui/Button.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import { PLATFORMS, TONES } from '../lib/constants.js';
import { cn } from '../lib/format.js';

const ease = [0.22, 1, 0.36, 1];
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease }
};

const STEPS = [
  {
    icon: UploadCloud,
    title: 'Upload your media',
    desc: 'Drop in a photo or video — JPG, PNG, WEBP, GIF, MP4, MOV and more, up to 50MB.'
  },
  {
    icon: SlidersHorizontal,
    title: 'Set the brief',
    desc: 'Pick the platform and format, then tell it who you are talking to, the tone and the goal.'
  },
  {
    icon: Sparkles,
    title: 'Generate & refine',
    desc: 'Get hooks, captions, titles, hashtags and CTAs. Edit inline, regenerate in a new tone, copy or save.'
  }
];

const PLATFORM_OUTPUTS = {
  instagram: [
    ['Scroll-stopping hook', 'Front-loaded so it shows before “…more”'],
    ['Caption', 'Up to 2,200 characters with natural line breaks'],
    ['8–15 hashtags', 'A mix of broad reach and niche discovery tags'],
    ['Cover text & CTA', 'Overlay text and a CTA tuned for saves and shares']
  ],
  youtube: [
    ['Click-worthy title', 'Under 70 characters with the keyword up front'],
    ['SEO description', 'Summary lines first, supporting detail after'],
    ['Tags & keywords', 'Searchable terms matched to what is on screen'],
    ['Thumbnail text', '3–5 high-contrast words, plus a first-5-seconds hook']
  ],
  facebook: [
    ['Headline', 'A short, conversational lead for feed and groups'],
    ['Story-driven caption', 'Written to spark comments and shares'],
    ['2–5 hashtags', 'Restrained, the way Facebook audiences prefer'],
    ['Community CTA', 'Invites replies instead of a hard sell']
  ]
};

const FAQ = [
  {
    q: 'What files can I upload?',
    a: 'Images (JPG, PNG, WEBP, GIF) and videos (MP4, MOV, AVI, WEBM) up to 50MB each. Larger videos are processed automatically — shorter clips are simply faster.'
  },
  {
    q: 'Which platforms are supported?',
    a: 'Instagram (posts, Reels, carousels, Stories), YouTube (videos, Shorts, thumbnail ideas) and Facebook (posts, Reels, Stories). Each one gets copy that follows its own conventions.'
  },
  {
    q: 'Can I edit what the AI writes?',
    a: 'Yes. Every field is editable inline, you can regenerate a fresh version in a different tone at any time, and copy a single field or the whole post in one click.'
  },
  {
    q: 'Who can see my uploads and content?',
    a: 'Your media and generated content are tied to your account and are never shown to other users. You can delete any item — or your entire account and everything in it — from the app.'
  },
  {
    q: 'What powers the AI?',
    a: 'Google Gemini multimodal models. They look at the actual image or video, describe what is in it, and write copy grounded in what they see.'
  }
];

function SectionHeading({ eyebrow, title, desc, center = true }) {
  return (
    <motion.div {...reveal} className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</div>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {desc && <p className="mt-4 text-base text-muted text-pretty sm:text-lg">{desc}</p>}
    </motion.div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-5 text-left text-[15px] font-medium transition-colors hover:text-brand"
      >
        {q}
        <ChevronDown className={cn('size-5 shrink-0 text-subtle transition-transform duration-300', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-10 text-sm leading-relaxed text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BentoCard({ className, icon: Icon, title, desc, children, delay = 0 }) {
  return (
    <motion.div
      {...reveal}
      transition={{ ...reveal.transition, delay }}
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-xs transition-shadow duration-300 hover:shadow-md sm:p-7',
        className
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface-2">
        <Icon className="size-5 text-brand" strokeWidth={1.9} />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
      {children && <div className="mt-6">{children}</div>}
    </motion.div>
  );
}

export default function Home() {
  useDocumentTitle();
  const { token } = useAuth();
  const [platform, setPlatform] = useState('instagram');
  const primaryCta = token ? { to: '/generate', label: 'Create new content' } : { to: '/register', label: 'Get started free' };

  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="relative">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" aria-hidden />
        <div className="absolute left-1/2 top-[-12rem] h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-brand-gradient opacity-[0.13] blur-3xl dark:opacity-[0.18]" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-28 lg:pt-20">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 py-1 pl-1 pr-3.5 text-[13px] text-fg-2 shadow-xs backdrop-blur"
            >
              <span className="rounded-full bg-brand-gradient px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
              Multimodal AI that actually looks at your media
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.05 }}
              className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.025em] text-balance sm:text-6xl"
            >
              Turn any photo or video into posts that <span className="text-gradient animate-gradient">perform.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.12 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty"
            >
              SocialBoost AI studies what is in your media, then writes platform-ready hooks, captions, titles, hashtags
              and CTAs for Instagram, YouTube and Facebook — tuned to your audience and tone.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.2 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Button as={Link} to={primaryCta.to} variant="gradient" size="lg" className="group">
                {primaryCta.label}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button as="a" href="#how-it-works" variant="secondary" size="lg">
                See how it works
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="mt-10 flex items-center gap-4"
            >
              <div className="flex -space-x-1.5">
                {PLATFORMS.map((p) => (
                  <PlatformBadge key={p.id} platform={p.id} size="md" className="ring-2 ring-bg" />
                ))}
              </div>
              <p className="text-sm text-muted">Optimised for Instagram, YouTube & Facebook</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease, delay: 0.15 }}
          >
            <ProductDemo />
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-line bg-surface/50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="How it works"
            title="From upload to publish-ready in under a minute"
            desc="No prompt engineering. Give it your media and a short brief — it handles the rest."
          />
          <div className="relative mt-16">
          <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-linear-to-r from-transparent via-line-strong to-transparent md:block" aria-hidden />
          <ol className="relative grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <motion.li key={title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }} className="relative text-center">
                <div className="relative mx-auto flex size-14 items-center justify-center rounded-2xl border border-line bg-surface shadow-sm">
                  <Icon className="size-6 text-brand" strokeWidth={1.8} />
                  <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-fg text-[11px] font-semibold text-bg">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">{desc}</p>
              </motion.li>
            ))}
          </ol>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Features"
            title="Everything you need to post with confidence"
            desc="Built around the way creators and social teams actually work."
          />
          <div className="mt-16 grid gap-4 md:grid-cols-6">
            <BentoCard
              className="md:col-span-4"
              icon={Eye}
              title="It sees what is in your media"
              desc="Objects, setting, mood, niche and any on-screen text are detected first, so every line of copy is grounded in the actual content."
            >
              <div className="flex flex-wrap gap-2">
                {['Latte art', 'Cozy café', 'Warm', 'Food & drink', '“Open daily”'].map((c, i) => (
                  <motion.span
                    key={c}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium',
                      i === 2 ? 'border-transparent bg-warning-soft text-warning' : 'border-line bg-surface-2 text-fg-2'
                    )}
                  >
                    {c}
                  </motion.span>
                ))}
              </div>
            </BentoCard>
            <BentoCard
              className="md:col-span-2"
              icon={Hash}
              delay={0.08}
              title="Hashtags & keywords"
              desc="Relevant, de-duplicated tags and search keywords sized to each platform."
            />
            <BentoCard
              className="md:col-span-2"
              icon={RefreshCw}
              title="Regenerate in any tone"
              desc="Not quite right? Get a genuinely new angle in one click."
            >
              <div className="flex flex-wrap gap-1.5">
                {TONES.slice(0, 5).map((t, i) => (
                  <span
                    key={t}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      i === 1 ? 'bg-fg text-bg' : 'border border-line text-muted'
                    )}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </BentoCard>
            <BentoCard
              className="md:col-span-2"
              icon={PenLine}
              delay={0.08}
              title="Edit inline, copy instantly"
              desc="Tweak any field in place and copy a single field or the whole post."
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-muted">
                  <Copy className="size-3.5" /> Copy all
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-soft px-2.5 py-1.5 font-medium text-success">
                  <Check className="size-3.5" /> Copied
                </span>
              </div>
            </BentoCard>
            <BentoCard
              className="md:col-span-2"
              icon={Bookmark}
              delay={0.16}
              title="Library & history"
              desc="Save your best ideas and revisit every generation, edit and regeneration."
            />
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section id="platforms" className="scroll-mt-20 border-y border-line bg-surface/50 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <SectionHeading
            center={false}
            eyebrow="Platform-native"
            title="One upload. Copy that fits each platform."
            desc="Instagram, YouTube and Facebook reward different things. SocialBoost follows each platform’s conventions instead of pasting the same caption everywhere."
          />
          <motion.div {...reveal} className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-6">
            <Segmented
              label="Platform"
              value={platform}
              onChange={setPlatform}
              options={PLATFORMS.map((p) => ({ value: p.id, label: p.label }))}
            />
            <AnimatePresence mode="wait">
              <motion.ul
                key={platform}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="mt-5 divide-y divide-line"
              >
                {PLATFORM_OUTPUTS[platform].map(([title, desc]) => (
                  <li key={title} className="flex items-start gap-3 py-3.5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft">
                      <Check className="size-3 text-brand-ink" strokeWidth={3} />
                    </span>
                    <div>
                      <div className="text-sm font-medium">{title}</div>
                      <div className="text-sm text-muted">{desc}</div>
                    </div>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" />
          <motion.div {...reveal} className="mt-12 border-t border-line">
            {FAQ.map((f) => (
              <FaqItem key={f.q} {...f} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <motion.div
          {...reveal}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#0c0a1d] px-6 py-16 text-center text-white sm:px-12 sm:py-20"
        >
          <div className="absolute -top-32 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-brand-gradient opacity-40 blur-3xl" aria-hidden />
          <div className="bg-grid absolute inset-0 opacity-[0.07] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
          <div className="relative">
            <Wand className="mx-auto size-8 text-white/80" strokeWidth={1.6} />
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              Stop staring at a blank caption box.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/70">Generate your first platform-ready post in under a minute.</p>
            <Button as={Link} to={primaryCta.to} variant="light" size="lg" className="mt-9">
              {token ? 'Create now' : 'Create your free account'}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
