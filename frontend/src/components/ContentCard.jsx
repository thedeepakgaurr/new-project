import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImageOff, Play } from 'lucide-react';
import { PlatformBadge } from './Brand.jsx';
import { Skeleton } from './ui/primitives.jsx';
import { PLATFORM_LABEL } from '../lib/constants.js';
import { thumbUrl, isVideo } from '../lib/media.js';
import { cn, timeAgo } from '../lib/format.js';

export function MediaThumb({ media, className, width }) {
  const [failed, setFailed] = useState(false);
  const src = thumbUrl(media, width);
  return (
    <div className={cn('relative overflow-hidden bg-surface-2', className)}>
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-subtle">
          <ImageOff className="size-6" strokeWidth={1.5} />
        </div>
      )}
      {isVideo(media) && (
        <span className="absolute bottom-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
          <Play className="size-3 translate-x-px" fill="currentColor" />
        </span>
      )}
    </div>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export default function ContentCard({ item, footer, index = 0 }) {
  const headline = item.hook || item.title || item.caption || 'Untitled';
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xs transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
    >
      <Link to={`/result/${item._id}`} className="absolute inset-0 z-10 rounded-2xl" aria-label={`Open ${PLATFORM_LABEL[item.platform]} ${item.contentType}: ${headline}`} />
      <div className="relative">
        <MediaThumb media={item.mediaId} className="aspect-[4/3]" />
        <div className="absolute left-3 top-3">
          <PlatformBadge platform={item.platform} size="sm" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className="font-medium text-fg-2">{item.contentType}</span>
          <span aria-hidden>·</span>
          <time dateTime={item.createdAt}>{timeAgo(item.createdAt)}</time>
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-[14.5px] font-semibold leading-snug">{headline}</h3>
        {item.caption && item.caption !== headline && <p className="mt-1 line-clamp-2 text-[13px] text-muted">{item.caption}</p>}
        {footer && <div className="relative z-20 mt-auto pt-4">{footer}</div>}
      </div>
    </motion.article>
  );
}
