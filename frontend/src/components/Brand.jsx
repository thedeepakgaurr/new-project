import { useId } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/format.js';

export function LogoMark({ className }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B5CFF" />
          <stop offset=".55" stopColor="#D946A8" />
          <stop offset="1" stopColor="#FF7A3D" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <path
        d="M10 15.5l6-6 6 6M10 22.5l6-6 6 6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ to = '/', className, compact }) {
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-2.5 rounded-lg', className)} aria-label="SocialBoost AI home">
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
      {!compact && (
        <span className="font-display text-[17px] font-semibold tracking-tight">
          SocialBoost<span className="text-muted"> AI</span>
        </span>
      )}
    </Link>
  );
}

// Simplified platform glyphs (stroke-based so they inherit currentColor)
export function PlatformIcon({ platform, className }) {
  const common = { viewBox: '0 0 24 24', className: cn('size-4', className), 'aria-hidden': true };
  if (platform === 'instagram') {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (platform === 'youtube') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8ZM10 15.1V8.9l5.2 3.1L10 15.1Z" />
      </svg>
    );
  }
  if (platform === 'facebook') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5H16.6V4.3a21 21 0 0 0-2.3-.1c-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z" />
      </svg>
    );
  }
  return null;
}

const PLATFORM_STYLE = {
  instagram: 'bg-[linear-gradient(135deg,#feda75_0%,#fa7e1e_25%,#d62976_50%,#962fbf_75%,#4f5bd5_100%)] text-white',
  youtube: 'bg-[#ff0033] text-white',
  facebook: 'bg-[#1877f2] text-white'
};

export function PlatformBadge({ platform, size = 'md', className }) {
  const dims = { sm: 'size-6 rounded-md', md: 'size-8 rounded-lg', lg: 'size-11 rounded-xl' }[size];
  const icon = { sm: 'size-3.5', md: 'size-4', lg: 'size-5' }[size];
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center shadow-sm', dims, PLATFORM_STYLE[platform], className)}>
      <PlatformIcon platform={platform} className={icon} />
    </span>
  );
}
