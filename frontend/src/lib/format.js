export const cn = (...classes) => classes.filter(Boolean).join(' ');

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / 1024 ** i).toFixed(i ? 1 : 0))} ${units[i]}`;
}

export function formatHashtags(tags = []) {
  return tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ');
}

// Plain-text value of any content field, as it would be pasted into a platform
export function fieldText(value, key) {
  if (Array.isArray(value)) return key === 'hashtags' ? formatHashtags(value) : value.join(', ');
  return value || '';
}

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60]
];

export function timeAgo(date) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  for (const [unit, s] of UNITS) {
    if (Math.abs(seconds) >= s) return rtf.format(Math.round(seconds / s), unit);
  }
  return 'just now';
}

export function formatDate(date, opts = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat(undefined, opts).format(new Date(date));
}

export function dayLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return formatDate(d, { weekday: 'long', month: 'short', day: 'numeric', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
