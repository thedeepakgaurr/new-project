import { useState } from 'react';
import { Bookmark, Globe, Heart, MessageCircle, MoreHorizontal, Play, Send, Share2, ThumbsUp } from 'lucide-react';
import { thumbUrl } from '../../lib/media.js';
import { cn, formatHashtags, initials } from '../../lib/format.js';

// Approximations of each platform's feed card so creators can sanity-check
// length and line breaks before posting. Not pixel-perfect replicas.

function Media({ media, className, children }) {
  const src = thumbUrl(media, 1080);
  return (
    <div className={cn('relative overflow-hidden bg-surface-3', className)}>
      {src && <img src={src} alt="" className="h-full w-full object-cover" />}
      {children}
    </div>
  );
}

function Avatar({ name, className }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-brand-gradient font-semibold text-white', className)}>
      {initials(name)}
    </span>
  );
}

function Expandable({ text, limit, className, children }) {
  const [open, setOpen] = useState(false);
  const long = text.length > limit;
  return (
    <p className={cn('whitespace-pre-wrap break-words', className)}>
      {children}
      {long && !open ? text.slice(0, limit).trimEnd() : text}
      {long && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="ml-1 text-muted hover:text-fg">
          {open ? ' less' : '… more'}
        </button>
      )}
    </p>
  );
}

function Instagram({ content, name, handle }) {
  const caption = [content.caption, formatHashtags(content.hashtags)].filter(Boolean).join('\n\n');
  return (
    <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-2xl border border-line bg-surface text-[13.5px] shadow-sm">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <span className="rounded-full bg-[linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf)] p-[2px]">
          <Avatar name={name} className="size-7 border-2 border-surface text-[10px]" />
        </span>
        <span className="flex-1 font-semibold">{handle}</span>
        <MoreHorizontal className="size-4" />
      </div>
      <Media media={content.mediaId} className={content.contentType === 'Reel' || content.contentType === 'Story' ? 'aspect-[4/5]' : 'aspect-square'}>
        {content.thumbnailText && (
          <span className="absolute inset-x-4 bottom-5 text-center font-display text-xl font-bold leading-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
            {content.thumbnailText}
          </span>
        )}
      </Media>
      <div className="flex items-center gap-4 px-3 pb-1 pt-3">
        <Heart className="size-[22px]" />
        <MessageCircle className="size-[22px]" />
        <Send className="size-[22px]" />
        <Bookmark className="ml-auto size-[22px]" />
      </div>
      <div className="px-3 pb-4 pt-1.5 leading-snug">
        <Expandable text={caption} limit={125}>
          <span className="mr-1.5 font-semibold">{handle}</span>
        </Expandable>
      </div>
    </div>
  );
}

function YouTube({ content, name }) {
  const isShort = content.contentType === 'Short';
  return (
    <div className={cn('mx-auto w-full', isShort ? 'max-w-[300px]' : 'max-w-[560px]')}>
      <Media media={content.mediaId} className={cn('rounded-xl', isShort ? 'aspect-[9/16]' : 'aspect-video')}>
        {content.thumbnailText && (
          <span className="absolute left-4 top-4 max-w-[70%] rounded-md bg-black/70 px-2.5 py-1.5 font-display text-xl font-extrabold uppercase leading-none tracking-tight text-[#ffe14d] sm:text-2xl">
            {content.thumbnailText}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100">
          <span className="flex size-14 items-center justify-center rounded-full bg-black/60">
            <Play className="size-6 translate-x-0.5 text-white" fill="currentColor" />
          </span>
        </span>
      </Media>
      <div className="mt-3 flex gap-3">
        <Avatar name={name} className="size-9 text-xs" />
        <div className="min-w-0">
          <h4 className="line-clamp-2 text-[15px] font-semibold leading-snug">{content.title || content.hook || 'Untitled video'}</h4>
          <p className="mt-1 text-[13px] text-muted">{name} · Preview</p>
        </div>
      </div>
      {content.description && (
        <div className="mt-4 rounded-xl bg-surface-2 p-3.5 text-[13.5px] leading-relaxed">
          <Expandable text={content.description} limit={160} />
          {content.hashtags?.length > 0 && <p className="mt-2 text-info">{formatHashtags(content.hashtags.slice(0, 3))}</p>}
        </div>
      )}
    </div>
  );
}

function Facebook({ content, name }) {
  const text = [content.caption, formatHashtags(content.hashtags)].filter(Boolean).join('\n\n');
  return (
    <div className="mx-auto w-full max-w-[500px] overflow-hidden rounded-2xl border border-line bg-surface text-[14px] shadow-sm">
      <div className="flex items-center gap-2.5 px-4 pt-3.5">
        <Avatar name={name} className="size-10 text-sm" />
        <div className="flex-1 leading-tight">
          <div className="font-semibold">{name}</div>
          <div className="flex items-center gap-1 text-xs text-muted">
            Just now · <Globe className="size-3" />
          </div>
        </div>
        <MoreHorizontal className="size-5 text-muted" />
      </div>
      <div className="px-4 py-3 leading-snug">
        {content.title && <p className="mb-1.5 font-semibold">{content.title}</p>}
        <Expandable text={text} limit={240} />
      </div>
      <Media media={content.mediaId} className="aspect-[1.91/1]" />
      <div className="mx-4 flex justify-around border-t border-line py-1.5 text-[13px] font-medium text-muted">
        {[
          [ThumbsUp, 'Like'],
          [MessageCircle, 'Comment'],
          [Share2, 'Share']
        ].map(([Icon, label]) => (
          <span key={label} className="flex items-center gap-2 rounded-md px-3 py-2">
            <Icon className="size-[18px]" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PostPreview({ content, userName = 'Your Brand' }) {
  const handle = userName.toLowerCase().replace(/[^a-z0-9_.]+/g, '') || 'yourbrand';
  const props = { content, name: userName, handle };
  return (
    <div className="rounded-2xl border border-line bg-surface-2/50 p-4 sm:p-8">
      {content.platform === 'instagram' && <Instagram {...props} />}
      {content.platform === 'youtube' && <YouTube {...props} />}
      {content.platform === 'facebook' && <Facebook {...props} />}
      <p className="mt-5 text-center text-xs text-subtle">Approximate preview — the final look varies by device and app version.</p>
    </div>
  );
}
